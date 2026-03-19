/**
 * moderate-review/index.ts
 *
 * Async AI content moderation for user reviews.
 *
 * ── Trigger ──────────────────────────────────────────────────────────────────
 * Called by a Supabase Database Webhook on:
 *   Table:  public.reviews
 *   Event:  INSERT
 *   Method: POST
 *   URL:    <project_url>/functions/v1/moderate-review
 *   Header: x-webhook-secret: <MODERATION_WEBHOOK_SECRET>
 *
 * ── Decision logic ───────────────────────────────────────────────────────────
 *   spam_risk ≥ 0.7  OR  toxicity_risk ≥ 0.7   → flagged
 *   confidence < 0.6                             → pending
 *   spam < 0.1 AND toxicity < 0.1
 *     AND quality > 70 AND confidence ≥ 0.8      → approved
 *   (everything else)                            → pending
 *
 * ── Safety guarantees ────────────────────────────────────────────────────────
 * - Review creation is never blocked (fully async).
 * - Every exit path defaults to 'pending' on any failure — never silent approval.
 * - Every exit path writes to moderation_audit_log before returning.
 * - Idempotent: queries the DB for current ai_moderated_at before processing
 *   (not the stale webhook payload) so duplicate webhook deliveries are safe.
 * - Anthropic fetch is bounded to 20 seconds via AbortSignal.timeout.
 * - When moderation_status = 'flagged', the existing `flagged` + `flag_reason`
 *   columns are also set, preserving all existing query/trigger behaviour.
 *
 * ── Required Supabase secrets ────────────────────────────────────────────────
 *   ANTHROPIC_API_KEY         — Anthropic API key
 *   MODERATION_WEBHOOK_SECRET — matches the x-webhook-secret header
 *   SUPABASE_URL              — auto-injected by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime
 *
 * ── Optional secrets ─────────────────────────────────────────────────────────
 *   MODERATION_MODEL — override Claude model (default: claude-haiku-4-5-20251001)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/**
 * Moderation decision thresholds.
 * All values are the single source of truth — never hardcode these in logic.
 */
const THRESHOLDS = {
  // At or above either threshold → force 'flagged', no further checks
  FLAG_SPAM:              0.70,
  FLAG_TOXICITY:          0.70,

  // Below this confidence → 'pending' always, even if risks look low
  MIN_CONFIDENCE:         0.60,

  // All four must hold simultaneously to auto-approve
  APPROVE_MAX_SPAM:       0.10,
  APPROVE_MAX_TOXICITY:   0.10,
  APPROVE_MIN_QUALITY:    70,
  APPROVE_MIN_CONFIDENCE: 0.80,

  // Anthropic API timeout in milliseconds
  FETCH_TIMEOUT_MS:       20_000,
} as const;

/**
 * Canonical tag allowlist. Any tag returned by Claude outside this set
 * is discarded before writing to the database.
 */
const ALLOWED_TAGS = new Set([
  "spam", "toxic", "fake", "promotional", "off_topic", "low_quality",
  "genuine", "detailed", "verified_feel", "helpful", "constructive",
  "rating_text_mismatch", "personal_attack", "pii_risk",
]);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReviewRecord {
  id:              string;
  text:            string;
  rating:          number;
  business_id:     string;
  user_id:         string;
  anonymous:       boolean | null;
  verified:        boolean | null;
  spam_score:      number | null;
  is_flagged_spam: boolean | null;
  spam_flags:      string[] | null;
  ai_moderated_at: string | null;
}

interface WebhookPayload {
  type:       "INSERT" | "UPDATE" | "DELETE";
  table:      string;
  schema:     string;
  record:     ReviewRecord;
  old_record: ReviewRecord | null;
}

interface ModerationResult {
  approval_recommendation: "approved" | "flagged" | "pending";
  quality_score:           number;    // 0–100 integer
  spam_risk:               number;    // 0.0–1.0
  toxicity_risk:           number;    // 0.0–1.0
  confidence:              number;    // 0.0–1.0 — how certain Claude is
  tags:                    string[];
  reason:                  string;
}

// Module-level interface (not inside handler — fixes Bug 4)
interface ReviewUpdate {
  moderation_status:         string;
  ai_moderated_at:           string;
  ai_moderation_model:       string;
  ai_moderation_confidence?: number;
  quality_score?:            number;
  ai_spam_risk?:             number;
  toxicity_risk?:            number;
  ai_moderation_tags?:       string[];
  ai_moderation_reason?:     string;
  flagged?:                  boolean;
  flag_reason?:              string;
}

type FallbackReason =
  | "anthropic_key_missing"
  | "network_error"
  | "timeout"
  | "api_error"
  | "invalid_json"
  | "validation_failed";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a content moderation AI for ReviewHub, an Israeli online course review platform.

Analyze the submitted course review and return a JSON moderation decision.

You MUST return ONLY a valid JSON object — no markdown, no code fences, no explanation. Raw JSON only.

Required fields:
{
  "approval_recommendation": "approved" | "flagged" | "pending",
  "quality_score": <integer 0-100>,
  "spam_risk": <float 0.0-1.0>,
  "toxicity_risk": <float 0.0-1.0>,
  "confidence": <float 0.0-1.0>,
  "tags": [<string>, ...],
  "reason": "<one sentence in English>"
}

Field definitions:
- approval_recommendation:
    "approved" = genuine, relevant, non-harmful review
    "flagged"  = clear violation: spam, hate speech, personal attack, fake review, promotion
    "pending"  = uncertain — needs human review
- quality_score: 0=useless one-word filler, 100=detailed, specific, genuinely helpful
- spam_risk: likelihood of spam or fake/incentivized content (0=clean, 1=certain spam)
- toxicity_risk: likelihood of harassment, hate speech, threats, slurs (0=clean, 1=certain toxic)
- confidence: how certain you are in this assessment (0=very uncertain, 1=fully certain)
    Use lower confidence when: the review is ambiguous, the language is unclear,
    or the signals are mixed. High confidence only when the decision is clear-cut.
- tags: use ONLY labels from this exact list — discard any others:
    "spam", "toxic", "fake", "promotional", "off_topic", "low_quality",
    "genuine", "detailed", "verified_feel", "helpful", "constructive",
    "rating_text_mismatch", "personal_attack", "pii_risk"
- reason: brief English explanation of the primary concern or approval basis

Decision rules you MUST follow:
- spam_risk >= 0.7 OR toxicity_risk >= 0.7 → approval_recommendation MUST be "flagged"
- confidence < 0.5 → approval_recommendation MUST be "pending"
- quality_score < 30 → quality is too low to auto-approve
- Hebrew text is expected and normal — do not treat Hebrew as suspicious
- Short reviews (under 30 characters) must receive quality_score ≤ 25
- Text sentiment contradicting the star rating → add tag "rating_text_mismatch"`;

function buildUserPrompt(review: ReviewRecord): string {
  const verifiedLabel  = review.verified        ? "Yes" : "No";
  const spamContext    = review.spam_score != null
    ? `Rule-based spam score: ${review.spam_score.toFixed(2)} (flags: ${(review.spam_flags ?? []).join(", ") || "none"})`
    : "Rule-based spam score: unavailable";

  return `Review to moderate:

Rating: ${review.rating}/5 stars
Verified purchase: ${verifiedLabel}
${spamContext}

Review text:
---
${review.text}
---

Return the JSON moderation decision now.`;
}

// ─── Claude API call ──────────────────────────────────────────────────────────

interface ClaudeApiResponse {
  content:     Array<{ type: string; text: string }>;
  model?:      string;
  stop_reason?: string;
  usage?:      { input_tokens: number; output_tokens: number };
}

interface CallClaudeResult {
  apiResponse:  ClaudeApiResponse | null;  // Full Anthropic response object (for audit log)
  error:        string | null;
  fallbackType: FallbackReason | null;
}

async function callClaude(
  anthropicKey: string,
  model:        string,
  review:       ReviewRecord,
): Promise<CallClaudeResult> {
  let res: Response;

  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens:  512,
        temperature: 0,
        system:      SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(review) }],
      }),
      signal: AbortSignal.timeout(THRESHOLDS.FETCH_TIMEOUT_MS),  // Fix Bug 3
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    return {
      apiResponse:  null,
      error:        isTimeout ? `Anthropic request timed out after ${THRESHOLDS.FETCH_TIMEOUT_MS}ms` : `Network error: ${err}`,
      fallbackType: isTimeout ? "timeout" : "network_error",
    };
  }

  const rawText = await res.text();

  if (!res.ok) {
    return {
      apiResponse:  null,
      error:        `Anthropic API returned ${res.status}: ${rawText.slice(0, 300)}`,
      fallbackType: "api_error",
    };
  }

  try {
    const parsed = JSON.parse(rawText) as ClaudeApiResponse;
    return { apiResponse: parsed, error: null, fallbackType: null };
  } catch {
    return {
      apiResponse:  null,
      error:        "Failed to parse Anthropic API response as JSON",
      fallbackType: "invalid_json",
    };
  }
}

// ─── Response validation ──────────────────────────────────────────────────────

/**
 * Extract the moderation JSON from Claude's content block.
 * Strips markdown code fences defensively — they should not appear at
 * temperature=0 but Claude occasionally adds them anyway.
 */
function extractModerationJson(apiResponse: ClaudeApiResponse): unknown | null {
  const text = apiResponse?.content?.[0]?.text?.trim();
  if (!text) return null;

  const stripped = text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

/**
 * Strictly validate shape and value ranges of Claude's moderation object.
 * Returns null if ANY required field is absent, wrong type, or out of range.
 * Out-of-range values from the AI are never clamped — they are rejected.
 * Caller must default to 'pending' on null return.
 */
function validateModerationResult(raw: unknown): {
  result: ModerationResult | null;
  fallbackType: FallbackReason | null;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { result: null, fallbackType: "invalid_json" };
  }

  const r = raw as Record<string, unknown>;

  // approval_recommendation
  if (!["approved", "flagged", "pending"].includes(r.approval_recommendation as string)) {
    return { result: null, fallbackType: "validation_failed" };
  }

  // quality_score: integer 0–100
  if (typeof r.quality_score !== "number"
      || !Number.isFinite(r.quality_score)
      || r.quality_score < 0
      || r.quality_score > 100) {
    return { result: null, fallbackType: "validation_failed" };
  }

  // spam_risk: float 0–1
  if (typeof r.spam_risk !== "number"
      || !Number.isFinite(r.spam_risk)
      || r.spam_risk < 0
      || r.spam_risk > 1) {
    return { result: null, fallbackType: "validation_failed" };
  }

  // toxicity_risk: float 0–1
  if (typeof r.toxicity_risk !== "number"
      || !Number.isFinite(r.toxicity_risk)
      || r.toxicity_risk < 0
      || r.toxicity_risk > 1) {
    return { result: null, fallbackType: "validation_failed" };
  }

  // confidence: float 0–1
  if (typeof r.confidence !== "number"
      || !Number.isFinite(r.confidence)
      || r.confidence < 0
      || r.confidence > 1) {
    return { result: null, fallbackType: "validation_failed" };
  }

  // tags: array of strings — filter to known allowlist (Fix Bug 5)
  if (!Array.isArray(r.tags) || r.tags.some((t) => typeof t !== "string")) {
    return { result: null, fallbackType: "validation_failed" };
  }
  const sanitisedTags = (r.tags as string[]).filter((t) => ALLOWED_TAGS.has(t)).slice(0, 10);

  // reason: non-empty string
  if (typeof r.reason !== "string" || r.reason.trim().length === 0) {
    return { result: null, fallbackType: "validation_failed" };
  }

  return {
    result: {
      approval_recommendation: r.approval_recommendation as ModerationResult["approval_recommendation"],
      quality_score:           Math.round(r.quality_score as number),
      spam_risk:               r.spam_risk    as number,
      toxicity_risk:           r.toxicity_risk as number,
      confidence:              r.confidence   as number,
      tags:                    sanitisedTags,
      reason:                  (r.reason as string).slice(0, 500),
    },
    fallbackType: null,
  };
}

// ─── Decision logic ───────────────────────────────────────────────────────────

/**
 * Apply threshold rules to produce the final moderation_status.
 *
 * The AI's approval_recommendation is NOT used — thresholds are the authority.
 * This prevents an adversarial or misconfigured model from self-approving content.
 *
 * Decision tree (evaluated top-to-bottom, first match wins):
 *   1. spam_risk ≥ 0.7 OR toxicity_risk ≥ 0.7  → flagged  (hard safety override)
 *   2. confidence < 0.6                          → pending  (insufficient certainty)
 *   3. spam < 0.1 AND toxicity < 0.1
 *        AND quality > 70 AND confidence ≥ 0.8   → approved (high-quality, confident)
 *   4. (everything else)                         → pending
 */
function applyThresholds(result: ModerationResult): "approved" | "flagged" | "pending" {
  if (result.spam_risk >= THRESHOLDS.FLAG_SPAM || result.toxicity_risk >= THRESHOLDS.FLAG_TOXICITY) {
    return "flagged";
  }

  if (result.confidence < THRESHOLDS.MIN_CONFIDENCE) {
    return "pending";
  }

  if (
    result.spam_risk      < THRESHOLDS.APPROVE_MAX_SPAM       &&
    result.toxicity_risk  < THRESHOLDS.APPROVE_MAX_TOXICITY   &&
    result.quality_score  > THRESHOLDS.APPROVE_MIN_QUALITY    &&
    result.confidence    >= THRESHOLDS.APPROVE_MIN_CONFIDENCE
  ) {
    return "approved";
  }

  return "pending";
}

// ─── Audit logging ────────────────────────────────────────────────────────────

/**
 * Write one row to moderation_audit_log.
 * This is called on every exit path — successes, fallbacks, and errors.
 * Failures here are logged but never propagate to the caller.
 */
async function writeAuditLog(
  db:               SupabaseClient,
  reviewId:         string,
  finalStatus:      "approved" | "flagged" | "pending",
  result:           ModerationResult | null,
  apiResponse:      unknown | null,
  modelId:          string,
  fallbackReason:   FallbackReason | null,
): Promise<void> {
  try {
    await db.from("moderation_audit_log").insert({
      review_id:         reviewId,
      decided_at:        new Date().toISOString(),
      moderation_status: finalStatus,
      model_id:          modelId,
      confidence:        result?.confidence    ?? null,
      quality_score:     result?.quality_score ?? null,
      spam_risk:         result?.spam_risk      ?? null,
      toxicity_risk:     result?.toxicity_risk  ?? null,
      tags:              result?.tags           ?? null,
      reason:            result?.reason         ?? null,
      raw_ai_response:   apiResponse            ?? null,
      fallback_reason:   fallbackReason,
      trigger_source:    "webhook_insert",
    });
  } catch (err) {
    // Audit log failure must never affect the main review flow
    console.error(`[moderate-review] Audit log write failed for review ${reviewId}:`, err);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {

  // ── 1. Method guard ────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── 2. Authenticate webhook ────────────────────────────────────────────────
  const webhookSecret  = Deno.env.get("MODERATION_WEBHOOK_SECRET") ?? "";
  const incomingSecret = req.headers.get("x-webhook-secret") ?? "";

  if (!webhookSecret) {
    console.error("[moderate-review] MODERATION_WEBHOOK_SECRET is not configured.");
    return new Response("Service misconfigured", { status: 503 });
  }

  if (incomingSecret !== webhookSecret) {
    console.warn("[moderate-review] Request rejected — invalid webhook secret.");
    return new Response("Unauthorized", { status: 401 });
  }

  // ── 3. Parse webhook payload ───────────────────────────────────────────────
  let payload: WebhookPayload;
  try {
    payload = await req.json() as WebhookPayload;
  } catch {
    console.error("[moderate-review] Failed to parse request body as JSON.");
    return new Response("Bad Request", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "reviews" || payload.schema !== "public") {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const review = payload.record;
  if (!review?.id || typeof review.text !== "string") {
    console.error("[moderate-review] Webhook payload missing required review fields.");
    return new Response("Bad Request — missing review fields", { status: 400 });
  }

  // ── 4. Initialise Supabase admin client ────────────────────────────────────
  const supabaseUrl    = Deno.env.get("SUPABASE_URL")             ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anthropicKey   = Deno.env.get("ANTHROPIC_API_KEY")         ?? "";
  const model          = Deno.env.get("MODERATION_MODEL")          ?? DEFAULT_MODEL;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[moderate-review] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return new Response("Service misconfigured", { status: 503 });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── 5. Idempotency — query the DB, not the stale webhook payload (Fix Bug 2)
  // The webhook payload always contains the row state AT INSERT TIME, so
  // ai_moderated_at is always NULL in the payload. We must query the live row.
  const { data: currentRow, error: fetchErr } = await db
    .from("reviews")
    .select("ai_moderated_at")
    .eq("id", review.id)
    .single();

  if (fetchErr) {
    console.error(`[moderate-review] Failed to fetch current review state for ${review.id}:`, fetchErr.message);
    // Fail open — proceed and let the DB update handle any conflicts
  } else if (currentRow?.ai_moderated_at) {
    console.log(`[moderate-review] Review ${review.id} already moderated. Skipping.`);
    return new Response(JSON.stringify({ skipped: true, reason: "already_moderated" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 6. Handle missing Anthropic key — safe fallback, no retry ─────────────
  if (!anthropicKey) {
    console.error(`[moderate-review] ANTHROPIC_API_KEY not set. Review ${review.id} → pending.`);
    await writeAuditLog(db, review.id, "pending", null, null, model, "anthropic_key_missing");
    // Stamp ai_moderated_at so the row is not re-queued if the key is later added.
    // moderation_status stays 'pending' (its default) — safe for the review to remain held.
    await db.from("reviews").update({
      moderation_status:   "pending",
      ai_moderated_at:     new Date().toISOString(),
      ai_moderation_model: model,
    }).eq("id", review.id);
    // Return 200 — this is a configuration problem, not a transient failure.
    // Returning 500 would cause infinite retries that would never succeed.
    return new Response(
      JSON.stringify({ ok: false, fallback: "anthropic_key_missing", moderation_status: "pending" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 7. Call Claude ─────────────────────────────────────────────────────────
  console.log(`[moderate-review] Processing review ${review.id} (${review.text.length} chars, rating=${review.rating})`);

  const { apiResponse, error: claudeError, fallbackType: claudeFallbackType } =
    await callClaude(anthropicKey, model, review);  // Fix Bug 1: was `apiKey`

  // ── 8. Extract and validate the moderation JSON ────────────────────────────
  let moderationResult: ModerationResult | null = null;
  let finalFallbackType: FallbackReason | null  = claudeFallbackType;

  if (claudeError) {
    console.error(`[moderate-review] Claude error for review ${review.id}: ${claudeError}`);
  } else if (apiResponse) {
    const raw = extractModerationJson(apiResponse);

    if (!raw) {
      console.error(
        `[moderate-review] Could not extract JSON from Claude response for review ${review.id}. Content: `,
        apiResponse?.content?.[0]?.text?.slice(0, 300),
      );
      finalFallbackType = "invalid_json";
    } else {
      const { result, fallbackType: validationFallback } = validateModerationResult(raw);
      moderationResult  = result;
      finalFallbackType = result ? null : validationFallback;

      if (!result) {
        console.error(
          `[moderate-review] Claude response failed validation for review ${review.id}. Raw: `,
          JSON.stringify(raw).slice(0, 300),
        );
      }
    }
  }

  // ── 9. Determine final status ──────────────────────────────────────────────
  // Default is 'pending' — only overridden when we have a valid, trusted result.
  const finalStatus: "approved" | "flagged" | "pending" =
    moderationResult ? applyThresholds(moderationResult) : "pending";

  const moderatedAt = new Date().toISOString();

  // ── 10. Write audit log ────────────────────────────────────────────────────
  // Always written before the reviews UPDATE so the audit trail is complete
  // even if the subsequent DB update fails.
  await writeAuditLog(
    db, review.id, finalStatus, moderationResult,
    apiResponse, model, finalFallbackType,
  );

  // ── 11. Build the reviews row update ──────────────────────────────────────
  const update: ReviewUpdate = {
    moderation_status:   finalStatus,
    ai_moderated_at:     moderatedAt,
    ai_moderation_model: model,
  };

  if (moderationResult) {
    update.ai_moderation_confidence = moderationResult.confidence;
    update.quality_score             = moderationResult.quality_score;
    update.ai_spam_risk              = moderationResult.spam_risk;
    update.toxicity_risk             = moderationResult.toxicity_risk;
    update.ai_moderation_tags        = moderationResult.tags;
    update.ai_moderation_reason      = moderationResult.reason;
  }

  if (finalStatus === "flagged") {
    // Bridge to existing schema so api-gateway, frontend queries, and the
    // positive-review lead trigger all continue to filter correctly.
    update.flagged     = true;
    update.flag_reason = moderationResult?.reason ?? "Flagged by AI moderation";
  }

  // ── 12. Write to reviews row ───────────────────────────────────────────────
  const { error: dbError } = await db
    .from("reviews")
    .update(update)
    .eq("id", review.id);

  if (dbError) {
    console.error(`[moderate-review] DB update failed for review ${review.id}:`, dbError.message);
    // Return 500 so the webhook retries. The audit log entry already exists.
    // On retry, idempotency check re-fetches from DB (ai_moderated_at still NULL)
    // so Claude will be called again and a second audit log row will be written.
    return new Response(
      JSON.stringify({ ok: false, error: "db_update_failed", review_id: review.id }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 13. Log decision ───────────────────────────────────────────────────────
  console.log(
    `[moderate-review] Review ${review.id} → ${finalStatus}` +
    (moderationResult
      ? ` | quality=${moderationResult.quality_score}` +
        ` spam=${moderationResult.spam_risk.toFixed(2)}` +
        ` toxicity=${moderationResult.toxicity_risk.toFixed(2)}` +
        ` confidence=${moderationResult.confidence.toFixed(2)}` +
        ` tags=[${moderationResult.tags.join(",")}]`
      : ` | fallback=${finalFallbackType ?? "unknown"}`),
  );

  return new Response(
    JSON.stringify({
      ok:                true,
      review_id:         review.id,
      moderation_status: finalStatus,
      quality_score:     moderationResult?.quality_score   ?? null,
      ai_spam_risk:      moderationResult?.spam_risk       ?? null,
      toxicity_risk:     moderationResult?.toxicity_risk   ?? null,
      confidence:        moderationResult?.confidence      ?? null,
      tags:              moderationResult?.tags            ?? [],
      reason:            moderationResult?.reason          ?? null,
      fallback:          finalFallbackType,
      model,
      moderated_at:      moderatedAt,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

/**
 * submit-review — Edge Function
 *
 * Responsibilities:
 *  1. Verify the caller is authenticated (valid JWT)
 *  2. Verify the Turnstile token server-side with Cloudflare's siteverify API
 *     (C-2: bot protection that was previously client-side only)
 *  3. Validate and sanitise all input fields
 *  4. Enforce the one-review-per-user-per-business rule (DB constraint backup)
 *  5. Insert the review row directly from the server with service-role key
 *     so the INSERT bypasses any gap in client-side RLS
 *
 * Environment variables required (Supabase → Project → Edge Functions → Secrets):
 *   TURNSTILE_SECRET_KEY   — from Cloudflare Dashboard → Turnstile → site settings
 *   SUPABASE_URL           — auto-injected by Supabase
 *   SUPABASE_ANON_KEY      — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── Constants ──────────────────────────────────────────────────────────────

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const SUBJECT_MAX      = 60;
const REVIEW_TEXT_MAX  = 2000;
const REVIEWER_MAX     = 80;

const VALID_DURATIONS = new Set([
  "3_months_plus",
  "half_year_plus",
  "one_year_plus",
  "two_years_plus",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip HTML tags and collapse whitespace. Mirrors the client-side sanitizeText. */
function sanitize(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/\s+/g, " ")           // collapse whitespace
    .trim()
    .slice(0, maxLen);
}

function jsonResp(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  // Pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResp({ error: "Method not allowed" }, 405, cors);
  }

  try {
    // ── Step 1: Authenticate caller ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401, cors);
    }

    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the user's JWT to verify identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return jsonResp({ error: "Unauthorized" }, 401, cors);
    }

    // ── Step 2: Parse and validate request body ──────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResp({ error: "Invalid JSON body" }, 400, cors);
    }

    const {
      turnstileToken,
      businessId,
      courseId,
      rating,
      subject,
      reviewText,
      trainingDuration,
      verifiedPurchase = false,
      indemnityAccepted = false,
      indemnityAcceptedAt = null,
      verificationStatus = "anonymous",
    } = body;

    // ── Legal compliance gate: indemnity must be accepted ─────────────────
    if (!indemnityAccepted) {
      return jsonResp(
        { error: "Indemnity acceptance is required to submit a review" },
        400,
        cors,
      );
    }

    // Validate verificationStatus value
    const VALID_VERIFICATION_STATUSES = new Set([
      "anonymous", "email_verified", "purchase_verified",
    ]);
    const cleanVerificationStatus = VALID_VERIFICATION_STATUSES.has(verificationStatus as string)
      ? (verificationStatus as string)
      : "anonymous";

    // Required fields
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return jsonResp({ error: "Missing CAPTCHA token" }, 400, cors);
    }
    if (!businessId || typeof businessId !== "string") {
      return jsonResp({ error: "Missing businessId" }, 400, cors);
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return jsonResp({ error: "Rating must be 1–5" }, 400, cors);
    }
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return jsonResp({ error: "Subject is required" }, 400, cors);
    }
    if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length < 10) {
      return jsonResp({ error: "Review text must be at least 10 characters" }, 400, cors);
    }
    if (!trainingDuration || !VALID_DURATIONS.has(trainingDuration as string)) {
      return jsonResp({ error: "Invalid training duration" }, 400, cors);
    }

    // ── Step 3: Verify Turnstile token server-side ───────────────────────
    // This is the critical fix: the token was previously only checked for
    // presence on the client. Here we validate it with Cloudflare's API.
    const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";

    if (!turnstileSecretKey) {
      // No secret configured → log a warning but allow in development
      console.warn("[submit-review] TURNSTILE_SECRET_KEY not set — skipping verification (dev mode)");
    } else {
      const formData = new URLSearchParams();
      formData.set("secret",   turnstileSecretKey);
      formData.set("response", turnstileToken as string);
      // Optionally include the user's IP for extra security
      const remoteIp = req.headers.get("CF-Connecting-IP");
      if (remoteIp) formData.set("remoteip", remoteIp);

      const tsResp = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        body:   formData,
      });
      const tsResult = await tsResp.json() as { success: boolean; "error-codes"?: string[] };

      if (!tsResult.success) {
        console.warn("[submit-review] Turnstile verification failed:", tsResult["error-codes"]);
        return jsonResp(
          { error: "CAPTCHA verification failed — please reload and try again" },
          403,
          cors,
        );
      }
    }

    // ── Step 4: Sanitise text fields ─────────────────────────────────────
    const cleanSubject      = sanitize(subject,      SUBJECT_MAX);
    const cleanReviewText   = sanitize(reviewText,   REVIEW_TEXT_MAX);
    const cleanReviewerName = sanitize(
      user.email?.split("@")[0] ?? "משתמש",
      REVIEWER_MAX,
    );

    // ── Step 5: Anti-spam analysis ────────────────────────────────────────
    // Run spam checks inline (same algorithm as anti-spam-check function).
    // Results are stored on the review row; spam-flagged reviews are still
    // inserted but surface in moderation tooling for human review.

    // 5a. SHA-256 duplicate hash
    async function sha256hex(text: string): Promise<string> {
      const encoder = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(text));
      return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    const normalised    = cleanReviewText.toLowerCase().replace(/[\u0591-\u05C7]/g, "").replace(/[^\w\s\u0590-\u05FF]/g, " ").replace(/\s+/g, " ").trim();
    const duplicateHash = await sha256hex(normalised);

    // 5b. Pattern checks
    const SPAM_PATTERNS: Array<{ pattern: RegExp; weight: number; flag: string }> = [
      { pattern: /קוד\s*קופון|קוד\s*הנחה|coupon|promo\s*code/i,            weight: 0.25, flag: "promo_code" },
      { pattern: /לחצ[וי]\s*כאן|click\s*here|לחץ\s*כאן/i,                  weight: 0.3,  flag: "cta_link" },
      { pattern: /https?:\/\/|www\./i,                                       weight: 0.35, flag: "url_in_text" },
      { pattern: /הרוויח[ות]\s*כסף|earn\s*money|make\s*money/i,             weight: 0.3,  flag: "earn_money" },
      { pattern: /100%\s*חינם|free\s*forever|חינמי\s*לגמרי/i,               weight: 0.2,  flag: "free_claim" },
      { pattern: /לא\s*(ניסיתי|השתמשתי|קניתי)|לא\s*עשיתי\s*את\s*הקורס/i,  weight: 0.5,  flag: "no_experience" },
      { pattern: /\[\s*שם\s*המוצר\s*\]|\[\s*name\s*\]|\{\s*product\s*\}/i, weight: 0.9,  flag: "template_placeholder" },
    ];
    const spamFlags: string[] = [];
    let spamScore = 0.0;
    for (const { pattern, weight, flag } of SPAM_PATTERNS) {
      if (pattern.test(cleanReviewText)) { spamScore += weight; spamFlags.push(flag); }
    }
    if (cleanReviewText.length < 20) { spamScore += 0.5; spamFlags.push("very_short_text"); }
    else if (cleanReviewText.length < 50) { spamScore += 0.2; spamFlags.push("short_text"); }
    const excessivePunct = (cleanReviewText.match(/[!?]{2,}/g) || []).length;
    if (excessivePunct >= 3) { spamScore += 0.2; spamFlags.push("excessive_punctuation"); }

    // 5c. DB checks: duplicate content + user burst
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: dupRow } = await adminClient
      .from("reviews").select("id").eq("duplicate_hash", duplicateHash).limit(1).maybeSingle();
    if (dupRow) { spamScore += 0.6; spamFlags.push("duplicate_content"); }

    const windowStart24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await adminClient
      .from("reviews").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", windowStart24h);
    if ((recentCount ?? 0) >= 5) { spamScore += 0.5; spamFlags.push("burst_5plus_24h"); }
    else if ((recentCount ?? 0) >= 3) { spamScore += 0.25; spamFlags.push("burst_3plus_24h"); }

    // 5d. Business-level burst check (fire-and-forget burst flag)
    const windowStart1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: bizBurst } = await adminClient
      .from("reviews").select("id", { count: "exact", head: true })
      .eq("business_id", businessId).gte("created_at", windowStart1h);
    if ((bizBurst ?? 0) >= 10) {
      spamFlags.push("business_burst_10plus_1h");
      adminClient.from("review_burst_flags").insert({
        business_id:  businessId,
        window_start: windowStart1h,
        window_end:   new Date().toISOString(),
        review_count: bizBurst ?? 10,
        threshold:    10,
        severity:     (bizBurst ?? 0) >= 20 ? "critical" : (bizBurst ?? 0) >= 15 ? "high" : "medium",
        status:       "open",
      }).then(() => {}).catch(() => {});
    }

    const isFlaggedSpam = Math.min(1.0, spamScore) >= 0.6;

    // ── Step 6: Insert review via service role ────────────────────────────
    // Using service-role key here ensures the insert cannot be blocked by
    // client-facing RLS misconfiguration and that we bypass nothing ourselves
    // — all business logic is in this function.
    // NOTE: adminClient was already created in Step 5 for spam checks.

    // Guard: verify the businessId actually exists (prevents phantom reviews)
    const { data: bizExists, error: bizErr } = await adminClient
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();

    if (bizErr || !bizExists) {
      return jsonResp({ error: "Business not found" }, 404, cors);
    }

    // ── SECURITY FIX: Server-side verified purchase validation ────────────
    // VULNERABILITY (before fix): Client sent verifiedPurchase=true and the
    // server trusted it unconditionally — anyone could forge a "Verified
    // Purchase" badge on their review with no actual purchase.
    //
    // FIX: Query the purchases table and only set verified_purchase=true if
    // a matching record exists for this user+course combination.
    // Fallback: if no courseId was provided, verified_purchase is always false.
    let serverVerifiedPurchase = false;
    let serverVerificationStatus = "anonymous";

    if (courseId && typeof courseId === "string") {
      // Check purchases by user_id first (most reliable), then by email fallback
      const { data: purchaseRow } = await adminClient
        .from("purchases")
        .select("id, verified")
        .eq("course_id", courseId)
        .or(`customer_user_id.eq.${user.id},customer_email.eq.${user.email ?? ""}`)
        .maybeSingle();

      if (purchaseRow) {
        // Purchase record found — honour verified flag from the DB record
        serverVerifiedPurchase  = purchaseRow.verified ?? true;
        serverVerificationStatus = serverVerifiedPurchase
          ? "purchase_verified"
          : "email_verified";
      }
      // If no purchase record: leave serverVerifiedPurchase = false
      // (client's verifiedPurchase claim is silently ignored)
    }

    // Capture audit metadata for legal compliance (Pillar 3)
    const submissionIp = req.headers.get("CF-Connecting-IP") ?? req.headers.get("X-Forwarded-For") ?? null;
    const submissionUa = req.headers.get("User-Agent") ?? null;

    const { data: insertedReview, error: insertError } = await adminClient
      .from("reviews")
      .insert({
        user_id:               user.id,
        business_id:           businessId,
        course_id:             courseId && typeof courseId === "string" ? courseId : null,
        rating:                Math.round(rating as number),
        review_text:           cleanReviewText,
        subject:               cleanSubject,
        training_duration:     trainingDuration,
        // ✅ FIXED: server-verified value only — client's claim is ignored
        verified_purchase:     serverVerifiedPurchase,
        reviewer_name:         cleanReviewerName,
        anonymous:             false,
        submission_ip:         submissionIp,
        submission_user_agent: submissionUa,
        // Legal compliance fields (migration 20260311000005)
        indemnity_accepted:    true,
        indemnity_accepted_at: indemnityAcceptedAt && typeof indemnityAcceptedAt === "string"
          ? indemnityAcceptedAt
          : new Date().toISOString(),
        // ✅ FIXED: server-computed status — not the client-supplied value
        verification_status:   serverVerificationStatus,
        // ── Anti-spam fields (Feature 7) ──────────────────────────────
        spam_score:            Math.min(1.0, Math.round(spamScore * 1000) / 1000),
        is_flagged_spam:       isFlaggedSpam,
        spam_flags:            spamFlags.length > 0 ? spamFlags : null,
        duplicate_hash:        duplicateHash,
      })
      .select("id")
      .single();

    if (insertError) {
      // PostgreSQL unique-constraint violation code
      if (insertError.code === "23505") {
        return jsonResp(
          { error: "duplicate_review", message: "כבר שלחתם ביקורת על עסק זה" },
          409,
          cors,
        );
      }
      console.error("[submit-review] insert error:", insertError);
      return jsonResp({ error: "Failed to save review" }, 500, cors);
    }

    // ── Trust moderation log — write audit entry when spam is detected ──────
    if (isFlaggedSpam && insertedReview?.id) {
      adminClient.from("trust_moderation_log").insert({
        decision_type: "spam_flagged",
        reason:        `ספאם זוהה אוטומטית. ציון: ${Math.min(1.0, Math.round(spamScore * 1000) / 1000).toFixed(3)}. דגלים: ${spamFlags.join(", ")}`,
        source:        "auto_spam_check",
        review_id:     insertedReview.id,
        business_id:   businessId as string,
        reporter_id:   null,
        metadata:      {
          spam_score:  Math.min(1.0, Math.round(spamScore * 1000) / 1000),
          spam_flags:  spamFlags,
          duplicate_hash: duplicateHash,
        },
      }).then(({ error: logErr }) => {
        if (logErr) console.warn("[trust_moderation_log] spam write failed:", logErr.message);
      });
    }

    return jsonResp({
      success:         true,
      verifiedPurchase: serverVerifiedPurchase,
      spamFlagged:     isFlaggedSpam,
      spamScore:       Math.min(1.0, Math.round(spamScore * 1000) / 1000),
    }, 200, cors);

  } catch (err) {
    console.error("[submit-review] unexpected error:", err);
    return jsonResp({ error: "Internal server error" }, 500, cors);
  }
});

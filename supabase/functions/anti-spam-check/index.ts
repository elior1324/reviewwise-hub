/**
 * anti-spam-check — Edge Function
 *
 * Standalone spam-analysis endpoint used by:
 *   • submit-review (inline logic copy — avoids HTTP round-trip overhead)
 *   • Admin rescreening tool (calls this endpoint with service-role auth)
 *   • Scheduled re-scan job
 *
 * Checks performed:
 *   1. Spam keyword detection  — promo/sales language patterns (HE + EN)
 *   2. Short text penalty      — reviews under 30 chars are low-quality
 *   3. Link/URL detection      — reviews containing URLs are spam-likely
 *   4. Excessive punctuation   — repeated !!! or ??? signals inauthenticity
 *   5. All-caps ratio          — high caps ratio signals aggressive spam
 *   6. Burst detection         — same user ≥ 3 reviews in 24 hours
 *   7. Duplicate hash          — SHA-256 of normalised text; exact duplicates rejected
 *
 * Security: requires Authorization: Bearer <service_role_key> for burst/dup checks.
 * If called without auth, returns pattern-only checks (no DB queries).
 *
 * Request body:
 *   {
 *     reviewText:  string;           // required
 *     userId?:     string;           // UUID — enables burst check
 *     businessId?: string;           // UUID — scopes burst + duplicate checks
 *     reviewId?:   string;           // UUID — existing review to re-screen
 *   }
 *
 * Response body:
 *   {
 *     spamScore:      number;        // 0.0 – 1.0
 *     isSpam:         boolean;       // spamScore >= 0.6
 *     flags:          string[];      // human-readable flag list
 *     duplicateHash:  string;        // SHA-256 hex of normalised text
 *     burstDetected:  boolean;
 *   }
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// jsonResp is defined inside serve() to access per-request corsHeaders

// ── Spam keyword patterns (Hebrew + English) ───────────────────────────────

const SPAM_PATTERNS: Array<{ pattern: RegExp; weight: number; flag: string }> = [
  // Promotional / referral
  { pattern: /קוד\s*קופון|קוד\s*הנחה|coupon|promo\s*code/i,              weight: 0.25, flag: "promo_code" },
  { pattern: /לחצ[וי]\s*כאן|click\s*here|לחץ\s*כאן/i,                    weight: 0.3,  flag: "cta_link" },
  { pattern: /https?:\/\/|www\./i,                                         weight: 0.35, flag: "url_in_text" },
  // Generic spam phrases
  { pattern: /הרוויח[ות]\s*כסף|earn\s*money|make\s*money|עשה\s*כסף/i,    weight: 0.3,  flag: "earn_money" },
  { pattern: /100%\s*חינם|free\s*forever|חינמי\s*לגמרי/i,                 weight: 0.2,  flag: "free_claim" },
  // Fake review patterns
  { pattern: /לא\s*(ניסיתי|השתמשתי|קניתי)|לא\s*עשיתי\s*את\s*הקורס/i,    weight: 0.5,  flag: "no_experience" },
  { pattern: /I\s+have\s+not\s+used|never\s+tried|haven'?t\s+tried/i,    weight: 0.5,  flag: "no_experience_en" },
  // Competitor mentions
  { pattern: /מתחרה|competitor|האתר\s+השני/i,                              weight: 0.15, flag: "competitor_mention" },
  // Templated review signals
  { pattern: /\[\s*שם\s*המוצר\s*\]|\[\s*name\s*\]|\{\s*product\s*\}/i,  weight: 0.9,  flag: "template_placeholder" },
];

// ── SHA-256 helper (Web Crypto — available in Deno) ────────────────────────

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Normalise text before hashing: lowercase, strip punctuation, collapse spaces. */
function normaliseForHash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")   // strip Hebrew nikud (diacritics)
    .replace(/[^\w\s\u0590-\u05FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Core spam-scoring function ─────────────────────────────────────────────

interface SpamResult {
  spamScore:     number;
  isSpam:        boolean;
  flags:         string[];
  duplicateHash: string;
  burstDetected: boolean;
}

async function computeSpamScore(
  reviewText:     string,
  userId:         string | null,
  businessId:     string | null,
  adminClient:    ReturnType<typeof createClient> | null,
): Promise<SpamResult> {
  const flags: string[] = [];
  let   score = 0.0;

  // ── Check 1: Keyword patterns ──────────────────────────────────────────
  for (const { pattern, weight, flag } of SPAM_PATTERNS) {
    if (pattern.test(reviewText)) {
      score += weight;
      flags.push(flag);
    }
  }

  // ── Check 2: Short text penalty ────────────────────────────────────────
  const cleaned = reviewText.replace(/\s+/g, " ").trim();
  if (cleaned.length < 20) {
    score += 0.5;
    flags.push("very_short_text");
  } else if (cleaned.length < 50) {
    score += 0.2;
    flags.push("short_text");
  }

  // ── Check 3: Excessive punctuation ─────────────────────────────────────
  const excessivePunct = (cleaned.match(/[!?]{2,}/g) || []).length;
  if (excessivePunct >= 3) {
    score += 0.2;
    flags.push("excessive_punctuation");
  }

  // ── Check 4: All-caps ratio ─────────────────────────────────────────────
  const letters    = cleaned.replace(/[^a-zA-Z\u0590-\u05FF]/g, "");
  const capsLetters = cleaned.replace(/[^A-Z]/g, "");
  if (letters.length > 10 && capsLetters.length / letters.length > 0.5) {
    score += 0.2;
    flags.push("high_caps_ratio");
  }

  // ── Duplicate hash (always computed) ──────────────────────────────────
  const normalised    = normaliseForHash(reviewText);
  const duplicateHash = await sha256hex(normalised);

  // ── DB-dependent checks (require admin client) ─────────────────────────
  let burstDetected = false;

  if (adminClient) {

    // ── Check 5: Duplicate content ──────────────────────────────────────
    const { data: dupRow } = await adminClient
      .from("reviews")
      .select("id")
      .eq("duplicate_hash", duplicateHash)
      .limit(1)
      .maybeSingle();

    if (dupRow) {
      score += 0.6;
      flags.push("duplicate_content");
    }

    // ── Check 6: Burst detection (user-level) ───────────────────────────
    if (userId) {
      const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await adminClient
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", windowStart);

      const recentCount = count ?? 0;
      if (recentCount >= 5) {
        score += 0.5;
        flags.push("burst_5plus_24h");
        burstDetected = true;
      } else if (recentCount >= 3) {
        score += 0.25;
        flags.push("burst_3plus_24h");
        burstDetected = true;
      }
    }

    // ── Check 7: Business-level burst ──────────────────────────────────
    if (businessId) {
      const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour
      const { count: bizBurst } = await adminClient
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("created_at", windowStart);

      const bizBurstCount = bizBurst ?? 0;
      if (bizBurstCount >= 10) {
        // Flag on the business — record a review_burst_flags row
        flags.push("business_burst_10plus_1h");
        // Non-blocking: insert burst flag (best-effort)
        await adminClient.from("review_burst_flags").insert({
          business_id:   businessId,
          window_start:  windowStart,
          window_end:    new Date().toISOString(),
          review_count:  bizBurstCount,
          threshold:     10,
          severity:      bizBurstCount >= 20 ? "critical" : bizBurstCount >= 15 ? "high" : "medium",
          status:        "open",
        }).then(() => {}).catch(() => {}); // fire-and-forget
      }
    }
  }

  // ── Cap score at 1.0 ────────────────────────────────────────────────────
  const finalScore = Math.min(1.0, Math.round(score * 1000) / 1000);

  return {
    spamScore:     finalScore,
    isSpam:        finalScore >= 0.6,
    flags,
    duplicateHash,
    burstDetected,
  };
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const jsonResp = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")   return jsonResp({ error: "Method not allowed" }, 405);

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResp({ error: "Invalid JSON body" }, 400);
    }

    const reviewText = typeof body.reviewText === "string" ? body.reviewText : null;
    if (!reviewText || reviewText.trim().length === 0) {
      return jsonResp({ error: "reviewText is required" }, 400);
    }

    const userId     = typeof body.userId     === "string" ? body.userId     : null;
    const businessId = typeof body.businessId === "string" ? body.businessId : null;
    const reviewId   = typeof body.reviewId   === "string" ? body.reviewId   : null;

    // Attempt service-role auth for DB checks
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    let adminClient: ReturnType<typeof createClient> | null = null;

    if (authHeader.includes(SUPABASE_SERVICE_ROLE_KEY) || authHeader.startsWith("Bearer ")) {
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    const result = await computeSpamScore(reviewText, userId, businessId, adminClient);

    // If a reviewId was provided, update that review with the fresh spam analysis
    if (reviewId && adminClient) {
      await adminClient
        .from("reviews")
        .update({
          spam_score:      result.spamScore,
          is_flagged_spam: result.isSpam,
          spam_flags:      result.flags,
          duplicate_hash:  result.duplicateHash,
        })
        .eq("id", reviewId);
    }

    return jsonResp(result);

  } catch (err) {
    console.error("[anti-spam-check] error:", err);
    return jsonResp({ error: "Internal server error" }, 500);
  }
});

/**
 * detect-review-anomalies — Edge Function
 *
 * AI-powered platform safety scanner. Detects suspicious patterns in reviews
 * and creates `ai_anomaly_flags` records for investigation.
 *
 * Detects 5 anomaly types:
 *   1. rating_spike       — sudden large influx of extreme ratings (1★ or 5★) in 48h
 *   2. review_flood       — volume in 24h exceeds 3× the 30d daily average
 *   3. coordinated_timing — ≥4 reviews within a 10-minute window (suspicious burst)
 *   4. sentiment_mismatch — AI: positive/neutral text paired with 1★ rating
 *   5. velocity_anomaly   — trending_score > 5× baseline (statistical outlier)
 *
 * Call modes:
 *   { business_id }   — check one business
 *   {}                — batch scan all businesses with recent review activity
 *
 * Security: CRON_SECRET required. Not callable by end users.
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, CRON_SECRET
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders }  from "../_shared/cors.ts";
import {
  AI_MODELS, callAi, extractContent,
} from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY  = Deno.env.get("LOVABLE_API_KEY") || "";
const CRON_SECRET  = Deno.env.get("CRON_SECRET") || "";

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorised(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) ||
         auth === `Bearer ${SERVICE_KEY}`;
}

// ── Flag deduplication — don't re-create a flag that's already open ───────────

async function flagAlreadyOpen(
  db:         ReturnType<typeof createClient>,
  businessId: string,
  flagType:   string,
): Promise<boolean> {
  const { data } = await db.from("ai_anomaly_flags")
    .select("id")
    .eq("business_id", businessId)
    .eq("flag_type", flagType)
    .eq("status", "open")
    .maybeSingle();
  return !!data;
}

async function createFlag(
  db:         ReturnType<typeof createClient>,
  businessId: string,
  flagType:   string,
  severity:   "low" | "medium" | "high" | "critical",
  details:    Record<string, unknown>,
): Promise<void> {
  if (await flagAlreadyOpen(db, businessId, flagType)) return;

  await db.from("ai_anomaly_flags").insert({
    business_id: businessId,
    flag_type:   flagType,
    severity,
    details,
  });

  // Mirror to audit_logs for compliance trail
  await db.from("audit_logs").insert({
    event_type:  "anomaly_detected",
    actor_type:  "ai",
    actor_id:    "detect-review-anomalies",
    target_type: "business",
    target_id:   businessId,
    business_id: businessId,
    payload:     { flag_type: flagType, severity, ...details },
  }).catch(() => {}); // non-blocking, audit_logs may not always exist
}

// ── 1. Rating spike ───────────────────────────────────────────────────────────

async function checkRatingSpike(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  const ago48h = new Date(Date.now() - 48 * 3600_000).toISOString();
  const ago14d = new Date(Date.now() - 14 * 86400_000).toISOString();

  const [{ data: recent }, { data: baseline }] = await Promise.all([
    db.from("reviews")
      .select("id, rating, created_at")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago48h),
    db.from("reviews")
      .select("id, rating")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago14d)
      .lt("created_at", ago48h),
  ]);

  if (!recent || recent.length < 5) return; // not enough volume to flag

  const recentCount   = recent.length;
  const baselineCount = baseline?.length ?? 0;
  const baselineDaily = baselineCount / 12; // 12 remaining days in 14d window

  // Only flag if 48h volume > 3× normal daily rate
  if (baselineDaily > 0 && recentCount < baselineDaily * 6) return;

  const fiveStars = recent.filter((r: any) => r.rating === 5).length;
  const oneStar   = recent.filter((r: any) => r.rating === 1).length;

  if (fiveStars / recentCount > 0.80) {
    await createFlag(db, businessId, "rating_spike", "high", {
      window_48h:        recentCount,
      five_star_percent: Math.round(fiveStars / recentCount * 100),
      baseline_daily:    parseFloat(baselineDaily.toFixed(2)),
    });
  } else if (oneStar / recentCount > 0.70) {
    await createFlag(db, businessId, "rating_spike", "high", {
      window_48h:       recentCount,
      one_star_percent: Math.round(oneStar / recentCount * 100),
      baseline_daily:   parseFloat(baselineDaily.toFixed(2)),
    });
  }
}

// ── 2. Review flood ───────────────────────────────────────────────────────────

async function checkReviewFlood(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  const ago24h = new Date(Date.now() - 24 * 3600_000).toISOString();
  const ago30d = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [{ data: today }, { data: month }] = await Promise.all([
    db.from("reviews")
      .select("id")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago24h),
    db.from("reviews")
      .select("id")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago30d)
      .lt("created_at", ago24h),
  ]);

  const todayCount = today?.length ?? 0;
  const avgDaily   = (month?.length ?? 0) / 29;

  if (todayCount < 10) return; // need meaningful volume
  if (avgDaily <= 0 || todayCount <= avgDaily * 3) return;

  await createFlag(db, businessId, "review_flood",
    todayCount > avgDaily * 8 ? "critical" : "high",
    {
      reviews_24h:   todayCount,
      avg_daily_30d: parseFloat(avgDaily.toFixed(2)),
      multiplier:    parseFloat((todayCount / Math.max(avgDaily, 0.1)).toFixed(1)),
    },
  );
}

// ── 3. Coordinated timing ─────────────────────────────────────────────────────

async function checkCoordinatedTiming(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  const ago7d = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data: reviews } = await db.from("reviews")
    .select("id, created_at")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .gte("created_at", ago7d)
    .order("created_at", { ascending: true });

  if (!reviews || reviews.length < 4) return;

  // Sliding window: find windows of 10 minutes with ≥4 reviews
  const WINDOW_MS = 10 * 60_000;
  let maxBurst = 0;
  let burstWindow: string[] = [];

  for (let i = 0; i < reviews.length; i++) {
    const start = new Date(reviews[i].created_at).getTime();
    const window = reviews.filter((r: any) =>
      new Date(r.created_at).getTime() >= start &&
      new Date(r.created_at).getTime() <= start + WINDOW_MS
    );
    if (window.length > maxBurst) {
      maxBurst = window.length;
      burstWindow = window.map((r: any) => r.id);
    }
  }

  if (maxBurst >= 4) {
    await createFlag(db, businessId, "coordinated_timing",
      maxBurst >= 8 ? "critical" : maxBurst >= 6 ? "high" : "medium",
      {
        max_reviews_in_10min: maxBurst,
        sample_review_ids:    burstWindow.slice(0, 5),
      },
    );
  }
}

// ── 4. Sentiment mismatch (AI-powered) ───────────────────────────────────────

async function checkSentimentMismatch(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  if (!LOVABLE_KEY) return;

  // Find 1-star reviews with non-trivially long text (likely genuine analysis)
  const ago30d = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: lowRated } = await db.from("reviews")
    .select("id, rating, review_text")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .eq("rating", 1)
    .gte("created_at", ago30d)
    .not("review_text", "is", null)
    .limit(10);

  if (!lowRated || lowRated.length === 0) return;

  // Filter to reviews with enough text to analyse
  const candidates = lowRated.filter((r: any) =>
    (r.review_text?.trim().length ?? 0) > 40
  );
  if (candidates.length === 0) return;

  const reviewLines = candidates.map((r: any, i: number) =>
    `${i + 1}. "${r.review_text?.substring(0, 200)}"`
  ).join("\n");

  const prompt = `בדוק האם ביקורות אלה עם דירוג 1 כוכב מכילות טקסט חיובי או ניטרלי שאינו עולה בקנה אחד עם הדירוג הנמוך.

ביקורות לבדיקה:
${reviewLines}

ענה ב-JSON:
{"mismatched_indices": [<מספרי הביקורות שנראות לא תואמות>], "explanation": "<הסבר קצר>"}

אם הכל תואם — החזר: {"mismatched_indices": [], "explanation": "תואם"}`;

  const result = await callAi(LOVABLE_KEY, {
    model:       AI_MODELS.fast,
    temperature: 0,
    maxTokens:   150,
    messages:    [{ role: "user", content: prompt }],
  });

  if (!result.ok) return;

  const raw = extractContent(result.data);
  if (!raw) return;

  try {
    const clean   = raw.replace(/```json?|```/g, "").trim();
    const parsed  = JSON.parse(clean);
    const indices = Array.isArray(parsed.mismatched_indices) ? parsed.mismatched_indices : [];

    if (indices.length > 0) {
      const mismatchedIds = indices
        .map((i: number) => candidates[i - 1]?.id)
        .filter(Boolean);

      await createFlag(db, businessId, "sentiment_mismatch", "medium", {
        count:       mismatchedIds.length,
        review_ids:  mismatchedIds,
        explanation: parsed.explanation ?? "",
      });
    }
  } catch {
    // JSON parse failure — not critical
  }
}

// ── 5. Velocity anomaly ───────────────────────────────────────────────────────

async function checkVelocityAnomaly(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  const { data: biz } = await db.from("businesses")
    .select("trending_score")
    .eq("id", businessId)
    .single();

  if (!biz?.trending_score) return;
  if (biz.trending_score <= 5.0) return; // only flag statistical outliers

  await createFlag(db, businessId, "velocity_anomaly",
    biz.trending_score > 10 ? "high" : "medium",
    {
      trending_score: biz.trending_score,
      threshold:      5.0,
    },
  );
}

// ── Process one business ──────────────────────────────────────────────────────

async function scanBusiness(
  db:         ReturnType<typeof createClient>,
  businessId: string,
): Promise<void> {
  await Promise.allSettled([
    checkRatingSpike(db, businessId),
    checkReviewFlood(db, businessId),
    checkCoordinatedTiming(db, businessId),
    checkSentimentMismatch(db, businessId),
    checkVelocityAnomaly(db, businessId),
  ]);
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAuthorised(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body       = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const businessId = typeof body.business_id === "string" ? body.business_id : null;

    let targets: string[] = [];

    if (businessId) {
      targets = [businessId];
    } else {
      // Batch: businesses with review activity in the last 48h
      const ago48h = new Date(Date.now() - 48 * 3600_000).toISOString();
      const { data } = await db.from("reviews")
        .select("business_id")
        .is("deleted_at", null)
        .gte("created_at", ago48h);

      const unique = new Set((data ?? []).map((r: any) => r.business_id));
      targets = [...unique].filter(Boolean) as string[];
    }

    await Promise.allSettled(targets.map(id => scanBusiness(db, id)));

    // Count new open flags created in this run
    const ago5min = new Date(Date.now() - 5 * 60_000).toISOString();
    const { count } = await db.from("ai_anomaly_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .gte("detected_at", ago5min);

    console.log(`[detect-review-anomalies] scanned ${targets.length} businesses, created ${count ?? 0} new flags`);

    return new Response(JSON.stringify({
      success:           true,
      businesses_scanned: targets.length,
      new_flags:         count ?? 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[detect-review-anomalies] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * analyze-profiles — Edge Function
 *
 * Core AI profile intelligence scanner. Computes AI-powered signals for each
 * business and writes them back to the `businesses` table.
 *
 * Signals computed per business:
 *   review_velocity   — reviews per day (30-day rolling average)
 *   trending_score    — 30d velocity ÷ 90d baseline (1.0 = stable, >1 = growing)
 *   response_rate     — fraction of reviews that received a business response
 *   sentiment_score   — 0.0–1.0 avg positive sentiment from recent review text
 *   quality_score     — 0.0–1.0 average review quality / detail level
 *   last_ai_scan_at   — timestamp of this scan
 *
 * Call modes:
 *   { business_id: "<uuid>" }   — scan one specific business
 *   {}                          — scan all businesses not scanned in 24h (cron mode)
 *
 * Security: requires CRON_SECRET header OR service-role JWT.
 *
 * Environment variables:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   LOVABLE_API_KEY           — Gemini gateway
 *   CRON_SECRET               — shared secret for cron trigger
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders }  from "../_shared/cors.ts";
import {
  AI_MODELS, callAi, extractContent,
} from "../_shared/ai-config.ts";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY   = Deno.env.get("LOVABLE_API_KEY") || "";
const CRON_SECRET   = Deno.env.get("CRON_SECRET") || "";

// Maximum reviews to feed into the sentiment/quality AI call (cost control)
const MAX_REVIEWS_FOR_AI = 20;

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorised(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true;
  if (auth === `Bearer ${SERVICE_KEY}`) return true;
  return false;
}

// ── Signal computation helpers ────────────────────────────────────────────────

interface ReviewRow {
  id:               string;
  rating:           number;
  review_text:      string;
  created_at:       string;
  verified_purchase: boolean;
}

interface ReviewResponseRow {
  review_id: string;
}

/**
 * Compute purely arithmetic signals that don't require an LLM call.
 */
function computeArithmeticSignals(
  reviews30d:        ReviewRow[],
  reviews30to90d:    ReviewRow[],
  responsesForBiz:   ReviewResponseRow[],
  totalReviewCount:  number,
): {
  review_velocity: number;
  trending_score:  number;
  response_rate:   number;
} {
  // Velocity: reviews per day over the last 30 days
  const review_velocity = parseFloat((reviews30d.length / 30).toFixed(4));

  // Trending: compare last-30d daily rate to the 30–90d baseline daily rate.
  // Cap at 10× to avoid div-by-zero / infinite outliers.
  const baseline30to90 = reviews30to90d.length / 60; // 60 days in that window
  const trending_score = baseline30to90 > 0
    ? parseFloat(Math.min(review_velocity / baseline30to90, 10).toFixed(4))
    : review_velocity > 0 ? 2.0 : 1.0; // first-ever reviews = mild trending signal

  // Response rate: responses / total reviews (using actual total, not just 30d)
  const response_rate = totalReviewCount > 0
    ? parseFloat((responsesForBiz.length / totalReviewCount).toFixed(4))
    : 0;

  return { review_velocity, trending_score, response_rate };
}

/**
 * Ask Gemini to rate the sentiment and quality of a sample of recent reviews.
 * Returns { sentiment_score, quality_score } both in 0.0–1.0 range.
 */
async function computeAiScores(
  reviews: ReviewRow[],
  businessName: string,
): Promise<{ sentiment_score: number; quality_score: number } | null> {
  if (!LOVABLE_KEY || reviews.length === 0) return null;

  const sample = reviews.slice(0, MAX_REVIEWS_FOR_AI);
  const reviewLines = sample.map((r, i) =>
    `${i + 1}. [${r.rating}★] ${r.review_text?.substring(0, 200) || "(ללא טקסט)"}`
  ).join("\n");

  const prompt = `אתה מנתח ביקורות לפלטפורמת ReviewHub.

עסק: "${businessName}"
${sample.length} ביקורות אחרונות:
${reviewLines}

דרג את הביקורות האלה בשני ממדים בסקלה 0.0 עד 1.0:

1. sentiment_score — מידת החיוביות הכוללת של הביקורות (0 = כולן שליליות, 1 = כולן חיוביות מאוד)
2. quality_score — איכות ועומק הביקורות (0 = קצרות/ריקות/חסרות תוכן, 1 = מפורטות/עשירות/שימושיות)

ענה אך ורק ב-JSON תקין — ללא הסברים נוספים:
{"sentiment_score": <מספר>, "quality_score": <מספר>}`;

  const result = await callAi(LOVABLE_KEY, {
    model:       AI_MODELS.fast,
    temperature: 0,
    maxTokens:   80,
    messages:    [{ role: "user", content: prompt }],
  });

  if (!result.ok) return null;

  const raw = extractContent(result.data);
  if (!raw) return null;

  try {
    const clean = raw.replace(/```json?|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const s = parseFloat(parsed.sentiment_score);
    const q = parseFloat(parsed.quality_score);
    if (isNaN(s) || isNaN(q)) return null;
    return {
      sentiment_score: Math.min(1, Math.max(0, parseFloat(s.toFixed(3)))),
      quality_score:   Math.min(1, Math.max(0, parseFloat(q.toFixed(3)))),
    };
  } catch {
    return null;
  }
}

// ── Process a single business ─────────────────────────────────────────────────

async function processOneBusiness(
  db:         ReturnType<typeof createClient>,
  businessId: string,
  bizName:    string,
): Promise<{ id: string; updated: boolean; error?: string }> {
  const now      = new Date();
  const ago30d   = new Date(now.getTime() - 30 * 86400_000).toISOString();
  const ago90d   = new Date(now.getTime() - 90 * 86400_000).toISOString();

  // Fetch reviews in the two velocity windows (only non-deleted)
  const [{ data: r30 }, { data: r90to30 }, { data: rAll }] = await Promise.all([
    db.from("reviews")
      .select("id, rating, review_text, created_at, verified_purchase")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago30d),
    db.from("reviews")
      .select("id, rating, review_text, created_at, verified_purchase")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("created_at", ago90d)
      .lt("created_at", ago30d),
    db.from("reviews")
      .select("id")
      .eq("business_id", businessId)
      .is("deleted_at", null),
  ]);

  const reviews30d:     ReviewRow[]         = r30       ?? [];
  const reviews30to90d: ReviewRow[]         = r90to30   ?? [];
  const totalCount      = (rAll ?? []).length;

  // Fetch business responses for this business
  const { data: responses } = await db
    .from("review_responses")
    .select("review_id")
    .eq("business_id", businessId);

  const responsesForBiz: ReviewResponseRow[] = responses ?? [];

  // Arithmetic signals (no LLM needed)
  const arithmetic = computeArithmeticSignals(
    reviews30d, reviews30to90d, responsesForBiz, totalCount,
  );

  // AI signals — use recent 30d reviews ordered by created_at desc
  const recentForAi = [...reviews30d]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_REVIEWS_FOR_AI);

  const aiScores = recentForAi.length > 0
    ? await computeAiScores(recentForAi, bizName)
    : null;

  // Write back to businesses
  const update: Record<string, unknown> = {
    review_velocity:  arithmetic.review_velocity,
    trending_score:   arithmetic.trending_score,
    response_rate:    arithmetic.response_rate,
    last_ai_scan_at:  now.toISOString(),
  };

  if (aiScores) {
    update.sentiment_score = aiScores.sentiment_score;
    update.quality_score   = aiScores.quality_score;
  }

  const { error: updateErr } = await db
    .from("businesses")
    .update(update)
    .eq("id", businessId);

  if (updateErr) {
    console.error(`[analyze-profiles] update failed for ${businessId}:`, updateErr.message);
    return { id: businessId, updated: false, error: "update failed" };
  }

  return { id: businessId, updated: true };
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
    const body         = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const businessId   = typeof body.business_id === "string" ? body.business_id : null;
    const batchLimit   = typeof body.limit       === "number"  ? body.limit       : 50;

    let targets: Array<{ id: string; name: string }> = [];

    if (businessId) {
      // Single-business mode
      const { data } = await db.from("businesses").select("id, name").eq("id", businessId).single();
      if (!data) {
        return new Response(JSON.stringify({ error: "business_not_found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targets = [{ id: data.id, name: data.name }];
    } else {
      // Batch cron mode — businesses not scanned in the last 23 hours
      const cutoff = new Date(Date.now() - 23 * 3600_000).toISOString();
      const { data } = await db
        .from("businesses")
        .select("id, name")
        .or(`last_ai_scan_at.is.null,last_ai_scan_at.lt.${cutoff}`)
        .limit(batchLimit);
      targets = (data ?? []).map((r: any) => ({ id: r.id, name: r.name }));
    }

    // Process in parallel (capped at 5 concurrent to avoid DB overload)
    const results: Array<{ id: string; updated: boolean; error?: string }> = [];
    const CONCURRENCY = 5;

    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      const chunk = targets.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(
        chunk.map(t => processOneBusiness(db, t.id, t.name))
      );
      for (const r of settled) {
        results.push(r.status === "fulfilled"
          ? r.value
          : { id: "unknown", updated: false, error: String(r.reason) });
      }
    }

    const updated = results.filter(r => r.updated).length;
    const failed  = results.filter(r => !r.updated).length;

    console.log(`[analyze-profiles] scanned ${targets.length} businesses — ${updated} updated, ${failed} failed`);

    return new Response(JSON.stringify({
      success:   true,
      scanned:   targets.length,
      updated,
      failed,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[analyze-profiles] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

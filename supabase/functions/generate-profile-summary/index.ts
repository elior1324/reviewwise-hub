/**
 * generate-profile-summary — Edge Function
 *
 * Generates a short, neutral, AI-written summary of a business based on all
 * its verified reviews. The summary is stored in businesses.ai_summary and
 * displayed on the public profile page.
 *
 * The summary is:
 *   – 3-4 sentences maximum
 *   – Factual and balanced (not promotional)
 *   – Written in Hebrew
 *   – Highlights what reviewers consistently praise AND any recurring concerns
 *
 * Call modes:
 *   { business_id }                          — on-demand by business owner
 *   { business_id, force: true }             — skip recency guard (cron)
 *
 * Rate limit: 3 regenerations per day per business owner (user-facing).
 * Cron calls (CRON_SECRET auth) bypass the rate limit.
 *
 * Environment variables:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   SUPABASE_ANON_KEY         — auto-injected
 *   LOVABLE_API_KEY           — Gemini gateway
 *   CRON_SECRET               — bypass for cron
 */

import { serve }            from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }     from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders }   from "../_shared/cors.ts";
import { checkAiRateLimit } from "../_shared/rate-limit.ts";
import {
  AI_MODELS, callAi, extractContent,
} from "../_shared/ai-config.ts";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_KEY   = Deno.env.get("LOVABLE_API_KEY") || "";
const CRON_SECRET   = Deno.env.get("CRON_SECRET") || "";

// Don't regenerate if summary is less than N hours old (unless force=true)
const RECENCY_GUARD_HOURS = 6;

// Max reviews to include in the summary context
const MAX_REVIEWS = 40;

// ── Build the prompt ──────────────────────────────────────────────────────────

function buildSummaryPrompt(
  bizName:    string,
  bizCategory: string,
  reviewCount: number,
  reviews:    Array<{ rating: number; review_text: string; verified_purchase: boolean }>,
): string {
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  const verifiedCount   = reviews.filter(r => r.verified_purchase).length;
  const avgRating       = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const samplePositive = positiveReviews.slice(0, 6).map(r =>
    `• [${r.rating}★] ${r.review_text?.substring(0, 180) || ""}`
  ).join("\n");

  const sampleNegative = negativeReviews.slice(0, 3).map(r =>
    `• [${r.rating}★] ${r.review_text?.substring(0, 180) || ""}`
  ).join("\n");

  return `אתה כותב תקצירי פרופיל ניטרליים ומקצועיים עבור פלטפורמת ReviewHub.

פרטי הפרופיל:
• שם: ${bizName}
• קטגוריה: ${bizCategory}
• סה"כ ביקורות: ${reviewCount} (${verifiedCount} מאומתות)
• דירוג ממוצע: ${avgRating.toFixed(1)}/5

ביקורות חיוביות לדוגמה (${positiveReviews.length} בסה"כ):
${samplePositive || "אין"}

ביקורות ביקורתיות לדוגמה (${negativeReviews.length} בסה"כ):
${sampleNegative || "אין"}

כתוב תקציר פרופיל בעברית — 3 משפטים בלבד.

כללים חשובים:
• עובדתי ומאוזן — לא פרסום, לא שיווק
• משפט 1: מה הלקוחות מעריכים ביותר (ממצא עיקרי חיובי)
• משפט 2: תחום מיוחדות / כוח עיקרי נוסף
• משפט 3: אם יש, ציין בעדינות נקודת שיפור חוזרת — אם אין, כתוב על יציבות ועקביות הדירוגים
• אל תזכיר שמות ספציפיים של לקוחות
• אל תציין כמה ביקורות יש — המספרים מוצגים בנפרד בפרופיל`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body       = await req.json();
    const businessId = typeof body.business_id === "string" ? body.business_id : null;
    const force      = body.force === true;

    if (!businessId) {
      return new Response(JSON.stringify({ error: "business_id required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Auth: cron bypass OR user JWT ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    let userId: string | null = null;
    if (!isCron) {
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      userId = user.id;

      // Verify ownership
      const { data: ownerCheck } = await db.from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", userId)
        .maybeSingle();

      if (!ownerCheck) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Rate limit (only for user-facing calls)
      const rateCheck = await checkAiRateLimit(db, userId, "generate-profile-summary", cors);
      if (!rateCheck.allowed) return rateCheck.response!;
    }

    // ── Fetch business ─────────────────────────────────────────────────────
    const { data: biz } = await db.from("businesses")
      .select("id, name, category, review_count, ai_summary_updated_at")
      .eq("id", businessId)
      .single();

    if (!biz) {
      return new Response(JSON.stringify({ error: "business_not_found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Recency guard (skip if summary was generated recently) ─────────────
    if (!force && biz.ai_summary_updated_at) {
      const age = Date.now() - new Date(biz.ai_summary_updated_at).getTime();
      if (age < RECENCY_GUARD_HOURS * 3600_000) {
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          reason:  `Summary generated ${Math.round(age / 3600_000)}h ago — still fresh.`,
        }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
    }

    // ── Fetch reviews ──────────────────────────────────────────────────────
    const { data: reviews } = await db.from("reviews")
      .select("rating, review_text, verified_purchase")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .not("review_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_REVIEWS);

    if (!reviews || reviews.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason:  "No reviews available to summarise.",
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (!LOVABLE_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Call Gemini ────────────────────────────────────────────────────────
    const prompt = buildSummaryPrompt(
      biz.name,
      biz.category ?? "כללי",
      biz.review_count ?? reviews.length,
      reviews,
    );

    const result = await callAi(LOVABLE_KEY, {
      model:       AI_MODELS.smart,
      temperature: 0.4,
      maxTokens:   300,
      messages:    [{ role: "user", content: prompt }],
    });

    if (!result.ok) {
      console.error("[generate-profile-summary] AI error:", result.status, result.text);
      return new Response(JSON.stringify({ error: "AI gateway error", status: result.status }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const summary = extractContent(result.data);
    if (!summary) {
      return new Response(JSON.stringify({ error: "AI returned empty summary" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Persist ────────────────────────────────────────────────────────────
    await db.from("businesses").update({
      ai_summary:            summary,
      ai_summary_updated_at: new Date().toISOString(),
    }).eq("id", businessId);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[generate-profile-summary] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

/**
 * compare-items — Edge Function
 *
 * AI-powered interactive comparison of businesses, courses, and professionals.
 * Upgraded from v1: now fetches live AI signals (sentiment, trending, quality)
 * from the database before each comparison, injecting richer context into the
 * Gemini prompt for more insightful, data-grounded analysis.
 *
 * New in v2:
 *   – Injects AI signals (sentiment_score, trending_score, quality_score,
 *     response_rate, ai_flags) into the comparison context
 *   – Adds a "📈 מגמות" section to the initial comparison output
 *   – Flags businesses with open anomaly flags with a ⚠️ warning
 *   – Fixed model: google/gemini-2.5-flash (was broken gemini-3-flash-preview)
 *
 * Rate limit: 30 calls/user/day (unchanged).
 *
 * Request body:
 *   {
 *     items:    CompareItem[]   — 2-3 items to compare
 *     messages: ChatMessage[]   — conversation history (omit for first call)
 *   }
 *
 * Response: text/event-stream (SSE streaming)
 */

import { serve }            from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }     from "https://esm.sh/@supabase/supabase-js@2";
import { checkAiRateLimit } from "../_shared/rate-limit.ts";
import { getCorsHeaders }   from "../_shared/cors.ts";
import { AI_MODELS }        from "../_shared/ai-config.ts";

interface CompareItem {
  name:            string;
  slug?:           string;
  businessName?:   string;
  category?:       string;
  rating?:         number;
  reviewCount?:    number;
  price?:          number;
  yearsExperience?: number;
  difficultyLevel?: string;
  targetAudience?: string;
  location?:       string;
  duration?:       string;
  format?:         string;
  description?:    string;
  type?:           string;
}

interface AiSignals {
  sentiment_score: number | null;
  quality_score:   number | null;
  trending_score:  number | null;
  response_rate:   number | null;
  ai_flags:        string[];
}

// ── Fetch AI signals from DB for a business slug ──────────────────────────────

async function fetchAiSignals(
  db:   ReturnType<typeof createClient>,
  slug: string | undefined,
): Promise<AiSignals | null> {
  if (!slug) return null;
  const { data } = await db
    .from("businesses")
    .select("sentiment_score, quality_score, trending_score, response_rate, ai_flags")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    sentiment_score: data.sentiment_score ?? null,
    quality_score:   data.quality_score   ?? null,
    trending_score:  data.trending_score  ?? null,
    response_rate:   data.response_rate   ?? null,
    ai_flags:        Array.isArray(data.ai_flags) ? data.ai_flags : [],
  };
}

// ── Format a signal value as a human-readable label ──────────────────────────

function formatSignal(value: number | null, label: string): string {
  if (value === null) return "";
  return `${label}: ${(value * 100).toFixed(0)}%`;
}

function trendingLabel(score: number | null): string {
  if (score === null) return "";
  if (score >= 3)   return "📈 צמיחה מהירה מאוד";
  if (score >= 2)   return "📈 צמיחה חזקה";
  if (score >= 1.3) return "↗️ צמיחה מתונה";
  if (score >= 0.7) return "→ יציב";
  return "↘️ ירידה בנפח";
}

// ── Build item description with AI signals ────────────────────────────────────

function buildItemDescription(item: CompareItem, signals: AiSignals | null): string {
  const parts: string[] = [`${item.name}`];

  if (item.businessName) parts.push(`(${item.businessName})`);
  if (item.category)     parts.push(`| קטגוריה: ${item.category}`);
  if (item.rating !== undefined) parts.push(`| דירוג: ${item.rating}/5`);
  if (item.reviewCount !== undefined) parts.push(`| ביקורות: ${item.reviewCount}`);
  if (item.price !== undefined) parts.push(`| מחיר: ₪${item.price}`);
  if (item.yearsExperience)  parts.push(`| ניסיון: ${item.yearsExperience} שנים`);
  if (item.difficultyLevel)  parts.push(`| רמה: ${item.difficultyLevel}`);
  if (item.targetAudience)   parts.push(`| קהל יעד: ${item.targetAudience}`);
  if (item.duration)         parts.push(`| משך: ${item.duration}`);
  if (item.format)           parts.push(`| פורמט: ${item.format}`);
  if (item.description)      parts.push(`| תיאור: ${item.description.substring(0, 100)}`);
  if (item.type) parts.push(`| סוג: ${item.type === "freelancer" ? "בעל מקצוע" : "קורס"}`);

  // AI signals block
  if (signals) {
    const signalParts: string[] = [];
    const s = formatSignal(signals.sentiment_score, "סנטימנט חיובי");
    const q = formatSignal(signals.quality_score,   "איכות ביקורות");
    const r = formatSignal(signals.response_rate,   "שיעור מענה");
    const t = trendingLabel(signals.trending_score);
    if (s) signalParts.push(s);
    if (q) signalParts.push(q);
    if (r) signalParts.push(r);
    if (t) signalParts.push(t);
    if (signals.ai_flags.length > 0) {
      signalParts.push(`⚠️ דגלים: ${signals.ai_flags.join(", ")}`);
    }
    if (signalParts.length > 0) {
      parts.push(`\n   [AI: ${signalParts.join(" | ")}]`);
    }
  }

  return parts.join(" ");
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY           = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit ────────────────────────────────────────────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const rateCheck   = await checkAiRateLimit(adminClient, user.id, "compare-items", corsHeaders);
    if (!rateCheck.allowed) return rateCheck.response!;

    const { items, messages } = await req.json();
    const isFirstMessage = !messages || messages.length === 0;

    // ── Fetch AI signals for each item (parallel) ─────────────────────────
    const signalsList: (AiSignals | null)[] = await Promise.all(
      (items as CompareItem[]).map(item =>
        fetchAiSignals(adminClient, item.slug ?? item.businessName?.toLowerCase().replace(/\s+/g, "-"))
      )
    );

    // ── Build item descriptions with signals ──────────────────────────────
    const itemDescriptions = (items as CompareItem[]).map((item, i) =>
      `${i + 1}. ${buildItemDescription(item, signalsList[i])}`
    ).join("\n\n");

    // ── Build system prompt ───────────────────────────────────────────────
    const systemPrompt = `אתה מומחה להשוואת שירותים מקצועיים ב-ReviewHub — פלטפורמת ביקורות מאומתות.
לכל פריט תקבל נתוני בסיס ונתוני AI מחושבים מביקורות מאומתות. השתמש בהם לניתוח עמוק ומבוסס נתונים.

הפריטים להשוואה:
${itemDescriptions}

## מבנה תגובה ראשונה — חובה לפי הסדר:

### 📊 סיכום מהיר
טבלת markdown עם עמודות: שם | דירוג | ביקורות | מחיר | סנטימנט | מגמה

### ✅ יתרונות עיקריים
2-3 נקודות לכל פריט. שם **מודגש**, נקודות קצרות ומבוססות על הנתונים.

### ⚠️ חסרונות / נקודות לשיפור
2-3 נקודות לכל פריט. אם יש דגלי AI — ציין אותם בסעיף זה.

### 📈 מגמות ונתוני AI
ניתוח הנתונים המחושבים: מי בצמיחה, מי יציב, מי מציג ביקורות איכותיות יותר, שיעורי מענה.
אם לפריט יש ⚠️ דגלים — הסבר בקצרה מה הם מצביעים.

### 🎯 שורה תחתונה
פסקה אחת — למי מתאים כל אחד ומה ההמלצה הכוללת.

## תגובות המשך (אחרי השאלה הראשונה):
ענה ממוקד לשאלה — ללא חזרה על ההשוואה המלאה.

## כללים:
- תמיד בעברית
- עובדתי ומבוסס על הנתונים שניתנו
- אם חסר מידע — ציין "אין נתונים" ולא תמציא
- שמור על פסקאות קצרות וקריאות`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(isFirstMessage
        ? [{ role: "user", content: "אנא צור השוואה מלאה בין הפריטים שנבחרו עם ניתוח AI" }]
        : (messages || [])),
    ];

    // ── Stream from Gemini ─────────────────────────────────────────────────
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:    AI_MODELS.smart,
        messages: allMessages,
        stream:   true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("[compare-items] AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("[compare-items] error:", e);
    console.error("[compare-items] unhandled error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

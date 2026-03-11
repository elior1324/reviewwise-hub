import { serve }            from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }     from "https://esm.sh/@supabase/supabase-js@2";
import { checkAiRateLimit } from "../_shared/rate-limit.ts";
import { getCorsHeaders }   from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: require a valid JWT ───────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit: 30 comparison calls per user per day ───────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const rateCheck = await checkAiRateLimit(adminClient, user.id, "compare-items", corsHeaders);
    if (!rateCheck.allowed) return rateCheck.response!;

    const { items, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build item descriptions for context
    const itemDescriptions = items.map((item: any, i: number) => {
      const parts = [`${i + 1}. ${item.name}`];
      if (item.businessName) parts.push(`(${item.businessName})`);
      if (item.category) parts.push(`| קטגוריה: ${item.category}`);
      if (item.rating !== undefined) parts.push(`| דירוג: ${item.rating}`);
      if (item.reviewCount !== undefined) parts.push(`| ביקורות: ${item.reviewCount}`);
      if (item.price !== undefined) parts.push(`| מחיר: ₪${item.price}`);
      if (item.yearsExperience) parts.push(`| שנות ניסיון: ${item.yearsExperience}`);
      if (item.difficultyLevel) parts.push(`| רמת קושי: ${item.difficultyLevel}`);
      if (item.targetAudience) parts.push(`| קהל יעד: ${item.targetAudience}`);
      if (item.location) parts.push(`| מיקום: ${item.location}`);
      if (item.duration) parts.push(`| משך: ${item.duration}`);
      if (item.format) parts.push(`| פורמט: ${item.format}`);
      if (item.description) parts.push(`| תיאור: ${item.description}`);
      if (item.type) parts.push(`| סוג: ${item.type === 'freelancer' ? 'בעל מקצוע' : 'קורס/הכשרה'}`);
      return parts.join(" ");
    }).join("\n");

    const itemNames = items.map((item: any) => item.name).join(" | ");

    const systemPrompt = `אתה מומחה להשוואת שירותים מקצועיים ב-ReviewHub.

הפריטים להשוואה:
${itemDescriptions}

## כללי עיצוב תגובה — חובה לעקוב:

1. **מבנה ברור וקצר** — אל תכתוב מגילה. כל סעיף צריך להיות תמציתי ולעניין.

2. **אם זו הודעה ראשונה**, בנה את התגובה בדיוק כך:

### 📊 סיכום מהיר
טבלת markdown קצרה עם העמודות הרלוונטיות (שם, דירוג, מחיר, ביקורות, רמת קושי וכו').

### ✅ יתרונות עיקריים
רשימה קצרה (2-3 נקודות) לכל פריט. שם הפריט **מודגש**, ואז הנקודות.

### ⚠️ חסרונות / נקודות לשיפור
אותו פורמט — 2-3 נקודות לכל פריט.

### 🎯 שורה תחתונה
פסקה אחת קצרה — למי מתאים כל אחד, ומה ההמלצה.

3. **אם יש היסטוריית שיחה** — ענה לשאלה בצורה ממוקדת וקצרה, ללא חזרה על ההשוואה המלאה.

## כללים נוספים:
- תמיד בעברית
- אל תשתמש ביותר מ-3 אימוג'ים בכל סעיף
- אל תחזור על מידע שכבר מופיע בטבלה בגוף הטקסט
- אם חסר מידע, אל תמציא — ציין שחסר
- שמור על שורות קצרות ופסקאות מופרדות היטב`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [{ role: "user", content: "אנא צור השוואה מפורטת בין הפריטים שנבחרו" }]),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("compare error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

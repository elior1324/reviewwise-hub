import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

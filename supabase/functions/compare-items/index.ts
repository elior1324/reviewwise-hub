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
      const parts = [`${i + 1}. **${item.name}**`];
      if (item.businessName) parts.push(`(${item.businessName})`);
      if (item.category) parts.push(`| קטגוריה: ${item.category}`);
      if (item.rating !== undefined) parts.push(`| דירוג: ⭐${item.rating}`);
      if (item.reviewCount !== undefined) parts.push(`| ביקורות: ${item.reviewCount}`);
      if (item.price !== undefined) parts.push(`| מחיר: ₪${item.price}`);
      if (item.description) parts.push(`| תיאור: ${item.description}`);
      if (item.type) parts.push(`| סוג: ${item.type === 'freelancer' ? 'בעל מקצוע' : 'קורס/הכשרה'}`);
      return parts.join(" ");
    }).join("\n");

    const systemPrompt = `אתה מומחה להשוואת שירותים מקצועיים ב-ReviewHub — פלטפורמת ביקורות מאומתות מובילה בישראל.

הנה הפריטים שהמשתמש רוצה להשוות:
${itemDescriptions}

## הנחיות:
- תמיד ענה בעברית
- אם זו הודעה ראשונה (אין היסטוריית שיחה), צור השוואה מפורטת הכוללת:
  1. **טבלת השוואה** בפורמט markdown עם כל הפרמטרים הרלוונטיים (דירוג, מחיר, ביקורות, קטגוריה, יתרונות)
  2. **ניתוח יתרונות וחסרונות** לכל פריט
  3. **המלצה מסכמת** — למי מתאים כל אחד ומה ההמלצה הכללית
- אם יש היסטוריית שיחה, ענה לשאלות המשך בהקשר של ההשוואה
- השתמש באימוג'ים בצורה מקצועית
- אם חסר מידע, ציין זאת בכנות
- התייחס להבדלים משמעותיים בין הפריטים`;

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

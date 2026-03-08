import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THRESHOLD = 3; // Minimum businesses requesting same category before AI evaluates

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { suggested_name, type, business_id } = await req.json();

    if (!suggested_name || !type || !business_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if category already exists in approved list
    const { data: existing } = await supabase
      .from("approved_categories")
      .select("id")
      .eq("name", suggested_name.trim())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "already_exists", category: suggested_name.trim() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the pending suggestion
    await supabase.from("pending_categories").insert({
      suggested_name: suggested_name.trim(),
      type,
      business_id,
    });

    // Count how many unique businesses suggested the same (or very similar) category
    const { data: pendingSuggestions } = await supabase
      .from("pending_categories")
      .select("business_id, suggested_name")
      .eq("type", type);

    // Normalize and group similar names
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "");

    const normalizedTarget = normalize(suggested_name);
    const matchingBusinessIds = new Set<string>();

    for (const s of pendingSuggestions || []) {
      if (normalize(s.suggested_name) === normalizedTarget) {
        matchingBusinessIds.add(s.business_id);
      }
    }

    const count = matchingBusinessIds.size;

    if (count < THRESHOLD) {
      // Not enough yet - business goes to "אחר"
      return new Response(
        JSON.stringify({
          status: "pending",
          assigned_category: "אחר",
          suggestions_count: count,
          threshold: THRESHOLD,
          message: `הקטגוריה "${suggested_name}" תתווסף אוטומטית לאחר ${THRESHOLD - count} עסקים נוספים`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Threshold reached! Use AI to validate and create a proper category name
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: approve as-is without AI
      await supabase.from("approved_categories").insert({
        name: suggested_name.trim(),
        type,
        auto_approved: true,
      });

      // Update businesses from "אחר" to the new category
      await updateBusinessCategories(supabase, normalizedTarget, suggested_name.trim(), pendingSuggestions || []);

      return new Response(
        JSON.stringify({ status: "approved", category: suggested_name.trim() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect all similar suggestion names for AI context
    const allSimilarNames = (pendingSuggestions || [])
      .filter(s => normalize(s.suggested_name) === normalizedTarget)
      .map(s => s.suggested_name);

    // Get existing categories for context
    const { data: existingCats } = await supabase
      .from("approved_categories")
      .select("name")
      .eq("type", type);

    const existingNames = (existingCats || []).map(c => c.name);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `אתה מומחה לקטגוריזציה של מקצועות ותחומי לימוד בשוק הישראלי.
תפקידך להחליט האם הצעת קטגוריה חדשה היא לגיטימית ולתת לה שם מקצועי ומדויק בעברית.

הקטגוריות הקיימות: ${existingNames.join(", ")}

כללים:
1. אם הקטגוריה המוצעת דומה מדי לקטגוריה קיימת - החזר את הקטגוריה הקיימת
2. אם זה מקצוע/תחום לגיטימי וחדש - אשר אותו עם שם מקצועי קצר (2-4 מילים)
3. אם זה לא נראה כמקצוע אמיתי - דחה אותו`
          },
          {
            role: "user",
            content: `${count} עסקים שונים ביקשו להוסיף קטגוריה חדשה.
השמות שהציעו: ${[...new Set(allSimilarNames)].join(", ")}
סוג: ${type === "freelancer" ? "בעלי מקצוע" : "קורסים"}

החלט: האם לאשר את הקטגוריה?`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "category_decision",
            description: "Return category approval decision",
            parameters: {
              type: "object",
              properties: {
                approved: { type: "boolean", description: "Whether to approve the new category" },
                category_name: { type: "string", description: "The final clean Hebrew category name" },
                reason: { type: "string", description: "Brief reason for the decision" },
                existing_match: { type: "string", description: "If it matches an existing category, which one" },
              },
              required: ["approved", "category_name", "reason"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "category_decision" } },
      }),
    });

    if (!aiResponse.ok) {
      // Fallback: approve as-is
      await supabase.from("approved_categories").insert({
        name: suggested_name.trim(),
        type,
        auto_approved: true,
      });
      await updateBusinessCategories(supabase, normalizedTarget, suggested_name.trim(), pendingSuggestions || []);

      return new Response(
        JSON.stringify({ status: "approved", category: suggested_name.trim() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let decision;
    try {
      decision = JSON.parse(toolCall.function.arguments);
    } catch {
      decision = { approved: true, category_name: suggested_name.trim(), reason: "Fallback" };
    }

    if (decision.existing_match && existingNames.includes(decision.existing_match)) {
      // Map to existing category
      await updateBusinessCategories(supabase, normalizedTarget, decision.existing_match, pendingSuggestions || []);

      return new Response(
        JSON.stringify({
          status: "mapped_to_existing",
          category: decision.existing_match,
          reason: decision.reason,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (decision.approved) {
      const finalName = decision.category_name || suggested_name.trim();

      await supabase.from("approved_categories").insert({
        name: finalName,
        type,
        auto_approved: true,
      });

      await updateBusinessCategories(supabase, normalizedTarget, finalName, pendingSuggestions || []);

      // Clean up processed pending suggestions
      const idsToDelete = (pendingSuggestions || [])
        .filter(s => normalize(s.suggested_name) === normalizedTarget)
        .map(s => s.business_id);

      return new Response(
        JSON.stringify({
          status: "approved",
          category: finalName,
          reason: decision.reason,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI rejected the category
    return new Response(
      JSON.stringify({
        status: "rejected",
        assigned_category: "אחר",
        reason: decision.reason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("evaluate-category error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateBusinessCategories(
  supabase: any,
  normalizedName: string,
  newCategory: string,
  pendingSuggestions: { business_id: string; suggested_name: string }[]
) {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "");

  const businessIds = pendingSuggestions
    .filter(s => normalize(s.suggested_name) === normalizedName)
    .map(s => s.business_id);

  if (businessIds.length > 0) {
    // Update businesses that were in "אחר" to the new category
    await supabase
      .from("businesses")
      .update({ category: newCategory })
      .in("id", businessIds)
      .eq("category", "אחר");
  }
}

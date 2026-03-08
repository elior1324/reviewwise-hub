import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THRESHOLD = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all pending category suggestions
    const { data: pendingSuggestions, error: pendingError } = await supabase
      .from("pending_categories")
      .select("id, suggested_name, type, business_id");

    if (pendingError || !pendingSuggestions || pendingSuggestions.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_pending", message: "אין קטגוריות ממתינות" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing approved categories
    const { data: existingCats } = await supabase
      .from("approved_categories")
      .select("name, type");

    const existingNames = new Set((existingCats || []).map(c => `${c.type}:${c.name}`));

    // Normalize function
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "");

    // Group suggestions by normalized name + type
    const groups: Record<string, { 
      originalNames: string[]; 
      businessIds: Set<string>; 
      type: string; 
      ids: string[];
    }> = {};

    for (const s of pendingSuggestions) {
      const key = `${s.type}:${normalize(s.suggested_name)}`;
      if (!groups[key]) {
        groups[key] = { originalNames: [], businessIds: new Set(), type: s.type, ids: [] };
      }
      groups[key].originalNames.push(s.suggested_name);
      groups[key].businessIds.add(s.business_id);
      groups[key].ids.push(s.id);
    }

    const results: Array<{ category: string; status: string; count: number }> = [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    for (const [key, group] of Object.entries(groups)) {
      const uniqueBusinessCount = group.businessIds.size;
      const representativeName = group.originalNames[0];

      // Skip if already approved
      if (existingNames.has(`${group.type}:${representativeName.trim()}`)) {
        results.push({ category: representativeName, status: "already_exists", count: uniqueBusinessCount });
        continue;
      }

      // Not enough businesses yet
      if (uniqueBusinessCount < THRESHOLD) {
        results.push({ category: representativeName, status: "pending", count: uniqueBusinessCount });
        continue;
      }

      // Threshold reached — use AI to validate
      let finalName = representativeName.trim();

      if (LOVABLE_API_KEY) {
        const existingForType = (existingCats || [])
          .filter(c => c.type === group.type)
          .map(c => c.name);

        try {
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
הקטגוריות הקיימות: ${existingForType.join(", ")}
כללים:
1. אם הקטגוריה המוצעת דומה מדי לקטגוריה קיימת - החזר את הקטגוריה הקיימת
2. אם זה מקצוע/תחום לגיטימי וחדש - אשר אותו עם שם מקצועי קצר (2-4 מילים)
3. אם זה לא נראה כמקצוע אמיתי - דחה אותו`,
                },
                {
                  role: "user",
                  content: `${uniqueBusinessCount} עסקים שונים ביקשו להוסיף קטגוריה: "${[...new Set(group.originalNames)].join('", "')}"
סוג: ${group.type === "freelancer" ? "בעלי מקצוע" : "קורסים"}
החלט: האם לאשר?`,
                },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "category_decision",
                  description: "Return category approval decision",
                  parameters: {
                    type: "object",
                    properties: {
                      approved: { type: "boolean" },
                      category_name: { type: "string" },
                      reason: { type: "string" },
                      existing_match: { type: "string" },
                    },
                    required: ["approved", "category_name", "reason"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "category_decision" } },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            const decision = JSON.parse(toolCall.function.arguments);

            if (decision.existing_match && existingForType.includes(decision.existing_match)) {
              // Map to existing
              await updateBusinessCategories(supabase, normalize(representativeName), decision.existing_match, pendingSuggestions);
              results.push({ category: `${representativeName} → ${decision.existing_match}`, status: "mapped_to_existing", count: uniqueBusinessCount });
              continue;
            }

            if (!decision.approved) {
              results.push({ category: representativeName, status: "rejected_by_ai", count: uniqueBusinessCount });
              continue;
            }

            finalName = decision.category_name || finalName;
          }
        } catch (aiErr) {
          console.error("AI evaluation failed, approving as-is:", aiErr);
        }
      }

      // Approve the category
      await supabase.from("approved_categories").insert({
        name: finalName,
        type: group.type,
        auto_approved: true,
      });

      // Update businesses from "אחר" to the new category
      await updateBusinessCategories(supabase, normalize(representativeName), finalName, pendingSuggestions);

      // Clean up processed pending suggestions
      await supabase
        .from("pending_categories")
        .delete()
        .in("id", group.ids);

      results.push({ category: finalName, status: "approved", count: uniqueBusinessCount });
    }

    return new Response(
      JSON.stringify({ status: "scan_complete", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("daily-category-scan error:", e);
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
    await supabase
      .from("businesses")
      .update({ category: newCategory })
      .in("id", businessIds)
      .eq("category", "אחר");
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Authenticate: require admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current month
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Fetch all businesses with their reviews from the last 30 days
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, slug, category, rating, review_count");

    if (bizError) throw new Error(`Failed to fetch businesses: ${bizError.message}`);

    // Fetch recent reviews (last 30 days) with ratings
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentReviews, error: revError } = await supabase
      .from("reviews")
      .select("business_id, rating, verified, flagged")
      .gte("created_at", thirtyDaysAgo)
      .eq("flagged", false);

    if (revError) throw new Error(`Failed to fetch reviews: ${revError.message}`);

    // Build business stats summary for AI
    const businessStats = (businesses || []).map((biz: any) => {
      const bizReviews = (recentReviews || []).filter((r: any) => r.business_id === biz.id);
      const positiveReviews = bizReviews.filter((r: any) => r.rating >= 4).length;
      const verifiedReviews = bizReviews.filter((r: any) => r.verified).length;
      const avgRecentRating = bizReviews.length > 0
        ? bizReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / bizReviews.length
        : 0;

      return {
        name: biz.name,
        slug: biz.slug,
        category: biz.category,
        overallRating: biz.rating || 0,
        totalReviews: biz.review_count || 0,
        recentReviewCount: bizReviews.length,
        recentPositiveCount: positiveReviews,
        recentVerifiedCount: verifiedReviews,
        avgRecentRating: Math.round(avgRecentRating * 100) / 100,
      };
    }).filter((b: any) => b.totalReviews > 0);

    // Ask AI to rank top 5
    const aiPrompt = `אתה מערכת דירוג של ReviewHub. בחר את 5 העסקים/בעלי מקצוע המובילים לחודש ${monthYear}.

קריטריונים לדירוג:
1. כמות ביקורות חיוביות (דירוג 4+) - משקל 40%
2. דירוג ממוצע כללי - משקל 25%
3. כמות ביקורות מאומתות אחרונות (30 יום) - משקל 20%
4. עקביות ואמינות - משקל 15%

הנה הנתונים של כל העסקים:
${JSON.stringify(businessStats, null, 2)}

החזר בדיוק 5 עסקים מדורגים מ-1 עד 5.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a ranking system. Return structured data only." },
          { role: "user", content: aiPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_top5",
              description: "Submit the top 5 ranked businesses",
              parameters: {
                type: "object",
                properties: {
                  rankings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "number", description: "1-5" },
                        slug: { type: "string" },
                        reasoning: { type: "string", description: "Short Hebrew explanation why this business is ranked here" },
                      },
                      required: ["rank", "slug", "reasoning"],
                      additionalProperties: false,
                    },
                    minItems: 5,
                    maxItems: 5,
                  },
                },
                required: ["rankings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_top5" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("AI did not return tool call");

    const { rankings } = JSON.parse(toolCall.function.arguments);

    // Delete existing rankings for this month
    await supabase.from("monthly_top5").delete().eq("month_year", monthYear);

    // Insert new rankings
    const inserts = rankings.map((r: any) => {
      const biz = businessStats.find((b: any) => b.slug === r.slug);
      if (!biz) return null;
      return {
        month_year: monthYear,
        rank: r.rank,
        business_slug: biz.slug,
        business_name: biz.name,
        business_type: biz.category, // will be category for now
        category: biz.category,
        rating: biz.overallRating,
        review_count: biz.totalReviews,
        ai_reasoning: r.reasoning,
      };
    }).filter(Boolean);

    const { error: insertError } = await supabase.from("monthly_top5").insert(inserts);
    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    return new Response(JSON.stringify({ success: true, monthYear, rankings: inserts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-monthly-top5 error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

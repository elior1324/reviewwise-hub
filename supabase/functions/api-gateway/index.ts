import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the key to compare
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    const keyPrefix = apiKey.substring(0, 8);

    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, business_id, active")
      .eq("key_hash", keyHash)
      .eq("key_prefix", keyPrefix)
      .single();

    if (keyError || !keyRecord || !keyRecord.active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_used_at
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    const businessId = keyRecord.business_id;

    // Route to endpoints
    switch (endpoint) {
      case "reviews": {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, rating, text, verified, anonymous, created_at, courses(name)")
          .eq("business_id", businessId)
          .eq("flagged", false)
          .order("created_at", { ascending: false })
          .limit(100);
        return new Response(JSON.stringify({ data: reviews }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "stats": {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, rating, review_count, category")
          .eq("id", businessId)
          .single();
        const { data: courses } = await supabase
          .from("courses")
          .select("id, name, rating, review_count")
          .eq("business_id", businessId);
        return new Response(JSON.stringify({ business: biz, courses }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "leads": {
        const { data: leads } = await supabase
          .from("leads")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100);
        return new Response(JSON.stringify({ data: leads }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reports": {
        const { data: reports } = await supabase
          .from("ai_reports")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(10);
        return new Response(JSON.stringify({ data: reports }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({
          error: "Unknown endpoint",
          available: ["reviews", "stats", "leads", "reports"],
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("api-gateway error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

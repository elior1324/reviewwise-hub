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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { business_id, event, payload } = await req.json();

    if (!business_id || !event) throw new Error("business_id and event are required");

    // Get active webhooks for this business and event
    const { data: webhooks, error } = await supabase
      .from("business_webhooks")
      .select("id, url, secret")
      .eq("business_id", business_id)
      .eq("active", true)
      .contains("events", [event]);

    if (error) throw new Error(`Failed to fetch webhooks: ${error.message}`);
    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ success: true, fired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookPayload = {
      event,
      business_id,
      timestamp: new Date().toISOString(),
      data: payload || {},
    };

    const results = await Promise.allSettled(
      webhooks.map(async (wh: any) => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wh.secret) headers["X-Webhook-Secret"] = wh.secret;

        const res = await fetch(wh.url, {
          method: "POST",
          headers,
          body: JSON.stringify(webhookPayload),
        });

        // Update last_triggered_at
        await supabase
          .from("business_webhooks")
          .update({ last_triggered_at: new Date().toISOString() })
          .eq("id", wh.id);

        return { webhook_id: wh.id, status: res.status };
      })
    );

    return new Response(JSON.stringify({ success: true, fired: webhooks.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fire-webhooks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

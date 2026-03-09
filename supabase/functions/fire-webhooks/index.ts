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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { business_id, event, payload } = await req.json();

    if (!business_id || !event) throw new Error("business_id and event are required");

    // Use service role client for data operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the caller owns this business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", business_id)
      .single();

    if (bizError || !business || business.owner_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden: you do not own this business" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhooks for this business and event
    const { data: webhooks, error } = await supabase
      .from("business_webhooks")
      .select("id, url, secret")
      .eq("business_id", business_id)
      .eq("active", true)
      .contains("events", [event]);

    if (error) throw new Error(`Failed to fetch webhooks: ${error.message}`);

    // Get active integrations (Google Sheets, HubSpot) for this business
    const { data: integrations } = await supabase
      .from("business_integrations")
      .select("id, integration_type, config, active")
      .eq("business_id", business_id)
      .eq("active", true);

    const webhookPayload = {
      event,
      business_id,
      timestamp: new Date().toISOString(),
      data: payload || {},
    };

    const results: any[] = [];

    // Fire business webhooks
    if (webhooks && webhooks.length > 0) {
      const webhookResults = await Promise.allSettled(
        webhooks.map(async (wh: any) => {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (wh.secret) headers["X-Webhook-Secret"] = wh.secret;

          const res = await fetch(wh.url, {
            method: "POST",
            headers,
            body: JSON.stringify(webhookPayload),
          });

          await supabase
            .from("business_webhooks")
            .update({ last_triggered_at: new Date().toISOString() })
            .eq("id", wh.id);

          return { webhook_id: wh.id, status: res.status };
        })
      );
      results.push(...webhookResults);
    }

    // Fire integration webhooks (Google Sheets via Zapier/Make)
    if (integrations && integrations.length > 0) {
      const integrationResults = await Promise.allSettled(
        integrations.map(async (intg: any) => {
          if (intg.integration_type === "google_sheets" && intg.config?.webhook_url) {
            const res = await fetch(intg.config.webhook_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(webhookPayload),
            });

            await supabase
              .from("business_integrations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", intg.id);

            return { integration: "google_sheets", status: res.status };
          }

          if (intg.integration_type === "hubspot" && intg.config?.api_key) {
            const contactData = {
              properties: {
                email: payload?.customer_email || payload?.reviewer_email || "",
                firstname: payload?.customer_name || payload?.reviewer_name || "",
                company: payload?.business_name || "",
                hs_lead_status: "NEW",
                lifecyclestage: "lead",
              },
            };

            if (contactData.properties.email) {
              const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${intg.config.api_key}`,
                },
                body: JSON.stringify(contactData),
              });

              await supabase
                .from("business_integrations")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", intg.id);

              return { integration: "hubspot", status: res.status };
            }

            return { integration: "hubspot", status: "skipped_no_email" };
          }

          return { integration: intg.integration_type, status: "unknown_type" };
        })
      );
      results.push(...integrationResults);
    }

    const totalFired = (webhooks?.length || 0) + (integrations?.length || 0);

    return new Response(JSON.stringify({ success: true, fired: totalFired, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fire-webhooks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

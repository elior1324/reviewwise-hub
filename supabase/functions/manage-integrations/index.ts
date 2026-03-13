import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";


serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check using user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { action, business_id, integration_type, config, active } = await req.json();

    // Verify business ownership
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: biz } = await adminClient
      .from("businesses")
      .select("id, owner_id")
      .eq("id", business_id)
      .single();

    if (!biz || biz.owner_id !== user.id) throw new Error("Forbidden");

    if (action === "get") {
      // Return integrations with sensitive data masked
      const { data: integrations } = await adminClient
        .from("business_integrations")
        .select("id, integration_type, active, config, updated_at")
        .eq("business_id", business_id);

      const masked = (integrations || []).map((intg: any) => ({
        id: intg.id,
        integration_type: intg.integration_type,
        active: intg.active,
        updated_at: intg.updated_at,
        config: {
          webhook_url: intg.config?.webhook_url || "",
          has_api_key: !!intg.config?.api_key,
          // Never return the actual api_key
        },
      }));

      return new Response(JSON.stringify({ data: masked }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      // Build safe config - only save what's needed
      const safeConfig: Record<string, string> = {};
      if (integration_type === "google_sheets" && config?.webhook_url) {
        // Basic URL validation
        try { new URL(config.webhook_url); } catch { throw new Error("Invalid webhook URL"); }
        safeConfig.webhook_url = config.webhook_url;
      }
      if (integration_type === "hubspot" && config?.api_key) {
        safeConfig.api_key = config.api_key;
      }

      const { error } = await adminClient
        .from("business_integrations")
        .upsert(
          {
            business_id,
            integration_type,
            config: safeConfig,
            active: active ?? true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,integration_type" }
        );

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e) {
    console.error("manage-integrations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

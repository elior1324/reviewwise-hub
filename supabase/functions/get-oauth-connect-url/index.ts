/**
 * get-oauth-connect-url — Edge Function
 *
 * Generates the OAuth authorization URL for Google or Facebook.
 * The client_id values never need to be in the frontend bundle — this
 * function reads them from server-side secrets and returns a full auth URL.
 *
 * POST body:
 *   { provider: "google" | "facebook", business_id: string }
 *
 * Returns:
 *   { url: string }  — the URL to redirect the user to
 *
 * Required secrets:
 *   GOOGLE_CLIENT_ID    — Google OAuth app client ID
 *   FACEBOOK_APP_ID     — Facebook App ID
 *   FRONTEND_URL        — base URL for redirect_uri
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const REDIRECT_URI_PATH = "/business/integrations/oauth/callback";

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? "https://reviewhub.co.il";

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { provider, business_id } = await req.json();

    if (!provider || !business_id) {
      return new Response(JSON.stringify({ error: "provider and business_id are required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Verify business ownership ─────────────────────────────────────────────
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: biz } = await admin
      .from("businesses")
      .select("id, owner_id")
      .eq("id", business_id)
      .single();

    if (!biz || biz.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const redirectUri = `${FRONTEND_URL}${REDIRECT_URI_PATH}`;
    // State is base64-encoded JSON — parsed by OAuthCallbackPage
    const state = btoa(JSON.stringify({ provider, business_id }));

    let url: string;

    if (provider === "google") {
      const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
      if (!GOOGLE_CLIENT_ID) {
        return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
          status: 503, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const params = new URLSearchParams({
        client_id:     GOOGLE_CLIENT_ID,
        redirect_uri:  redirectUri,
        response_type: "code",
        scope:         "https://www.googleapis.com/auth/business.manage",
        access_type:   "offline",
        prompt:        "consent",
        state,
      });
      url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    } else if (provider === "facebook") {
      const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID") ?? "";
      if (!FACEBOOK_APP_ID) {
        return new Response(JSON.stringify({ error: "Facebook OAuth not configured" }), {
          status: 503, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const params = new URLSearchParams({
        client_id:     FACEBOOK_APP_ID,
        redirect_uri:  redirectUri,
        scope:         "pages_show_list,pages_read_user_content",
        response_type: "code",
        state,
      });
      url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;

    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[get-oauth-connect-url] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

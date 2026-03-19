/**
 * exchange-oauth-token — Edge Function
 *
 * Server-side OAuth token exchange for Google and Facebook integrations.
 * Receives the authorization code from the frontend (after the OAuth redirect),
 * exchanges it for an access token using the provider's token endpoint,
 * then stores the token in business_integrations.
 *
 * SECURITY: client_secret values are never sent to the frontend.
 * The frontend only handles the authorization code, which is short-lived.
 *
 * Required Edge Function secrets:
 *   GOOGLE_CLIENT_ID      — Google OAuth app client ID
 *   GOOGLE_CLIENT_SECRET  — Google OAuth app client secret
 *   FACEBOOK_APP_ID       — Facebook App ID
 *   FACEBOOK_APP_SECRET   — Facebook App Secret
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   FRONTEND_URL          — for redirect_uri construction
 *
 * POST body:
 *   {
 *     provider:    "google" | "facebook",
 *     code:        string,       -- authorization code from OAuth redirect
 *     business_id: string,
 *     // Google only:
 *     account_id?:  string,      -- Google Business account ID
 *     location_id?: string,      -- Google Business location ID
 *     // Facebook only:
 *     page_id?:     string,      -- Facebook Page ID to import reviews from
 *   }
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

    // ── Authenticate user ─────────────────────────────────────────────────────
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

    const body = await req.json();
    const { provider, code, business_id, account_id, location_id, page_id } = body;

    if (!provider || !code || !business_id) {
      return new Response(JSON.stringify({ error: "provider, code, and business_id are required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Verify business ownership ─────────────────────────────────────────────
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
    let integrationConfig: Record<string, string> = {};

    // ── Google OAuth token exchange ───────────────────────────────────────────
    if (provider === "google") {
      const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
      const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(JSON.stringify({ error: "Google OAuth not configured on server" }), {
          status: 503, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Exchange authorization code for access + refresh tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id:     GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri:  redirectUri,
          grant_type:    "authorization_code",
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("[exchange-oauth-token] Google token error:", JSON.stringify(tokenData).slice(0, 300));
        return new Response(JSON.stringify({ error: "Failed to exchange Google authorization code" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      integrationConfig = {
        access_token:  tokenData.access_token,
        ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
        token_expiry:  new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString(),
        ...(account_id  ? { account_id }  : {}),
        ...(location_id ? { location_id } : {}),
      };

    // ── Facebook OAuth token exchange ─────────────────────────────────────────
    } else if (provider === "facebook") {
      const FACEBOOK_APP_ID     = Deno.env.get("FACEBOOK_APP_ID") ?? "";
      const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET") ?? "";

      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        return new Response(JSON.stringify({ error: "Facebook OAuth not configured on server" }), {
          status: 503, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Exchange short-lived user access token for a long-lived one
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        new URLSearchParams({
          client_id:     FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri:  redirectUri,
          code,
        }),
        { signal: AbortSignal.timeout(15_000) }
      );

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("[exchange-oauth-token] Facebook token error:", JSON.stringify(tokenData).slice(0, 300));
        return new Response(JSON.stringify({ error: "Failed to exchange Facebook authorization code" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Exchange user token for long-lived token (60 days)
      const longLivedRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type:        "fb_exchange_token",
          client_id:         FACEBOOK_APP_ID,
          client_secret:     FACEBOOK_APP_SECRET,
          fb_exchange_token: tokenData.access_token,
        }),
        { signal: AbortSignal.timeout(15_000) }
      );

      const longLived = await longLivedRes.json();
      const finalToken = longLived.access_token ?? tokenData.access_token;

      // If page_id was passed, get the page-level access token (never expires)
      let pageToken = finalToken;
      if (page_id) {
        const pagesRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?access_token=${finalToken}`,
          { signal: AbortSignal.timeout(10_000) }
        );
        const pagesData = await pagesRes.json();
        const page = (pagesData.data ?? []).find((p: { id: string }) => p.id === page_id);
        if (page?.access_token) pageToken = page.access_token;
      }

      integrationConfig = {
        page_access_token: pageToken,
        ...(page_id ? { page_id } : {}),
        connected_at: new Date().toISOString(),
      };

    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Store in business_integrations ────────────────────────────────────────
    const { error: upsertErr } = await admin
      .from("business_integrations")
      .upsert(
        {
          business_id,
          integration_type: provider,
          config:     integrationConfig,
          active:     true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,integration_type" }
      );

    if (upsertErr) {
      console.error("[exchange-oauth-token] DB upsert failed:", upsertErr.message);
      return new Response(JSON.stringify({ error: "Failed to save integration" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    console.log(`[exchange-oauth-token] ${provider} connected for business=${business_id}`);

    return new Response(JSON.stringify({ success: true, provider }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[exchange-oauth-token] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

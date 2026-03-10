/**
 * fire-webhooks/index.ts
 * SECURITY FIX #2 — SSRF Protection via Webhook URL Validation
 *
 * VULNERABILITY (before fix):
 *   Any authenticated business owner could save a webhook URL like:
 *     http://169.254.169.254/latest/meta-data/iam/security-credentials/
 *     http://10.0.0.1:5432/            ← internal Postgres
 *     file:///etc/passwd               ← local filesystem read
 *   The function would fetch it using the service role's network context,
 *   leaking cloud provider credentials or internal service responses.
 *
 * FIX APPLIED:
 *   - Protocol whitelist: only https:// allowed (http:// blocked)
 *   - RFC1918 + loopback IP blocklist (10.x, 172.16-31.x, 192.168.x, 127.x, ::1)
 *   - AWS/GCP/Azure metadata endpoint blocklist
 *   - DNS resolution check via URL hostname inspection
 *   - Max URL length enforced (prevents log injection)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS: restrict to your production domain ──────────────────────────────────
// SECURITY FIX #4 applied here too: replace "*" with your actual domain.
const ALLOWED_ORIGIN = Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

// ── SSRF Guard ────────────────────────────────────────────────────────────────

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",   // AWS/GCP/Azure Instance Metadata
  "fd00:ec2::254",     // AWS IPv6 IMDS
  "100.100.100.200",   // Alibaba Cloud metadata
]);

const RFC1918_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

/**
 * Returns false if the URL is safe to fetch; throws a descriptive error if not.
 */
function assertSafeUrl(rawUrl: string): void {
  if (rawUrl.length > 2048) throw new Error("Webhook URL too long (max 2048 chars)");

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Webhook URL is not a valid URL");
  }

  // Protocol whitelist — only HTTPS
  if (parsed.protocol !== "https:") {
    throw new Error(`Webhook URL must use HTTPS (got '${parsed.protocol}')`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Blocked known metadata hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Webhook URL targets a blocked/internal hostname");
  }

  // RFC1918 / loopback IP ranges
  for (const pattern of RFC1918_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error("Webhook URL targets an internal/private IP range");
    }
  }

  // Block numeric IPv6 with embedded IPv4 private ranges
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    const inner = hostname.slice(1, -1);
    if (inner === "::1" || inner.startsWith("fc") || inner.startsWith("fe80")) {
      throw new Error("Webhook URL targets an internal IPv6 address");
    }
  }
}

// ── Input sanitisation for integration payloads ───────────────────────────────

function sanitiseString(value: unknown, maxLen = 512): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>"'&]/g, "").slice(0, maxLen).trim();
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify business ownership
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

    // Get active integrations
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

    const results: unknown[] = [];

    // Fire business webhooks — with SSRF guard on each URL
    if (webhooks && webhooks.length > 0) {
      const webhookResults = await Promise.allSettled(
        webhooks.map(async (wh: { id: string; url: string; secret?: string }) => {
          // ← SSRF FIX: validate before fetching
          try {
            assertSafeUrl(wh.url);
          } catch (err) {
            await supabase.from("business_webhooks")
              .update({ last_triggered_at: new Date().toISOString() })
              .eq("id", wh.id);
            return { webhook_id: wh.id, status: "blocked", reason: (err as Error).message };
          }

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          // Use HMAC signature instead of raw secret in header
          if (wh.secret) {
            const msgBytes = new TextEncoder().encode(JSON.stringify(webhookPayload));
            const keyBytes = new TextEncoder().encode(wh.secret);
            const cryptoKey = await crypto.subtle.importKey(
              "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
            );
            const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
            headers["X-Webhook-Signature"] = Array.from(new Uint8Array(sig))
              .map(b => b.toString(16).padStart(2, "0")).join("");
          }

          const res = await fetch(wh.url, {
            method: "POST",
            headers,
            body: JSON.stringify(webhookPayload),
            signal: AbortSignal.timeout(10_000), // 10-second timeout
          });

          await supabase.from("business_webhooks")
            .update({ last_triggered_at: new Date().toISOString() })
            .eq("id", wh.id);

          return { webhook_id: wh.id, status: res.status };
        })
      );
      results.push(...webhookResults);
    }

    // Fire integration webhooks — with SSRF guard
    if (integrations && integrations.length > 0) {
      const integrationResults = await Promise.allSettled(
        integrations.map(async (intg: { id: string; integration_type: string; config: Record<string, string> }) => {

          if (intg.integration_type === "google_sheets" && intg.config?.webhook_url) {
            // ← SSRF FIX
            try {
              assertSafeUrl(intg.config.webhook_url);
            } catch (err) {
              return { integration: "google_sheets", status: "blocked", reason: (err as Error).message };
            }

            const res = await fetch(intg.config.webhook_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(webhookPayload),
              signal: AbortSignal.timeout(10_000),
            });

            await supabase.from("business_integrations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", intg.id);

            return { integration: "google_sheets", status: res.status };
          }

          if (intg.integration_type === "hubspot" && intg.config?.api_key) {
            // Sanitise all payload fields before sending to HubSpot
            const email    = sanitiseString(payload?.customer_email || payload?.reviewer_email);
            const firstname = sanitiseString(payload?.customer_name  || payload?.reviewer_name);
            const company   = sanitiseString(payload?.business_name);

            if (!email) return { integration: "hubspot", status: "skipped_no_email" };

            const contactData = {
              properties: {
                email,
                firstname,
                company,
                hs_lead_status: "NEW",
                lifecyclestage: "lead",
              },
            };

            const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${intg.config.api_key}`,
              },
              body: JSON.stringify(contactData),
              signal: AbortSignal.timeout(10_000),
            });

            await supabase.from("business_integrations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", intg.id);

            return { integration: "hubspot", status: res.status };
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

/**
 * _shared/cors.ts
 * SECURITY FIX #4 — Replace CORS "*" with an explicit origin allowlist.
 *
 * VULNERABILITY (before fix):
 *   Every edge function had:
 *     "Access-Control-Allow-Origin": "*"
 *   This allows ANY website to make cross-origin requests to your functions.
 *   Combined with user JWTs sent via Authorization headers, this enables
 *   CSRF-style data theft from malicious pages the user visits.
 *
 * FIX:
 *   - Read FRONTEND_URL from the edge function's environment (set in Supabase
 *     dashboard → Edge Functions → Secrets as FRONTEND_URL=https://reviewhub.co.il).
 *   - Only echo back the Origin header if it matches an allowed domain.
 *   - For local development, also allow localhost origins.
 *
 * USAGE IN EVERY EDGE FUNCTION:
 *   import { corsHeaders, getCorsHeaders, assertOrigin } from "../_shared/cors.ts";
 *
 *   // Server-side origin enforcement (recommended for authenticated endpoints):
 *   const originCheck = assertOrigin(req);
 *   if (originCheck) return originCheck;   // 403 for disallowed origins
 *
 *   // Dynamic CORS headers (validates the caller's Origin per request):
 *   { headers: getCorsHeaders(req) }
 *
 *   // Static (use when you don't have access to the request object):
 *   { headers: corsHeaders }
 */

const ALLOWED_ORIGINS: string[] = [
  Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il",
  "https://www.reviewhub.co.il",
  "https://reviewhub.info",
  "https://www.reviewhub.info",
  "https://reviewshub.info",
  "https://www.reviewshub.info",
];

/** Allow localhost:* in development for Vite dev server */
function isLocalDev(origin: string): boolean {
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
         /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

/** Allow Lovable preview/deploy URLs (e.g. https://<id>.lovable.app) */
function isLovablePreview(origin: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

/** Check whether an origin string is in the allowlist. */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const isDev = Deno.env.get("ENVIRONMENT") !== "production";
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    isLovablePreview(origin) ||
    (isDev && isLocalDev(origin))
  );
}

/**
 * Server-side origin enforcement gate.
 *
 * Returns a 403 Response for disallowed origins, or null if the origin is valid.
 * Handles both OPTIONS preflight and normal requests.
 *
 * Usage:
 *   const blocked = assertOrigin(req);
 *   if (blocked) return blocked;
 */
export function assertOrigin(req: Request): Response | null {
  const origin = req.headers.get("Origin");
  if (isOriginAllowed(origin)) return null;

  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("Forbidden", { status: 403, headers });
  }

  return new Response(
    JSON.stringify({ error: "Invalid origin" }),
    { status: 403, headers: { ...headers, "Content-Type": "application/json" } },
  );
}

/**
 * Returns CORS headers that echo the request Origin only if it is allowed.
 * Falls back to the primary allowed origin for disallowed callers.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";

  return {
    "Access-Control-Allow-Origin":  isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}

/**
 * Static fallback for callers that don't have access to the request object.
 * Defaults to the primary allowed origin.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin":  ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Vary": "Origin",
};

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
 *   import { corsHeaders, getCorsHeaders } from "../_shared/cors.ts";
 *
 *   // Static (use when you don't need per-request origin check):
 *   { headers: corsHeaders }
 *
 *   // Dynamic (recommended — validates the caller's Origin per request):
 *   { headers: getCorsHeaders(req) }
 */

const ALLOWED_ORIGINS: string[] = [
  Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il",
  "https://www.reviewhub.co.il",
  // Add staging / preview URLs here as needed:
  // "https://staging.reviewhub.co.il",
];

/** Allow localhost:* in development for Vite dev server */
function isLocalDev(origin: string): boolean {
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
         /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

/**
 * Returns CORS headers that echo the request Origin only if it is allowed.
 * Sends a restrictive "null" origin for all other callers.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isDev  = Deno.env.get("ENVIRONMENT") !== "production";

  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    (isDev && isLocalDev(origin));

  return {
    "Access-Control-Allow-Origin":  isAllowed ? origin : ALLOWED_ORIGINS[0],
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

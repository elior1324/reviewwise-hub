/**
 * create-checkout — Edge Function (Grow integration)
 *
 * Returns a Grow payment page URL for the requested plan.
 * User ID and plan ID are appended as URL parameters so the
 * Make scenario can identify the buyer and relay them to grow-make-webhook.
 *
 * Flow:
 *   1. Authenticate caller via Supabase JWT
 *   2. Validate priceId
 *   3. Build Grow payment URL with user metadata
 *   4. Return { url } — frontend redirects browser there
 *
 * Required Edge Function secrets:
 *   GROW_PAYMENT_URL   — Base Grow payment page URL
 *                        e.g. https://pay.grow.link/d617dc715759e003e346b9937339b959-MzE5MTQwNQ
 *   FRONTEND_URL       — e.g. https://reviewshub.info (no trailing slash)
 *
 * ⚠️  Make scenario must be updated to read uid + plan from the Grow webhook
 *     and pass them to grow-make-webhook as user_id and plan_id.
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const VALID_PLAN_IDS = new Set([
  "plan_pro_monthly",
  "plan_pro_annual",
  "plan_enterprise_monthly",
  "plan_enterprise_annual",
]);

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")      ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const GROW_PAYMENT_URL  = Deno.env.get("GROW_PAYMENT_URL")  ?? "";

  if (!GROW_PAYMENT_URL) {
    return new Response(
      JSON.stringify({ error: "מערכת התשלומים לא מוגדרת. פנו לתמיכה." }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 503 }
    );
  }

  try {
    // ── Authenticate caller ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token  = authHeader.replace("Bearer ", "");
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error: authErr } = await client.auth.getUser(token);
    if (authErr || !data.user) throw new Error("User not authenticated");

    const user = data.user;

    // ── Validate plan ───────────────────────────────────────────────────
    const body = await req.json();
    const priceId = body?.priceId;
    if (!priceId || !VALID_PLAN_IDS.has(priceId)) {
      throw new Error(`Unknown plan: ${priceId}`);
    }

    // ── Build Grow payment URL with user metadata ───────────────────────
    // uid and plan are appended so Make can extract them from the Grow webhook
    // and pass them to grow-make-webhook as user_id and plan_id.
    const url = new URL(GROW_PAYMENT_URL);
    url.searchParams.set("uid",   user.id);
    url.searchParams.set("plan",  priceId);
    url.searchParams.set("email", user.email ?? "");

    console.log(`[create-checkout] user=${user.id} plan=${priceId}`);

    return new Response(
      JSON.stringify({ url: url.toString() }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    console.error("[create-checkout] error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

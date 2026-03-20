/**
 * check-subscription — Edge Function
 *
 * Checks whether the authenticated user has an active paid subscription.
 * Backed entirely by the Supabase DB — no external payment API calls needed.
 *
 * Subscription state is maintained by the hyp-webhook IPN handler:
 *   • Successful payment  → subscription_expires_at is extended
 *   • J4 tokenisation     → trial_ends_at is set (30-day free trial)
 *
 * Response shape:
 *   { subscribed, tier, subscription_end, in_trial }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";


const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { id: user.id });

    // ── Look up business subscription state directly from DB ──────────────────
    const { data: biz, error: bizError } = await supabaseClient
      .from("businesses")
      .select("subscription_tier, subscription_expires_at, trial_ends_at")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (bizError) throw new Error(`Business lookup error: ${bizError.message}`);

    const now         = new Date();
    const tier        = biz?.subscription_tier ?? "free";
    const expiresAt   = biz?.subscription_expires_at ? new Date(biz.subscription_expires_at) : null;
    const trialEndsAt = biz?.trial_ends_at ? new Date(biz.trial_ends_at) : null;

    const inTrial     = trialEndsAt !== null && trialEndsAt > now;
    const hasActiveSub = tier !== "free" && (inTrial || (expiresAt !== null && expiresAt > now));

    logStep("Subscription state", {
      tier, inTrial, hasActiveSub,
      expiresAt: expiresAt?.toISOString(),
      trialEndsAt: trialEndsAt?.toISOString(),
    });

    // ── Auto-downgrade to free if subscription has lapsed ────────────────────
    if (tier !== "free" && !inTrial && (expiresAt === null || expiresAt <= now)) {
      await supabaseClient
        .from("businesses")
        .update({ subscription_tier: "free" })
        .eq("owner_id", user.id);
      logStep("Reset business tier to free (subscription lapsed)");
    }

    return new Response(JSON.stringify({
      subscribed:       hasActiveSub,
      tier:             hasActiveSub ? tier : "free",
      subscription_end: inTrial
        ? trialEndsAt!.toISOString()
        : (expiresAt?.toISOString() ?? null),
      in_trial: inTrial,
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again later." }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

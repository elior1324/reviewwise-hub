/**
 * customer-portal — Edge Function
 *
 * Returns a URL for the authenticated business owner to manage their subscription.
 *
 * hyp (YaadPay) does not provide a hosted billing portal equivalent to Stripe's.
 * Instead we return two options:
 *   1. The business dashboard URL (for plan info / upgrade)
 *   2. A support mailto: link for cancellations / billing queries
 *
 * The frontend can use `url` to navigate, or display `support_email` for manual requests.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPPORT_EMAIL = "support@reviewshub.info";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Fetch current subscription state
    const { data: biz } = await supabaseClient
      .from("businesses")
      .select("subscription_tier, subscription_expires_at, trial_ends_at")
      .eq("owner_id", user.id)
      .maybeSingle();

    const origin      = req.headers.get("origin") || "https://reviewhub.co.il";
    const dashboardUrl = `${origin}/business/dashboard`;

    const mailtoUrl = [
      `mailto:${SUPPORT_EMAIL}`,
      `?subject=${encodeURIComponent("ניהול מנוי ReviewHub")}`,
      `&body=${encodeURIComponent(
        `שלום,\n\nאני מעוניין לנהל את המנוי שלי.\n\n` +
        `אימייל חשבון: ${user.email ?? ""}\n` +
        `תוכנית נוכחית: ${biz?.subscription_tier ?? "free"}\n\n` +
        `תודה`
      )}`,
    ].join("");

    return new Response(JSON.stringify({
      url:           dashboardUrl,
      support_email: SUPPORT_EMAIL,
      mailto_url:    mailtoUrl,
      subscription:  {
        tier:             biz?.subscription_tier ?? "free",
        expires_at:       biz?.subscription_expires_at ?? null,
        trial_ends_at:    biz?.trial_ends_at ?? null,
      },
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

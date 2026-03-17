/**
 * create-checkout — Edge Function
 *
 * Builds a redirect URL to the hyp (YaadPay) hosted payment page.
 * Returns { url: string } — the client redirects the browser there.
 *
 * Flow:
 *   1. Authenticate caller via Supabase JWT
 *   2. Look up the plan details (price in ILS) for the requested priceId
 *   3. Check for coupon phase-2 discount (applies to months 2–3)
 *   4. If in the 30-day free trial → use J4 tokenisation (save card, zero charge)
 *      Otherwise              → charge the discounted / full monthly price
 *   5. Construct the hyp payment URL with all required parameters
 *   6. Return { url } to the frontend
 *
 * hyp (YaadPay) payment page:
 *   Production: https://icom.yaad.net/p/
 *   Test:       https://icom.yaad.net/p/ (same URL, use test Masof from hyp dashboard)
 *
 * Required Edge Function secrets:
 *   HYP_TERMINAL_NUMBER   — Your hyp Masof (terminal number)
 *   HYP_API_KEY           — Your hyp PassP (terminal password)
 *   FRONTEND_URL          — Public URL of the frontend (e.g. https://reviewhub.co.il)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── hyp payment page URL ──────────────────────────────────────────────────────
const HYP_PAYMENT_URL = "https://icom.yaad.net/p/";

// ── Trial period (days) — first paid period is free ──────────────────────────
const TRIAL_DAYS = 30;

// ── Plan price map: priceId → monthly amount in ILS (grush = ILS * 100) ──────
// Keep in sync with REVIEWHUB_PLANS in src/components/ui/pricing-card.tsx
const PLAN_PRICES_ILS: Record<string, { amountILS: number; planName: string; tier: string }> = {
  "plan_pro_monthly":        { amountILS: 149,  planName: "מקצועי",    tier: "pro" },
  "plan_pro_annual":         { amountILS: 119,  planName: "מקצועי שנתי", tier: "pro" },
  "plan_enterprise_monthly": { amountILS: 399,  planName: "אנטרפרייז", tier: "enterprise" },
  "plan_enterprise_annual":  { amountILS: 319,  planName: "אנטרפרייז שנתי", tier: "enterprise" },
};

// ── Coin code: 1 = ILS (₪) ───────────────────────────────────────────────────
const COIN_ILS = "1";

// ── Unique order ID generator ─────────────────────────────────────────────────
function generateOrderId(userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const uid = userId.slice(0, 6).toUpperCase();
  return `RH-${uid}-${ts}`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const HYP_TERMINAL              = Deno.env.get("HYP_TERMINAL_NUMBER") ?? "";
  const HYP_PASS                  = Deno.env.get("HYP_API_KEY") ?? "";
  const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? req.headers.get("origin") ?? "";

  if (!HYP_TERMINAL || !HYP_PASS) {
    return new Response(JSON.stringify({ error: "מערכת התשלומים לא מוגדרת. פנו לתמיכה." }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 503,
    });
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await anonClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Missing priceId");

    const plan = PLAN_PRICES_ILS[priceId];
    if (!plan) throw new Error(`Unknown priceId: ${priceId}`);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Check for coupon phase-2 discount (months 2–3) ────────────────────────
    const { data: couponRed } = await adminClient
      .from("coupon_redemptions")
      .select("discounted_until, coupons ( phase2_discount_percent, phase2_duration_months )")
      .eq("user_id", user.id)
      .not("discounted_until", "is", null)
      .gt("discounted_until", new Date().toISOString())
      .order("redeemed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const couponInfo        = (couponRed as any)?.coupons ?? null;
    const phase2DiscountPct = couponInfo?.phase2_discount_percent as number | null ?? null;

    // ── Check if user is still in their free trial ────────────────────────────
    // Fetch business row to check trial_ends_at
    const { data: biz } = await adminClient
      .from("businesses")
      .select("id, trial_ends_at")
      .eq("owner_id", user.id)
      .maybeSingle();

    const now        = new Date();
    const trialEnds  = biz?.trial_ends_at ? new Date(biz.trial_ends_at) : null;
    const inTrial    = trialEnds !== null && trialEnds > now;

    // ── Compute amount in grush (ILS * 100 = agorot) ─────────────────────────
    // During trial:          J4 tokenisation (action=Token) — zero charge
    // Phase-2 coupon active: apply phase2_discount_percent to monthly price
    // Otherwise:             full plan price
    let amountILS: number;
    let hypAction: string;

    if (inTrial) {
      // Save card for future billing — no charge today
      amountILS = 0;
      hypAction = "Token"; // J4 — tokenise without charging
    } else if (phase2DiscountPct !== null) {
      amountILS = Math.round(plan.amountILS * (1 - phase2DiscountPct / 100));
      hypAction = "pay";
    } else {
      amountILS = plan.amountILS;
      hypAction = "pay";
    }

    const amountGrosh = (amountILS * 100).toString();
    const orderId     = generateOrderId(user.id);

    // ── Build hyp redirect URL ────────────────────────────────────────────────
    const params = new URLSearchParams({
      // Authentication
      Masof:           HYP_TERMINAL,
      PassP:           HYP_PASS,

      // Transaction
      action:          hypAction,
      Amount:          amountGrosh,
      Coin:            COIN_ILS,

      // Order metadata
      Order:           orderId,
      Info:            `ReviewHub ${plan.planName}`,
      email:           user.email,

      // Redirect URLs
      SuccessUrl:      `${FRONTEND_URL}/business/dashboard?checkout=success&order=${orderId}`,
      FailUrl:         `${FRONTEND_URL}/business/pricing?checkout=cancelled&order=${orderId}`,
      NotificationUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/hyp-webhook`,

      // Locale & encoding
      PageLang:        "HEB",
      UTF8:            "1",
      UTF8out:         "1",

      // Security — request hash verification in callback
      SendHesh:        "1",

      // Custom fields — pass plan tier and user ID for IPN handler
      Fild1:           plan.tier,
      Fild2:           user.id,
      Fild3:           priceId,
    });

    // For tokenisation: set J4=1 (save card without charging)
    if (hypAction === "Token") {
      params.set("J4", "1");
    }

    const hypUrl = `${HYP_PAYMENT_URL}?${params.toString()}`;

    // ── Set trial_ends_at if this is the user's first subscription ────────────
    // We set it optimistically here; the IPN will confirm the card save succeeded.
    if (!biz?.trial_ends_at && biz?.id) {
      const trialEndDate = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      await adminClient
        .from("businesses")
        .update({ trial_ends_at: trialEndDate.toISOString() })
        .eq("id", biz.id);
    }

    console.log(
      `[create-checkout] user=${user.id} plan=${priceId} action=${hypAction} ` +
      `amount=${amountILS}₪ orderId=${orderId}`
    );

    return new Response(JSON.stringify({ url: hypUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-checkout] error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

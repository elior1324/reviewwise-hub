/**
 * create-checkout — Edge Function (PayPlus integration)
 *
 * Calls the PayPlus REST API to generate a hosted payment page link.
 * Returns { url: string } — the client redirects the browser there.
 *
 * Flow:
 *   1. Authenticate caller via Supabase JWT
 *   2. Look up the plan details (price in ILS) for the requested priceId
 *   3. Check for coupon phase-2 discount (applies to months 2–3)
 *   4. If in the 30-day free trial → use a ₪1 tokenisation charge (saves card, minimal charge)
 *      Otherwise              → charge the discounted / full monthly price
 *   5. POST to PayPlus generateLink endpoint, receive payment_page_link
 *   6. Return { url: payment_page_link } to the frontend
 *
 * PayPlus API:
 *   Production: https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink
 *   Staging:    https://restapidev.payplus.co.il/api/v1.0/PaymentPages/generateLink
 *
 * Required Edge Function secrets:
 *   PAYPLUS_API_KEY    — Your PayPlus publishable / public API key
 *   PAYPLUS_SECRET_KEY — Your PayPlus secret key
 *   PAYPLUS_PAGE_UID   — Your PayPlus payment-page template UID
 *                        (create one in myaccount.payplus.co.il → Payment Pages)
 *   FRONTEND_URL       — Public URL of the frontend (e.g. https://reviewhub.co.il)
 *
 * PayPlus charge_method values:
 *   0 = test / J2 (no real charge, testing only)
 *   1 = charge / J4 (standard debit — also saves token)
 *   2 = frame seizure / J5
 *   3 = recurring (set recurring_settings object)
 *   4 = credit
 *   5 = token charge (charge a saved token)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── PayPlus API endpoint ──────────────────────────────────────────────────────
const PAYPLUS_API_URL =
  "https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink";

// ── Trial: minimal ₪1 charge to save card details (refunded / micro-auth) ────
const TRIAL_AMOUNT_ILS = 1; // ₪1 — saves card, user is in 30-day trial

// ── Plan price map: priceId → monthly amount in ILS ──────────────────────────
// Keep in sync with REVIEWHUB_PLANS in src/components/ui/pricing-card.tsx
const PLAN_PRICES_ILS: Record<string, { amountILS: number; planName: string; tier: string }> = {
  "plan_pro_monthly":        { amountILS: 149,  planName: "מקצועי",          tier: "pro"        },
  "plan_pro_annual":         { amountILS: 119,  planName: "מקצועי שנתי",     tier: "pro"        },
  "plan_enterprise_monthly": { amountILS: 399,  planName: "אנטרפרייז",       tier: "enterprise" },
  "plan_enterprise_annual":  { amountILS: 319,  planName: "אנטרפרייז שנתי",  tier: "enterprise" },
};

// ── Unique order ID generator ─────────────────────────────────────────────────
function generateOrderId(userId: string): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const uid = userId.slice(0, 6).toUpperCase();
  return `RH-${uid}-${ts}`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")              ?? "";
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")         ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const PAYPLUS_API_KEY           = Deno.env.get("PAYPLUS_API_KEY")           ?? "";
  const PAYPLUS_SECRET_KEY        = Deno.env.get("PAYPLUS_SECRET_KEY")        ?? "";
  const PAYPLUS_PAGE_UID          = Deno.env.get("PAYPLUS_PAGE_UID")          ?? "";
  const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? req.headers.get("origin") ?? "";

  if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_PAGE_UID) {
    return new Response(
      JSON.stringify({ error: "מערכת התשלומים לא מוגדרת. פנו לתמיכה." }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 503 }
    );
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // ── Authenticate caller ───────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization")!;
    const token      = authHeader.replace("Bearer ", "");
    const { data }   = await anonClient.auth.getUser(token);
    const user       = data.user;
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
    const { data: biz } = await adminClient
      .from("businesses")
      .select("id, trial_ends_at")
      .eq("owner_id", user.id)
      .maybeSingle();

    const now       = new Date();
    const trialEnds = biz?.trial_ends_at ? new Date(biz.trial_ends_at) : null;
    const inTrial   = trialEnds !== null && trialEnds > now;

    // ── Compute charge amount ─────────────────────────────────────────────────
    // During trial:          ₪1 micro-charge (saves card, minimal cost)
    // Phase-2 coupon active: apply phase2_discount_percent to monthly price
    // Otherwise:             full plan price
    let amountILS: number;
    let chargeLabel: string;

    if (inTrial) {
      amountILS  = TRIAL_AMOUNT_ILS;
      chargeLabel = "trial";
    } else if (phase2DiscountPct !== null) {
      amountILS  = Math.round(plan.amountILS * (1 - phase2DiscountPct / 100));
      chargeLabel = `phase2-${phase2DiscountPct}%-off`;
    } else {
      amountILS  = plan.amountILS;
      chargeLabel = "full";
    }

    const orderId = generateOrderId(user.id);

    // ── POST to PayPlus generateLink ──────────────────────────────────────────
    // Authentication: pass api_key + secret_key in the Authorization header.
    // Format: "ApiKey {api_key}:{secret_key}"
    const payplusBody = {
      payment_page_uid:    PAYPLUS_PAGE_UID,
      charge_method:       1,             // J4 — standard charge (also saves token)
      currency_code:       "ILS",
      language_code:       "HE",
      senderpaymentpageuid: orderId,      // our unique order reference
      more_info:           `ReviewHub ${plan.planName} | ${orderId}`,
      refURL_success:      `${FRONTEND_URL}/business/dashboard?checkout=success&order=${orderId}`,
      refURL_failure:      `${FRONTEND_URL}/business/pricing?checkout=cancelled&order=${orderId}`,
      refURL_notify:       `${SUPABASE_URL}/functions/v1/payplus-webhook`,
      amount:              amountILS,
      items: [
        {
          name:     `ReviewHub ${plan.planName}`,
          quantity: 1,
          price:    amountILS,
          vat_type: 0, // 0 = price includes VAT
        },
      ],
      customer: {
        customer_name: user.user_metadata?.full_name ?? "",
        email:         user.email,
        phone:         user.user_metadata?.phone    ?? "",
      },
      // Pass plan metadata in more_info_2/3/4 — the webhook reads them back
      // via the page_request_uid → PayPlus transaction details endpoint
      // (alternatively use custom fields if supported by your page template)
      more_info_2: plan.tier,   // subscription tier
      more_info_3: user.id,     // user UUID
      more_info_4: priceId,     // price plan ID
    };

    const payplusRes = await fetch(PAYPLUS_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        // PayPlus auth: "ApiKey {publishable_key}:{secret_key}"
        "Authorization": `ApiKey ${PAYPLUS_API_KEY}:${PAYPLUS_SECRET_KEY}`,
      },
      body: JSON.stringify(payplusBody),
    });

    const payplusJson = await payplusRes.json();

    if (!payplusRes.ok || payplusJson?.results?.status !== "success") {
      const desc = payplusJson?.results?.description ?? payplusRes.statusText;
      console.error(`[create-checkout] PayPlus error: ${desc}`, JSON.stringify(payplusJson));
      throw new Error(`PayPlus: ${desc}`);
    }

    const paymentPageLink = payplusJson?.data?.payment_page_link;
    const pageRequestUid  = payplusJson?.data?.page_request_uid;

    if (!paymentPageLink) {
      throw new Error("PayPlus did not return a payment_page_link");
    }

    // ── Persist page_request_uid for reconciliation ───────────────────────────
    // Also set trial_ends_at optimistically if this is the user's first checkout
    if (biz?.id) {
      const updatePayload: Record<string, string> = {
        payplus_page_uid: pageRequestUid ?? "",
      };
      if (!biz.trial_ends_at) {
        // First-ever checkout: start the 30-day trial clock
        const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        updatePayload.trial_ends_at = trialEndDate.toISOString();
      }
      await adminClient
        .from("businesses")
        .update(updatePayload)
        .eq("id", biz.id);
    }

    console.log(
      `[create-checkout] user=${user.id} plan=${priceId} charge=${chargeLabel} ` +
      `amount=${amountILS}₪ orderId=${orderId} pageUid=${pageRequestUid}`
    );

    return new Response(JSON.stringify({ url: paymentPageLink }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status:  200,
    });
  } catch (error) {
    console.error("[create-checkout] error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

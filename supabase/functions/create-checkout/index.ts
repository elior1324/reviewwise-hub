import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Every paid subscription gets a 30-day free trial, regardless of coupons.
// Users who have redeemed a coupon additionally get the phase-2 discount
// (e.g. 90% off for 2 months) applied after the trial via a Stripe coupon.
const TRIAL_PERIOD_DAYS = 30;

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await anonClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Missing priceId");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Find or create Stripe customer ──────────────────────────────────────
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({ email: user.email });
      customerId = newCustomer.id;
    }

    // ── Cache stripe_customer_id on the business row ─────────────────────────
    // (non-blocking; used by send-billing-reminders for trial lookups)
    adminClient
      .from("businesses")
      .update({ stripe_customer_id: customerId })
      .eq("owner_id", user.id)
      .then(() => {})
      .catch((e: Error) => console.warn("[create-checkout] stripe_customer_id cache failed:", e.message));

    // ── Check if user has a phase-2 coupon discount ──────────────────────────
    // Applies when the user has redeemed a coupon that grants a discount after trial.
    // The stripe_phase2_coupon_id must be configured in the Stripe Dashboard:
    //   e.g. 90% off, repeating for 2 months — then stored on the coupon row.
    const { data: activeDiscount } = await adminClient
      .from("coupon_redemptions")
      .select("discounted_until, coupons ( stripe_phase2_coupon_id, phase2_discount_percent )")
      .eq("user_id", user.id)
      .not("discounted_until", "is", null)
      .order("redeemed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const couponInfo = (activeDiscount as any)?.coupons ?? null;
    const stripePhase2CouponId: string | null = couponInfo?.stripe_phase2_coupon_id ?? null;

    // ── Build checkout session ───────────────────────────────────────────────
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      // ✅ Free first month for ALL plans — built into Stripe
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        trial_settings: {
          end_behavior: {
            missing_payment_method: "pause", // pause instead of cancel if no card
          },
        },
      },
      // Always require payment method upfront so billing can start automatically
      payment_method_collection: "always",
      success_url: `${req.headers.get("origin")}/business/dashboard?checkout=success`,
      cancel_url:  `${req.headers.get("origin")}/business/pricing?checkout=cancelled`,
    };

    // ✅ Coupon holders get 90% off for months 2–3 (phase-2 Stripe coupon)
    // The Stripe coupon is applied AFTER the trial and repeats for phase2_duration_months.
    if (stripePhase2CouponId) {
      sessionParams.discounts = [{ coupon: stripePhase2CouponId }];
      console.log(
        `[create-checkout] user=${user.id} → trial=${TRIAL_PERIOD_DAYS}d + ` +
        `phase2 coupon=${stripePhase2CouponId} (${couponInfo?.phase2_discount_percent}% off)`
      );
    } else {
      console.log(`[create-checkout] user=${user.id} → trial=${TRIAL_PERIOD_DAYS}d, no coupon`);
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
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

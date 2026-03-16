/**
 * apply-coupon — Edge Function
 *
 * Validates and redeems a coupon code for an authenticated user.
 *
 * POST body: { code: string, business_id?: string }
 *
 * Flow:
 *  1. Authenticate caller
 *  2. Look up coupon — must be active, not expired, under max_uses
 *  3. Ensure user hasn't redeemed this coupon before
 *  4. Atomically increment used_count + insert redemption row
 *  5. Return billing_starts_at (= now + duration_months)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il",
  "https://www.reviewhub.co.il",
  "https://reviewshub.info",
  "https://www.reviewshub.info",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isDev = Deno.env.get("ENVIRONMENT") !== "production";
  const isLocal = /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || (isDev && isLocal);
  return {
    "Access-Control-Allow-Origin":  isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Authenticate caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { code?: string; business_id?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) {
    return new Response(JSON.stringify({ error: "נא להזין קוד קופון" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Look up coupon
  const { data: coupon, error: couponError } = await adminClient
    .from("coupons")
    .select("id, discount_percent, duration_months, max_uses, used_count, is_active, valid_until")
    .eq("code", code)
    .single();

  if (couponError || !coupon) {
    return new Response(JSON.stringify({ error: "קוד הקופון לא נמצא" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!coupon.is_active) {
    return new Response(JSON.stringify({ error: "קוד הקופון אינו פעיל" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return new Response(JSON.stringify({ error: "תוקף הקופון פג" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (coupon.used_count >= coupon.max_uses) {
    return new Response(JSON.stringify({ error: "הקופון כבר מומש" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check if this user already used this coupon
  const { data: existing } = await adminClient
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "כבר השתמשת בקופון זה" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Calculate billing start date
  const now = new Date();
  const billingStartsAt = new Date(now);
  billingStartsAt.setMonth(billingStartsAt.getMonth() + coupon.duration_months);

  // Atomically: increment used_count + insert redemption
  const { error: updateError } = await adminClient
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", coupon.id)
    .eq("used_count", coupon.used_count); // optimistic lock

  if (updateError) {
    return new Response(JSON.stringify({ error: "הקופון כבר מומש על ידי מישהו אחר. נסה שנית." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { error: redemptionError } = await adminClient
    .from("coupon_redemptions")
    .insert({
      coupon_id: coupon.id,
      user_id: user.id,
      business_id: body.business_id ?? null,
      billing_starts_at: billingStartsAt.toISOString(),
    });

  if (redemptionError) {
    // Rollback the used_count increment
    await adminClient.from("coupons").update({ used_count: coupon.used_count }).eq("id", coupon.id);
    return new Response(JSON.stringify({ error: "שגיאה בשמירת המימוש. נסה שנית." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  console.log(`[apply-coupon] User ${user.id} redeemed coupon ${code} → billing starts ${billingStartsAt.toISOString()}`);

  return new Response(JSON.stringify({
    success: true,
    discount_percent: coupon.discount_percent,
    duration_months:  coupon.duration_months,
    billing_starts_at: billingStartsAt.toISOString(),
    message: `🎉 הקופון הופעל! ${coupon.duration_months} חודשים חינם. החיוב יתחיל ב-${billingStartsAt.toLocaleDateString("he-IL")}`,
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

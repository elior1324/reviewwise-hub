/**
 * apply-coupon — Edge Function
 *
 * Validates and redeems a coupon code for an authenticated user.
 * Grants full premium access for the coupon's duration (typically 90 days).
 *
 * POST body: { code: string, business_id?: string }
 *
 * Flow:
 *  1. Authenticate caller
 *  2. Look up coupon — must be active, not expired, under max_uses
 *  3. Ensure user hasn't redeemed this coupon before
 *  4. Atomically increment used_count (race-condition safe)
 *  5. Insert redemption row
 *  6. Update business subscription_tier → "pro" + subscription_expires_at
 *  7. Return success
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, assertOrigin } from "../_shared/cors.ts";

function json(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Per-user coupon attempt tracker (in-memory, resets on cold start). */
const couponAttempts = new Map<string, { count: number; resetAt: number }>();
const COUPON_RATE_LIMIT  = 5;          // max attempts
const COUPON_RATE_WINDOW = 60 * 1000;  // per 1 minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = couponAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    couponAttempts.set(userId, { count: 1, resetAt: now + COUPON_RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > COUPON_RATE_LIMIT;
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // ── Server-side origin enforcement ──────────────────────────────────────
  const blocked = assertOrigin(req);
  if (blocked) return blocked;

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ── 1. Authenticate ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  // ── Rate limit: max 5 coupon attempts per user per minute ───────────────
  if (isRateLimited(user.id)) {
    return json({ error: "יותר מדי ניסיונות — נסו שוב בעוד דקה" }, 429, cors);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── 2. Parse body ───────────────────────────────────────────────────────
  let body: { code?: string; business_id?: string };
  try { body = await req.json(); } catch {
    return json({ error: "Invalid JSON body" }, 400, cors);
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return json({ error: "נא להזין קוד קופון" }, 400, cors);

  // ── 3. Look up coupon ───────────────────────────────────────────────────
  const { data: coupon, error: couponErr } = await admin
    .from("coupons")
    .select("id, duration_months, max_uses, used_count, is_active, valid_until")
    .eq("code", code)
    .single();

  if (couponErr || !coupon) return json({ error: "קוד הקופון לא נמצא" }, 404, cors);
  if (!coupon.is_active) return json({ error: "קוד הקופון אינו פעיל" }, 400, cors);
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return json({ error: "תוקף הקופון פג" }, 400, cors);
  }
  if (coupon.used_count >= coupon.max_uses) {
    return json({ error: "הקופון כבר מומש" }, 400, cors);
  }

  // ── 4. Check single-use per user ────────────────────────────────────────
  const { data: existing } = await admin
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return json({ error: "כבר השתמשת בקופון זה" }, 400, cors);

  // ── 5. Calculate premium_until ──────────────────────────────────────────
  // duration_months = 0 means lifetime (no expiration)
  const now = new Date();
  const isLifetime = coupon.duration_months === 0;
  const premiumUntil = isLifetime ? null : new Date(now);
  if (premiumUntil) {
    premiumUntil.setMonth(premiumUntil.getMonth() + coupon.duration_months);
  }

  // ── 6. Atomically increment used_count (race-condition protection) ──────
  const { error: updateErr } = await admin
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", coupon.id)
    .eq("used_count", coupon.used_count); // optimistic lock

  if (updateErr) {
    return json({ error: "הקופון כבר מומש על ידי מישהו אחר. נסה שנית." }, 409, cors);
  }

  // ── 7. Insert redemption row ────────────────────────────────────────────
  const { error: redeemErr } = await admin
    .from("coupon_redemptions")
    .insert({
      coupon_id:         coupon.id,
      user_id:           user.id,
      business_id:       body.business_id ?? null,
      billing_starts_at: premiumUntil?.toISOString() ?? new Date("2099-12-31").toISOString(),
    });

  if (redeemErr) {
    // Rollback used_count
    await admin.from("coupons").update({ used_count: coupon.used_count }).eq("id", coupon.id);
    return json({ error: "שגיאה בשמירת המימוש. נסה שנית." }, 500, cors);
  }

  // ── 8. Activate premium on the business ─────────────────────────────────
  if (body.business_id) {
    await admin
      .from("businesses")
      .update({
        subscription_tier: "enterprise",
        subscription_expires_at: isLifetime ? null : premiumUntil!.toISOString(),
      })
      .eq("id", body.business_id)
      .eq("owner_id", user.id); // safety: only the owner can activate
  }

  const logExpiry = isLifetime ? "LIFETIME" : premiumUntil!.toISOString();
  console.log(`[apply-coupon] User ${user.id} redeemed ${code} → premium until ${logExpiry}`);

  const message = isLifetime
    ? "הקוד הופעל בהצלחה! יש לך גישת פרימיום ללא הגבלת זמן"
    : `הקופון הופעל! גישת פרימיום פעילה עד ${premiumUntil!.toLocaleDateString("he-IL")}`;

  return json({
    success: true,
    message,
    premium_until: isLifetime ? null : premiumUntil!.toISOString(),
    billing_starts_at: isLifetime ? null : premiumUntil!.toISOString(),
    is_lifetime: isLifetime,
  }, 200, cors);
});

/**
 * apply-coupon — Edge Function
 *
 * Validates and redeems a coupon code for an authenticated user,
 * then sends a Hebrew confirmation email via Resend.
 *
 * POST body: { code: string, business_id?: string }
 *
 * Flow:
 *  1. Authenticate caller
 *  2. Look up coupon — must be active, not expired, under max_uses
 *  3. Ensure user hasn't redeemed this coupon before
 *  4. Atomically increment used_count + insert redemption row
 *  5. Send confirmation email (non-blocking)
 *  6. Return billing_starts_at (= now + duration_months)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FROM_ADDRESS = "ReviewHub <noreply@reviewshub.info>";
const RESEND_API   = "https://api.resend.com/emails";

const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il",
  "https://www.reviewhub.co.il",
  "https://reviewshub.info",
  "https://www.reviewshub.info",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isDev   = Deno.env.get("ENVIRONMENT") !== "production";
  const isLocal = /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || (isDev && isLocal);
  return {
    "Access-Control-Allow-Origin":  isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function formatHebrewDate(d: Date): string {
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

async function sendConfirmationEmail(opts: {
  to: string;
  code: string;
  durationMonths: number;
  billingStartsAt: Date;
  resendApiKey: string;
}): Promise<void> {
  const { to, code, durationMonths, billingStartsAt, resendApiKey } = opts;
  const billingDateStr = formatHebrewDate(billingStartsAt);

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"/><title>קופון הופעל - ReviewHub</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;color:#e5e5e5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;max-width:580px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 40px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">ReviewHub</div>
    <div style="font-size:13px;color:#a0aec0;margin-top:6px;">פלטפורמת הביקורות לעסקים</div>
  </td></tr>
  <tr><td style="padding:32px 40px 8px;text-align:center;">
    <div style="display:inline-block;background:#064e3b;border:1px solid #065f46;border-radius:50px;padding:8px 20px;font-size:13px;font-weight:700;color:#34d399;">checkmark הקופון הופעל בהצלחה!</div>
  </td></tr>
  <tr><td style="padding:16px 40px 8px;text-align:center;">
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">ברוכים הבאים ל-ReviewHub!</h1>
    <p style="margin:12px 0 0;font-size:15px;color:#a0aec0;">גישה חינמית ל-${durationMonths} חודשים הופעלה בחשבונך.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid #2d2d2d;">
      <tr><td style="padding:24px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:1px;">קוד קופון</td>
            <td align="left" style="font-family:monospace;font-size:16px;font-weight:800;color:#60a5fa;letter-spacing:2px;">${code}</td>
          </tr>
        </table>
        <div style="height:1px;background:#2d2d2d;margin-bottom:16px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:1px;">תקופת חינם</td>
            <td align="left" style="font-size:15px;font-weight:700;color:#34d399;">${durationMonths} חודשים מלאים</td>
          </tr>
        </table>
        <div style="height:1px;background:#2d2d2d;margin-bottom:16px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:1px;">תחילת חיוב</td>
            <td align="left" style="font-size:15px;font-weight:700;color:#fff;">${billingDateStr}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2744;border-radius:10px;border:1px solid #1e3a5f;">
      <tr><td style="padding:16px 20px;font-size:13px;color:#93c5fd;line-height:1.7;">
        <strong style="color:#60a5fa;">מה קורה מעכשיו?</strong><br/>
        יש לכם גישה מלאה לכל תכונות ReviewHub עד <strong>${billingDateStr}</strong>. לא תחויבו כלל לפני תאריך זה.
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="https://reviewhub.co.il/business/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;">
      עבורו ללוח הבקרה &rarr;
    </a>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
    <p style="margin:0;font-size:12px;color:#4b5563;">
      ReviewHub &middot; <a href="https://reviewhub.co.il" style="color:#4b5563;text-decoration:none;">reviewhub.co.il</a><br/>
      תמיכה: <a href="mailto:support@reviewshub.info" style="color:#4b5563;text-decoration:none;">support@reviewshub.info</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [to],
        subject: `הקופון ${code} הופעל - ${durationMonths} חודשים חינם ב-ReviewHub`,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[apply-coupon] Resend error ${res.status}: ${errBody}`);
    } else {
      console.log(`[apply-coupon] Confirmation email sent to ${to}`);
    }
  } catch (err) {
    console.error("[apply-coupon] Email send failed:", err);
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { code?: string; business_id?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) {
    return new Response(JSON.stringify({ error: "נא להזין קוד קופון" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: coupon, error: couponError } = await adminClient
    .from("coupons")
    .select("id, discount_percent, duration_months, max_uses, used_count, is_active, valid_until")
    .eq("code", code)
    .single();

  if (couponError || !coupon) {
    return new Response(JSON.stringify({ error: "קוד הקופון לא נמצא" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!coupon.is_active) {
    return new Response(JSON.stringify({ error: "קוד הקופון אינו פעיל" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return new Response(JSON.stringify({ error: "תוקף הקופון פג" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (coupon.used_count >= coupon.max_uses) {
    return new Response(JSON.stringify({ error: "הקופון כבר מומש" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: existing } = await adminClient
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "כבר השתמשת בקופון זה" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const billingStartsAt = new Date(now);
  billingStartsAt.setMonth(billingStartsAt.getMonth() + coupon.duration_months);

  const { error: updateError } = await adminClient
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", coupon.id)
    .eq("used_count", coupon.used_count);

  if (updateError) {
    return new Response(JSON.stringify({ error: "הקופון כבר מומש על ידי מישהו אחר. נסה שנית." }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: redemptionError } = await adminClient
    .from("coupon_redemptions")
    .insert({
      coupon_id:         coupon.id,
      user_id:           user.id,
      business_id:       body.business_id ?? null,
      billing_starts_at: billingStartsAt.toISOString(),
    });

  if (redemptionError) {
    await adminClient.from("coupons").update({ used_count: coupon.used_count }).eq("id", coupon.id);
    return new Response(JSON.stringify({ error: "שגיאה בשמירת המימוש. נסה שנית." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[apply-coupon] User ${user.id} redeemed ${code} → billing starts ${billingStartsAt.toISOString()}`);

  // Send confirmation email — fire & forget (doesn't block the response)
  const userEmail = user.email;
  if (userEmail && RESEND_API_KEY) {
    sendConfirmationEmail({
      to:             userEmail,
      code,
      durationMonths: coupon.duration_months,
      billingStartsAt,
      resendApiKey:   RESEND_API_KEY,
    }).catch((e) => console.error("[apply-coupon] email fire failed:", e));
  } else if (!RESEND_API_KEY) {
    console.warn("[apply-coupon] RESEND_API_KEY not set — skipping confirmation email");
  }

  return new Response(
    JSON.stringify({
      success:           true,
      discount_percent:  coupon.discount_percent,
      duration_months:   coupon.duration_months,
      billing_starts_at: billingStartsAt.toISOString(),
      message: `הקופון הופעל! ${coupon.duration_months} חודשים חינם. החיוב יתחיל ב-${formatHebrewDate(billingStartsAt)}`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

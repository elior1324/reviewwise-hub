/**
 * hyp-webhook — Edge Function
 *
 * Handles IPN (Instant Payment Notification) callbacks from hyp (YaadPay).
 * hyp sends a server-to-server POST to this URL after every payment attempt.
 *
 * hyp IPN Parameters (POST body, application/x-www-form-urlencoded):
 *   Id       — Unique transaction ID assigned by hyp
 *   CCode    — Response code: "000" = success, anything else = failure
 *   Amount   — Amount charged in grush (ILS × 100)
 *   ACode    — Bank authorization code
 *   Order    — Order ID we passed in the original request
 *   Masof    — Terminal number (verify matches our terminal)
 *   Hesh     — HMAC hash for signature verification
 *   Fild1    — subscription tier (we passed it in create-checkout)
 *   Fild2    — user ID  (we passed it in create-checkout)
 *   Fild3    — priceId  (we passed it in create-checkout)
 *   Token    — tokenised card reference (present when action=Token)
 *   SVComp   — Card company (1=Isracard, 2=CAL, etc.)
 *   L4digit  — Last 4 digits of card
 *
 * Subscription lifecycle:
 *   J4 tokenisation success → activate trial, save Token
 *   Regular charge success  → activate / extend subscription by billing period
 *
 * Required Edge Function secrets:
 *   HYP_TERMINAL_NUMBER   — Our hyp Masof
 *   HYP_API_KEY           — Our hyp PassP (used for hash verification)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY        — (optional) for confirmation emails
 *   FRONTEND_URL          — for email links
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac }         from "https://deno.land/x/hmac@v2.0.1/mod.ts";

// ── hyp response code for success ─────────────────────────────────────────────
const HYP_SUCCESS_CODE = "000";

// ── Subscription period durations ─────────────────────────────────────────────
const MONTHLY_DAYS  = 31; // add 31 days per monthly charge
const ANNUAL_DAYS   = 366; // add 366 days per annual charge

// ── Plan metadata ──────────────────────────────────────────────────────────────
interface PlanMeta { tier: string; billingCycle: "monthly" | "annual" }
const PLAN_META: Record<string, PlanMeta> = {
  "plan_pro_monthly":        { tier: "pro",        billingCycle: "monthly" },
  "plan_pro_annual":         { tier: "pro",        billingCycle: "annual"  },
  "plan_enterprise_monthly": { tier: "enterprise", billingCycle: "monthly" },
  "plan_enterprise_annual":  { tier: "enterprise", billingCycle: "annual"  },
};

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendPaymentConfirmation(opts: {
  to: string;
  tier: string;
  transactionId: string;
  amountILS: number;
  isTokenOnly: boolean;
  frontendUrl: string;
  resendApiKey: string;
}): Promise<void> {
  const { to, tier, transactionId, amountILS, isTokenOnly, frontendUrl, resendApiKey } = opts;

  const tierLabel = tier === "enterprise" ? "אנטרפרייז" : "מקצועי";
  const subject   = isTokenOnly
    ? `ReviewHub — כרטיסך נשמר. ה30 ימים הראשונים חינם! 🎉`
    : `ReviewHub — תשלום אושר ✓ (${amountILS}₪)`;

  const bodyText = isTokenOnly
    ? `פרטי הכרטיס שלך נשמרו בהצלחה. תקופת הניסיון של 30 ימים החלה — לא תחויב עד סיום התקופה.`
    : `התשלום של ₪${amountILS} עבור תוכנית ${tierLabel} אושר בהצלחה. מספר עסקה: ${transactionId}.`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;color:#e5e5e5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;max-width:580px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 40px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">ReviewHub</div>
    <div style="font-size:13px;color:#a0aec0;margin-top:6px;">פלטפורמת הביקורות לעסקים</div>
  </td></tr>
  <tr><td style="padding:32px 40px;text-align:center;">
    <div style="display:inline-block;background:${isTokenOnly ? "#064e3b" : "#064e3b"};border:1px solid #065f46;border-radius:50px;padding:8px 20px;font-size:13px;font-weight:700;color:#34d399;">
      ${isTokenOnly ? "✓ הכרטיס נשמר — הניסיון החינמי מתחיל!" : "✓ תשלום אושר!"}
    </div>
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:800;color:#fff;">${bodyText}</h1>
    ${!isTokenOnly ? `<p style="margin:0;font-size:13px;color:#6b7280;">מזהה עסקה: <span style="font-family:monospace;color:#60a5fa;">${transactionId}</span></p>` : ""}
  </td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="${frontendUrl}/business/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;">
      עברו ללוח הבקרה &rarr;
    </a>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
    <p style="margin:0;font-size:12px;color:#4b5563;">
      ReviewHub &middot; תמיכה: <a href="mailto:support@reviewshub.info" style="color:#4b5563;text-decoration:none;">support@reviewshub.info</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "ReviewHub <noreply@reviewshub.info>",
        to:      [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error(`[hyp-webhook] Resend error ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    console.error("[hyp-webhook] Email send failed:", e);
  }
}

serve(async (req: Request) => {
  // hyp sends a POST with application/x-www-form-urlencoded body
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const HYP_TERMINAL              = Deno.env.get("HYP_TERMINAL_NUMBER") ?? "";
  const HYP_API_KEY               = Deno.env.get("HYP_API_KEY") ?? "";
  const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");
  const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? "https://reviewhub.co.il";

  let params: URLSearchParams;
  let rawBody: string;
  try {
    rawBody = await req.text();
    params = new URLSearchParams(rawBody);
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  const ccode       = params.get("CCode")  ?? "";
  const transId     = params.get("Id")     ?? "";
  const masof       = params.get("Masof")  ?? "";
  const orderId     = params.get("Order")  ?? "";
  const amountGrosh = params.get("Amount") ?? "0";
  const token       = params.get("Token")  ?? "";   // present for J4 tokenisation
  const tier        = params.get("Fild1")  ?? "";
  const userId      = params.get("Fild2")  ?? "";
  const priceId     = params.get("Fild3")  ?? "";
  const hesh        = params.get("Hesh")   ?? "";

  // ── Basic integrity checks ────────────────────────────────────────────────
  if (masof !== HYP_TERMINAL) {
    console.warn(`[hyp-webhook] Terminal mismatch: got ${masof}, expected ${HYP_TERMINAL}`);
    return new Response("Forbidden", { status: 403 });
  }

  // ── HMAC signature verification ───────────────────────────────────────────
  // hyp signs the IPN with HMAC-SHA256 over sorted key=value pairs (excluding Hesh itself)
  // using HYP_API_KEY (PassP) as the secret. This prevents forged payment notifications.
  if (HYP_API_KEY) {
    const sortedKeys = [...params.keys()]
      .filter(k => k !== "Hesh")
      .sort();
    const message = sortedKeys.map(k => `${k}=${params.get(k)}`).join("&");
    const expectedHesh = hmac("sha256", HYP_API_KEY, message, "utf8", "hex") as string;
    // Constant-time comparison to prevent timing attacks
    const expectedBytes = new TextEncoder().encode(expectedHesh.toLowerCase());
    const receivedBytes = new TextEncoder().encode(hesh.toLowerCase());
    let mismatch = expectedBytes.length !== receivedBytes.length ? 1 : 0;
    for (let i = 0; i < Math.min(expectedBytes.length, receivedBytes.length); i++) {
      mismatch |= expectedBytes[i] ^ receivedBytes[i];
    }
    if (mismatch !== 0) {
      console.error(`[hyp-webhook] HMAC verification FAILED — possible forgery attempt`);
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    console.warn("[hyp-webhook] HYP_API_KEY not set — skipping HMAC verification (insecure)");
  }

  if (!userId) {
    console.error("[hyp-webhook] Missing Fild2 (userId) in IPN");
    return new Response("Bad request — missing userId", { status: 400 });
  }

  // ── Payment failed ────────────────────────────────────────────────────────
  if (ccode !== HYP_SUCCESS_CODE) {
    console.log(`[hyp-webhook] Payment FAILED — CCode=${ccode} Order=${orderId} User=${userId}`);
    // No DB update needed on failure
    return new Response("OK", { status: 200 });
  }

  // ── Payment / tokenisation succeeded ─────────────────────────────────────
  const amountILS  = Math.round(parseInt(amountGrosh, 10) / 100);
  const isTokenOnly = token !== "" && amountILS === 0; // J4 tokenisation (trial)

  console.log(
    `[hyp-webhook] SUCCESS — Id=${transId} Order=${orderId} User=${userId} ` +
    `Amount=${amountILS}₪ Token=${isTokenOnly ? "yes" : "no"} Tier=${tier}`
  );

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Fetch business row ────────────────────────────────────────────────────
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, subscription_tier, subscription_expires_at, trial_ends_at")
    .eq("owner_id", userId)
    .maybeSingle();

  if (bizErr || !biz) {
    console.error(`[hyp-webhook] Business not found for user ${userId}:`, bizErr?.message);
    return new Response("OK", { status: 200 }); // return 200 so hyp doesn't retry
  }

  const now   = new Date();
  const planMeta = PLAN_META[priceId] ?? { tier: tier || "pro", billingCycle: "monthly" };
  const extendDays = planMeta.billingCycle === "annual" ? ANNUAL_DAYS : MONTHLY_DAYS;

  if (isTokenOnly) {
    // ── Trial activated: card saved, no charge ────────────────────────────
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await admin.from("businesses").update({
      subscription_tier: planMeta.tier,
      trial_ends_at:     trialEnds.toISOString(),
      hyp_card_token:    token,
      hyp_transaction_id: transId,
    }).eq("id", biz.id);

    console.log(`[hyp-webhook] Trial activated for business=${biz.id} trial_ends=${trialEnds.toISOString()}`);
  } else {
    // ── Paid charge: extend subscription period ───────────────────────────
    const currentExpiry = biz.subscription_expires_at
      ? new Date(biz.subscription_expires_at)
      : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);

    const updates: Record<string, string> = {
      subscription_tier:       planMeta.tier,
      subscription_expires_at: newExpiry.toISOString(),
      hyp_transaction_id:      transId,
    };
    if (token) updates.hyp_card_token = token; // update token if refreshed

    await admin.from("businesses").update(updates).eq("id", biz.id);

    console.log(`[hyp-webhook] Subscription extended for business=${biz.id} expires=${newExpiry.toISOString()}`);
  }

  // ── Send confirmation email (non-blocking) ────────────────────────────────
  if (RESEND_API_KEY) {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (email) {
      sendPaymentConfirmation({
        to:            email,
        tier:          planMeta.tier,
        transactionId: transId,
        amountILS,
        isTokenOnly,
        frontendUrl:   FRONTEND_URL,
        resendApiKey:  RESEND_API_KEY,
      }).catch((e) => console.error("[hyp-webhook] Email fire failed:", e));
    }
  }

  // hyp expects a plain "200 OK" — no specific body required
  return new Response("OK", { status: 200 });
});

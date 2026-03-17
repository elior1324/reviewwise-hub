/**
 * payplus-webhook — Edge Function
 *
 * Handles IPN (Instant Payment Notification) callbacks from PayPlus.
 * PayPlus sends a server-to-server POST to this URL (refURL_notify)
 * after every payment attempt.
 *
 * PayPlus IPN — POST body (application/json):
 *   transaction_uid       — Unique transaction ID assigned by PayPlus
 *   payment_page_uid      — The payment page template UID
 *   page_request_uid      — The page_request_uid returned at checkout creation
 *   status                — "success" | "failed" | "pending" | "refund"
 *   amount                — Amount charged in ILS (decimal)
 *   currency_code         — "ILS"
 *   senderpaymentpageuid  — Our orderId (from create-checkout)
 *   customer.email        — Customer email
 *   more_info             — Our order description
 *   more_info_2           — subscription tier  (set in create-checkout)
 *   more_info_3           — user UUID          (set in create-checkout)
 *   more_info_4           — priceId            (set in create-checkout)
 *
 * Webhook signature validation:
 *   PayPlus sends an "x-payplus-signature" header (or similar).
 *   We compute HMAC-SHA256 of the raw request body using PAYPLUS_SECRET_KEY
 *   and compare with the header value. Reject if they don't match.
 *
 * Subscription lifecycle:
 *   Trial charge (₪1)   → activate trial period (30 days), save payplus_uid
 *   Regular charge      → activate / extend subscription by billing period
 *
 * Required Edge Function secrets:
 *   PAYPLUS_SECRET_KEY        — For HMAC-SHA256 signature verification
 *   PAYPLUS_PAGE_UID          — Expected payment_page_uid (integrity check)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY            — (optional) for confirmation emails
 *   FRONTEND_URL              — for email links
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── PayPlus status codes ───────────────────────────────────────────────────────
const PAYPLUS_SUCCESS = "success";

// ── Subscription period durations ─────────────────────────────────────────────
const MONTHLY_DAYS = 31;
const ANNUAL_DAYS  = 366;

// ── Trial amount threshold (₪1 micro-charge → treat as trial activation) ──────
const TRIAL_AMOUNT_THRESHOLD = 1.5; // anything ≤ ₪1.50 is considered a trial charge

// ── Plan metadata ──────────────────────────────────────────────────────────────
interface PlanMeta { tier: string; billingCycle: "monthly" | "annual" }
const PLAN_META: Record<string, PlanMeta> = {
  "plan_pro_monthly":        { tier: "pro",        billingCycle: "monthly" },
  "plan_pro_annual":         { tier: "pro",        billingCycle: "annual"  },
  "plan_enterprise_monthly": { tier: "enterprise", billingCycle: "monthly" },
  "plan_enterprise_annual":  { tier: "enterprise", billingCycle: "annual"  },
};

// ── HMAC-SHA256 signature verification ────────────────────────────────────────
// PayPlus sends X-Payplus-Signature: HMAC-SHA256(rawBody, secretKey) hex-encoded.
async function verifySignature(
  rawBody: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  try {
    const enc     = new TextEncoder();
    const keyData = enc.encode(secretKey);
    const msgData = enc.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData,
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigHex    = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    if (sigHex.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < sigHex.length; i++) {
      diff |= sigHex.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendPaymentConfirmation(opts: {
  to:            string;
  tier:          string;
  transactionId: string;
  amountILS:     number;
  isTrialCharge: boolean;
  frontendUrl:   string;
  resendApiKey:  string;
}): Promise<void> {
  const { to, tier, transactionId, amountILS, isTrialCharge, frontendUrl, resendApiKey } = opts;

  const tierLabel = tier === "enterprise" ? "אנטרפרייז" : "מקצועי";
  const subject   = isTrialCharge
    ? `ReviewHub — כרטיסך נשמר. ה30 ימים הראשונים חינם! 🎉`
    : `ReviewHub — תשלום אושר ✓ (${amountILS}₪)`;

  const bodyText = isTrialCharge
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
    <div style="display:inline-block;background:#064e3b;border:1px solid #065f46;border-radius:50px;padding:8px 20px;font-size:13px;font-weight:700;color:#34d399;">
      ${isTrialCharge ? "✓ הכרטיס נשמר — הניסיון החינמי מתחיל!" : "✓ תשלום אושר!"}
    </div>
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:800;color:#fff;">${bodyText}</h1>
    ${!isTrialCharge ? `<p style="margin:0;font-size:13px;color:#6b7280;">מזהה עסקה: <span style="font-family:monospace;color:#60a5fa;">${transactionId}</span></p>` : ""}
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
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${resendApiKey}`,
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
      console.error(`[payplus-webhook] Resend error ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    console.error("[payplus-webhook] Email send failed:", e);
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PAYPLUS_SECRET_KEY        = Deno.env.get("PAYPLUS_SECRET_KEY") ?? "";
  const PAYPLUS_PAGE_UID          = Deno.env.get("PAYPLUS_PAGE_UID")   ?? "";
  const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");
  const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? "https://reviewhub.co.il";

  // ── Read raw body (needed for signature verification) ─────────────────────
  let rawBody: string;
  // deno-lint-ignore no-explicit-any
  let ipn: Record<string, any>;

  try {
    rawBody = await req.text();
    ipn     = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // ── Signature verification ────────────────────────────────────────────────
  // PayPlus sends the signature in the "x-payplus-signature" header.
  // Skip verification only if secret key is not configured (dev/test mode).
  if (PAYPLUS_SECRET_KEY) {
    const sigHeader = req.headers.get("x-payplus-signature")
                   ?? req.headers.get("X-Payplus-Signature")
                   ?? "";
    if (!sigHeader) {
      console.warn("[payplus-webhook] Missing signature header — rejecting");
      return new Response("Forbidden — missing signature", { status: 403 });
    }
    const valid = await verifySignature(rawBody, sigHeader, PAYPLUS_SECRET_KEY);
    if (!valid) {
      console.warn("[payplus-webhook] Signature mismatch — rejecting");
      return new Response("Forbidden — invalid signature", { status: 403 });
    }
  }

  // ── Parse IPN fields ──────────────────────────────────────────────────────
  const status         = (ipn.status         ?? "").toString().toLowerCase();
  const transactionUid = (ipn.transaction_uid ?? ipn.transactionUid ?? "").toString();
  const pageRequestUid = (ipn.page_request_uid ?? ipn.pageRequestUid ?? "").toString();
  const pageUid        = (ipn.payment_page_uid ?? "").toString();
  const amountILS      = parseFloat(ipn.amount ?? "0");
  const orderId        = (ipn.senderpaymentpageuid ?? "").toString();

  // Fields we embedded in more_info_2/3/4 at checkout creation
  const tier    = (ipn.more_info_2 ?? "").toString();
  const userId  = (ipn.more_info_3 ?? "").toString();
  const priceId = (ipn.more_info_4 ?? "").toString();

  // Fallback: try to extract userId from orderId (format: RH-{UID6}-{TS})
  const derivedUserId = userId || (() => {
    const parts = orderId.split("-");
    return parts.length >= 3 ? parts[1] : "";
  })();

  // ── Basic integrity checks ────────────────────────────────────────────────
  if (PAYPLUS_PAGE_UID && pageUid && pageUid !== PAYPLUS_PAGE_UID) {
    console.warn(`[payplus-webhook] Page UID mismatch: got ${pageUid}, expected ${PAYPLUS_PAGE_UID}`);
    return new Response("Forbidden — page UID mismatch", { status: 403 });
  }

  if (!derivedUserId) {
    console.error("[payplus-webhook] Cannot identify user — missing more_info_3 and orderId");
    return new Response("Bad request — cannot identify user", { status: 400 });
  }

  // ── Payment failed ────────────────────────────────────────────────────────
  if (status !== PAYPLUS_SUCCESS) {
    console.log(
      `[payplus-webhook] Payment NOT successful — status=${status} ` +
      `order=${orderId} user=${derivedUserId}`
    );
    // No DB update on failure — return 200 so PayPlus stops retrying
    return new Response("OK", { status: 200 });
  }

  // ── Payment succeeded ─────────────────────────────────────────────────────
  const isTrialCharge = amountILS <= TRIAL_AMOUNT_THRESHOLD;

  console.log(
    `[payplus-webhook] SUCCESS — txn=${transactionUid} order=${orderId} ` +
    `user=${derivedUserId} amount=${amountILS}₪ trial=${isTrialCharge} tier=${tier}`
  );

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Fetch business row ────────────────────────────────────────────────────
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, subscription_tier, subscription_expires_at, trial_ends_at")
    .eq("owner_id", derivedUserId)
    .maybeSingle();

  if (bizErr || !biz) {
    console.error(`[payplus-webhook] Business not found for user ${derivedUserId}:`, bizErr?.message);
    return new Response("OK", { status: 200 }); // 200 so PayPlus doesn't retry
  }

  const now      = new Date();
  const planMeta = PLAN_META[priceId] ?? { tier: tier || "pro", billingCycle: "monthly" as const };
  const extendDays = planMeta.billingCycle === "annual" ? ANNUAL_DAYS : MONTHLY_DAYS;

  if (isTrialCharge) {
    // ── Trial activated: ₪1 micro-charge, card saved ─────────────────────
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await admin.from("businesses").update({
      subscription_tier:  planMeta.tier,
      trial_ends_at:      trialEnds.toISOString(),
      payplus_page_uid:   pageRequestUid,
      payplus_txn_uid:    transactionUid,
    }).eq("id", biz.id);

    console.log(
      `[payplus-webhook] Trial activated for business=${biz.id} ` +
      `trial_ends=${trialEnds.toISOString()}`
    );
  } else {
    // ── Paid charge: extend subscription period ───────────────────────────
    const currentExpiry = biz.subscription_expires_at
      ? new Date(biz.subscription_expires_at)
      : now;
    const baseDate  = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);

    await admin.from("businesses").update({
      subscription_tier:       planMeta.tier,
      subscription_expires_at: newExpiry.toISOString(),
      payplus_page_uid:        pageRequestUid,
      payplus_txn_uid:         transactionUid,
    }).eq("id", biz.id);

    console.log(
      `[payplus-webhook] Subscription extended for business=${biz.id} ` +
      `expires=${newExpiry.toISOString()}`
    );
  }

  // ── Send confirmation email (non-blocking) ────────────────────────────────
  if (RESEND_API_KEY) {
    const { data: userData } = await admin.auth.admin.getUserById(derivedUserId);
    const email = userData?.user?.email;
    if (email) {
      sendPaymentConfirmation({
        to:            email,
        tier:          planMeta.tier,
        transactionId: transactionUid,
        amountILS,
        isTrialCharge,
        frontendUrl:   FRONTEND_URL,
        resendApiKey:  RESEND_API_KEY,
      }).catch((e) => console.error("[payplus-webhook] Email fire failed:", e));
    }
  }

  // PayPlus expects a 200 response — specific body not required
  return new Response("OK", { status: 200 });
});

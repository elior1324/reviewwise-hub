/**
 * grow-make-webhook — Edge Function
 *
 * Receives payment confirmation relayed by Make (Integromat) from Grow.
 * Architecture: Grow → Make (filter + relay) → POST here → DB update → access granted
 *
 * Authentication:
 *   Make sends header: X-Webhook-Secret: <GROW_MAKE_SECRET env var>
 *   This is validated FIRST, constant-time, before any body is read.
 *
 * Execution order (safety-critical — do not reorder):
 *   1.  Method check (POST only)
 *   2.  Secret validation (constant-time HMAC compare)
 *   3.  JSON parse
 *   4.  Log raw payload → get logId          ← blind-spot protection
 *   5.  Extract fields
 *   6.  Validate required fields present
 *   7.  Validate user_id UUID format
 *   8.  Status whitelist check                ← gate: non-success → 200, skip
 *   9.  Plan ID validation
 *   10. Amount floor check                    ← gate: below ₪10 → 200, skip
 *   11. Look up business row                  ← need biz.id for step 12
 *   12. INSERT idempotency row FIRST          ← CRITICAL: must precede step 13
 *       - 23505 conflict → already processed → 200, skip
 *       - other error    → 500, Make retries
 *   13. UPDATE businesses (subscription)
 *       - error → DELETE idempotency row → 500, Make retries
 *   14. Mark log done
 *   15. Send confirmation email (async, non-blocking)
 *   16. Return 200
 *
 * ⚠️ STATUS STRING: verify the exact Grow success string in GROW_SUCCESS_STATUSES below.
 * ⚠️ FIELD NAMES: verify Grow's exact field names match the Make HTTP mapping.
 *
 * Required secrets (Supabase → Edge Functions → Manage Secrets):
 *   GROW_MAKE_SECRET          — ≥ 32 random chars, shared with Make environment variable
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   RESEND_API_KEY            — optional, for confirmation emails
 *   FRONTEND_URL              — e.g. https://reviewhub.co.il
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE = "grow_make";

/**
 * ⚠️ MUST VERIFY WITH GROW:
 * Open Grow dashboard → Developer / Webhooks → Event types.
 * Find the status string for a completed, money-charged payment.
 * Add ONLY confirmed success strings. Everything else is rejected.
 */
const GROW_SUCCESS_STATUSES = new Set([
  "success",
  "paid",
  "completed",
  "charge.success",
  "payment_success",
]);

/**
 * Minimum acceptable payment amount in ILS.
 * ₪10 floor accommodates phase-2 coupon discounts (up to 90% off).
 * The cheapest discounted plan: pro_monthly ₪149 × 10% = ₪14.90 → safely above ₪10.
 * Do NOT lower this below ₪10.
 */
const MIN_AMOUNT_ILS = 10;

/** UUID v4 format validation. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PlanMeta {
  tier:         "pro" | "enterprise";
  billingCycle: "monthly" | "annual";
}

const PLAN_META: Record<string, PlanMeta> = {
  // Full format (preferred)
  "plan_pro_monthly":        { tier: "pro",        billingCycle: "monthly" },
  "plan_pro_annual":         { tier: "pro",        billingCycle: "annual"  },
  "plan_enterprise_monthly": { tier: "enterprise", billingCycle: "monthly" },
  "plan_enterprise_annual":  { tier: "enterprise", billingCycle: "annual"  },
  // Short format (sent by Make scenario — defaults to monthly)
  "pro":                     { tier: "pro",        billingCycle: "monthly" },
  "enterprise":              { tier: "enterprise", billingCycle: "monthly" },
};

const MONTHLY_DAYS = 31;
const ANNUAL_DAYS  = 366;

// ── Logging ───────────────────────────────────────────────────────────────────

function log(step: string, details?: unknown): void {
  const d = details !== undefined ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[grow-make-webhook] ${step}${d}`);
}

// ── Constant-time secret comparison ──────────────────────────────────────────
// String === is vulnerable to timing attacks.
// HMAC both values with a fixed key and compare the fixed-length digests.

async function secureEqual(a: string, b: string): Promise<boolean> {
  const enc  = new TextEncoder();
  // Use a stable internal key — timing safety comes from comparing equal-length HMAC digests
  const key  = await crypto.subtle.importKey(
    "raw",
    enc.encode("reviewhub-secret-compare-v1"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(a)),
    crypto.subtle.sign("HMAC", key, enc.encode(b)),
  ]);
  const arrA = new Uint8Array(sigA);
  const arrB = new Uint8Array(sigB);
  // SHA-256 output is always 32 bytes, so lengths always match
  let diff = 0;
  for (let i = 0; i < arrA.length; i++) diff |= arrA[i] ^ arrB[i];
  return diff === 0;
}

// ── Confirmation email ────────────────────────────────────────────────────────

async function sendConfirmationEmail(opts: {
  to:            string;
  tier:          string;
  transactionId: string;
  amountILS:     number;
  frontendUrl:   string;
  resendApiKey:  string;
}): Promise<void> {
  const { to, tier, transactionId, amountILS, frontendUrl, resendApiKey } = opts;
  const tierLabel = tier === "enterprise" ? "אנטרפרייז" : "מקצועי";
  const subject   = `ReviewHub — תשלום אושר ✓ (${amountILS}₪)`;
  const bodyText  = `התשלום של ₪${amountILS} עבור תוכנית ${tierLabel} אושר. מספר עסקה: ${transactionId}.`;

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
      ✓ תשלום אושר!
    </div>
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:800;color:#fff;">${bodyText}</h1>
    <p style="margin:0;font-size:13px;color:#6b7280;">מזהה עסקה: <span style="font-family:monospace;color:#60a5fa;">${transactionId}</span></p>
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
      log("Email failed", { status: res.status, body: await res.text() });
    }
  } catch (e) {
    log("Email exception", { error: String(e) });
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {

  // ── Step 1: Method guard ────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GROW_MAKE_SECRET          = Deno.env.get("GROW_MAKE_SECRET") ?? "";
  const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");
  const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") ?? "https://reviewhub.co.il";

  // ── Step 2: Secret validation ───────────────────────────────────────────────
  if (!GROW_MAKE_SECRET) {
    log("FATAL: GROW_MAKE_SECRET not set in edge function secrets");
    return new Response("Service misconfigured", { status: 503 });
  }

  const incomingSecret = req.headers.get("x-webhook-secret") ?? "";
  const secretOk = await secureEqual(incomingSecret, GROW_MAKE_SECRET);
  if (!secretOk) {
    log("AUTH_FAIL", { headerPresent: incomingSecret.length > 0 });
    return new Response("Forbidden", { status: 403 });
  }

  // ── Step 3: Parse JSON ──────────────────────────────────────────────────────
  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any>;
  try {
    const raw = await req.text();
    payload   = JSON.parse(raw);
  } catch {
    log("PARSE_ERROR: invalid JSON body");
    return new Response("Bad request — invalid JSON", { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Step 4: Log raw payload IMMEDIATELY ────────────────────────────────────
  // Logged before any processing so no delivery is ever invisible.
  const { data: logRow, error: logInsertErr } = await admin
    .from("payment_webhook_logs")
    .insert({
      source:            SOURCE,
      transaction_id:    payload.transaction_id ?? null,
      order_id:          payload.order_id       ?? null,
      user_id:           payload.user_id        ?? null,
      amount_ils:        payload.amount != null ? parseFloat(String(payload.amount)) : null,
      status_raw:        payload.status         ?? null,
      raw_payload:       payload,
      processing_status: "pending",
    })
    .select("id")
    .single();

  const logId: string | null = logRow?.id ?? null;

  if (logInsertErr) {
    log("LOG_WARN: failed to insert webhook log", { error: logInsertErr.message });
    // Non-fatal — continue processing
  } else {
    log("Logged", { logId, transaction_id: payload.transaction_id });
  }

  /** Updates the log row outcome. Silently skips if logId is null. */
  async function updateLog(
    status: string,
    errorMsg?: string
  ): Promise<void> {
    if (!logId) return;
    await admin
      .from("payment_webhook_logs")
      .update({
        processing_status: status,
        error_message:     errorMsg ?? null,
        processed_at:      new Date().toISOString(),
      })
      .eq("id", logId);
  }

  // ── Step 5: Extract fields ──────────────────────────────────────────────────
  const transactionId  = String(payload.transaction_id ?? "").trim();
  const orderId        = String(payload.order_id       ?? "").trim();
  const userId         = String(payload.user_id        ?? "").trim();
  const planId         = String(payload.plan_id        ?? "").trim();
  const statusRaw      = String(payload.status         ?? "").trim();
  const customerEmail  = String(payload.customer_email ?? "").trim();
  const amountRaw      = parseFloat(String(payload.amount ?? "0"));

  log("Extracted", { transactionId, orderId, userId, planId, status: statusRaw, amount: amountRaw });

  // ── Step 6: Required field presence check ───────────────────────────────────
  const missing: string[] = [];
  if (!transactionId)             missing.push("transaction_id");
  if (!orderId)                   missing.push("order_id");
  if (!userId)                    missing.push("user_id");
  if (!planId)                    missing.push("plan_id");
  if (!statusRaw)                 missing.push("status");
  if (isNaN(amountRaw))           missing.push("amount (not numeric)");

  if (missing.length > 0) {
    const msg = `Missing fields: ${missing.join(", ")}`;
    log("FIELD_FAIL", { missing });
    await updateLog("failed", msg);
    return new Response("OK — field validation failed", { status: 200 });
  }

  // ── Step 7: UUID format validation ─────────────────────────────────────────
  if (!UUID_RE.test(userId)) {
    const msg = `user_id is not a valid UUID: '${userId}'`;
    log("UUID_FAIL", { userId });
    await updateLog("failed", msg);
    return new Response("OK — invalid user_id format", { status: 200 });
  }

  // ── Step 8: Status whitelist ────────────────────────────────────────────────
  // Only proceed on confirmed successful payment status.
  // pending / failed / cancelled / refunded / chargeback → log and return 200.
  if (!GROW_SUCCESS_STATUSES.has(statusRaw.toLowerCase())) {
    log("STATUS_SKIP", { status: statusRaw });
    await updateLog("status_skipped", `'${statusRaw}' not in success whitelist`);
    return new Response("OK — non-success status", { status: 200 });
  }

  // ── Step 9: Plan validation ─────────────────────────────────────────────────
  const plan = PLAN_META[planId];
  if (!plan) {
    const msg = `Unknown plan_id: '${planId}'`;
    log("PLAN_FAIL", { planId });
    await updateLog("failed", msg);
    return new Response("OK — unknown plan_id", { status: 200 });
  }

  // ── Step 10: Amount floor check ─────────────────────────────────────────────
  // Rejects clearly invalid amounts (e.g. ₪0, negative, test values).
  // ₪10 floor covers all plan prices after coupon discounts (min real charge ≈ ₪15).
  if (amountRaw < MIN_AMOUNT_ILS) {
    const msg = `Amount ₪${amountRaw} is below minimum ₪${MIN_AMOUNT_ILS}`;
    log("AMOUNT_FAIL", { amountRaw, floor: MIN_AMOUNT_ILS });
    await updateLog("amount_rejected", msg);
    return new Response("OK — amount below minimum", { status: 200 });
  }

  // ── Step 11: Look up business ───────────────────────────────────────────────
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, subscription_tier, subscription_expires_at")
    .eq("owner_id", userId)
    .maybeSingle();

  if (bizErr || !biz) {
    const msg = `Business not found for user ${userId}: ${bizErr?.message ?? "no row"}`;
    log("BIZ_FAIL", { userId, error: bizErr?.message });
    await updateLog("failed", msg);
    return new Response("OK — business not found", { status: 200 });
  }

  log("Business found", { businessId: biz.id, tier: biz.subscription_tier });

  // ── Step 12: Idempotency INSERT — MUST happen before subscription UPDATE ────
  //
  // This is the critical race-condition guard. The processed_payment_transactions
  // table has a PRIMARY KEY on transaction_id. Only one of any concurrent deliveries
  // can INSERT successfully. The loser gets error code "23505" and returns 200.
  // The winner proceeds to update the subscription in step 13.
  //
  // DO NOT move this insert after the businesses UPDATE.
  const { error: idempErr } = await admin
    .from("processed_payment_transactions")
    .insert({
      transaction_id: transactionId,
      source:         SOURCE,
      user_id:        userId,
      business_id:    biz.id,
      plan_id:        planId,
      amount_ils:     amountRaw,
      webhook_log_id: logId,
    });

  if (idempErr) {
    if (idempErr.code === "23505") {
      // Duplicate key → already processed by a previous delivery
      log("DUPLICATE_SKIP", { transactionId });
      await updateLog("duplicate_skipped", "transaction_id already in processed_payment_transactions");
      return new Response("OK — duplicate, already processed", { status: 200 });
    }
    // Any other DB error → return 500 so Make retries
    const msg = `Idempotency insert failed: ${idempErr.message}`;
    log("IDEMP_FAIL", { error: idempErr.message, code: idempErr.code });
    await updateLog("failed", msg);
    return new Response("Internal error — idempotency insert failed", { status: 500 });
  }

  log("Idempotency row inserted", { transactionId });

  // ── Step 13: Update subscription ────────────────────────────────────────────
  // Compute new expiry: extend from current expiry if future, else from now.
  const now           = new Date();
  const extendDays    = plan.billingCycle === "annual" ? ANNUAL_DAYS : MONTHLY_DAYS;
  const currentExpiry = biz.subscription_expires_at
    ? new Date(biz.subscription_expires_at)
    : now;
  const baseDate  = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);

  const { error: updateErr } = await admin
    .from("businesses")
    .update({
      subscription_tier:       plan.tier,
      subscription_expires_at: newExpiry.toISOString(),
      grow_transaction_id:     transactionId,
      grow_order_id:           orderId,
    })
    .eq("id", biz.id);

  if (updateErr) {
    const msg = `Subscription update failed: ${updateErr.message}`;
    log("UPDATE_FAIL", { businessId: biz.id, error: updateErr.message });

    // ROLLBACK: delete the idempotency row so Make can retry successfully.
    // If this delete also fails, the transaction is orphaned — a human must
    // manually re-process by deleting the row from processed_payment_transactions.
    const { error: rollbackErr } = await admin
      .from("processed_payment_transactions")
      .delete()
      .eq("transaction_id", transactionId);

    if (rollbackErr) {
      log("ROLLBACK_FAIL — MANUAL INTERVENTION REQUIRED", {
        transactionId,
        userId,
        businessId: biz.id,
        rollbackError: rollbackErr.message,
      });
    } else {
      log("Idempotency row rolled back", { transactionId });
    }

    await updateLog("failed", msg);
    return new Response("Internal error — subscription update failed", { status: 500 });
  }

  log("Subscription activated", {
    businessId: biz.id,
    tier:        plan.tier,
    expiresAt:   newExpiry.toISOString(),
    transactionId,
    amount:      amountRaw,
  });

  // ── Step 14: Mark log done ──────────────────────────────────────────────────
  await updateLog("done");

  // ── Step 15: Confirmation email (async, non-blocking, best-effort) ──────────
  if (RESEND_API_KEY) {
    const emailTarget = customerEmail || null;
    if (emailTarget) {
      sendConfirmationEmail({
        to:            emailTarget,
        tier:          plan.tier,
        transactionId,
        amountILS:     amountRaw,
        frontendUrl:   FRONTEND_URL,
        resendApiKey:  RESEND_API_KEY,
      }).catch((e) => log("Email failed", { error: String(e) }));
    } else {
      // No email in payload — look up from auth (non-blocking)
      admin.auth.admin.getUserById(userId)
        .then(({ data }) => {
          const email = data?.user?.email;
          if (email && RESEND_API_KEY) {
            return sendConfirmationEmail({
              to:            email,
              tier:          plan.tier,
              transactionId,
              amountILS:     amountRaw,
              frontendUrl:   FRONTEND_URL,
              resendApiKey:  RESEND_API_KEY!,
            });
          }
        })
        .catch((e) => log("Email auth-lookup failed", { error: String(e) }));
    }
  }

  // ── Step 16: Return 200 ─────────────────────────────────────────────────────
  log("COMPLETE", { transactionId, userId, businessId: biz.id, tier: plan.tier, amount: amountRaw });

  return new Response(
    JSON.stringify({ received: true, transaction_id: transactionId }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

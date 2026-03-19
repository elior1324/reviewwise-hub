/**
 * create-checkout — Edge Function
 *
 * Creates a hyp (YaadPay / iCom) payment page URL for subscription checkout.
 *
 * Flow:
 *   1. Frontend POSTs { plan: "pro"|"enterprise", billing_cycle: "monthly"|"annual" }
 *   2. This function builds the hyp checkout URL with HMAC hash
 *   3. Returns { checkoutUrl } to the frontend
 *   4. Frontend redirects the user to checkoutUrl
 *   5. User completes payment on hyp's hosted page
 *   6. hyp POSTs IPN to our hyp-webhook function
 *   7. hyp-webhook activates the subscription
 *
 * First month free: we use hyp J4 tokenisation (Amount=0, Tash=1, J4Id=2).
 * The card is saved and the trial starts. After 30 days hyp auto-charges the
 * saved card (recurring billing must be configured in the hyp portal).
 *
 * Required Edge Function secrets:
 *   HYP_TERMINAL_NUMBER  — hyp Masof (terminal ID)
 *   HYP_API_KEY          — hyp PassP (used in HMAC hash)
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   FRONTEND_URL         — public app URL (for redirect URLs)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── Plan price map (amounts in grush = ILS × 100) ─────────────────────────────
const PLAN_PRICES: Record<string, { amountGrosh: number; priceId: string; label: string }> = {
  "pro_monthly":        { amountGrosh: 18900, priceId: "plan_pro_monthly",        label: "Pro חודשי"        },
  "pro_annual":         { amountGrosh: 181400, priceId: "plan_pro_annual",         label: "Pro שנתי"         },
  "enterprise_monthly": { amountGrosh: 47900, priceId: "plan_enterprise_monthly", label: "Enterprise חודשי" },
  "enterprise_annual":  { amountGrosh: 459800, priceId: "plan_enterprise_annual",  label: "Enterprise שנתי"  },
};

// ── HMAC-SHA256 helper ─────────────────────────────────────────────────────────
async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON  = Deno.env.get("SUPABASE_ANON_KEY")!;
    const HYP_TERMINAL   = Deno.env.get("HYP_TERMINAL_NUMBER") ?? "";
    const HYP_PASSP      = Deno.env.get("HYP_API_KEY") ?? "";
    const FRONTEND_URL   = Deno.env.get("FRONTEND_URL") ?? "https://reviewhub.co.il";

    if (!HYP_TERMINAL || !HYP_PASSP) {
      return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Authenticate user ────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── Parse request body ───────────────────────────────────────────────────
    const { plan, billing_cycle } = await req.json();
    const planKey = `${plan}_${billing_cycle}`;
    const planMeta = PLAN_PRICES[planKey];
    if (!planMeta) {
      return new Response(JSON.stringify({ error: "Invalid plan or billing cycle" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── Build hyp checkout parameters ────────────────────────────────────────
    // We use J4 tokenisation (Amount=0) for the free-first-month trial.
    // hyp will save the card and auto-charge after the trial period ends
    // according to the recurring schedule configured in the hyp portal.
    const orderId  = `${user.id.slice(0, 8)}-${Date.now()}`;
    const currency = "1"; // 1 = ILS

    // J4Id=2: Tokenise + set up recurring. Amount=0 = no charge at signup.
    const params: Record<string, string> = {
      Masof:      HYP_TERMINAL,
      Action:     "Token",
      Amount:     "0",              // ₪0 for trial (card saved, not charged)
      Tash:       "1",
      Currency:   currency,
      Info:       `ReviewHub ${planMeta.label}`,
      Order:      orderId,
      Fild1:      plan,             // tier — read by hyp-webhook
      Fild2:      user.id,          // userId — read by hyp-webhook
      Fild3:      planMeta.priceId, // priceId — read by hyp-webhook
      J4Id:       "2",              // recurring tokenisation
      SuccessUrl: `${FRONTEND_URL}/business/dashboard?payment=success`,
      ErrorUrl:   `${FRONTEND_URL}/business/pricing?payment=error`,
      CancelUrl:  `${FRONTEND_URL}/business/pricing`,
    };

    // ── Compute HMAC hash (hyp Hesh) ─────────────────────────────────────────
    // hyp hash formula: HMAC-SHA256 of sorted param values joined with '|',
    // using PassP as the key. Parameters included: Masof, Amount, Currency, Tash.
    const hashInput = [
      params.Masof,
      params.Amount,
      params.Currency,
      params.Tash,
      params.Order,
    ].join("|");
    params.Hesh = await hmacSha256Hex(hashInput, HYP_PASSP);

    // ── Build the checkout redirect URL ──────────────────────────────────────
    const queryString = new URLSearchParams(params).toString();
    const checkoutUrl = `https://icom.yaad.net/p/?${queryString}`;

    console.log(`[create-checkout] User ${user.id} → plan=${planKey} order=${orderId}`);

    return new Response(JSON.stringify({ checkoutUrl, orderId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[create-checkout] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

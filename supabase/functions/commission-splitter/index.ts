/**
 * commission-splitter — Real-Time Affiliate Commission Splitter
 *
 * Called when:
 *   A) A conversion is confirmed (webhook from payment provider)
 *   B) A lead_purchase is charged
 *   C) A pg_cron job processes pending conversions past hold_until
 *
 * Actions:
 *   POST body: { action: "process_conversion" | "charge_lead" | "batch_process", ... }
 *
 * process_conversion { conversion_id }
 *   → validates 72h hold, calls split_affiliate_commission(), marks paid
 *
 * charge_lead { lead_id, business_id }
 *   → deducts from business platform_balance, reveals contact info
 *
 * batch_process {}
 *   → processes ALL confirmed conversions past hold_until (cron call)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

type Action = "process_conversion" | "charge_lead" | "batch_process";

interface ConversionRow {
  id: string;
  status: string;
  hold_until: string;
  transaction_amount_ils: number;
  pool_share_ils: number;
  user_cashback_ils: number;
  reviewer_id: string | null;
  business_id: string;
  liability_shield_accepted: boolean;
}

// ─── Entry ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow cron OR authenticated users
  const cronSecret = Deno.env.get("CRON_SECRET");
  const incoming   = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const isCron     = cronSecret && incoming === cronSecret;
  const isAuth     = !!authHeader;

  if (!isCron && !isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body = batch_process */ }

  const action: Action = (body.action as Action) ?? "batch_process";

  // ── process_conversion ────────────────────────────────────────────────────
  if (action === "process_conversion") {
    const convId = body.conversion_id as string;
    if (!convId) return Response.json({ error: "conversion_id required" }, { status: 400 });

    const { data: conv, error: fetchErr } = await supabase
      .from("conversions")
      .select("*")
      .eq("id", convId)
      .single<ConversionRow>();

    if (fetchErr || !conv) {
      return Response.json({ error: "Conversion not found" }, { status: 404 });
    }

    if (!conv.liability_shield_accepted) {
      return Response.json({ error: "Liability shield not accepted" }, { status: 422 });
    }

    if (new Date(conv.hold_until) > new Date()) {
      const remainMs = new Date(conv.hold_until).getTime() - Date.now();
      return Response.json({
        message: "Still in 72h hold",
        hold_remaining_minutes: Math.ceil(remainMs / 60000),
      });
    }

    if (conv.status !== "confirmed") {
      return Response.json({ message: `Skip: status=${conv.status}` });
    }

    // Call DB function to credit vault
    const { data: splitResult, error: splitErr } = await supabase
      .rpc("split_affiliate_commission", { p_conversion_id: convId });

    if (splitErr) {
      console.error("[commission-splitter] split error:", splitErr);
      return Response.json({ error: "Split failed", detail: splitErr }, { status: 500 });
    }

    // Credit cashback to reviewer (record point_transaction)
    if (conv.reviewer_id && conv.user_cashback_ils > 0) {
      await supabase.from("point_transactions").insert({
        user_id:          conv.reviewer_id,
        transaction_type: "bonus",
        base_points:      Math.round(conv.user_cashback_ils * 10), // 10 pts per ₪1 cashback
        points:           Math.round(conv.user_cashback_ils * 10),
        status:           "active",
        description:      `קאשבק מרכישה — ₪${conv.user_cashback_ils.toFixed(2)}`,
      });
    }

    // Mark conversion as paid
    await supabase
      .from("conversions")
      .update({ status: "paid", cashback_paid_at: new Date().toISOString() })
      .eq("id", convId);

    return Response.json({
      message: "Conversion processed",
      split_result: splitResult,
      cashback_ils: conv.user_cashback_ils,
      pool_share_ils: conv.pool_share_ils,
    });
  }

  // ── charge_lead ───────────────────────────────────────────────────────────
  if (action === "charge_lead") {
    const leadId     = body.lead_id as string;
    const businessId = body.business_id as string;
    if (!leadId || !businessId) {
      return Response.json({ error: "lead_id and business_id required" }, { status: 400 });
    }

    const LEAD_FEE = 25.00; // ₪25 flat fee

    // Check business balance
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, platform_balance_ils")
      .eq("id", businessId)
      .single<{ id: string; platform_balance_ils: number }>();

    if (bizErr || !biz) {
      return Response.json({ error: "Business not found" }, { status: 404 });
    }

    if ((biz.platform_balance_ils ?? 0) < LEAD_FEE) {
      return Response.json({
        error: "Insufficient balance",
        balance: biz.platform_balance_ils,
        required: LEAD_FEE,
      }, { status: 402 });
    }

    // Deduct fee from balance
    const { error: deductErr } = await supabase
      .from("businesses")
      .update({ platform_balance_ils: biz.platform_balance_ils - LEAD_FEE })
      .eq("id", businessId);

    if (deductErr) {
      return Response.json({ error: "Deduct failed", detail: deductErr }, { status: 500 });
    }

    // Record purchase and reveal contact
    const { data: purchase, error: purchaseErr } = await supabase
      .from("lead_purchases")
      .upsert({
        business_id:         businessId,
        lead_id:             leadId,
        amount_ils:          LEAD_FEE,
        status:              "charged",
        contact_revealed_at: new Date().toISOString(),
        charged_at:          new Date().toISOString(),
      }, { onConflict: "business_id,lead_id" })
      .select("id")
      .single();

    if (purchaseErr) {
      // Refund on error
      await supabase
        .from("businesses")
        .update({ platform_balance_ils: biz.platform_balance_ils })
        .eq("id", businessId);
      return Response.json({ error: "Purchase record failed", detail: purchaseErr }, { status: 500 });
    }

    // Return full lead contact info
    const { data: lead } = await supabase
      .from("matchmaker_leads")
      .select("contact_name, contact_email, contact_phone, goals, interests, budget_range")
      .eq("id", leadId)
      .single();

    return Response.json({
      message:     "Lead purchased",
      purchase_id: purchase!.id,
      charged_ils: LEAD_FEE,
      contact:     lead,
    });
  }

  // ── batch_process (cron) ──────────────────────────────────────────────────
  if (action === "batch_process") {
    const { data: pending, error: fetchErr } = await supabase
      .from("conversions")
      .select("id")
      .eq("status", "confirmed")
      .lt("hold_until", new Date().toISOString())
      .eq("liability_shield_accepted", true)
      .limit(200);

    if (fetchErr) {
      return Response.json({ error: "Fetch failed", detail: fetchErr }, { status: 500 });
    }

    const results: { id: string; result: string }[] = [];

    for (const conv of (pending ?? [])) {
      const { data: r } = await supabase
        .rpc("split_affiliate_commission", { p_conversion_id: conv.id });
      results.push({ id: conv.id, result: r ?? "ok" });
      await supabase
        .from("conversions")
        .update({ status: "paid", pool_credited_at: new Date().toISOString() })
        .eq("id", conv.id)
        .eq("status", "confirmed");
    }

    // Also run point unlock
    await supabase.rpc("unlock_earned_points");

    console.log(`[commission-splitter] batch processed ${results.length} conversions`);

    return Response.json({
      processed: results.length,
      results,
    });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
});

/**
 * community-payout — Monthly Community Vault Distribution
 *
 * Triggered on the 1st of each month (pg_cron / Supabase Scheduler).
 * Also callable by admin with ?month_year=2026-03.
 *
 * Flow:
 *  1. Validate cron-secret header
 *  2. Determine target month (previous month by default)
 *  3. Call calculate_reviewer_payout() DB function
 *  4. Upsert reviewer_payouts rows
 *  5. Mark vault as 'distributed'
 *  6. Send summary email to admin
 *
 * Headers required:
 *   x-cron-secret: <CRON_SECRET env var>
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayoutRow {
  reviewer_id: string;
  reviewer_points: number;
  global_points: number;
  share_pct: number;
  estimated_payout_ils: number;
}

interface VaultRow {
  id: string;
  month_year: string;
  total_pool_ils: number;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const prevMonthYear = (): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7); // "YYYY-MM"
};

const sendAdminEmail = async (subject: string, body: string) => {
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "ReviewHub System <noreply@reviewshub.info>",
      to: ["admin@reviewshub.info"],
      subject,
      html: `<pre style="font-family:monospace;font-size:13px">${body}</pre>`,
    }),
  });
};

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = Deno.env.get("CRON_SECRET");
  const incoming   = req.headers.get("x-cron-secret");
  if (cronSecret && incoming !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const url        = new URL(req.url);
  const monthYear  = url.searchParams.get("month_year") ?? prevMonthYear();
  const dryRun     = url.searchParams.get("dry_run") === "true";

  console.log(`[community-payout] month=${monthYear} dry_run=${dryRun}`);

  // ── Fetch vault ───────────────────────────────────────────────────────────
  const { data: vaultRows, error: vaultErr } = await supabase
    .from("community_vault")
    .select("*")
    .eq("month_year", monthYear)
    .is("category", null)
    .single<VaultRow>();

  if (vaultErr || !vaultRows) {
    const msg = `Vault not found for ${monthYear}`;
    console.error(msg, vaultErr);
    return Response.json({ error: msg }, { status: 404 });
  }

  const vault = vaultRows;

  if (vault.status === "distributed") {
    return Response.json({ message: `Already distributed for ${monthYear}` });
  }

  if (vault.total_pool_ils <= 0) {
    return Response.json({ message: `Empty vault for ${monthYear}` });
  }

  // ── Mark vault as 'calculating' ────────────────────────────────────────────
  if (!dryRun) {
    await supabase
      .from("community_vault")
      .update({ status: "calculating" })
      .eq("id", vault.id);
  }

  // ── Call DB payout function ────────────────────────────────────────────────
  const { data: payoutData, error: calcErr } = await supabase
    .rpc("calculate_reviewer_payout", {
      p_month_year: monthYear,
      p_category: null,
    }) as { data: PayoutRow[] | null; error: any };

  if (calcErr || !payoutData) {
    console.error("[community-payout] calc error:", calcErr);
    await supabase
      .from("community_vault")
      .update({ status: "accumulating" })
      .eq("id", vault.id);
    return Response.json({ error: "Payout calculation failed", detail: calcErr }, { status: 500 });
  }

  console.log(`[community-payout] ${payoutData.length} reviewers to pay`);

  // ── Upsert reviewer_payouts ────────────────────────────────────────────────
  if (!dryRun && payoutData.length > 0) {
    const rows = payoutData.map((p) => ({
      reviewer_id:       p.reviewer_id,
      vault_id:          vault.id,
      reviewer_points:   p.reviewer_points,
      global_points:     p.global_points,
      payout_amount_ils: p.estimated_payout_ils,
      status:            "pending",
    }));

    const { error: insertErr } = await supabase
      .from("reviewer_payouts")
      .upsert(rows, { onConflict: "reviewer_id,vault_id" });

    if (insertErr) {
      console.error("[community-payout] insert error:", insertErr);
      return Response.json({ error: "Failed to insert payouts", detail: insertErr }, { status: 500 });
    }

    // ── Mark vault distributed ───────────────────────────────────────────────
    await supabase
      .from("community_vault")
      .update({
        status:             "distributed",
        distributed_ils:    vault.total_pool_ils,
        participant_count:  payoutData.length,
        distribution_date:  new Date().toISOString(),
      })
      .eq("id", vault.id);
  }

  // ── Summary email ─────────────────────────────────────────────────────────
  const totalPaidOut = payoutData.reduce((s, p) => s + p.estimated_payout_ils, 0);
  const topLine = payoutData
    .slice(0, 5)
    .map((p, i) => `  ${i + 1}. ${p.reviewer_id.slice(0, 8)}… → ₪${p.estimated_payout_ils.toFixed(2)} (${p.reviewer_points} pts)`)
    .join("\n");

  const summary = [
    `Month: ${monthYear}`,
    `Vault: ₪${vault.total_pool_ils.toFixed(2)}`,
    `Participants: ${payoutData.length}`,
    `Total paid out: ₪${totalPaidOut.toFixed(2)}`,
    `Dry run: ${dryRun}`,
    ``,
    `Top 5 earners:`,
    topLine,
  ].join("\n");

  await sendAdminEmail(`[ReviewHub] Community Payout ${monthYear} — ₪${totalPaidOut.toFixed(2)}`, summary);

  console.log("[community-payout] done.", summary);

  return Response.json({
    month_year:   monthYear,
    vault_total:  vault.total_pool_ils,
    participants: payoutData.length,
    total_paid:   totalPaidOut,
    dry_run:      dryRun,
    top_earners:  payoutData.slice(0, 3),
  });
});

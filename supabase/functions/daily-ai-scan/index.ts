/**
 * daily-ai-scan — Edge Function (Master Intelligence Cron)
 *
 * The central intelligence loop for ReviewHub. Runs daily (or on demand) and
 * orchestrates all AI analysis tasks in the correct order:
 *
 *   Phase 1 — Profile signals    (analyze-profiles)
 *     Computes velocity, trending, sentiment, quality for all stale profiles.
 *
 *   Phase 2 — Anomaly detection  (detect-review-anomalies)
 *     Scans businesses with recent review activity for suspicious patterns.
 *
 *   Phase 3 — Summary generation (generate-profile-summary)
 *     Regenerates AI summaries for profiles that have new reviews since their
 *     last summary, capped at SUMMARY_BATCH_PER_RUN per execution.
 *
 *   Phase 4 — Update ai_flags on businesses
 *     Reflects currently open anomaly flags back onto businesses.ai_flags for
 *     fast read access on profile pages.
 *
 * The scan is idempotent — safe to run multiple times. Each phase independently
 * guards against duplicate work via timestamp fields and "open" status checks.
 *
 * Security: requires CRON_SECRET Bearer token.
 *
 * Trigger: Set up a Supabase pg_cron job or an external scheduler to POST to
 *   this function with Authorization: Bearer <CRON_SECRET> daily at ~03:00.
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, CRON_SECRET
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders }  from "../_shared/cors.ts";

const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY    = Deno.env.get("LOVABLE_API_KEY") || "";
const CRON_SECRET    = Deno.env.get("CRON_SECRET") || "";

// How many profile summaries to generate per run (cost control)
const SUMMARY_BATCH_PER_RUN = 20;

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorised(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) ||
         auth === `Bearer ${SERVICE_KEY}`;
}

// ── Self-invoking sibling function calls ──────────────────────────────────────
// Rather than duplicating logic, daily-ai-scan calls its sibling Edge Functions
// via internal HTTP. The CRON_SECRET is forwarded so they accept the request.

async function callSibling(
  functionName: string,
  body: Record<string, unknown> = {},
): Promise<{ ok: boolean; data?: unknown }> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${CRON_SECRET || SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (err) {
    console.error(`[daily-ai-scan] Failed to call ${functionName}:`, err);
    return { ok: false };
  }
}

// ── Phase 4: Sync ai_flags from open anomaly flags ───────────────────────────

async function syncAiFlags(db: ReturnType<typeof createClient>): Promise<void> {
  // Get all businesses with at least one open flag
  const { data: flags } = await db.from("ai_anomaly_flags")
    .select("business_id, flag_type")
    .eq("status", "open");

  if (!flags || flags.length === 0) return;

  // Group by business
  const byBusiness = new Map<string, string[]>();
  for (const f of flags) {
    const existing = byBusiness.get(f.business_id) ?? [];
    if (!existing.includes(f.flag_type)) existing.push(f.flag_type);
    byBusiness.set(f.business_id, existing);
  }

  // Update in batches of 20
  const entries = [...byBusiness.entries()];
  for (let i = 0; i < entries.length; i += 20) {
    const batch = entries.slice(i, i + 20);
    await Promise.allSettled(batch.map(([bizId, flagTypes]) =>
      db.from("businesses").update({ ai_flags: flagTypes }).eq("id", bizId)
    ));
  }

  // Clear ai_flags for businesses that no longer have open flags
  // (resolved flags should be cleared)
  const flaggedIds = [...byBusiness.keys()];
  if (flaggedIds.length > 0) {
    await db.from("businesses")
      .update({ ai_flags: [] })
      .not("id", "in", `(${flaggedIds.map(id => `'${id}'`).join(",")})`)
      .neq("ai_flags", "[]");
  }
}

// ── Phase 3: Generate summaries for stale profiles ───────────────────────────

async function generateStaleSummaries(
  db: ReturnType<typeof createClient>,
): Promise<{ attempted: number; succeeded: number }> {
  if (!LOVABLE_KEY) return { attempted: 0, succeeded: 0 };

  // Find businesses where:
  //   a) ai_summary is null (never generated), OR
  //   b) the last review was after the last summary generation
  const { data: stale } = await db.rpc("get_businesses_needing_summary", {
    p_limit: SUMMARY_BATCH_PER_RUN,
  }).catch(async () => {
    // Fallback if the RPC doesn't exist: simple query for null summaries
    const { data } = await db.from("businesses")
      .select("id")
      .is("ai_summary", null)
      .limit(SUMMARY_BATCH_PER_RUN);
    return { data };
  });

  const targets = (stale ?? []).map((r: any) => r.id ?? r);
  let succeeded = 0;

  for (const bizId of targets) {
    const result = await callSibling("generate-profile-summary", {
      business_id: bizId,
      force: true,
    });
    if (result.ok) succeeded++;
  }

  return { attempted: targets.length, succeeded };
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAuthorised(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db        = createClient(SUPABASE_URL, SERVICE_KEY);
  const startedAt = Date.now();

  console.log("[daily-ai-scan] Starting intelligence scan...");

  const report: Record<string, unknown> = {
    started_at: new Date().toISOString(),
  };

  try {
    // ── Phase 1: Profile signals ────────────────────────────────────────────
    console.log("[daily-ai-scan] Phase 1 — Analyzing profile signals...");
    const p1 = await callSibling("analyze-profiles", { limit: 100 });
    report.phase1_profiles = p1.ok ? (p1.data as any) : { error: "failed" };

    // ── Phase 2: Anomaly detection ──────────────────────────────────────────
    console.log("[daily-ai-scan] Phase 2 — Detecting anomalies...");
    const p2 = await callSibling("detect-review-anomalies");
    report.phase2_anomalies = p2.ok ? (p2.data as any) : { error: "failed" };

    // ── Phase 3: Summary generation ─────────────────────────────────────────
    console.log("[daily-ai-scan] Phase 3 — Generating profile summaries...");
    const p3 = await generateStaleSummaries(db);
    report.phase3_summaries = p3;

    // ── Phase 4: Sync ai_flags to businesses table ──────────────────────────
    console.log("[daily-ai-scan] Phase 4 — Syncing anomaly flags...");
    await syncAiFlags(db);
    report.phase4_flags_synced = true;

    const durationMs = Date.now() - startedAt;
    report.duration_ms   = durationMs;
    report.completed_at  = new Date().toISOString();
    report.success       = true;

    // Log completion to audit trail
    await db.from("audit_logs").insert({
      event_type:  "ai_scan_completed",
      actor_type:  "ai",
      actor_id:    "daily-ai-scan",
      target_type: "platform",
      target_id:   "00000000-0000-0000-0000-000000000000",
      payload:     report,
    }).catch(() => {}); // non-blocking

    console.log(`[daily-ai-scan] Completed in ${durationMs}ms`);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    report.error      = String(err);
    report.success    = false;
    report.duration_ms = Date.now() - startedAt;
    console.error("[daily-ai-scan] Fatal error:", err);

    return new Response(JSON.stringify(report), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

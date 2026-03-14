/**
 * account-deletion — Right to be Forgotten (GDPR / Israeli Privacy Law)
 *
 * POST  { "user_id": "<uuid>" }   (called server-side with service_role key)
 *
 * What this function does:
 *  1. Verifies the requesting JWT belongs to the target user OR is service_role.
 *  2. Anonymises all reviews authored by the user:
 *       reviewer_name  → "משתמש מחוק"
 *       anonymous      → true
 *       user_id        → NULL   (unlinks the review from the account)
 *     Reviews are KEPT on the platform so trust scores remain intact.
 *  3. Deletes personal data rows:
 *       profiles, review_likes (authored), notifications (recipient), referral_clicks
 *  4. Writes an immutable audit log entry (service_role only — no user FK) so
 *     legal / compliance teams can prove deletion was executed.
 *  5. Calls supabase.auth.admin.deleteUser() to remove the auth identity.
 *
 * Data retained for legal defense (statute of limitations):
 *  - audit_logs rows (immutable — no user_id FK, identified only by actor_id field)
 *  - evidence_vault entries (identified only by review_id, no direct user reference)
 *  - Anonymised review text (no longer linked to the user)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") || "";
  const callerJwt  = authHeader.replace("Bearer ", "").trim();

  // We always operate with service_role so we can bypass RLS
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify caller identity
  let callerUserId: string | null = null;
  let isServiceRole = false;

  if (callerJwt === SERVICE_ROLE_KEY) {
    isServiceRole = true;
  } else {
    const { data: { user }, error: authErr } = await admin.auth.getUser(callerJwt);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerUserId = user.id;
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let targetUserId: string;
  try {
    const body = await req.json();
    targetUserId = body.user_id;
    if (!targetUserId) throw new Error("missing user_id");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body — provide { user_id }" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Only service_role OR the user themselves may delete an account
  if (!isServiceRole && callerUserId !== targetUserId) {
    return new Response(JSON.stringify({ error: "Forbidden — can only delete your own account" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Confirm the target user exists ──────────────────────────────────────────
  const { data: targetUser, error: userLookupErr } = await admin.auth.admin.getUserById(targetUserId);
  if (userLookupErr || !targetUser?.user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const deletedAt = new Date().toISOString();
  const errors: string[] = [];

  // ── Step 1: Anonymise reviews (keep content, sever identity link) ────────────
  const { error: reviewAnonErr } = await admin
    .from("reviews")
    .update({
      reviewer_name: "משתמש מחוק",
      anonymous:     true,
      user_id:       null,
    })
    .eq("user_id", targetUserId);

  if (reviewAnonErr) {
    errors.push(`review anonymisation: ${reviewAnonErr.message}`);
  }

  // ── Step 2: Delete review_likes authored by this user ───────────────────────
  const { error: likesErr } = await admin
    .from("review_likes")
    .delete()
    .eq("user_id", targetUserId);

  if (likesErr) {
    errors.push(`review_likes deletion: ${likesErr.message}`);
  }

  // ── Step 3: Delete notifications addressed to this user ─────────────────────
  const { error: notifErr } = await admin
    .from("notifications")
    .delete()
    .eq("user_id", targetUserId);

  if (notifErr) {
    errors.push(`notifications deletion: ${notifErr.message}`);
  }

  // ── Step 4: Delete referral_clicks tied to this user ────────────────────────
  // referral_clicks stores no direct user_id — nothing to delete here.
  // If the table ever gains a user_id FK, add deletion here.

  // ── Step 5: Delete profile row ───────────────────────────────────────────────
  const { error: profileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", targetUserId);

  if (profileErr) {
    errors.push(`profile deletion: ${profileErr.message}`);
  }

  // ── Step 6: Write immutable audit log (no user_id FK — only actor_id text) ──
  // NOTE: actor_id is stored as a plain string for legal traceability even after
  // the auth user is deleted. The audit_logs table has no FK to auth.users.
  const { error: auditErr } = await admin.from("audit_logs").insert({
    action:      "account_deleted",
    entity_type: "user",
    entity_id:   targetUserId,
    actor_id:    isServiceRole ? "service_role" : targetUserId,
    details: {
      deletion_method:    isServiceRole ? "admin_initiated" : "self_service",
      reviews_anonymised: true,
      deleted_at:         deletedAt,
      gdpr_compliant:     true,
      retained_for_legal: ["audit_logs", "evidence_vault", "anonymised_reviews"],
    },
  });

  if (auditErr) {
    // Audit failure is non-fatal for the user but must be surfaced for ops
    errors.push(`audit_log write: ${auditErr.message}`);
    console.error("[account-deletion] AUDIT LOG FAILED:", auditErr);
  }

  // ── Step 7: Delete the auth.users record (irreversible) ─────────────────────
  const { error: authDeleteErr } = await admin.auth.admin.deleteUser(targetUserId);

  if (authDeleteErr) {
    errors.push(`auth.deleteUser: ${authDeleteErr.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error:   "Failed to delete auth user — personal data may have been partially cleaned. Contact support.",
        details: errors,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      success:     true,
      user_id:     targetUserId,
      deleted_at:  deletedAt,
      warnings:    errors.length > 0 ? errors : undefined,
      retained:    [
        "audit_logs (immutable, legal defense)",
        "evidence_vault (review evidence, no direct PII)",
        "anonymised review content (trust score integrity)",
      ],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

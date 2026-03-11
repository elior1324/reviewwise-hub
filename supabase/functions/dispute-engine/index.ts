/**
 * dispute-engine — Edge Function
 *
 * Handles the full Evidence Management & Dispute Resolution lifecycle:
 *
 *   action: "open_dispute"        → business owner opens a dispute
 *   action: "submit_evidence"     → reviewer uploads proof of experience
 *   action: "resolve_dispute"     → admin resolves (uphold | remove | escalate)
 *   action: "check_timeouts"      → cron: auto-remove reviews past 72h with no proof
 *   action: "unlock_points"       → cron: unlock points for undisputed reviews ≥72h old
 *   action: "verify_token"        → validate an evidence submission token from email link
 *
 * Security:
 *   - open_dispute:    requires authenticated business owner of the relevant business
 *   - submit_evidence: requires valid dispute_token (no auth session needed — email flow)
 *   - resolve_dispute: requires admin role
 *   - check_timeouts:  requires admin role OR internal cron secret
 *   - unlock_points:   requires admin role OR internal cron secret
 *
 * Environment variables:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_ANON_KEY         — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   RESEND_API_KEY            — for transactional emails
 *   FRONTEND_URL              — e.g. https://reviewhub.co.il
 *   CRON_SECRET               — shared secret for cron-triggered calls
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── Constants ────────────────────────────────────────────────────────────────

const FROM_ADDRESS   = "ReviewHub <noreply@reviewshub.info>";
const REPLY_TO       = "legal@reviewshub.info";
const DISPUTE_WINDOW = 72 * 60 * 60 * 1000; // 72 hours in ms

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");
const FRONTEND_URL              = Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il";
const CRON_SECRET               = Deno.env.get("CRON_SECRET");

// ── Helpers ──────────────────────────────────────────────────────────────────

const jsonResp = (body: unknown, status = 200, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

const fail = (msg: string, status = 400, cors: Record<string, string>) =>
  jsonResp({ success: false, error: msg }, status, cors);

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[dispute-engine] RESEND_API_KEY not set — email not sent:", opts.subject);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:     FROM_ADDRESS,
      reply_to: REPLY_TO,
      to:       [opts.to],
      subject:  opts.subject,
      html:     opts.html,
      text:     opts.text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[dispute-engine] Resend error:", err);
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

function evidenceRequestEmail(opts: {
  reviewerEmail: string;
  businessName: string;
  evidenceUrl: string;
  expiresAt: string;
}): { subject: string; html: string; text: string } {
  const deadline = new Date(opts.expiresAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
  const subject  = `[ReviewHub] הביקורת שלך על ${opts.businessName} נמצאת בחקירה — נדרש אישור תוך 72 שעות`;

  const html = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;border-radius:12px 12px 0 0">
    <h1 style="color:white;margin:0;font-size:22px">ReviewHub</h1>
  </div>
  <div style="background:#f9f9fb;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
    <h2 style="color:#1a1a1a;font-size:18px;margin-top:0">הביקורת שלך נמצאת בחקירה</h2>
    <p>שלום,</p>
    <p>
      עסק <strong>${opts.businessName}</strong> פתח הליך חקירה רשמי לגבי ביקורת שפרסמת בפלטפורמה.
      לפי תנאי השימוש שלנו ועקרונות ה-Safe Harbor, אנו מחויבים לבצע בדיקה של הטענות.
    </p>
    <div style="background:#fff3cd;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:20px 0">
      <strong>⏰ דדליין: ${deadline}</strong>
      <p style="margin:8px 0 0">יש לך <strong>72 שעות</strong> להעלות הוכחת עסקה (קבלה, חשבונית, חוזה).</p>
    </div>
    <p>
      אם לא תספק הוכחה תוך המועד הנקוב, הביקורת עשויה להיות מוסרת מהפלטפורמה.
      אם תספק הוכחה תקפה, הביקורת תוחזר עם תג <strong>"מאומת משפטית"</strong>.
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${opts.evidenceUrl}"
         style="background:#6366f1;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
        📎 העלאת הוכחה עכשיו
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px">
      אם לא כתבת ביקורת על עסק זה, פנה אלינו מיד בכתובת
      <a href="mailto:legal@reviewshub.info">legal@reviewshub.info</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center">
      ReviewHub — פלטפורמת ביקורות אמינה לעסקים בישראל<br>
      זה מייל אוטומטי. אין להשיב ישירות. לפניות: legal@reviewshub.info
    </p>
  </div>
</div>`;

  const text = `הביקורת שלך על ${opts.businessName} נמצאת בחקירה.

דדליין: ${deadline}

יש לך 72 שעות להעלות הוכחת עסקה. לחץ כאן: ${opts.evidenceUrl}

אם לא כתבת ביקורת זו, פנה אלינו: legal@reviewshub.info`;

  return { subject, html, text };
}

function evidenceVerifiedEmail(opts: {
  reviewerEmail: string;
  businessName:  string;
}): { subject: string; html: string; text: string } {
  const subject = `[ReviewHub] הביקורת שלך על ${opts.businessName} אומתה ✓`;
  const html = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;border-radius:12px 12px 0 0">
    <h1 style="color:white;margin:0">ReviewHub — אימות הצליח ✓</h1>
  </div>
  <div style="background:#f9f9fb;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
    <p>שלום,</p>
    <p>
      הביקורת שלך על <strong>${opts.businessName}</strong> <strong>אומתה בהצלחה</strong>.
      ההוכחה שסיפקת נבדקה ואושרה, והביקורת הוחזרה לפלטפורמה עם תג
      <strong style="color:#10b981">✓ מאומת משפטית</strong>.
    </p>
    <p>
      בנוסף, הנקודות שהרווחת על הביקורת שוחררו לחשבונך.
    </p>
    <p style="color:#6b7280;font-size:13px">
      לפניות: <a href="mailto:legal@reviewshub.info">legal@reviewshub.info</a>
    </p>
  </div>
</div>`;
  const text = `הביקורת שלך על ${opts.businessName} אומתה ✓. היא הוחזרה עם תג "מאומת משפטית" והנקודות שוחררו.`;
  return { subject, html, text };
}

function adminNotifyEmail(opts: {
  reviewId:      string;
  businessName:  string;
  reviewerEmail: string;
  evidencePath:  string;
}): { subject: string; html: string; text: string } {
  const subject = `[Admin] ראיה הוגשה — ${opts.businessName}`;
  const adminUrl = `${FRONTEND_URL}/admin/disputes/${opts.reviewId}`;
  const html = `
<div style="font-family:monospace;padding:16px;background:#1e1e2e;color:#cdd6f4;border-radius:8px">
  <h2 style="color:#cba6f7">📋 Dispute Evidence Submitted</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 8px;color:#a6e3a1">Review ID:</td><td>${opts.reviewId}</td></tr>
    <tr><td style="padding:4px 8px;color:#a6e3a1">Business:</td><td>${opts.businessName}</td></tr>
    <tr><td style="padding:4px 8px;color:#a6e3a1">Reviewer:</td><td>${opts.reviewerEmail}</td></tr>
    <tr><td style="padding:4px 8px;color:#a6e3a1">Evidence:</td><td>${opts.evidencePath}</td></tr>
  </table>
  <br>
  <a href="${adminUrl}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
    Open Admin Panel →
  </a>
</div>`;
  const text = `Evidence submitted for review ${opts.reviewId} (${opts.businessName}). Admin URL: ${adminUrl}`;
  return { subject, html, text };
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, cors);
  }

  const { action } = body;
  if (!action || typeof action !== "string") {
    return fail("Missing required field: action", 400, cors);
  }

  // ── Service role client (all privileged DB operations) ──────────────────
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Auth helpers ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  const { data: { user } } = await userClient.auth.getUser();

  const requireAuth = () => {
    if (!user) throw new Error("AUTH_REQUIRED");
  };
  const requireAdmin = async () => {
    requireAuth();
    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw new Error("ADMIN_REQUIRED");
  };
  const requireCronOrAdmin = async () => {
    const cronSecret = req.headers.get("x-cron-secret");
    if (CRON_SECRET && cronSecret === CRON_SECRET) return; // cron call
    await requireAdmin();
  };

  const ip = req.headers.get("CF-Connecting-IP") ?? req.headers.get("X-Forwarded-For") ?? null;
  const ua = req.headers.get("User-Agent") ?? null;

  try {
    // ════════════════════════════════════════════════════════════════════════
    // ACTION: open_dispute
    // ════════════════════════════════════════════════════════════════════════
    if (action === "open_dispute") {
      requireAuth();

      const { reviewId, businessId, reason } = body as {
        reviewId: string; businessId: string; reason?: string;
      };
      if (!reviewId || !businessId) return fail("Missing reviewId or businessId", 400, cors);

      // Verify caller owns the business
      const { data: biz } = await admin
        .from("businesses")
        .select("id, name, owner_id")
        .eq("id", businessId)
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (!biz) return fail("Business not found or not owned by you", 403, cors);

      // Fetch the review + reviewer email
      const { data: review } = await admin
        .from("reviews")
        .select("id, user_id, is_disputed, dispute_status")
        .eq("id", reviewId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (!review) return fail("Review not found", 404, cors);
      if (review.is_disputed) return fail("A dispute is already open for this review", 409, cors);

      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("user_id", review.user_id)
        .maybeSingle();

      const reviewerEmail = profile?.email;
      if (!reviewerEmail) return fail("Could not retrieve reviewer email", 500, cors);

      const expiresAt = new Date(Date.now() + DISPUTE_WINDOW).toISOString();

      // Open dispute
      const { error: updateErr } = await admin
        .from("reviews")
        .update({
          is_disputed:       true,
          dispute_status:    "open",
          verification_expiry: expiresAt,
          points_locked:     true,
        })
        .eq("id", reviewId);

      if (updateErr) throw updateErr;

      // Create dispute token for email link
      const { data: tokenRow } = await admin
        .from("dispute_tokens")
        .insert({
          review_id:   reviewId,
          reviewer_id: review.user_id,
          expires_at:  expiresAt,
        })
        .select("token")
        .single();

      const evidenceUrl = `${FRONTEND_URL}/evidence/${tokenRow!.token}`;

      // Create defamation_complaint record
      const { data: complaint } = await admin
        .from("defamation_complaints")
        .insert({
          review_id:         reviewId,
          complainant_id:    user!.id,
          complainant_name:  biz.name,
          complainant_email: user!.email ?? "",
          complaint_type:    "defamation",
          description:       reason ?? "Dispute opened via business dashboard",
          status:            "under_review",
        })
        .select("id")
        .single();

      // Link complaint to review
      await admin
        .from("reviews")
        .update({ dispute_complaint_id: complaint?.id ?? null })
        .eq("id", reviewId);

      // Audit log
      await admin.rpc("record_audit_event", {
        p_entity_type: "review",
        p_entity_id:   reviewId,
        p_action:      "review.dispute_opened",
        p_actor_id:    user!.id,
        p_actor_role:  "business_owner",
        p_metadata:    { businessId, businessName: biz.name, expiresAt, complaintId: complaint?.id },
        p_ip_address:  ip,
        p_user_agent:  ua,
      });

      // Send email to reviewer
      const emailContent = evidenceRequestEmail({
        reviewerEmail,
        businessName: biz.name,
        evidenceUrl,
        expiresAt,
      });
      await sendEmail({ to: reviewerEmail, ...emailContent });

      // Audit: evidence requested
      await admin.rpc("record_audit_event", {
        p_entity_type: "review",
        p_entity_id:   reviewId,
        p_action:      "review.evidence_requested",
        p_actor_id:    null,
        p_actor_role:  "system",
        p_metadata:    { emailTo: reviewerEmail, expiresAt },
      });

      return jsonResp({ success: true, expiresAt, evidenceUrl }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: verify_token
    // Validate a dispute token from an email link (no auth required)
    // ════════════════════════════════════════════════════════════════════════
    if (action === "verify_token") {
      const { token } = body as { token: string };
      if (!token) return fail("Missing token", 400, cors);

      const { data: tokenRow } = await admin
        .from("dispute_tokens")
        .select("id, review_id, reviewer_id, expires_at, used")
        .eq("token", token)
        .maybeSingle();

      if (!tokenRow) return fail("Invalid token", 404, cors);
      if (tokenRow.used) return fail("This link has already been used", 410, cors);
      if (new Date(tokenRow.expires_at) < new Date()) {
        return fail("This link has expired", 410, cors);
      }

      // Fetch review and business info for the UI
      const { data: review } = await admin
        .from("reviews")
        .select("id, dispute_status, review_text, subject, businesses(name)")
        .eq("id", tokenRow.review_id)
        .maybeSingle();

      return jsonResp({
        success:     true,
        reviewId:    tokenRow.review_id,
        expiresAt:   tokenRow.expires_at,
        businessName: (review as any)?.businesses?.name ?? "",
        reviewSubject: (review as any)?.subject ?? "",
        disputeStatus: review?.dispute_status,
      }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: submit_evidence
    // Reviewer submits proof via token-based email link
    // ════════════════════════════════════════════════════════════════════════
    if (action === "submit_evidence") {
      const { token, filePath } = body as { token: string; filePath: string };
      if (!token || !filePath) return fail("Missing token or filePath", 400, cors);

      const { data: tokenRow } = await admin
        .from("dispute_tokens")
        .select("id, review_id, reviewer_id, expires_at, used")
        .eq("token", token)
        .maybeSingle();

      if (!tokenRow) return fail("Invalid token", 404, cors);
      if (tokenRow.used) return fail("This link has already been used", 410, cors);
      if (new Date(tokenRow.expires_at) < new Date()) {
        return fail("Submission deadline has passed", 410, cors);
      }

      // Mark evidence submitted
      const { error: updErr } = await admin
        .from("reviews")
        .update({
          evidence_submitted:  true,
          evidence_file_path:  filePath,
          dispute_status:      "evidence_submitted",
          verification_status: "purchase_verified",
        })
        .eq("id", tokenRow.review_id);

      if (updErr) throw updErr;

      // Mark token used
      await admin
        .from("dispute_tokens")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id", tokenRow.id);

      // Audit log
      await admin.rpc("record_audit_event", {
        p_entity_type: "review",
        p_entity_id:   tokenRow.review_id,
        p_action:      "review.evidence_submitted",
        p_actor_id:    tokenRow.reviewer_id,
        p_actor_role:  "reviewer",
        p_metadata:    { filePath, tokenId: tokenRow.id },
        p_ip_address:  ip,
        p_user_agent:  ua,
      });

      // Notify admin
      const { data: review } = await admin
        .from("reviews")
        .select("businesses(name), profiles(email)")
        .eq("id", tokenRow.review_id)
        .maybeSingle() as any;

      const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@reviewshub.info";
      const adminContent = adminNotifyEmail({
        reviewId:      tokenRow.review_id,
        businessName:  review?.businesses?.name ?? "—",
        reviewerEmail: review?.profiles?.email ?? "—",
        evidencePath:  filePath,
      });
      await sendEmail({ to: adminEmail, ...adminContent });

      return jsonResp({ success: true, message: "Evidence received — admin will review within 48 hours" }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: resolve_dispute
    // Admin resolves: uphold | remove | escalate
    // ════════════════════════════════════════════════════════════════════════
    if (action === "resolve_dispute") {
      await requireAdmin();

      const { reviewId, resolution, adminNote } = body as {
        reviewId: string;
        resolution: "upheld" | "removed" | "escalated";
        adminNote?: string;
      };

      if (!reviewId || !resolution) return fail("Missing reviewId or resolution", 400, cors);
      if (!["upheld", "removed", "escalated"].includes(resolution)) {
        return fail("Invalid resolution value", 400, cors);
      }

      const { data: review } = await admin
        .from("reviews")
        .select("id, user_id, dispute_complaint_id, businesses(name), profiles(email)")
        .eq("id", reviewId)
        .maybeSingle() as any;

      if (!review) return fail("Review not found", 404, cors);

      if (resolution === "upheld") {
        // Reinstate: add Legally Verified badge, unlock points
        await admin.from("reviews").update({
          is_disputed:         false,
          dispute_status:      "resolved_upheld",
          challenged:          true,
          challenge_upheld:    true,
          points_locked:       false,
          verification_status: "purchase_verified",
        }).eq("id", reviewId);

        // Update complaint status
        if (review.dispute_complaint_id) {
          await admin.from("defamation_complaints").update({
            status: "resolved_upheld",
            admin_notes: adminNote ?? null,
            resolution_date: new Date().toISOString(),
          }).eq("id", review.dispute_complaint_id);
        }

        // Write to public transparency log
        await admin.from("review_public_log").insert({
          review_id:      reviewId,
          complaint_id:   review.dispute_complaint_id,
          log_type:       "review_upheld",
          public_message: "ביקורת זו עמדה בהליך חקירה משפטית ואומתה על-ידי ReviewHub.",
        });

        // Email reviewer — evidence confirmed
        if (review.profiles?.email) {
          const emailContent = evidenceVerifiedEmail({
            reviewerEmail: review.profiles.email,
            businessName:  review.businesses?.name ?? "",
          });
          await sendEmail({ to: review.profiles.email, ...emailContent });
        }

        await admin.rpc("record_audit_event", {
          p_entity_type: "review",
          p_entity_id:   reviewId,
          p_action:      "review.reinstated",
          p_actor_id:    user!.id,
          p_actor_role:  "admin",
          p_metadata:    { adminNote, resolution },
        });

      } else if (resolution === "removed") {
        // No valid proof — remove the review
        await admin.from("reviews").update({
          dispute_status: "resolved_removed",
          challenged:     true,
          challenge_upheld: false,
        }).eq("id", reviewId);

        if (review.dispute_complaint_id) {
          await admin.from("defamation_complaints").update({
            status: "resolved_removed",
            admin_notes: adminNote ?? null,
            resolution_date: new Date().toISOString(),
          }).eq("id", review.dispute_complaint_id);
        }

        await admin.from("review_public_log").insert({
          review_id:      reviewId,
          complaint_id:   review.dispute_complaint_id,
          log_type:       "review_removed",
          public_message: "ביקורת זו הוסרה לאחר הליך בדיקה משפטית.",
        });

        // Soft-delete: flag as removed (hard delete omitted to preserve audit trail)
        await admin.from("reviews").update({ flagged: true, flag_reason: "Removed after dispute — no valid evidence" }).eq("id", reviewId);

        await admin.rpc("record_audit_event", {
          p_entity_type: "review",
          p_entity_id:   reviewId,
          p_action:      "review.removed_invalid_evidence",
          p_actor_id:    user!.id,
          p_actor_role:  "admin",
          p_metadata:    { adminNote, resolution },
        });

      } else if (resolution === "escalated") {
        // Business escalates even after proof → set escalated state (triggers LiabilityShield UI)
        await admin.from("reviews").update({
          dispute_status: "escalated",
        }).eq("id", reviewId);

        await admin.rpc("record_audit_event", {
          p_entity_type: "review",
          p_entity_id:   reviewId,
          p_action:      "review.escalated",
          p_actor_id:    user!.id,
          p_actor_role:  "admin",
          p_metadata:    { adminNote },
        });
      }

      return jsonResp({ success: true, resolution }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: check_timeouts
    // Cron: find disputes past 72h with no evidence → auto-remove
    // ════════════════════════════════════════════════════════════════════════
    if (action === "check_timeouts") {
      await requireCronOrAdmin();

      const { data: expired } = await admin
        .from("reviews")
        .select("id, user_id, dispute_complaint_id")
        .eq("is_disputed", true)
        .eq("evidence_submitted", false)
        .lt("verification_expiry", new Date().toISOString());

      let removed = 0;
      for (const review of (expired ?? [])) {
        await admin.from("reviews").update({
          dispute_status:   "resolved_removed",
          flagged:          true,
          flag_reason:      "Automatically removed — no evidence submitted within 72h",
          challenged:       true,
          challenge_upheld: false,
        }).eq("id", review.id);

        if (review.dispute_complaint_id) {
          await admin.from("defamation_complaints").update({
            status: "resolved_removed",
            admin_notes: "Auto-resolved by timeout sweep",
            resolution_date: new Date().toISOString(),
          }).eq("id", review.dispute_complaint_id);
        }

        await admin.rpc("record_audit_event", {
          p_entity_type: "review",
          p_entity_id:   review.id,
          p_action:      "review.removed_no_evidence",
          p_actor_id:    null,
          p_actor_role:  "system",
          p_metadata:    { reason: "72h deadline expired without evidence submission" },
        });

        removed++;
      }

      await admin.rpc("record_audit_event", {
        p_entity_type: "system",
        p_entity_id:   "00000000-0000-0000-0000-000000000000" as any,
        p_action:      "system.timeout_sweep",
        p_actor_role:  "system",
        p_metadata:    { removedCount: removed, sweepTime: new Date().toISOString() },
      });

      return jsonResp({ success: true, removed }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: unlock_points
    // Cron: unlock points for reviews ≥72h old with no active dispute
    // ════════════════════════════════════════════════════════════════════════
    if (action === "unlock_points") {
      await requireCronOrAdmin();

      const cutoff = new Date(Date.now() - DISPUTE_WINDOW).toISOString();

      const { data: unlockable, error: unlockErr } = await admin
        .from("reviews")
        .update({ points_locked: false })
        .eq("points_locked", true)
        .eq("is_disputed", false)
        .lt("created_at", cutoff)
        .select("id");

      if (unlockErr) throw unlockErr;

      const count = unlockable?.length ?? 0;

      if (count > 0) {
        await admin.rpc("record_audit_event", {
          p_entity_type: "system",
          p_entity_id:   "00000000-0000-0000-0000-000000000000" as any,
          p_action:      "review.points_unlocked",
          p_actor_role:  "system",
          p_metadata:    { unlockedCount: count, cutoff },
        });
      }

      return jsonResp({ success: true, unlocked: count }, 200, cors);
    }

    return fail(`Unknown action: ${action}`, 400, cors);

  } catch (err: any) {
    if (err.message === "AUTH_REQUIRED")  return fail("Authentication required", 401, cors);
    if (err.message === "ADMIN_REQUIRED") return fail("Admin role required", 403, cors);
    console.error("[dispute-engine] Unhandled error:", err);
    return fail("Internal server error", 500, cors);
  }
});

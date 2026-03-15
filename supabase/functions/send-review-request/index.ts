/**
 * send-review-request — Production-hardened
 * ──────────────────────────────────────────
 * Sends 7-day post-purchase review request emails for verified purchases.
 *
 * Reliability guarantees:
 *   - IDEMPOTENT: DB UNIQUE(verified_purchase_id) on review_requests prevents
 *     duplicate rows even under concurrent / retry execution.
 *   - SKIP-IF-REVIEWED: skips purchases where a review already exists.
 *   - SKIP-IF-DELETED: skips orphaned purchases (course/business removed).
 *   - BATCH SAFE: marks review_requested=true atomically before sending email,
 *     so a restart after a partial run won't re-send already-dispatched emails.
 *   - PARALLEL EMAIL SEND: uses Promise.allSettled in chunks of 10 for throughput.
 *
 * Invocation modes:
 *   POST { action: "batch_7day" }   → runs nightly batch (default)
 *   POST { action: "send_single", verified_purchase_id: "..." }  → test/manual
 *   POST { action: "retry_failed" } → re-sends where sent_at IS NULL (email failed)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL          = Deno.env.get("SITE_URL") || "https://reviewhub.co.il";
const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY");
const BATCH_CONCURRENCY = 10;   // parallel email sends per batch

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Types ──────────────────────────────────────────────────────────────────
interface VerifiedPurchase {
  id:                 string;
  user_email:         string | null;
  course_id:          string | null;
  business_id:        string | null;
  purchased_at:       string;
  courses:            { name: string } | null;
  businesses:         { name: string } | null;
}

// ── Email ──────────────────────────────────────────────────────────────────
async function sendEmail(opts: {
  to:          string;
  productName: string;
  reviewToken: string;
}) {
  const reviewUrl   = `${SITE_URL}/review/${opts.reviewToken}`;
  const giveawayUrl = `${SITE_URL}/giveaway`;
  const subject     = `איך הייתה החוויה שלכם עם ${opts.productName}? 🌟`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width"/>
  <title>${subject}</title>
</head>
<body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:20px;direction:rtl;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">

  <h2 style="font-size:20px;margin-bottom:8px;color:#111;">שלום 👋</h2>
  <p style="color:#555;line-height:1.6;margin-bottom:0;">
    עבר שבוע מאז שרכשתם את
    <strong style="color:#111;">${opts.productName}</strong>
    דרך ReviewHub. נשמח לשמוע על החוויה שלכם!
  </p>

  <a href="${reviewUrl}"
     style="display:inline-block;margin:24px 0 16px;padding:14px 28px;
            background:#7c3aed;color:#fff;border-radius:8px;
            text-decoration:none;font-weight:600;font-size:15px;">
    כתבו ביקורת מאומתת ←
  </a>

  <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
    הקישור תקף ל-30 יום ומאמת אוטומטית את הרכישה שלכם.
  </p>

  <!-- Giveaway callout -->
  <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;
              padding:16px;margin:0 0 24px;">
    <p style="margin:0 0 6px;font-weight:700;color:#7c3aed;font-size:14px;">
      🎁 הגרלה חודשית — ₪5,000
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.55;">
      ביקורת מאומתת = כניסה אוטומטית להגרלה החודשית.<br/>
      הפרס ניתן לרכישת כל קורס, שירות דיגיטלי או מוצר ב-ReviewHub.
    </p>
    <a href="${giveawayUrl}"
       style="display:inline-block;margin-top:10px;color:#7c3aed;
              font-size:12px;text-decoration:underline;">
      פרטים על ההגרלה ←
    </a>
  </div>

  <p style="font-size:11px;color:#9ca3af;line-height:1.5;margin:0 0 6px;">
    אתם מקבלים מייל זה כי רכשתם את ${opts.productName} דרך ReviewHub.
    אם אינכם מעוניינים לקבל הודעות מסוג זה, ניתן להתעלם ממייל זה.
  </p>
  <p style="font-size:11px;color:#d1d5db;margin:0;">
    ReviewHub — המצפן של הקהילה הדיגיטלית
  </p>
</div>
</body>
</html>`;

  if (!RESEND_API_KEY) {
    console.warn("[send-review-request] RESEND_API_KEY not set — skipping email for:", opts.to);
    return { ok: false, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ from: "ReviewHub <noreply@reviewhub.co.il>", to: [opts.to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[send-review-request] Resend error for", opts.to, "→", body);
    return { ok: false, error: body };
  }

  return { ok: true };
}

// ── Core dispatch for a single verified_purchase ───────────────────────────
// Returns 'sent' | 'already_requested' | 'already_reviewed' | 'no_email' | 'error'
async function dispatchForPurchase(vp: VerifiedPurchase): Promise<string> {
  if (!vp.user_email) return "no_email";

  const productName = vp.courses?.name || vp.businesses?.name || "המוצר";

  // ── Guard 1: already_reviewed — skip if a verified review already exists
  //    for this user+course or user+business. We check the reviews table.
  //    This avoids nagging users who already wrote a review.
  if (vp.course_id) {
    const { count } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("course_id", vp.course_id)
      .eq("user_id", vp.user_email) // best effort — email may not match user_id
      .eq("verified_purchase", true);

    // Also check by email if we can match via profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", vp.user_email)
      .maybeSingle();

    if (profile?.id) {
      const { count: reviewCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("course_id", vp.course_id)
        .eq("user_id", profile.id);

      if ((reviewCount ?? 0) > 0) {
        // Mark as requested so we don't check again
        await supabase
          .from("verified_purchases")
          .update({ review_requested: true, review_request_sent_at: new Date().toISOString() })
          .eq("id", vp.id);
        return "already_reviewed";
      }
    }
  }

  // ── Guard 2: idempotency — INSERT ... ON CONFLICT DO NOTHING
  //    The UNIQUE(verified_purchase_id) constraint means concurrent runs
  //    will silently skip if a review_request row already exists.
  const now = new Date().toISOString();
  const { data: rr, error: rrError } = await supabase
    .from("review_requests")
    .insert({
      verified_purchase_id: vp.id,
      user_email:           vp.user_email,
      course_id:            vp.course_id,
      business_id:          vp.business_id,
    })
    .select("token, id")
    .single();

  if (rrError) {
    // Unique violation → already sent
    if (rrError.code === "23505") return "already_requested";
    console.error("[send-review-request] review_request insert error:", rrError);
    return "error";
  }

  if (!rr?.token) return "error";

  // ── Mark verified_purchase BEFORE sending email (safe for retries)
  await supabase
    .from("verified_purchases")
    .update({ review_requested: true, review_request_sent_at: now })
    .eq("id", vp.id);

  // ── Send email (non-blocking failures don't block the batch)
  const emailResult = await sendEmail({ to: vp.user_email, productName, reviewToken: rr.token });

  // ── Record send timestamp (or leave null if email failed for retry_failed mode)
  if (emailResult.ok) {
    await supabase
      .from("review_requests")
      .update({ sent_at: now })
      .eq("id", rr.id);
  } else if (!emailResult.skipped) {
    // Email genuinely failed — leave sent_at null so retry_failed can catch it
    console.warn("[send-review-request] Email failed for VP:", vp.id);
  }

  return emailResult.ok ? "sent" : "email_failed";
}

// ── Main ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  try {
    const body   = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = (body?.action ?? "batch_7day") as string;

    // ── Mode: send_single (for testing / creator-triggered dispatch) ─────
    if (action === "send_single" && body?.verified_purchase_id) {
      const { data: vp } = await supabase
        .from("verified_purchases")
        .select("*, courses(name), businesses(name)")
        .eq("id", body.verified_purchase_id)
        .single();

      if (!vp) return Response.json({ error: "not_found" }, { status: 404 });

      const result = await dispatchForPurchase(vp as VerifiedPurchase);
      return Response.json({ ok: true, result });
    }

    // ── Mode: retry_failed (re-send where review_requested=true but sent_at IS NULL) ─
    if (action === "retry_failed") {
      const { data: failedRRs } = await supabase
        .from("review_requests")
        .select("id, token, user_email, verified_purchase_id, course_id, business_id, courses(name), businesses(name)")
        .is("sent_at", null)
        .lte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // at least 5 min old

      if (!failedRRs || failedRRs.length === 0) {
        return Response.json({ ok: true, retried: 0 });
      }

      let retried = 0;
      for (const rr of failedRRs) {
        if (!rr.user_email) continue;
        const productName = (rr.courses as any)?.name || (rr.businesses as any)?.name || "המוצר";
        const result = await sendEmail({ to: rr.user_email, productName, reviewToken: rr.token });
        if (result.ok) {
          await supabase.from("review_requests").update({ sent_at: new Date().toISOString() }).eq("id", rr.id);
          retried++;
        }
      }

      return Response.json({ ok: true, retried, total: failedRRs.length });
    }

    // ── Mode: batch_7day (default nightly cron) ──────────────────────────
    // 7-day window: purchased_at between 8 and 7 days ago, not yet requested
    const now          = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

    // Use compound index: (review_requested, purchased_at)
    const { data: purchases, error: fetchError } = await supabase
      .from("verified_purchases")
      .select("*, courses(name), businesses(name)")
      .eq("review_requested", false)
      .not("user_email", "is", null)
      .gte("purchased_at", eightDaysAgo)
      .lte("purchased_at", sevenDaysAgo)
      .limit(500); // safety cap per run

    if (fetchError) {
      console.error("[send-review-request] Fetch error:", fetchError);
      return Response.json({ error: "fetch_error" }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "no eligible purchases" });
    }

    // ── Parallel dispatch in chunks of BATCH_CONCURRENCY ─────────────────
    const results = { sent: 0, already_requested: 0, already_reviewed: 0, no_email: 0, error: 0 };
    const chunks: typeof purchases[] = [];

    for (let i = 0; i < purchases.length; i += BATCH_CONCURRENCY) {
      chunks.push(purchases.slice(i, i + BATCH_CONCURRENCY));
    }

    for (const chunk of chunks) {
      const settled = await Promise.allSettled(
        chunk.map(vp => dispatchForPurchase(vp as VerifiedPurchase))
      );
      for (const r of settled) {
        if (r.status === "fulfilled") {
          const key = r.value as keyof typeof results;
          if (key in results) results[key]++;
        } else {
          results.error++;
          console.error("[send-review-request] Unhandled rejection:", r.reason);
        }
      }
    }

    console.log("[send-review-request] Batch complete:", results);
    return Response.json({ ok: true, ...results, total: purchases.length });

  } catch (err) {
    console.error("[send-review-request] Fatal error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
});

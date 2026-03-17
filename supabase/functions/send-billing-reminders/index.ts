/**
 * send-billing-reminders — Edge Function
 *
 * Runs daily (via pg_cron or Supabase scheduled invocation).
 * Sends two types of Hebrew reminder emails:
 *
 *  TYPE 1 — "Trial ending" (7 days before billing starts):
 *    Sent to businesses whose trial_ends_at falls in 6–8 days (DB-based, no Stripe).
 *    "Your free month ends in one week. Billing starts on X."
 *    De-duped via `businesses.trial_reminder_sent_at`.
 *
 *  TYPE 2 — "Discount ending" (30 days before discounted_until):
 *    Sent only to coupon holders whose 90%-off period ends in ~30 days.
 *    "Your 90% discount ends on X. Full price starts after that."
 *    De-duped via `coupon_redemptions.phase2_reminder_sent_at`.
 *
 * Authentication: CRON_SECRET token required in Authorization header.
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FROM_ADDRESS = "ReviewHub <noreply@reviewshub.info>";
const RESEND_API   = "https://api.resend.com/emails";

function formatHebrewDate(d: Date): string {
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  resendApiKey: string;
}): Promise<boolean> {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    FROM_ADDRESS,
      to:      [opts.to],
      subject: opts.subject,
      html:    opts.html,
    }),
  });
  if (!res.ok) {
    console.error(`[send-billing-reminders] Resend error for ${opts.to}: ${await res.text()}`);
    return false;
  }
  return true;
}

// ── TYPE 1: Trial-ending email (7 days before billing) ───────────────────────
function buildTrialEndingEmail(opts: {
  businessName: string;
  billingStartsAt: Date;
  hasCouponDiscount: boolean;
  couponDiscountPct?: number;
  couponDurationMonths?: number;
}): string {
  const billingStr   = formatHebrewDate(opts.billingStartsAt);
  const discountNote = opts.hasCouponDiscount
    ? `<p style="color:#92400e;font-size:14px;line-height:1.7;margin:0 0 20px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;">
        ✨ <strong>יש לך הנחה מיוחדת!</strong> כיחסנו הכרת תודה בגין קופון הבטא שלך, תהנה מ-<strong>${opts.couponDiscountPct}% הנחה</strong> במשך ${opts.couponDurationMonths} חודשים לאחר סיום הניסיון.
      </p>`
    : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"/><title>תזכורת — החיוב מתחיל בעוד שבוע</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#0f172a;padding:32px 40px;text-align:center;">
    <h1 style="color:#22c55e;margin:0;font-size:28px;font-weight:700;">ReviewHub</h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">מנוע הביקורות החכם לעסקים</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">החודש החינמי שלך מסתיים בעוד שבוע ⏰</h2>
    <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
      שלום,<br/>
      תקופת הניסיון החינמית של <strong style="color:#1e293b;">${opts.businessName}</strong> ב-ReviewHub מסתיימת בעוד כשבוע.
      החיוב הראשון יתבצע אוטומטית בתאריך:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:#f0fdf4;border:2px solid #22c55e;border-radius:10px;padding:20px;text-align:center;">
        <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;letter-spacing:1px;">תאריך תחילת חיוב</p>
        <p style="margin:8px 0 0;color:#166534;font-size:26px;font-weight:700;">${billingStr}</p>
      </td></tr>
    </table>
    ${discountNote}
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
      אין צורך בפעולה — המנוי יחודש אוטומטית. אם תרצה לשנות או לבטל, ניתן לעשות זאת בקלות מלוח הבקרה לפני ${billingStr}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="https://reviewshub.info/business/dashboard" style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;">
          לניהול המנוי שלי
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">
      לשאלות: <a href="mailto:support@reviewshub.info" style="color:#22c55e;text-decoration:none;">support@reviewshub.info</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── TYPE 2: Discount-ending email (30 days before full price) ─────────────────
function buildDiscountEndingEmail(opts: {
  businessName: string;
  discountPct: number;
  fullPriceStartsAt: Date;
}): string {
  const dateStr = formatHebrewDate(opts.fullPriceStartsAt);

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"/><title>תזכורת — ההנחה מסתיימת בקרוב</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#0f172a;padding:32px 40px;text-align:center;">
    <h1 style="color:#22c55e;margin:0;font-size:28px;font-weight:700;">ReviewHub</h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">מנוע הביקורות החכם לעסקים</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">ההנחה שלך מסתיימת בקרוב 📅</h2>
    <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
      שלום,<br/>
      ההנחה של <strong>${opts.discountPct}%</strong> עבור <strong style="color:#1e293b;">${opts.businessName}</strong> מסתיימת בתאריך:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="background:#fef2f2;border:2px solid #f87171;border-radius:10px;padding:20px;text-align:center;">
        <p style="margin:0;color:#b91c1c;font-size:13px;font-weight:600;letter-spacing:1px;">תאריך תחילת מחיר רגיל</p>
        <p style="margin:8px 0 0;color:#7f1d1d;font-size:26px;font-weight:700;">${dateStr}</p>
      </td></tr>
    </table>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
      לאחר ${dateStr} תחויב במחיר הרגיל. אין צורך בפעולה — המנוי ימשיך אוטומטית. ניתן לשנות תוכנית בכל עת מלוח הבקרה.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="https://reviewshub.info/business/dashboard" style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;">
          לניהול המנוי שלי
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">
      לשאלות: <a href="mailto:support@reviewshub.info" style="color:#22c55e;text-decoration:none;">support@reviewshub.info</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (CRON_SECRET) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn("[send-billing-reminders] Unauthorized");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  } else {
    console.warn("[send-billing-reminders] CRON_SECRET not set — running without auth guard");
  }

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now      = new Date();
  let sentCount  = 0;
  const errors: string[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // TYPE 1 — 7-day trial-ending reminder (DB-based, no external payment API)
  // Query businesses whose trial_ends_at falls 6–8 days from now and have not
  // yet received the reminder (trial_reminder_sent_at IS NULL).
  // ─────────────────────────────────────────────────────────────────────────
  {
    const trialWindowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const trialWindowEnd   = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const { data: trialDue, error: e1 } = await supabase
      .from("businesses")
      .select("id, name, owner_id, trial_ends_at")
      .gte("trial_ends_at", trialWindowStart.toISOString())
      .lte("trial_ends_at", trialWindowEnd.toISOString())
      .is("trial_reminder_sent_at", null);

    if (e1) {
      errors.push(`Trial fetch error: ${e1.message}`);
    } else if (trialDue && trialDue.length > 0) {
      for (const business of trialDue) {
        const { data: userData } = await supabase.auth.admin.getUserById(business.owner_id);
        const email = userData?.user?.email;
        if (!email) { errors.push(`No email for user ${business.owner_id}`); continue; }

        const trialEndDate = new Date(business.trial_ends_at!);

        // Check if this business has a coupon discount for months 2–3
        const { data: couponRed } = await supabase
          .from("coupon_redemptions")
          .select("discounted_until, coupons ( phase2_discount_percent, phase2_duration_months )")
          .eq("user_id", business.owner_id)
          .not("discounted_until", "is", null)
          .maybeSingle();

        // deno-lint-ignore no-explicit-any
        const couponInfo  = (couponRed as any)?.coupons ?? null;
        const hasCoupon   = !!couponInfo?.phase2_discount_percent;
        const discountPct = couponInfo?.phase2_discount_percent as number | undefined;
        const discountMo  = couponInfo?.phase2_duration_months  as number | undefined;

        const html = buildTrialEndingEmail({
          businessName:         business.name,
          billingStartsAt:      trialEndDate,
          hasCouponDiscount:    hasCoupon,
          couponDiscountPct:    discountPct,
          couponDurationMonths: discountMo,
        });

        const ok = await sendEmail({
          to:           email,
          subject:      `ReviewHub — החיוב מתחיל בעוד שבוע (${formatHebrewDate(trialEndDate)}) ⏰`,
          html,
          resendApiKey: RESEND_API_KEY,
        });

        if (ok) {
          await supabase
            .from("businesses")
            .update({ trial_reminder_sent_at: now.toISOString() })
            .eq("id", business.id);
          sentCount++;
          console.log(`[send-billing-reminders] ✓ Trial reminder → ${email} (${business.name})`);
        } else {
          errors.push(`Trial reminder failed for ${email}`);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TYPE 2 — 30-day discount-ending reminder for coupon holders (phase2 → full price)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const windowStart = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);

    const { data: phase2Due, error: e2 } = await supabase
      .from("coupon_redemptions")
      .select(`
        id, discounted_until, user_id,
        businesses ( name ),
        coupons ( phase2_discount_percent )
      `)
      .gte("discounted_until", windowStart.toISOString())
      .lte("discounted_until", windowEnd.toISOString())
      .is("phase2_reminder_sent_at", null)
      .not("discounted_until", "is", null);

    if (e2) {
      errors.push(`Phase-2 fetch error: ${e2.message}`);
    } else if (phase2Due && phase2Due.length > 0) {
      for (const r of phase2Due) {
        const { data: userData } = await supabase.auth.admin.getUserById(r.user_id);
        const email = userData?.user?.email;
        if (!email) { errors.push(`No email for user ${r.user_id}`); continue; }

        // deno-lint-ignore no-explicit-any
        const discountPct  = (r as any).coupons?.phase2_discount_percent as number ?? 90;
        // deno-lint-ignore no-explicit-any
        const businessName = (r as any).businesses?.name ?? "העסק שלך";
        const fullPrice    = new Date(r.discounted_until!);

        const html = buildDiscountEndingEmail({ businessName, discountPct, fullPriceStartsAt: fullPrice });
        const ok   = await sendEmail({
          to:           email,
          subject:      `ReviewHub — ההנחה של ${discountPct}% מסתיימת ב-${formatHebrewDate(fullPrice)} 📅`,
          html,
          resendApiKey: RESEND_API_KEY,
        });

        if (ok) {
          await supabase
            .from("coupon_redemptions")
            .update({ phase2_reminder_sent_at: now.toISOString() })
            .eq("id", r.id);
          sentCount++;
          console.log(`[send-billing-reminders] ✓ Discount-end reminder → ${email}`);
        } else {
          errors.push(`Discount-end reminder failed for ${email}`);
        }
      }
    }
  }

  if (sentCount === 0 && errors.length === 0) {
    console.log("[send-billing-reminders] No reminders due today");
  }

  return new Response(JSON.stringify({
    sent:    sentCount,
    errors:  errors.length > 0 ? errors : undefined,
    message: `נשלחו ${sentCount} תזכורות${errors.length > 0 ? `, ${errors.length} שגיאות` : ""}`,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
});

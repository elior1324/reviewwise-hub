/**
 * send-billing-reminders — Edge Function
 *
 * Runs daily (via pg_cron or Supabase scheduled invocation).
 * Finds all coupon_redemptions where billing_starts_at is
 * 28–32 days from now AND reminder_sent_at IS NULL,
 * then sends a Hebrew reminder email via Resend.
 *
 * Authentication: CRON_SECRET token required in Authorization header.
 *
 * Set secrets in Supabase Dashboard → Edge Functions → Secrets:
 *   CRON_SECRET=<strong-random-value>
 *   RESEND_API_KEY=re_xxxxxxxxxxxxx
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FROM_ADDRESS = "ReviewHub <noreply@reviewshub.info>";
const RESEND_API   = "https://api.resend.com/emails";

// ── CRON auth guard ────────────────────────────────────────────────────────
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
    console.error("[send-billing-reminders] RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  // Window: billing starts in 28–32 days from now (catches "~30 days")
  const windowStart = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);

  // Fetch redemptions due for a reminder
  const { data: dueReminders, error: fetchError } = await supabase
    .from("coupon_redemptions")
    .select(`
      id,
      billing_starts_at,
      user_id,
      business_id,
      businesses ( name ),
      auth_user:user_id ( email )
    `)
    .gte("billing_starts_at", windowStart.toISOString())
    .lte("billing_starts_at", windowEnd.toISOString())
    .is("reminder_sent_at", null);

  if (fetchError) {
    console.error("[send-billing-reminders] fetch error:", fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!dueReminders || dueReminders.length === 0) {
    console.log("[send-billing-reminders] No reminders due today");
    return new Response(JSON.stringify({ sent: 0, message: "אין תזכורות לשלוח היום" }), { status: 200 });
  }

  console.log(`[send-billing-reminders] Sending ${dueReminders.length} reminder(s)`);

  let sentCount = 0;
  const errors: string[] = [];

  for (const reminder of dueReminders) {
    // Get user email — queried from auth.users via service_role
    const { data: userData } = await supabase.auth.admin.getUserById(reminder.user_id);
    const email = userData?.user?.email;

    if (!email) {
      errors.push(`No email for user ${reminder.user_id}`);
      continue;
    }

    const billingDate = new Date(reminder.billing_starts_at);
    const billingDateHe = billingDate.toLocaleDateString("he-IL", {
      day: "numeric", month: "long", year: "numeric",
    });

    const businessName = (reminder.businesses as any)?.name ?? "העסק שלך";

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תזכורת חיוב - ReviewHub</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#22c55e;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">ReviewHub</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">מנוע הביקורות החכם לעסקים</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;font-weight:600;">
                תקופת הניסיון מסתיימת בעוד חודש 📅
              </h2>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                שלום,
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                רצינו להזכיר לך שתקופת הניסיון החינמית שלך עבור <strong style="color:#1e293b;">${businessName}</strong> ב-ReviewHub מסתיימת בתאריך:
              </p>

              <!-- Date Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#f0fdf4;border:2px solid #22c55e;border-radius:10px;padding:20px;text-align:center;">
                    <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">תאריך תחילת חיוב</p>
                    <p style="margin:8px 0 0;color:#166534;font-size:26px;font-weight:700;">${billingDateHe}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                לאחר תאריך זה יתחיל החיוב החודשי הרגיל בהתאם לפלן שבחרת. אין צורך בשום פעולה — המנוי יחודש אוטומטית.
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 28px;">
                אם תרצה לבטל או לשנות את הפלן לפני תחילת החיוב, ניתן לעשות זאת בקלות מתוך לוח הבקרה שלך.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://reviewshub.info/dashboard/subscription"
                       style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      לניהול המנוי שלי
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="color:#94a3b8;font-size:13px;margin:0;">
                אימייל זה נשלח אוטומטית מ-ReviewHub.<br>
                לשאלות ותמיכה: <a href="mailto:support@reviewshub.info" style="color:#22c55e;text-decoration:none;">support@reviewshub.info</a>
              </p>
              <p style="color:#cbd5e1;font-size:12px;margin:10px 0 0;">
                © ${new Date().getFullYear()} ReviewHub · כל הזכויות שמורות
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `שלום,\n\nתקופת הניסיון החינמית שלך ב-ReviewHub מסתיימת בתאריך ${billingDateHe}.\n\nלאחר מכן יתחיל החיוב החודשי הרגיל.\n\nלניהול המנוי: https://reviewshub.info/dashboard/subscription\n\nבברכה,\nצוות ReviewHub`;

    // Send via Resend
    const resendRes = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [email],
        subject: `📅 תזכורת: החיוב ב-ReviewHub מתחיל בעוד חודש — ${billingDateHe}`,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(`[send-billing-reminders] Resend error for ${email}:`, errBody);
      errors.push(`Failed to send to ${email}: ${errBody}`);
      continue;
    }

    // Mark reminder as sent
    await supabase
      .from("coupon_redemptions")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", reminder.id);

    sentCount++;
    console.log(`[send-billing-reminders] ✓ Sent reminder to ${email} (billing: ${billingDateHe})`);
  }

  return new Response(JSON.stringify({
    sent:   sentCount,
    errors: errors.length > 0 ? errors : undefined,
    message: `נשלחו ${sentCount} תזכורות${errors.length > 0 ? `, ${errors.length} שגיאות` : ""}`,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
});

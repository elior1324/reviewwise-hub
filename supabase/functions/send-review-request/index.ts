import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSendPulseToken(): Promise<string> {
  const res = await fetch("https://api.sendpulse.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: Deno.env.get("SENDPULSE_CLIENT_ID"),
      client_secret: Deno.env.get("SENDPULSE_CLIENT_SECRET"),
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("SendPulse auth failed: " + JSON.stringify(data));
  return data.access_token;
}

function buildEmailHtml(businessName: string, courseName: string, reviewUrl: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">ReviewHub</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;text-align:right;">שלום 👋</h2>
    <p style="color:#4a4a5a;font-size:16px;line-height:1.7;text-align:right;margin:0 0 8px;">
      <strong>${businessName}</strong> מזמין אותך לשתף את החוויה שלך מהקורס:
    </p>
    <p style="color:#6366f1;font-size:18px;font-weight:bold;text-align:right;margin:0 0 32px;">
      ${courseName}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:bold;">
        ✍️ כתבו ביקורת
      </a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:32px 0 0;">
      הביקורת שלכם עוזרת לאחרים לקבל החלטה מושכלת
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ReviewHub — פלטפורמת ביקורות אמינה</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { customer_email, course_id } = await req.json();
    if (!customer_email || !course_id) throw new Error("Missing customer_email or course_id");

    // Get business
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!biz) throw new Error("No business found for user");

    // Get course
    const { data: course } = await supabase
      .from("courses")
      .select("id, name")
      .eq("id", course_id)
      .eq("business_id", biz.id)
      .single();
    if (!course) throw new Error("Course not found");

    // Create review request record
    const { data: reqRecord, error: reqError } = await supabase
      .from("review_requests")
      .insert({
        business_id: biz.id,
        course_id: course.id,
        customer_email,
        status: "sending",
      })
      .select("id, token")
      .single();
    if (reqError) throw new Error("Failed to create request: " + reqError.message);

    // Build review URL
    const siteUrl = req.headers.get("origin") || "https://reviewhub.co.il";
    const reviewUrl = `${siteUrl}/write-review?token=${reqRecord.token}&business=${biz.slug}&course=${course.id}`;

    // Send via SendPulse
    const token = await getSendPulseToken();
    const emailRes = await fetch("https://api.sendpulse.com/smtp/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: {
          subject: `${biz.name} מזמין אותך לכתוב ביקורת`,
          from: { name: "ReviewHub", email: "noreply@reviewhub.co.il" },
          to: [{ email: customer_email }],
          html: buildEmailHtml(biz.name, course.name, reviewUrl),
        },
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      await supabase.from("review_requests").update({ status: "failed" }).eq("id", reqRecord.id);
      throw new Error("SendPulse error: " + JSON.stringify(emailData));
    }

    // Update status to sent
    await supabase.from("review_requests").update({ status: "sent" }).eq("id", reqRecord.id);

    return new Response(JSON.stringify({ success: true, token: reqRecord.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-review-request error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve }             from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }      from "https://esm.sh/@supabase/supabase-js@2";
import { checkAiRateLimit }  from "../_shared/rate-limit.ts";
import { getCorsHeaders }    from "../_shared/cors.ts";

// ── SSRF guard ─────────────────────────────────────────────────────────────
// Validates a webhook URL before firing it.  Blocks:
//   • Non-HTTPS schemes (http, file, ftp, etc.)
//   • Private/loopback IPv4 and IPv6 ranges
//   • Cloud metadata endpoints (169.254.x.x, AWS/GCP/Azure magic IPs)
function isWebhookUrlSafe(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false; // unparseable
  }

  // Only HTTPS allowed
  if (parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost
  if (hostname === "localhost") return false;

  // Block IPv6 loopback / link-local
  if (hostname.startsWith("[")) {
    const ipv6 = hostname.slice(1, -1);
    if (ipv6 === "::1") return false;
    if (ipv6.startsWith("fe80:")) return false;
    if (ipv6.startsWith("fc") || ipv6.startsWith("fd")) return false;
  }

  // Block private / reserved IPv4 ranges
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b, c, d] = ipv4.map(Number);
    if (
      a === 10 ||                          // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) ||          // 192.168.0.0/16
      (a === 127) ||                       // 127.0.0.0/8 loopback
      (a === 169 && b === 254) ||          // 169.254.0.0/16 link-local / metadata
      (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 shared address space
      (a === 0) ||                         // 0.0.0.0/8
      (a === 255)                          // broadcast
    ) return false;
  }

  return true;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Rate limit: 5 AI report calls per user per day ────────────────────
    const rateCheck = await checkAiRateLimit(supabase, userId, "generate-ai-report", corsHeaders);
    if (!rateCheck.allowed) return rateCheck.response!;

    const { business_id, report_type = "weekly" } = await req.json();

    if (!business_id) throw new Error("business_id is required");

    // Verify caller owns this business
    const { data: ownerCheck } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", userId)
      .single();

    if (!ownerCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: not business owner" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine period
    const now = new Date();
    const daysBack = report_type === "daily" ? 1 : 7;
    const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch business info
    const { data: biz } = await supabase
      .from("businesses")
      .select("name, category, rating, review_count")
      .eq("id", business_id)
      .single();

    if (!biz) throw new Error("Business not found");

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating, text, verified, created_at, courses(name)")
      .eq("business_id", business_id)
      .eq("flagged", false)
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: false });

    if (!reviews || reviews.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "No reviews in period" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build AI prompt
    const reviewsSummary = reviews.map((r: any, i: number) => 
      `${i + 1}. דירוג: ${r.rating}/5 | קורס: ${r.courses?.name || "כללי"} | מאומת: ${r.verified ? "כן" : "לא"}\n   "${r.text}"`
    ).join("\n\n");

    const prompt = `אתה מערכת ניתוח ביקורות של ReviewHub. צור דוח ${report_type === "daily" ? "יומי" : "שבועי"} עבור העסק "${biz.name}" (קטגוריה: ${biz.category}).

נתונים כלליים: דירוג ממוצע ${biz.rating}/5, סה"כ ${biz.review_count} ביקורות.

ביקורות אחרונות (${reviews.length} ביקורות מ-${daysBack} ימים אחרונים):
${reviewsSummary}

צור דוח בעברית שכולל:
1. **סיכום מגמות** — מה השתנה, מגמה חיובית/שלילית
2. **נקודות חוזק** — מה לקוחות אוהבים
3. **נקודות לשיפור** — תלונות חוזרות או בעיות
4. **המלצות פעולה** — 2-3 צעדים קונקרטיים לשיפור
5. **ציון כללי לתקופה** — מ-1 עד 10

הדוח צריך להיות מקצועי, תמציתי ושימושי לבעל העסק. כתוב ב-Markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional business analytics AI. Always respond in Hebrew." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error("AI returned empty response");

    // Save report
    const { error: insertError } = await supabase.from("ai_reports").insert({
      business_id,
      report_type,
      content,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: now.toISOString().split("T")[0],
    });

    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    // Fire webhook for report_generated event
    const { data: webhooks } = await supabase
      .from("business_webhooks")
      .select("url, secret")
      .eq("business_id", business_id)
      .eq("active", true)
      .contains("events", ["report_generated"]);

    if (webhooks && webhooks.length > 0) {
      const payload = { event: "report_generated", business_id, report_type, created_at: now.toISOString() };
      await Promise.allSettled(
        webhooks
          .filter((wh: any) => {
            if (!isWebhookUrlSafe(wh.url)) {
              console.warn("[generate-ai-report] Blocked unsafe webhook URL:", wh.url);
              return false;
            }
            return true;
          })
          .map((wh: any) =>
            fetch(wh.url, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(wh.secret ? { "X-Webhook-Secret": wh.secret } : {}) },
              body: JSON.stringify(payload),
            })
          )
      );
    }

    return new Response(JSON.stringify({ success: true, report_type, reviews_analyzed: reviews.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-report error:", e);
    console.error("generate-ai-report unhandled error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

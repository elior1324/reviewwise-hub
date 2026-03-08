import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const format = url.searchParams.get("format") || "json"; // json | html

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: biz, error } = await supabaseClient
      .from("businesses")
      .select("name, slug, rating, review_count, subscription_tier, verified")
      .eq("slug", slug)
      .single();

    if (error || !biz) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only Pro and Premium can use the widget
    if (biz.subscription_tier !== "pro" && biz.subscription_tier !== "premium") {
      return new Response(JSON.stringify({ error: "Widget available for Pro and Premium plans only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rating = Number(biz.rating) || 0;
    const reviewCount = biz.review_count || 0;
    const origin = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");

    if (format === "html") {
      // Return an embeddable HTML widget
      const profileUrl = `https://reviewhub.co.il/biz/${biz.slug}`;
      const logoUrl = "https://nrtyavfilrmnflikyzed.supabase.co/storage/v1/object/public/testimonials/reviewhub-logo-widget.png";
      
      const stars = Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="${filled ? '#f59e0b' : 'none'}" stroke="${filled ? '#f59e0b' : '#d1d5db'}" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      }).join("");

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
.rh-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;text-decoration:none;color:#111;transition:box-shadow .2s}
.rh-widget:hover{box-shadow:0 4px 12px rgba(0,0,0,.1)}
.rh-logo{width:32px;height:32px;border-radius:8px;object-fit:cover}
.rh-info{display:flex;flex-direction:column;gap:2px}
.rh-stars{display:flex;align-items:center;gap:1px}
.rh-rating{font-weight:700;font-size:14px;margin-left:6px}
.rh-count{font-size:11px;color:#6b7280}
.rh-brand{font-size:10px;color:#9ca3af;display:flex;align-items:center;gap:4px}
</style></head>
<body>
<a href="${profileUrl}" target="_blank" rel="noopener" class="rh-widget">
  <img src="${logoUrl}" alt="ReviewHub" class="rh-logo" />
  <div class="rh-info">
    <div class="rh-stars">
      <span class="rh-rating">${rating.toFixed(1)}</span>
      ${stars}
    </div>
    <span class="rh-count">${reviewCount} ביקורות מאומתות</span>
    <span class="rh-brand">מופעל ע״י ReviewHub ✓</span>
  </div>
</a>
</body></html>`;

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Default: JSON response
    return new Response(JSON.stringify({
      name: biz.name,
      slug: biz.slug,
      rating,
      review_count: reviewCount,
      verified: biz.verified,
      profile_url: `https://reviewhub.co.il/biz/${biz.slug}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

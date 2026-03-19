/**
 * import-facebook-reviews — Edge Function
 *
 * Fetches Facebook Page ratings and reviews via the Facebook Graph API
 * and upserts them into the reviews table as review_source = 'facebook'.
 *
 * Facebook Graph API endpoint:
 *   GET /{page-id}/ratings?fields=reviewer,rating,review_text,created_time
 *   Authorization: Bearer {page_access_token}
 *
 * Auth flow:
 *   The business owner connects Facebook via OAuth and we store their
 *   page_access_token in business_integrations.config (integration_type = 'facebook').
 *   The page_access_token must have the pages_read_user_content permission.
 *
 * Required Edge Function secrets:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Config stored in business_integrations:
 *   page_access_token — Facebook Page access token
 *   page_id           — Facebook Page ID
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const GRAPH_API_BASE    = "https://graph.facebook.com/v19.0";
const MAX_REVIEWS_PER_IMPORT = 50;

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { business_id } = await req.json();
    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Verify business ownership ─────────────────────────────────────────────
    const { data: biz } = await admin
      .from("businesses")
      .select("id, owner_id")
      .eq("id", business_id)
      .single();

    if (!biz || biz.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Load Facebook integration config ──────────────────────────────────────
    const { data: intg } = await admin
      .from("business_integrations")
      .select("config, active")
      .eq("business_id", business_id)
      .eq("integration_type", "facebook")
      .maybeSingle();

    if (!intg?.config?.page_access_token || !intg?.config?.page_id) {
      return new Response(JSON.stringify({
        error: "Facebook integration not configured. Please connect your Facebook Page first.",
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { page_access_token, page_id } = intg.config;

    // ── Fetch reviews from Facebook Graph API ─────────────────────────────────
    const apiUrl = `${GRAPH_API_BASE}/${page_id}/ratings` +
      `?fields=reviewer,rating,review_text,created_time,open_graph_story` +
      `&limit=${MAX_REVIEWS_PER_IMPORT}` +
      `&access_token=${page_access_token}`;

    const fbRes = await fetch(apiUrl, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!fbRes.ok) {
      const errText = await fbRes.text();
      console.error(`[import-facebook-reviews] Graph API error ${fbRes.status}: ${errText.slice(0, 300)}`);

      if (fbRes.status === 190) {
        return new Response(JSON.stringify({
          error: "Facebook access token has expired. Please reconnect your Facebook Page.",
        }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "Failed to fetch ratings from Facebook" }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: fbRatings = [] } = await fbRes.json();

    if (fbRatings.length === 0) {
      return new Response(JSON.stringify({ imported: 0, message: "No ratings found on Facebook" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Upsert into reviews table ─────────────────────────────────────────────
    let imported = 0;
    let skipped  = 0;

    for (const fb of fbRatings) {
      const reviewText = (fb.review_text ?? "").trim().slice(0, 2000);
      // Skip rating-only entries with no text
      if (!reviewText) { skipped++; continue; }

      const rating       = Math.min(5, Math.max(1, Math.round(fb.rating ?? 3)));
      const reviewerName = fb.reviewer?.name ?? "Facebook User";
      const externalId   = fb.open_graph_story?.id ?? `fb-${fb.reviewer?.id ?? Date.now()}`;
      const createdAt    = fb.created_time ?? new Date().toISOString();

      const { error: upsertErr } = await admin
        .from("reviews")
        .upsert({
          business_id,
          external_review_id: externalId,
          rating,
          review_text:     reviewText,
          subject:         reviewText.slice(0, 60),
          reviewer_name:   reviewerName,
          review_source:   "facebook",
          source_label:    "Facebook",
          anonymous:       false,
          verified_purchase: false,
          verification_status: "email_verified",
          moderation_status: "approved", // Facebook reviews are pre-moderated
          indemnity_accepted: true,
          indemnity_accepted_at: createdAt,
          training_duration: "one_year_plus",
          created_at: createdAt,
        }, { onConflict: "business_id,external_review_id" });

      if (upsertErr) {
        console.warn(`[import-facebook-reviews] upsert failed for ${externalId}:`, upsertErr.message);
        skipped++;
      } else {
        imported++;
      }
    }

    // ── Update integration last_sync_at ───────────────────────────────────────
    await admin.from("business_integrations")
      .update({ updated_at: new Date().toISOString() })
      .eq("business_id", business_id)
      .eq("integration_type", "facebook");

    console.log(`[import-facebook-reviews] business=${business_id} imported=${imported} skipped=${skipped}`);

    return new Response(JSON.stringify({ imported, skipped, total: fbRatings.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[import-facebook-reviews] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

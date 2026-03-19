/**
 * import-google-reviews — Edge Function
 *
 * Fetches Google Business Profile reviews via the Google My Business API v4
 * and upserts them into the reviews table as review_source = 'google'.
 *
 * Trigger: POST from the business dashboard integrations tab, or via cron.
 *
 * Auth flow:
 *   The business owner connects Google via OAuth and we store their
 *   access_token in business_integrations.config (integration_type = 'google').
 *   This function uses that stored token to call the Google API.
 *
 * Google API endpoint:
 *   GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
 *
 * Required Edge Function secrets:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Config stored in business_integrations:
 *   access_token  — Google OAuth access token
 *   account_id    — Google Business account ID (accounts/...)
 *   location_id   — Google Business location ID (locations/...)
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const GOOGLE_API_BASE = "https://mybusiness.googleapis.com/v4";
const MAX_REVIEWS_PER_IMPORT = 50;

// Star rating label → numeric mapping
const STAR_RATING: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

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

    // ── Load Google integration config ────────────────────────────────────────
    const { data: intg } = await admin
      .from("business_integrations")
      .select("config, active")
      .eq("business_id", business_id)
      .eq("integration_type", "google")
      .maybeSingle();

    if (!intg?.config?.access_token) {
      return new Response(JSON.stringify({
        error: "Google integration not configured. Please connect your Google Business account first.",
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { access_token, account_id, location_id } = intg.config;

    if (!account_id || !location_id) {
      return new Response(JSON.stringify({
        error: "Google Business account_id and location_id are required in the integration config.",
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── Fetch reviews from Google My Business API ─────────────────────────────
    const apiUrl = `${GOOGLE_API_BASE}/${account_id}/${location_id}/reviews?pageSize=${MAX_REVIEWS_PER_IMPORT}`;
    const googleRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error(`[import-google-reviews] Google API error ${googleRes.status}: ${errText.slice(0, 300)}`);

      if (googleRes.status === 401) {
        return new Response(JSON.stringify({
          error: "Google access token has expired. Please reconnect your Google Business account.",
        }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "Failed to fetch reviews from Google" }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { reviews: googleReviews = [] } = await googleRes.json();

    if (googleReviews.length === 0) {
      return new Response(JSON.stringify({ imported: 0, message: "No reviews found on Google" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Upsert reviews into reviews table ─────────────────────────────────────
    // We use the Google review name (e.g. "accounts/.../reviews/AbcXyz") as the
    // external_review_id to prevent duplicates across multiple imports.
    let imported = 0;
    let skipped  = 0;

    for (const gr of googleReviews) {
      const externalId = gr.reviewId ?? gr.name;
      const rating     = STAR_RATING[gr.starRating] ?? 3;
      const reviewText = (gr.comment ?? "").trim().slice(0, 2000);
      const reviewerName = gr.reviewer?.displayName ?? "Google Reviewer";
      const createdAt  = gr.createTime ?? new Date().toISOString();

      // Skip reviews without text (rating-only)
      if (!reviewText) { skipped++; continue; }

      const { error: upsertErr } = await admin
        .from("reviews")
        .upsert({
          business_id,
          external_review_id: externalId,
          rating,
          review_text:     reviewText,
          subject:         reviewText.slice(0, 60),
          reviewer_name:   reviewerName,
          review_source:   "google",
          source_label:    "Google Business",
          anonymous:       false,
          verified_purchase: false,
          verification_status: "email_verified",
          moderation_status: "approved", // Google reviews are pre-moderated
          indemnity_accepted: true,
          indemnity_accepted_at: createdAt,
          training_duration: "one_year_plus", // default for imported reviews
          created_at: createdAt,
        }, { onConflict: "business_id,external_review_id" });

      if (upsertErr) {
        console.warn(`[import-google-reviews] upsert failed for ${externalId}:`, upsertErr.message);
        skipped++;
      } else {
        imported++;
      }
    }

    // ── Update integration last_sync_at ───────────────────────────────────────
    await admin.from("business_integrations")
      .update({ updated_at: new Date().toISOString() })
      .eq("business_id", business_id)
      .eq("integration_type", "google");

    console.log(`[import-google-reviews] business=${business_id} imported=${imported} skipped=${skipped}`);

    return new Response(JSON.stringify({ imported, skipped, total: googleReviews.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[import-google-reviews] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

/**
 * submit-review — Edge Function
 *
 * Responsibilities:
 *  1. Verify the caller is authenticated (valid JWT)
 *  2. Verify the Turnstile token server-side with Cloudflare's siteverify API
 *     (C-2: bot protection that was previously client-side only)
 *  3. Validate and sanitise all input fields
 *  4. Enforce the one-review-per-user-per-business rule (DB constraint backup)
 *  5. Insert the review row directly from the server with service-role key
 *     so the INSERT bypasses any gap in client-side RLS
 *
 * Environment variables required (Supabase → Project → Edge Functions → Secrets):
 *   TURNSTILE_SECRET_KEY   — from Cloudflare Dashboard → Turnstile → site settings
 *   SUPABASE_URL           — auto-injected by Supabase
 *   SUPABASE_ANON_KEY      — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── Constants ──────────────────────────────────────────────────────────────

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const SUBJECT_MAX      = 60;
const REVIEW_TEXT_MAX  = 2000;
const REVIEWER_MAX     = 80;

const VALID_DURATIONS = new Set([
  "3_months_plus",
  "half_year_plus",
  "one_year_plus",
  "two_years_plus",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip HTML tags and collapse whitespace. Mirrors the client-side sanitizeText. */
function sanitize(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/\s+/g, " ")           // collapse whitespace
    .trim()
    .slice(0, maxLen);
}

function jsonResp(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  // Pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResp({ error: "Method not allowed" }, 405, cors);
  }

  try {
    // ── Step 1: Authenticate caller ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401, cors);
    }

    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the user's JWT to verify identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return jsonResp({ error: "Unauthorized" }, 401, cors);
    }

    // ── Step 2: Parse and validate request body ──────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResp({ error: "Invalid JSON body" }, 400, cors);
    }

    const {
      turnstileToken,
      businessId,
      courseId,
      rating,
      subject,
      reviewText,
      trainingDuration,
      verifiedPurchase = false,
    } = body;

    // Required fields
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return jsonResp({ error: "Missing CAPTCHA token" }, 400, cors);
    }
    if (!businessId || typeof businessId !== "string") {
      return jsonResp({ error: "Missing businessId" }, 400, cors);
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return jsonResp({ error: "Rating must be 1–5" }, 400, cors);
    }
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return jsonResp({ error: "Subject is required" }, 400, cors);
    }
    if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length < 10) {
      return jsonResp({ error: "Review text must be at least 10 characters" }, 400, cors);
    }
    if (!trainingDuration || !VALID_DURATIONS.has(trainingDuration as string)) {
      return jsonResp({ error: "Invalid training duration" }, 400, cors);
    }

    // ── Step 3: Verify Turnstile token server-side ───────────────────────
    // This is the critical fix: the token was previously only checked for
    // presence on the client. Here we validate it with Cloudflare's API.
    const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";

    if (!turnstileSecretKey) {
      // No secret configured → log a warning but allow in development
      console.warn("[submit-review] TURNSTILE_SECRET_KEY not set — skipping verification (dev mode)");
    } else {
      const formData = new URLSearchParams();
      formData.set("secret",   turnstileSecretKey);
      formData.set("response", turnstileToken as string);
      // Optionally include the user's IP for extra security
      const remoteIp = req.headers.get("CF-Connecting-IP");
      if (remoteIp) formData.set("remoteip", remoteIp);

      const tsResp = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        body:   formData,
      });
      const tsResult = await tsResp.json() as { success: boolean; "error-codes"?: string[] };

      if (!tsResult.success) {
        console.warn("[submit-review] Turnstile verification failed:", tsResult["error-codes"]);
        return jsonResp(
          { error: "CAPTCHA verification failed — please reload and try again" },
          403,
          cors,
        );
      }
    }

    // ── Step 4: Sanitise text fields ─────────────────────────────────────
    const cleanSubject      = sanitize(subject,      SUBJECT_MAX);
    const cleanReviewText   = sanitize(reviewText,   REVIEW_TEXT_MAX);
    const cleanReviewerName = sanitize(
      user.email?.split("@")[0] ?? "משתמש",
      REVIEWER_MAX,
    );

    // ── Step 5: Insert review via service role ────────────────────────────
    // Using service-role key here ensures the insert cannot be blocked by
    // client-facing RLS misconfiguration and that we bypass nothing ourselves
    // — all business logic is in this function.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Guard: verify the businessId actually exists (prevents phantom reviews)
    const { data: bizExists, error: bizErr } = await adminClient
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();

    if (bizErr || !bizExists) {
      return jsonResp({ error: "Business not found" }, 404, cors);
    }

    const { error: insertError } = await adminClient
      .from("reviews")
      .insert({
        user_id:           user.id,
        business_id:       businessId,
        course_id:         courseId && typeof courseId === "string" ? courseId : null,
        rating:            Math.round(rating as number),
        review_text:       cleanReviewText,
        subject:           cleanSubject,
        training_duration: trainingDuration,
        verified_purchase: Boolean(verifiedPurchase),
        reviewer_name:     cleanReviewerName,
        anonymous:         false,
      });

    if (insertError) {
      // PostgreSQL unique-constraint violation code
      if (insertError.code === "23505") {
        return jsonResp(
          { error: "duplicate_review", message: "כבר שלחתם ביקורת על עסק זה" },
          409,
          cors,
        );
      }
      console.error("[submit-review] insert error:", insertError);
      return jsonResp({ error: "Failed to save review" }, 500, cors);
    }

    return jsonResp({ success: true, verifiedPurchase: Boolean(verifiedPurchase) }, 200, cors);

  } catch (err) {
    console.error("[submit-review] unexpected error:", err);
    return jsonResp({ error: "Internal server error" }, 500, cors);
  }
});

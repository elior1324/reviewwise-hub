/**
 * receive-instagram-dm-review — Edge Function
 *
 * Handles incoming Instagram DM customer feedback submitted via
 * the ReviewHub /ig/{flow_token} review page.
 *
 * This is an UNAUTHENTICATED endpoint — customers who click the
 * Instagram review link do NOT have a ReviewHub account.
 *
 * Security controls:
 *  - Validates flow_token exists and is active
 *  - Validates business exists
 *  - Rate limits: max 3 reviews per phone_hash per business
 *  - Content length limits
 *  - Reviews default to is_approved=false (business must approve)
 *
 * Environment variables:
 *  SUPABASE_URL              — auto-injected
 *  SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const TEXT_MIN = 5;
const TEXT_MAX = 1000;
const NAME_MAX = 80;

function jsonResp(
  body: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

/** Minimal text sanitiser — strips HTML, collapses whitespace */
function sanitize(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** SHA-256 a phone number string (Deno built-in crypto) */
async function hashPhone(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw.replace(/\D/g, "").slice(-10)); // last 10 digits
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")   return jsonResp({ error: "Method not allowed" }, 405, cors);

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "Invalid JSON" }, 400, cors);
  }

  const {
    flow_token,
    rating,
    text,
    author_name,
    author_phone,   // optional; hashed server-side
  } = body;

  // ── Validate flow_token ────────────────────────────────────────────────
  if (!flow_token || typeof flow_token !== "string") {
    return jsonResp({ error: "flow_token is required" }, 400, cors);
  }

  const { data: flow, error: flowErr } = await admin
    .from("instagram_dm_review_flows")
    .select("id, business_id, active")
    .eq("flow_token", flow_token)
    .maybeSingle();

  if (flowErr || !flow) {
    return jsonResp({ error: "Invalid review link" }, 404, cors);
  }
  if (!flow.active) {
    return jsonResp({ error: "This review link is no longer active" }, 410, cors);
  }

  // ── Validate input ─────────────────────────────────────────────────────
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return jsonResp({ error: "rating must be 1–5" }, 400, cors);
  }

  const cleanText = sanitize(text, TEXT_MAX);
  if (cleanText.length < TEXT_MIN) {
    return jsonResp(
      { error: `Review text must be at least ${TEXT_MIN} characters` },
      400,
      cors,
    );
  }

  const cleanName = sanitize(author_name, NAME_MAX) || null;

  // ── Hash phone for dedup (do not store raw number) ─────────────────────
  let phoneHash: string | null = null;
  if (author_phone && typeof author_phone === "string" && author_phone.trim().length >= 5) {
    phoneHash = await hashPhone(author_phone);

    // Rate limit: max 3 reviews from same phone_hash to same business
    const { count } = await admin
      .from("instagram_dm_reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", flow.business_id)
      .eq("author_phone_hash", phoneHash);

    if ((count ?? 0) >= 3) {
      return jsonResp({ error: "Too many reviews from this number" }, 429, cors);
    }
  }

  // ── Insert review (defaults to is_approved=false) ───────────────────────
  const { data: inserted, error: insertErr } = await admin
    .from("instagram_dm_reviews")
    .insert({
      business_id:       flow.business_id,
      flow_id:           flow.id,
      author_name:       cleanName,
      author_phone_hash: phoneHash,
      rating:            Math.round(rating),
      text:              cleanText,
      is_approved:       false,
      received_at:       new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[receive-instagram-dm-review] insert error:", insertErr);
    return jsonResp({ error: "Failed to save review" }, 500, cors);
  }

  return jsonResp({
    success:   true,
    review_id: inserted.id,
    message:   "תודה על הביקורת! היא תוצג לאחר אישור בעל העסק.",
  });
});

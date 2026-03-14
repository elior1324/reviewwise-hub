/**
 * submit-purchase-proof
 *
 * POST  { review_id, proof_type, proof_url?, business_id? }
 * Authorization: Bearer <user_jwt>
 *
 * 1. Verifies the caller owns the review (review.user_id = caller)
 * 2. Inserts a purchase_verifications row with status='pending'
 * 3. If the business has invoice templates, triggers AI comparison via verify-invoice
 *    (status auto-advances to 'approved' or 'rejected')
 * 4. Returns { id, status, message }
 */
import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // ── 1. Authenticate caller ───────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 2. Parse body ────────────────────────────────────────────────────────
    const { review_id, proof_type, proof_url, business_id } = await req.json();

    if (!review_id || !proof_type) {
      return new Response(JSON.stringify({ error: "review_id and proof_type are required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!["receipt", "crm", "invoice"].includes(proof_type)) {
      return new Response(JSON.stringify({ error: "proof_type must be receipt, crm, or invoice" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── 3. Verify review belongs to caller ───────────────────────────────────
    const { data: review, error: reviewErr } = await admin
      .from("reviews")
      .select("id, user_id, business_id")
      .eq("id", review_id)
      .maybeSingle();

    if (reviewErr || !review) {
      return new Response(JSON.stringify({ error: "Review not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (review.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: you do not own this review" }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── 4. Check for existing pending/approved proof ─────────────────────────
    const { data: existing } = await admin
      .from("purchase_verifications")
      .select("id, status")
      .eq("review_id", review_id)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        id: existing.id,
        status: existing.status,
        message: existing.status === "approved"
          ? "This review is already verified."
          : "A verification is already pending for this review.",
      }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── 5. Insert purchase_verifications row ────────────────────────────────
    const resolvedBusinessId = business_id || review.business_id;

    const { data: pvRow, error: insertErr } = await admin
      .from("purchase_verifications")
      .insert({
        review_id,
        user_id:     user.id,
        business_id: resolvedBusinessId,
        proof_type,
        proof_url:   proof_url || null,
        status:      "pending",
      })
      .select("id, status")
      .single();

    if (insertErr || !pvRow) {
      console.error("insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create verification record" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── 6. If business has invoice templates, trigger AI auto-verification ───
    if (resolvedBusinessId && proof_url && proof_type === "receipt") {
      const { data: templates } = await admin
        .from("invoice_templates")
        .select("id")
        .eq("business_id", resolvedBusinessId)
        .limit(1);

      if (templates && templates.length > 0) {
        // Non-blocking: fire verify-invoice in background
        try {
          const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-invoice`, {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action:     "verify_receipt",
              businessId: resolvedBusinessId,
              filePath:   proof_url,
              receiptId:  pvRow.id,
            }),
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            // Mirror the AI result into our purchase_verifications table
            const newStatus = verifyData.verified ? "approved"
              : verifyData.status === "manual_review" ? "pending"
              : "rejected";

            await admin
              .from("purchase_verifications")
              .update({
                status:      newStatus,
                reviewed_at: new Date().toISOString(),
              })
              .eq("id", pvRow.id);

            return new Response(JSON.stringify({
              id:      pvRow.id,
              status:  newStatus,
              message: newStatus === "approved"
                ? "Purchase verified automatically by AI ✓"
                : newStatus === "pending"
                ? "Submitted for manual review."
                : "Receipt could not be verified — contact support if this is an error.",
            }), {
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          console.warn("AI verification failed, falling back to manual:", e);
        }
      }
    }

    // ── 7. CRM-type proofs are auto-approved (system-verified) ──────────────
    if (proof_type === "crm") {
      await admin
        .from("purchase_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", pvRow.id);

      return new Response(JSON.stringify({
        id:      pvRow.id,
        status:  "approved",
        message: "CRM purchase verification approved ✓",
      }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      id:      pvRow.id,
      status:  "pending",
      message: "Purchase proof submitted. We'll review it within 24 hours.",
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("submit-purchase-proof error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

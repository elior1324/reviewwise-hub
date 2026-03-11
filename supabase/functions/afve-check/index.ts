/**
 * afve-check — Anti-Fraud Verification Engine (AFVE) Edge Function
 *
 * Implements 4 verification pillars:
 *
 *   Pillar 1 · Digital Forensics & Metadata Analysis
 *     — Computes SHA-256 of the uploaded file (Safe Harbor: no file stored)
 *     — Detects AI-generated PDF metadata (Canva, Photoshop, etc.)
 *     — Checks for hash collisions across users
 *
 *   Pillar 2 · Merchant Verification Loop
 *     — Creates a merchant_verif_queue row for Pro-tier businesses
 *     — Exposes confirm/reject endpoint via token link
 *
 *   Pillar 3 · E2V (Email-to-Verify)
 *     — Issues unique verify+ token addresses
 *     — Validates SPF / DKIM / DMARC headers of inbound forwarded emails
 *
 *   Pillar 4 · AI Text Analysis (Perplexity & Burstiness)
 *     — Sends review text to Gemini 2.5 Flash for LLM-output detection
 *     — Updates trust_score via fn_calculate_trust_score()
 *
 * Actions (POST body.action):
 *   "scan_file"            — Pillar 1: hash + metadata forensics
 *   "request_e2v"          — Pillar 3: issue a verify+ token for a review
 *   "ingest_e2v_email"     — Pillar 3: parse inbound forwarded email (internal)
 *   "analyze_review_text"  — Pillar 4: perplexity / burstiness check
 *   "merchant_decide"      — Pillar 2: confirm or reject (token-authenticated)
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   LOVABLE_API_KEY  — Gemini 2.5 Flash gateway
 *   E2V_INGEST_SECRET — shared secret for inbound email processor webhook
 */

import { serve }          from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }   from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ─── Suspicious PDF producers ─────────────────────────────────────────────────
// Known invoicing software (legit) — everything else is flagged.
const LEGIT_INVOICE_PRODUCERS = new Set([
  "greeninvoice",   // חשבשבת - ירוק
  "icount",         // iCount
  "hashavshevet",   // חשבשבת
  "priority",       // Priority ERP
  "sap",            // SAP Business One
  "microsoft word", // Word → PDF (acceptable for small biz)
  "openoffice",
  "libreoffice",
  "woocommerce",
  "shopify",
  "invoice ninja",
  "zoho invoice",
  "quickbooks",
  "xero",
  "freshbooks",
  "wave",
  "pdfkit",
  "reportlab",      // Python invoice generators
]);

const SUSPICIOUS_PRODUCERS = [
  "canva",
  "adobe photoshop",
  "adobe illustrator",
  "adobe indesign",
  "gimp",
  "figma",
  "pixelmator",
  "affinity",
  "sketch",
  "procreate",
  "paint",
  "snapseed",
  "dall-e",
  "midjourney",
  "stable diffusion",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResp(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

/** SHA-256 of a Uint8Array — returns lowercase hex string */
async function sha256hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Detect MIME type from magic bytes */
function detectMime(bytes: Uint8Array): string {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  return "application/octet-stream";
}

/**
 * Extract PDF metadata producer/creator from raw bytes.
 * Parses the XMP or classic Info dictionary — no external dep needed.
 */
function extractPdfProducer(bytes: Uint8Array): { producer: string | null; creator: string | null } {
  const text = new TextDecoder("latin1").decode(bytes.slice(0, 32_768)); // first 32 KB
  const producerMatch = text.match(/\/Producer\s*\(([^)]{1,200})\)/i);
  const creatorMatch  = text.match(/\/Creator\s*\(([^)]{1,200})\)/i);
  return {
    producer: producerMatch?.[1]?.trim() ?? null,
    creator:  creatorMatch?.[1]?.trim()  ?? null,
  };
}

/** Returns true if producer string looks suspicious */
function isProducerSuspicious(producer: string | null, creator: string | null): boolean {
  const combined = `${producer ?? ""} ${creator ?? ""}`.toLowerCase();
  return SUSPICIOUS_PRODUCERS.some((s) => combined.includes(s));
}

/** Returns true if producer is a known legit invoicing tool */
function isProducerLegit(producer: string | null, creator: string | null): boolean {
  const combined = `${producer ?? ""} ${creator ?? ""}`.toLowerCase();
  for (const legit of LEGIT_INVOICE_PRODUCERS) {
    if (combined.includes(legit)) return true;
  }
  return false;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY          = Deno.env.get("LOVABLE_API_KEY");
  const E2V_INGEST_SECRET        = Deno.env.get("E2V_INGEST_SECRET") ?? "";

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Merchant decide: token-auth (no JWT needed) ──────────────────────────
  const url = new URL(req.url);
  if (url.pathname.endsWith("/merchant_decide") && req.method === "POST") {
    const { token, decision, note } = await req.json();
    const { data } = await db.rpc("fn_process_merchant_decision", {
      p_confirm_token: token,
      p_decision:      decision,
      p_decision_note: note ?? null,
    });
    return jsonResp(data, 200, cors);
  }

  // ── All other actions require a valid JWT ─────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const isInternalCron = req.headers.get("x-afve-secret") === E2V_INGEST_SECRET && E2V_INGEST_SECRET.length > 8;

  let userId: string | null = null;

  if (!isInternalCron) {
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401, cors);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return jsonResp({ error: "Unauthorized" }, 401, cors);
    userId = user.id;
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ════════════════════════════════════════════════════════════════════════
    // PILLAR 1 — scan_file: hash + PDF metadata forensics + hash collision
    // ════════════════════════════════════════════════════════════════════════
    if (action === "scan_file") {
      const { review_id, business_id, storage_path } = body;

      if (!review_id || !storage_path) {
        return jsonResp({ error: "review_id and storage_path required" }, 400, cors);
      }

      // Download file from Supabase Storage
      const { data: fileData, error: dlErr } = await db.storage
        .from("invoices")
        .download(storage_path);

      if (dlErr || !fileData) {
        return jsonResp({ error: "Could not download file from storage" }, 400, cors);
      }

      const bytes      = new Uint8Array(await fileData.arrayBuffer());
      const fileHash   = await sha256hex(bytes);
      const mimeType   = detectMime(bytes);
      const flags: Record<string, unknown> = {};

      // ── PDF forensics ──────────────────────────────────────────────────
      let producerSuspicious = false;
      let producerLegit = false;
      if (mimeType === "application/pdf") {
        const { producer, creator } = extractPdfProducer(bytes);
        flags.pdf_producer      = producer;
        flags.pdf_creator       = creator;
        producerSuspicious      = isProducerSuspicious(producer, creator);
        producerLegit           = isProducerLegit(producer, creator);
        flags.flagged_producer  = producerSuspicious;
        flags.legit_producer    = producerLegit;
      } else {
        // For images: flag non-PDF as requiring closer scrutiny
        flags.is_image         = true;
        flags.image_mime       = mimeType;
        flags.image_note       = "Image invoices require AI artifact scan";
      }

      // ── Hash collision check ──────────────────────────────────────────
      const { data: collisionFound } = await db.rpc("fn_detect_hash_collision", {
        p_file_hash: fileHash,
        p_user_id:   userId,
        p_review_id: review_id,
      });
      flags.hash_collision = !!collisionFound;

      // ── Determine initial result ──────────────────────────────────────
      const passed = !producerSuspicious && !collisionFound;
      const confidence = producerLegit ? 0.80 : producerSuspicious ? 0.10 : 0.50;
      let reason = "";
      if (collisionFound)      reason = "Invoice hash already used by another user";
      else if (producerSuspicious) reason = `Suspicious PDF producer: ${flags.pdf_producer}`;
      else if (producerLegit)  reason = `Legit invoicing software detected: ${flags.pdf_producer}`;
      else                     reason = "No obvious forensic flags — recommend AI scan";

      // ── Persist verification log ──────────────────────────────────────
      await db.from("verification_logs").insert({
        review_id,
        user_id:          userId,
        business_id:      business_id ?? null,
        method:           "ai_metadata",
        passed,
        confidence_score: confidence,
        file_hash_sha256: fileHash,
        file_mime:        mimeType,
        metadata_flags:   flags,
        reason,
      });

      // ── Update review afve_status ─────────────────────────────────────
      const newStatus = collisionFound      ? "flagged"
                      : producerSuspicious  ? "manual_review"
                      : "partial";

      await db.from("reviews")
        .update({
          afve_status: newStatus,
          afve_methods: db.rpc("array_append_if_missing", {
            arr: ["invoice_hash"],
            val: "invoice_hash",
          }) as unknown as string[],
        })
        .eq("id", review_id);

      // Simple direct update avoids RPC call complexity
      if (!collisionFound) {
        await db.rpc("fn_calculate_trust_score", { p_user_id: userId });
      }

      return jsonResp({
        passed,
        confidence,
        hash:   fileHash,
        mime:   mimeType,
        flags,
        reason,
        status: newStatus,
      }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PILLAR 3 — request_e2v: issue unique verify+ token for a review
    // ════════════════════════════════════════════════════════════════════════
    if (action === "request_e2v") {
      const { review_id, business_id } = body;
      if (!review_id) return jsonResp({ error: "review_id required" }, 400, cors);

      const { data: token, error: tokErr } = await db
        .from("e2v_tokens")
        .insert({
          user_id:     userId,
          review_id,
          business_id: business_id ?? null,
        })
        .select("token_code, expires_at")
        .single();

      if (tokErr) throw tokErr;

      return jsonResp({
        email:      `verify+${token.token_code}@reviewhub.co.il`,
        expires_at: token.expires_at,
        instructions: [
          "העבר (Forward) את קבלת הרכישה המקורית לכתובת המייל הזו.",
          "המייל חייב להגיע מאותה כתובת שממנה קיבלת את הקבלה.",
          "המערכת תבדוק SPF, DKIM ו-DMARC אוטומטית.",
        ],
      }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PILLAR 3 — ingest_e2v_email: called by inbound email processor webhook
    // ════════════════════════════════════════════════════════════════════════
    if (action === "ingest_e2v_email") {
      if (!isInternalCron) return jsonResp({ error: "Forbidden" }, 403, cors);

      const {
        token_code,
        sender_email,
        sender_domain,
        spf_result,
        dkim_result,
        dmarc_result,
        email_subject,
        invoice_number,
        invoice_amount,
      } = body;

      // Find the token
      const { data: tok, error: tokErr } = await db
        .from("e2v_tokens")
        .select("*")
        .eq("token_code", token_code)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (tokErr || !tok) {
        return jsonResp({ success: false, error: "token_not_found_or_expired" }, 200, cors);
      }

      // Evaluate email authentication
      const spfOk   = spf_result   === "pass";
      const dkimOk  = dkim_result  === "pass";
      const dmarcOk = dmarc_result === "pass";
      const passed  = spfOk && dkimOk && dmarcOk;

      const failureReason = !passed
        ? [
            !spfOk   && "SPF failed",
            !dkimOk  && "DKIM failed",
            !dmarcOk && "DMARC failed",
          ].filter(Boolean).join(", ")
        : null;

      // Update token row
      await db.from("e2v_tokens").update({
        used_at:              new Date().toISOString(),
        sender_email,
        sender_domain,
        spf_result,
        dkim_result,
        dmarc_result,
        email_subject,
        invoice_number:       invoice_number ?? null,
        invoice_amount:       invoice_amount ?? null,
        verification_passed:  passed,
        failure_reason:       failureReason,
      }).eq("id", tok.id);

      // Insert verification log
      await db.from("verification_logs").insert({
        review_id:        tok.review_id,
        user_id:          tok.user_id,
        business_id:      tok.business_id,
        method:           "e2v_email",
        passed,
        confidence_score: passed ? 0.90 : 0.05,
        metadata_flags: {
          spf_result,
          dkim_result,
          dmarc_result,
          sender_domain,
          sender_email,
        },
        reason: passed
          ? `Email chain authenticated: SPF✓ DKIM✓ DMARC✓ from ${sender_domain}`
          : `Email auth failed: ${failureReason}`,
      });

      // Update review status
      if (passed && tok.review_id) {
        await db.from("reviews")
          .update({ afve_status: "verified" })
          .eq("id", tok.review_id)
          .neq("afve_status", "rejected");

        await db.rpc("fn_calculate_trust_score", { p_user_id: tok.user_id });
      } else if (!passed) {
        await db.from("fraud_alerts").insert({
          user_id:    tok.user_id,
          review_id:  tok.review_id,
          alert_type: "email_spf_fail",
          severity:   "high",
          status:     "open",
          evidence:   { spf_result, dkim_result, dmarc_result, sender_email },
        });
      }

      return jsonResp({ success: true, passed }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PILLAR 4 — analyze_review_text: perplexity + burstiness via Gemini
    // ════════════════════════════════════════════════════════════════════════
    if (action === "analyze_review_text") {
      const { review_id, review_text, business_id } = body;
      if (!review_id || !review_text) {
        return jsonResp({ error: "review_id and review_text required" }, 400, cors);
      }
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role:    "system",
              content: `You are a forensic text analyst specializing in detecting AI-generated reviews.

Analyze the review text and return ONLY valid JSON (no markdown) with:
{
  "is_ai_generated": boolean,
  "confidence": number (0.0 to 1.0 — how confident you are it's AI-generated),
  "perplexity_estimate": "low" | "medium" | "high",
  "burstiness_estimate": "low" | "medium" | "high",
  "signals": string[] (specific signals that suggest AI or human authorship),
  "verdict": "human" | "likely_human" | "uncertain" | "likely_ai" | "ai"
}

Key signals to look for:
- Generic praise without specifics ("great service", "highly recommend") → AI signal
- Mentions of specific details (dates, names, unique experiences) → human signal
- Unnatural "burstiness": AI text tends to have uniform sentence complexity
- Hebrew/English mixing that feels unnatural → AI signal
- Review that sounds like a product description → AI signal
- Typos, colloquialisms, emotional language → human signal`,
            },
            {
              role:    "user",
              content: `Analyze this review:\n\n"${review_text.slice(0, 1500)}"`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        // Non-fatal: log and return neutral
        console.error("AI text analysis failed:", aiResponse.status);
        return jsonResp({ is_ai_generated: false, confidence: 0, verdict: "uncertain" }, 200, cors);
      }

      const aiResult  = await aiResponse.json();
      const rawContent = aiResult.choices?.[0]?.message?.content ?? "{}";
      let analysis: Record<string, unknown> = {};
      try {
        analysis = JSON.parse(rawContent.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      } catch { /* fall through to defaults */ }

      const isAi       = analysis.is_ai_generated as boolean ?? false;
      const confidence = analysis.confidence       as number  ?? 0;
      const verdict    = analysis.verdict          as string  ?? "uncertain";

      // Insert verification log
      await db.from("verification_logs").insert({
        review_id,
        user_id:     userId,
        business_id: business_id ?? null,
        method:      "ai_text",
        passed:      !isAi,
        confidence_score: isAi ? confidence : (1 - confidence),
        metadata_flags: {
          perplexity_estimate: analysis.perplexity_estimate,
          burstiness_estimate: analysis.burstiness_estimate,
          signals:             analysis.signals,
          verdict,
        },
        reason: `AI text verdict: ${verdict} (confidence ${Math.round((confidence as number) * 100)}%)`,
      });

      // Escalate if strong AI signal
      if (isAi && (confidence as number) >= 0.80) {
        await db.from("fraud_alerts").insert({
          user_id:        userId,
          review_id,
          business_id:    business_id ?? null,
          alert_type:     "ai_generated_text",
          severity:       confidence >= 0.95 ? "high" : "medium",
          status:         "open",
          review_hidden:  confidence >= 0.95,
          evidence:       analysis,
        });

        if ((confidence as number) >= 0.95) {
          await db.from("reviews")
            .update({ afve_status: "flagged", is_hidden: true })
            .eq("id", review_id);
        }
      }

      // Recalculate trust score
      if (userId) {
        await db.rpc("fn_calculate_trust_score", { p_user_id: userId });
      }

      return jsonResp({
        is_ai_generated: isAi,
        confidence,
        verdict,
        perplexity:  analysis.perplexity_estimate,
        burstiness:  analysis.burstiness_estimate,
        signals:     analysis.signals,
      }, 200, cors);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PILLAR 2 — create_merchant_queue: enqueue verification for Pro business
    // ════════════════════════════════════════════════════════════════════════
    if (action === "create_merchant_queue") {
      const { review_id, business_id, invoice_hash, invoice_amount, invoice_number, invoice_date } = body;

      if (!review_id || !business_id || !invoice_hash) {
        return jsonResp({ error: "review_id, business_id, invoice_hash required" }, 400, cors);
      }

      // Only enqueue for Pro/Business tier
      const { data: biz } = await db
        .from("businesses")
        .select("subscription_tier")
        .eq("id", business_id)
        .maybeSingle();

      if (!biz || !["pro", "business"].includes(biz.subscription_tier ?? "")) {
        return jsonResp({
          skipped: true,
          reason: "Merchant verification requires Pro or Business subscription",
        }, 200, cors);
      }

      const { data: queueRow, error: qErr } = await db
        .from("merchant_verif_queue")
        .insert({
          review_id,
          business_id,
          user_id:        userId,
          invoice_hash,
          invoice_amount: invoice_amount ?? null,
          invoice_number: invoice_number ?? null,
          invoice_date:   invoice_date   ?? null,
        })
        .select("id, confirm_token, expires_at")
        .single();

      if (qErr) throw qErr;

      // NOTE: In production, send email to business owner here via Resend.
      // The email would contain a link like:
      //   https://reviewhub.co.il/business/verify-invoice?token=<confirm_token>

      return jsonResp({
        queued:       true,
        queue_id:     queueRow.id,
        expires_at:   queueRow.expires_at,
        confirm_url:  `/business/verify-invoice?token=${queueRow.confirm_token}`,
      }, 200, cors);
    }

    return jsonResp({ error: "Unknown action" }, 400, cors);

  } catch (err) {
    console.error("afve-check error:", err);
    return jsonResp({ error: "Internal server error" }, 500, cors);
  }
});

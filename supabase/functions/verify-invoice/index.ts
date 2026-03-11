import { serve }            from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient }     from "https://esm.sh/@supabase/supabase-js@2";
import { checkAiRateLimit } from "../_shared/rate-limit.ts";
import { getCorsHeaders }   from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: require valid JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create a user-scoped client for auth verification
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { action, businessId, filePath, receiptId } = await req.json();

    // ── Ownership check: caller must own the business ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (bizErr || !business) {
      return new Response(JSON.stringify({ error: "Forbidden: you do not own this business" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit: 10 AI invoice-verify calls per user per day ───────────
    const rateCheck = await checkAiRateLimit(supabase, userId, "verify-invoice", corsHeaders);
    if (!rateCheck.allowed) return rateCheck.response!;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "analyze_template") {
      const { data: signedUrl } = await supabase.storage
        .from("invoices")
        .createSignedUrl(filePath, 600);

      if (!signedUrl?.signedUrl) throw new Error("Could not create signed URL");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an invoice/receipt analysis AI. Analyze the document at the provided URL and extract identifying features. Return a JSON object with:
- business_name: string (the business name on the document)
- document_type: "invoice" | "receipt" | "unknown"
- logo_description: string (describe the logo/branding)
- layout_features: string[] (key layout elements like header position, table format, footer content)
- unique_identifiers: string[] (recurring patterns like document number format, specific text)
- currency: string
- language: string
Respond ONLY with valid JSON, no markdown.`,
            },
            {
              role: "user",
              content: `Analyze this invoice/receipt document: ${signedUrl.signedUrl}`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI analysis error:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI analysis failed");
      }

      const aiResult = await aiResponse.json();
      const content = aiResult.choices?.[0]?.message?.content || "{}";
      
      let extractedData = {};
      try {
        extractedData = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      } catch {
        extractedData = { raw: content };
      }

      await supabase
        .from("invoice_templates")
        .update({ ai_extracted_data: extractedData })
        .eq("business_id", businessId)
        .eq("file_path", filePath);

      return new Response(JSON.stringify({ success: true, extracted: extractedData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_receipt") {
      const { data: templates } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("business_id", businessId);

      if (!templates || templates.length === 0) {
        await supabase
          .from("customer_receipts")
          .update({ verification_status: "manual_review", ai_match_score: 0 })
          .eq("id", receiptId);

        return new Response(JSON.stringify({ verified: false, match_score: 0, reason: "no_templates" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: receiptUrl } = await supabase.storage
        .from("invoices")
        .createSignedUrl(filePath, 600);

      if (!receiptUrl?.signedUrl) throw new Error("Could not create signed URL for receipt");

      const templateDescriptions = templates.map((t: any) => {
        const data = t.ai_extracted_data || {};
        return `Template: business_name="${data.business_name || "unknown"}", type="${data.document_type || "unknown"}", logo="${data.logo_description || "unknown"}", identifiers=${JSON.stringify(data.unique_identifiers || [])}, layout=${JSON.stringify(data.layout_features || [])}`;
      }).join("\n");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a receipt verification AI. Compare a customer's receipt against known invoice templates from a business. Determine if the receipt is genuine and from the same business.

Known business templates:
${templateDescriptions}

Analyze the customer receipt and return ONLY valid JSON:
{
  "match_score": number (0.0 to 1.0),
  "verified": boolean (true if match_score >= 0.7),
  "confidence": "high" | "medium" | "low",
  "reasons": string[] (why it matches or doesn't),
  "flagged": boolean (true if suspicious/fraudulent)
}`,
            },
            {
              role: "user",
              content: `Verify this customer receipt: ${receiptUrl.signedUrl}`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI verify error:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI verification failed");
      }

      const verifyResult = await aiResponse.json();
      const verifyContent = verifyResult.choices?.[0]?.message?.content || "{}";

      let result = { match_score: 0, verified: false, confidence: "low", reasons: [], flagged: false };
      try {
        result = JSON.parse(verifyContent.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      } catch {
        // Parsing failed — manual review
      }

      let status = "rejected";
      if (result.verified && !result.flagged) {
        status = "verified";
      } else if (result.flagged) {
        status = "flagged";
      } else if (result.match_score >= 0.4) {
        status = "manual_review";
      }

      await supabase
        .from("customer_receipts")
        .update({
          verification_status: status,
          ai_match_score: result.match_score,
          ai_analysis: result,
          reviewed_at: status === "verified" ? new Date().toISOString() : null,
        })
        .eq("id", receiptId);

      return new Response(JSON.stringify({
        verified: status === "verified",
        match_score: result.match_score,
        confidence: result.confidence,
        status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-invoice error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

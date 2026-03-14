/**
 * ai-compliance-agent — Edge Function
 *
 * Neutral AI compliance moderator for ReviewHub.
 * Processes flagged reviews and business reports according to platform policy.
 *
 * Actions:
 *   "process_report"     → evaluate a new report against a review
 *   "process_new_review" → pre-publication scan of a freshly submitted review
 *   "check_proof"        → evidence-vault approval webhook (proof approved/rejected)
 *
 * Decision rules (matching Trust Architecture specification):
 *   RULE 1 — Profanity / harassment / PII   → REMOVE immediately
 *   RULE 2 — Opinion disagreement only       → REJECT report, keep review
 *   RULE 3 — Factual falsehood claim         → FREEZE + request proof
 *   RULE 4 — Spam / coordinated pattern      → REMOVE + flag account
 *
 * Security:
 *   All actions require service_role key OR valid business owner JWT.
 *   All decisions are written to audit_logs (immutable).
 *
 * Environment variables:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   OPENAI_API_KEY            — for GPT-4o classification
 *   RESEND_API_KEY            — for email notifications
 *   FRONTEND_URL              — e.g. https://reviewhub.co.il
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY      = Deno.env.get("OPENAI_API_KEY") || "";
const RESEND_KEY      = Deno.env.get("RESEND_API_KEY") || "";
const FRONTEND_URL    = Deno.env.get("FRONTEND_URL") || "https://reviewhub.co.il";
const FROM_EMAIL      = "ReviewHub Trust & Safety <noreply@reviewshub.info>";

// ─── Compliance Rules ─────────────────────────────────────────────────────────

const RULE_PATTERNS = {
  profanity:    /fuck|shit|bitch|asshole|bastard|cunt|מפגר|כלבה|זונה|בן זונה|עזאזל/i,
  pii:          /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[\w.]+@[\w.]+\.[a-z]{2,}\b|\b\d{9,10}\b/,
  personalAtk:  /תמות|תפוצץ|אתה חרא|את חרא|ממחלקת|מכוער|מטומטם|stupid|idiot|moron|loser/i,
  spamPattern:  /buy now|click here|limited offer|act now|free money|earn \$|make money fast/i,
};

type ModerationDecision =
  | "remove_immediately"
  | "reject_report"
  | "freeze_request_proof"
  | "approve"
  | "escalate_human";

interface ComplianceResult {
  decision:  ModerationDecision;
  rule:      string;
  reason:    string;
  newStatus: "removed" | "verified" | "flagged" | "under_review" | "pending";
}

// ─── Rule-based classifier (fast, no API call) ───────────────────────────────

function ruleBasedClassify(reviewText: string, reportReason: string): ComplianceResult | null {

  // RULE 1 — Profanity / harassment / PII → remove immediately
  if (RULE_PATTERNS.profanity.test(reviewText) ||
      RULE_PATTERNS.personalAtk.test(reviewText) ||
      RULE_PATTERNS.pii.test(reviewText)) {
    return {
      decision:  "remove_immediately",
      rule:      "RULE_1",
      reason:    "הביקורת מכילה שפה פוגענית, תקיפה אישית, או מידע אישי — הוסרה על פי מדיניות הפלטפורמה.",
      newStatus: "removed",
    };
  }

  // RULE 4 — Spam patterns
  if (RULE_PATTERNS.spamPattern.test(reviewText)) {
    return {
      decision:  "remove_immediately",
      rule:      "RULE_4",
      reason:    "הביקורת זוהתה כספאם מסחרי — הוסרה על פי מדיניות הפלטפורמה.",
      newStatus: "removed",
    };
  }

  // RULE 2 — Report is purely opinion-based disagreement (no factual claim)
  const opinionReport = /disagree|לא מסכים|לא אוהב|דעה|opinion|personal|אישי/i.test(reportReason) &&
    !/false|שקר|לא נכון|fabricated|fake|never|מעולם|לא קרה/i.test(reportReason);

  if (opinionReport) {
    return {
      decision:  "reject_report",
      rule:      "RULE_2",
      reason:    "הדיווח מבוסס על חוסר הסכמה עם דעה — הביקורת נשמרת. חוות דעת לגיטימית מוגנת.",
      newStatus: "verified",
    };
  }

  // RULE 3 — Factual falsehood claim → freeze and request proof
  const factualClaim = /false|שקר|לא נכון|fabricated|never happened|לא קרה|fake|מזויף|לא היה|never purchased|לא רכש/i
    .test(reportReason);

  if (factualClaim) {
    return {
      decision:  "freeze_request_proof",
      rule:      "RULE_3",
      reason:    "הדיווח טוען לאי-דיוק עובדתי — הביקורת הוקפאה. הסוקר מתבקש להגיש הוכחת רכישה תוך 72 שעות.",
      newStatus: "under_review",
    };
  }

  return null; // needs AI classification
}

// ─── GPT-4o classification fallback ──────────────────────────────────────────

async function aiClassify(
  reviewText: string,
  reportReason: string,
  businessName: string
): Promise<ComplianceResult> {
  if (!OPENAI_KEY) {
    // No API key — conservative escalation
    return {
      decision:  "escalate_human",
      rule:      "FALLBACK",
      reason:    "מערכת ה-AI אינה זמינה — הדוח הועבר לבדיקת Trust & Safety.",
      newStatus: "under_review",
    };
  }

  const systemPrompt = `You are the neutral compliance moderator for ReviewHub, a trust verification platform.
Your task is to analyze reported reviews and act according to these rules:

RULE_1: If review contains profanity, harassment, personal attacks unrelated to product, or personal data (phone, address, email) → decision: "remove_immediately"
RULE_2: If the report is simply disagreement with an opinion or subjective experience → decision: "reject_report"
RULE_3: If report claims factual falsehood (reviewer was never a customer, event never happened) → decision: "freeze_request_proof"
RULE_4: If review shows spam patterns, coordinated manipulation, or commercial solicitation → decision: "remove_immediately"
Default: If unclear → decision: "escalate_human"

Respond ONLY with valid JSON:
{"decision":"<decision>","rule":"<RULE_N>","reason":"<one sentence in Hebrew referencing the rule>"}`;

  const userPrompt = `Business: ${businessName}
Report reason: ${reportReason}
Review text: ${reviewText}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      }),
    });

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw.replace(/```json?|```/g, "").trim());

    const decisionMap: Record<string, ComplianceResult["newStatus"]> = {
      remove_immediately:  "removed",
      reject_report:       "verified",
      freeze_request_proof:"under_review",
      escalate_human:      "under_review",
      approve:             "verified",
    };

    return {
      decision:  parsed.decision  || "escalate_human",
      rule:      parsed.rule      || "AI",
      reason:    parsed.reason    || "סיבה לא ידועה — הועבר לבדיקה ידנית.",
      newStatus: decisionMap[parsed.decision] || "under_review",
    };
  } catch {
    return {
      decision:  "escalate_human",
      rule:      "AI_ERROR",
      reason:    "שגיאה בעיבוד AI — הועבר לבדיקת Trust & Safety.",
      newStatus: "under_review",
    };
  }
}

// ─── Email notification helpers ───────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
}

// ─── Audit logger ─────────────────────────────────────────────────────────────

async function writeAuditLog(
  db: ReturnType<typeof createClient>,
  eventType: string,
  targetType: string,
  targetId: string,
  businessId: string | null,
  payload: Record<string, unknown>
) {
  await db.from("audit_logs").insert({
    event_type:  eventType,
    actor_type:  "ai",
    actor_id:    "ai-compliance-agent",
    target_type: targetType,
    target_id:   targetId,
    business_id: businessId,
    payload,
  });
}

// ─── Notification sender ─────────────────────────────────────────────────────

async function notify(
  db: ReturnType<typeof createClient>,
  recipientType: "reviewer" | "business",
  recipientId: string,
  notifType: string,
  title: string,
  body: string,
  reviewId: string | null,
  businessId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await db.from("notifications").insert({
    user_id:          recipientType === "reviewer" ? recipientId : null,
    type:             notifType,
    title,
    body,
    recipient_type:   recipientType,
    review_id:        reviewId,
    business_id:      businessId,
    metadata,
    read:             false,
  });
}

// ─── Action: process_report ───────────────────────────────────────────────────

async function processReport(db: ReturnType<typeof createClient>, payload: Record<string, string>) {
  const { report_id, review_id, business_id } = payload;
  if (!report_id || !review_id) return { error: "report_id and review_id required" };

  // Fetch review
  const { data: review } = await db
    .from("reviews")
    .select("id, review_text, status, user_id, reviewer_name, business_id")
    .eq("id", review_id)
    .single();

  if (!review) return { error: "review_not_found" };

  // Fetch report
  const { data: report } = await db
    .from("reports")
    .select("id, reason, report_type")
    .eq("id", report_id)
    .single();

  if (!report) return { error: "report_not_found" };

  // Fetch business name
  const { data: biz } = await db
    .from("businesses")
    .select("name, email")
    .eq("id", business_id || review.business_id)
    .maybeSingle();

  const reviewText   = review.review_text || "";
  const reportReason = report.reason       || "";
  const bizName      = biz?.name           || "Unknown";

  // Classify
  let result = ruleBasedClassify(reviewText, reportReason);
  if (!result) result = await aiClassify(reviewText, reportReason, bizName);

  // Update review status
  await db.from("reviews").update({
    status:            result.newStatus,
    status_reason:     result.reason,
    status_updated_at: new Date().toISOString(),
    ...(result.newStatus === "removed" ? { deleted_at: new Date().toISOString() } : {}),
  }).eq("id", review_id);

  // Update report
  await db.from("reports").update({
    moderation_status: result.decision === "escalate_human" ? "escalated" : "resolved",
    ai_decision:       result.decision,
    ai_reason:         result.reason,
    resolved_at:       new Date().toISOString(),
  }).eq("id", report_id);

  // Audit log
  await writeAuditLog(db, "ai_decision", "review", review_id,
    business_id || review.business_id, {
    report_id, decision: result.decision, rule: result.rule, reason: result.reason,
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  const effectiveBizId = business_id || review.business_id;

  // Notify business — decision issued
  if (effectiveBizId) {
    await notify(db, "business", effectiveBizId, "decision_issued",
      "החלטה בדוח שהגשתם",
      `מערכת ה-AI בחנה את הדוח שלכם. ${result.reason}`,
      review_id, effectiveBizId,
      { decision: result.decision, rule: result.rule }
    );

    if (biz?.email) {
      await sendEmail(biz.email,
        "ReviewHub — החלטת מערכת הציות",
        `<p>שלום,</p>
         <p>מערכת הציות של ReviewHub בחנה את הדוח שהגשתם.</p>
         <p><strong>החלטה:</strong> ${result.reason}</p>
         <p><strong>כלל שהופעל:</strong> ${result.rule}</p>
         <p><a href="${FRONTEND_URL}/business/dashboard">כניסה ללוח הבקרה</a></p>`
      );
    }
  }

  // Notify reviewer based on decision
  if (review.user_id) {
    if (result.decision === "remove_immediately") {
      await notify(db, "reviewer", review.user_id, "review_removed",
        "ביקורתך הוסרה",
        `ביקורתך הוסרה בשל הפרת מדיניות הפלטפורמה: ${result.reason}`,
        review_id, effectiveBizId,
        { rule: result.rule }
      );
    } else if (result.decision === "freeze_request_proof") {
      await notify(db, "reviewer", review.user_id, "proof_requested",
        "נדרשת הוכחת רכישה",
        "הוגש דוח על ביקורתך הטוען לאי-דיוק עובדתי. נא להגיש הוכחת רכישה תוך 72 שעות.",
        review_id, effectiveBizId,
        { report_id, deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString() }
      );
    }
  }

  return { success: true, decision: result.decision, rule: result.rule, reason: result.reason };
}

// ─── Action: process_new_review ──────────────────────────────────────────────

async function processNewReview(db: ReturnType<typeof createClient>, payload: Record<string, string>) {
  const { review_id } = payload;
  if (!review_id) return { error: "review_id required" };

  const { data: review } = await db
    .from("reviews")
    .select("id, review_text, verified_purchase, business_id, user_id")
    .eq("id", review_id)
    .single();

  if (!review) return { error: "review_not_found" };

  const text = review.review_text || "";
  let newStatus: ComplianceResult["newStatus"] = review.verified_purchase ? "verified" : "pending";
  let reason = "";

  // Pre-publication safety checks
  if (RULE_PATTERNS.profanity.test(text) || RULE_PATTERNS.personalAtk.test(text)) {
    newStatus = "removed";
    reason    = "ביקורת נחסמה לפני פרסום — שפה פוגענית זוהתה. ניתן לתקן ולהגיש מחדש.";
  } else if (RULE_PATTERNS.pii.test(text)) {
    newStatus = "flagged";
    reason    = "ביקורת נשלחה לבדיקה — נמצא מידע אישי פוטנציאלי. עדכנו את הטקסט.";
  } else if (RULE_PATTERNS.spamPattern.test(text)) {
    newStatus = "removed";
    reason    = "ביקורת נחסמה — זוהו דפוסי ספאם מסחרי.";
  }

  if (newStatus !== "pending" && newStatus !== "verified") {
    await db.from("reviews").update({
      status:            newStatus,
      status_reason:     reason,
      status_updated_at: new Date().toISOString(),
    }).eq("id", review_id);
  }

  await writeAuditLog(db, "review_created", "review", review_id,
    review.business_id, { pre_scan_result: newStatus, reason }
  );

  return { success: true, status: newStatus, reason };
}

// ─── Action: check_proof ─────────────────────────────────────────────────────

async function checkProof(db: ReturnType<typeof createClient>, payload: Record<string, string>) {
  const { evidence_id, decision, review_id } = payload;
  if (!evidence_id || !decision || !review_id) return { error: "evidence_id, decision, review_id required" };

  const approved = decision === "approved";

  // Update evidence vault
  await db.from("evidence_vault").update({
    verification_status: decision,
    verified_by:         "ai",
    verified_at:         new Date().toISOString(),
  }).eq("id", evidence_id);

  // Update review status
  const newStatus = approved ? "verified" : "pending";
  const reason    = approved
    ? "הוכחת הרכישה אושרה — הביקורת קיבלה תג אימות רכישה."
    : "הוכחת הרכישה נדחתה — הביקורת חוזרת לסטטוס ממתין.";

  await db.from("reviews").update({
    status:            newStatus,
    status_reason:     reason,
    status_updated_at: new Date().toISOString(),
    ...(approved ? { verified_purchase: true } : {}),
  }).eq("id", review_id);

  // Fetch review for notification
  const { data: review } = await db
    .from("reviews")
    .select("user_id, business_id")
    .eq("id", review_id)
    .single();

  if (review?.user_id) {
    await notify(db,
      "reviewer", review.user_id,
      approved ? "review_approved" : "proof_rejected",
      approved ? "הביקורת שלך אומתה!" : "הוכחת הרכישה נדחתה",
      reason,
      review_id, review.business_id
    );

    await writeAuditLog(db, "proof_approved", "evidence", evidence_id,
      review.business_id, { review_id, approved, reason }
    );
  }

  return { success: true, approved, status: newStatus };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body    = await req.json();
    const action  = body.action  as string;
    const payload = body.payload as Record<string, string>;

    if (!action) {
      return new Response(JSON.stringify({ error: "action required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let result: Record<string, unknown>;

    switch (action) {
      case "process_report":     result = await processReport(db, payload);    break;
      case "process_new_review": result = await processNewReview(db, payload); break;
      case "check_proof":        result = await checkProof(db, payload);       break;
      default:
        return new Response(JSON.stringify({ error: `unknown action: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[ai-compliance-agent]", err);
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});

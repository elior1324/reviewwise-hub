/**
 * ModerationCaseTracker.tsx
 *
 * Internal moderation case management UI for the business dashboard.
 * Shows all moderation cases for a business with their workflow status
 * and allows the business owner to track the decision lifecycle.
 *
 * Case workflow:
 *   report_received → under_review → proof_requested → proof_received
 *                                                     → decision_issued
 *                   → closed_no_action
 *
 * This satisfies the "Moderation Case Tracking" requirement:
 *   structured internal system with clear status transitions and
 *   displayed decision outcomes for legal defensibility.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Flag, SearchCheck, FileQuestion, FileCheck2, Gavel,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Clock,
  ExternalLink
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CaseStatus =
  | "report_received"
  | "under_review"
  | "proof_requested"
  | "proof_received"
  | "decision_issued"
  | "closed_no_action"
  | "escalated";

interface ModerationCase {
  id: string;
  review_id: string;
  status: CaseStatus;
  report_reason: string;
  report_category: string | null;
  source: string;
  decision: string | null;
  decision_reason: string | null;
  decided_at: string | null;
  proof_deadline: string | null;
  created_at: string;
  reviews?: {
    text: string;
  } | null;
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  CaseStatus,
  { label: string; icon: React.ElementType; color: string; bg: string; step: number }
> = {
  report_received:  { label: "דיווח התקבל",      icon: Flag,         color: "text-muted-foreground",                          bg: "bg-muted/40",          step: 1 },
  under_review:     { label: "בבדיקה",             icon: SearchCheck,  color: "text-blue-600 dark:text-blue-400",               bg: "bg-blue-500/10",       step: 2 },
  proof_requested:  { label: "הוכחה נדרשת",       icon: FileQuestion, color: "text-amber-600 dark:text-amber-400",             bg: "bg-amber-500/10",      step: 3 },
  proof_received:   { label: "הוכחה התקבלה",      icon: FileCheck2,   color: "text-emerald-600 dark:text-emerald-400",         bg: "bg-emerald-500/10",    step: 4 },
  decision_issued:  { label: "הוחלט",              icon: Gavel,        color: "text-primary",                                   bg: "bg-primary/10",        step: 5 },
  closed_no_action: { label: "נסגר — ללא פעולה",  icon: CheckCircle2, color: "text-green-600 dark:text-green-400",             bg: "bg-green-500/10",      step: 5 },
  escalated:        { label: "הועלה לדרג גבוה",   icon: AlertTriangle,color: "text-destructive",                               bg: "bg-destructive/10",    step: 5 },
};

const WORKFLOW_STEPS: { key: CaseStatus | "pending_decision"; label: string; icon: React.ElementType }[] = [
  { key: "report_received",  label: "דיווח התקבל",    icon: Flag },
  { key: "under_review",     label: "בבדיקה",          icon: SearchCheck },
  { key: "proof_requested",  label: "הוכחה נדרשת",    icon: FileQuestion },
  { key: "pending_decision", label: "הכרעה ממתינה",   icon: Clock },
  { key: "decision_issued",  label: "הוחלט",           icon: Gavel },
];

const DECISION_LABELS: Record<string, string> = {
  remove:          "ביקורת הוסרה",
  keep:            "ביקורת נשארת",
  edit_required:   "נדרש עריכה",
  warn_reviewer:   "אזהרה לכותב",
  warn_business:   "אזהרה לעסק",
};

const CATEGORY_LABELS: Record<string, string> = {
  spam:          "ספאם",
  fake:          "ביקורת מזויפת",
  harmful:       "תוכן פוגעני",
  personal_info: "מידע אישי",
  off_topic:     "לא רלוונטי",
  other:         "אחר",
};

const SOURCE_LABELS: Record<string, string> = {
  user_report:     "דיווח משתמש",
  ai_flag:         "סימון AI",
  business_report: "דיווח עסק",
  system:          "מערכת אוטומטית",
};

// ─── WorkflowProgress ────────────────────────────────────────────────────────

const WorkflowProgress = ({ status }: { status: CaseStatus }) => {
  const currentStep = STATUS_META[status]?.step ?? 1;
  const isTerminal = ["decision_issued", "closed_no_action", "escalated"].includes(status);

  return (
    <div className="flex items-center gap-1 mt-2">
      {WORKFLOW_STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = isTerminal ? stepNum <= 5 : stepNum < currentStep;
        const isActive = !isTerminal && stepNum === currentStep;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    transition-colors cursor-help
                    ${isActive ? "bg-primary text-primary-foreground" :
                      isDone  ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                                "bg-muted/40 text-muted-foreground/40"}`}
                >
                  <Icon size={10} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{step.label}</TooltipContent>
            </Tooltip>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`h-px w-4 ${isDone ? "bg-green-500/40" : "bg-border/40"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── CaseRow ─────────────────────────────────────────────────────────────────

const CaseRow = ({ c }: { c: ModerationCase }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[c.status] ?? STATUS_META.report_received;
  const Icon = meta.icon;

  const proofDeadline = c.proof_deadline ? new Date(c.proof_deadline) : null;
  const proofExpired  = proofDeadline && proofDeadline < new Date();
  const proofHours    = proofDeadline
    ? Math.max(0, Math.round((proofDeadline.getTime() - Date.now()) / 3_600_000))
    : null;

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-right"
        type="button"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
          <Icon size={14} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} border-current/20`}>
              {meta.label}
            </span>
            {c.report_category && (
              <span className="text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                {CATEGORY_LABELS[c.report_category] ?? c.report_category}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {SOURCE_LABELS[c.source] ?? c.source}
            </span>
          </div>
          <p className="text-xs text-foreground/80 mt-1 truncate">
            {c.reviews?.text
              ? `"${c.reviews.text.slice(0, 80)}${c.reviews.text.length > 80 ? "…" : ""}"`
              : `תיק #${c.id.slice(0, 8)}`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            נפתח: {new Date(c.created_at).toLocaleDateString("he-IL")}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/30 px-4 py-3 space-y-3 bg-muted/10">
          {/* Workflow progress */}
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wide mb-1">
              מסלול הטיפול
            </p>
            <WorkflowProgress status={c.status} />
          </div>

          {/* Reason */}
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wide mb-0.5">
              סיבת הדיווח
            </p>
            <p className="text-xs text-foreground/80">{c.report_reason}</p>
          </div>

          {/* Proof deadline */}
          {c.status === "proof_requested" && proofDeadline && (
            <div className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2
              ${proofExpired
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}
            >
              <Clock size={12} />
              {proofExpired
                ? "המועד האחרון חלף — ממתין להחלטה"
                : `הוכחה נדרשת בתוך ${proofHours} שעות (עד ${proofDeadline.toLocaleDateString("he-IL")})`}
            </div>
          )}

          {/* Decision */}
          {c.decision && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-wide mb-0.5">
                הכרעה
              </p>
              <p className="text-xs font-semibold text-primary">
                {DECISION_LABELS[c.decision] ?? c.decision}
              </p>
              {c.decision_reason && (
                <p className="text-xs text-muted-foreground mt-1">{c.decision_reason}</p>
              )}
              {c.decided_at && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  הוחלט ב: {new Date(c.decided_at).toLocaleDateString("he-IL")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface ModerationCaseTrackerProps {
  businessId: string;
  isDemo?: boolean;
}

const ModerationCaseTracker = ({ businessId, isDemo = false }: ModerationCaseTrackerProps) => {
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all");

  useEffect(() => {
    if (isDemo) {
      setCases([]);
      return;
    }
    const fetchCases = async () => {
      setLoading(true);
      const { data } = await (supabase.from as any)("moderation_cases")
        .select("*, reviews(text)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);
      setCases((data as ModerationCase[]) ?? []);
      setLoading(false);
    };
    fetchCases();
  }, [businessId, isDemo]);

  const filtered = filterStatus === "all"
    ? cases
    : cases.filter(c => c.status === filterStatus);

  const counts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const openCount = cases.filter(c =>
    !["decision_issued", "closed_no_action"].includes(c.status)
  ).length;

  return (
    <Card className="shadow-card bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flag size={16} className="text-primary" />
          ניהול תיקי ציות
          {openCount > 0 && (
            <span className="ml-1 bg-destructive text-destructive-foreground text-[10px]
              font-bold px-1.5 py-0.5 rounded-full leading-none">
              {openCount} פתוחים
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          כל הדיווחים שהתקבלו על ביקורות העסק — כולל סטטוס, ראיות, והחלטות.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2">
          {(["report_received", "under_review", "proof_requested", "decision_issued"] as CaseStatus[]).map(s => {
            const m = STATUS_META[s];
            const Icon = m.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(prev => prev === s ? "all" : s)}
                className={`rounded-lg border p-2 text-center transition-colors cursor-pointer
                  ${filterStatus === s ? `${m.bg} border-current/30 ${m.color}` : "border-border/30 hover:bg-muted/20"}`}
              >
                <Icon size={14} className={`mx-auto mb-0.5 ${m.color}`} />
                <p className="text-lg font-bold">{counts[s] ?? 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors
              ${filterStatus === "all"
                ? "bg-primary text-primary-foreground border-transparent"
                : "border-border/40 text-muted-foreground hover:bg-muted/20"}`}
          >
            הכל ({cases.length})
          </button>
          {(Object.entries(STATUS_META) as [CaseStatus, typeof STATUS_META[CaseStatus]][]).map(([key, m]) =>
            counts[key] ? (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(prev => prev === key ? "all" : key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                  ${filterStatus === key
                    ? `${m.bg} ${m.color} border-current/30`
                    : "border-border/40 text-muted-foreground hover:bg-muted/20"}`}
              >
                {m.label} ({counts[key]})
              </button>
            ) : null
          )}
        </div>

        {/* Cases list */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">טוען תיקים...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">אין תיקים פתוחים</p>
            <p className="text-xs text-muted-foreground mt-1">
              לא התקבלו דיווחים על ביקורות העסק שלכם.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => <CaseRow key={c.id} c={c} />)}
          </div>
        )}

        {/* Explainer note */}
        <p className="text-[10px] text-muted-foreground/60 leading-snug border-t border-border/30 pt-3">
          מערכת ניהול תיקי הציות מאפשרת שקיפות מלאה לגבי דיווחים על ביקורות העסק שלכם.
          כל שלב בתהליך מתועד ונשמר לטובת ביקורות משפטיות.
          <a
            href="https://reviewhub.co.il/trust"
            target="_blank"
            rel="noopener"
            className="text-primary/70 hover:text-primary ml-1 inline-flex items-center gap-0.5"
          >
            מדיניות ציות <ExternalLink size={9} />
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default ModerationCaseTracker;

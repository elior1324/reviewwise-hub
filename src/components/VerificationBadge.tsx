/**
 * VerificationBadge — Shows how a review was verified by the AFVE.
 *
 * Renders a compact pill badge with a tooltip explaining the verification method.
 *
 * Methods:
 *   invoice_hash       — SHA-256 file fingerprint matched known invoice
 *   merchant_confirmed — Business owner confirmed the invoice is genuine
 *   e2v_email          — SPF/DKIM/DMARC email chain verified
 *   ai_metadata        — AI forensic scan passed (PDF metadata clean)
 *   ai_text            — Review text passed LLM-detection analysis
 *   manual_admin       — Verified by ReviewHub staff
 *
 * Composite badge: if multiple methods passed, shows the strongest + count.
 *
 * Usage:
 *   <VerificationBadge methods={['merchant_confirmed', 'invoice_hash']} score={0.97} />
 *   <VerificationBadge methods={['ai_metadata']} size="sm" />
 *   <VerificationBadge status="flagged" />
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
  CheckCircle2,
  Hash,
  Store,
  Mail,
  Cpu,
  FileSearch,
  UserCheck,
  X,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationMethod =
  | "invoice_hash"
  | "merchant_confirmed"
  | "e2v_email"
  | "ai_metadata"
  | "ai_text"
  | "manual_admin";

export type AfveStatus =
  | "pending"
  | "verified"
  | "partial"
  | "flagged"
  | "rejected"
  | "manual_review";

export interface VerificationBadgeProps {
  /** Which AFVE methods passed for this review */
  methods?: VerificationMethod[];
  /** Composite AFVE confidence score 0–1 */
  score?: number;
  /** Current AFVE status of the review */
  status?: AfveStatus;
  /** Badge size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Show full label text (otherwise icon-only for xs/sm) */
  showLabel?: boolean;
  className?: string;
}

// ─── Method metadata ──────────────────────────────────────────────────────────

const METHOD_META: Record<VerificationMethod, {
  label:    string;
  labelHe:  string;
  icon:     React.FC<{ size?: number; className?: string }>;
  color:    string;
  weight:   number;  // higher = more authoritative, shown first
  tooltip:  string;
}> = {
  merchant_confirmed: {
    label:   "Merchant Verified",
    labelHe: "אומת על-ידי העסק",
    icon:    Store,
    color:   "text-emerald-600 dark:text-emerald-400",
    weight:  10,
    tooltip: "בעל העסק אישר ידנית שהקבלה אמיתית ושייכת לרכישה זו.",
  },
  e2v_email: {
    label:   "Email Chain Verified",
    labelHe: "מייל מאומת",
    icon:    Mail,
    color:   "text-blue-600 dark:text-blue-400",
    weight:  9,
    tooltip: "המשתמש העביר את מייל הקבלה המקורי. SPF, DKIM ו-DMARC עברו בהצלחה.",
  },
  manual_admin: {
    label:   "Staff Verified",
    labelHe: "אומת ע\"י צוות",
    icon:    UserCheck,
    color:   "text-violet-600 dark:text-violet-400",
    weight:  8,
    tooltip: "צוות ReviewHub בדק את הביקורת ידנית ואישר את אמינותה.",
  },
  invoice_hash: {
    label:   "Invoice Hash",
    labelHe: "טביעת אצבע חשבונית",
    icon:    Hash,
    color:   "text-primary",
    weight:  7,
    tooltip: "גיבוב SHA-256 של הקובץ הועלה ואומת. הקובץ המקורי אינו נשמר (Safe Harbor).",
  },
  ai_metadata: {
    label:   "Forensic Scan",
    labelHe: "סריקה פורנזית",
    icon:    FileSearch,
    color:   "text-amber-600 dark:text-amber-400",
    weight:  5,
    tooltip: "סריקת מטא-דאטה של קובץ PDF/תמונה. לא זוהה שימוש בכלי עיצוב חשודים.",
  },
  ai_text: {
    label:   "AI Text Check",
    labelHe: "בדיקת טקסט AI",
    icon:    Cpu,
    color:   "text-indigo-600 dark:text-indigo-400",
    weight:  4,
    tooltip: "ניתוח Perplexity ו-Burstiness של טקסט הביקורת. לא זוהה כפלט של מודל שפה.",
  },
};

// ─── Status badge when methods are unknown ─────────────────────────────────────

const STATUS_META: Record<AfveStatus, {
  label:   string;
  icon:    React.FC<{ size?: number; className?: string }>;
  bg:      string;
  border:  string;
  text:    string;
}> = {
  verified:      { label: "מאומת",         icon: ShieldCheck,    bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300" },
  partial:       { label: "אימות חלקי",    icon: ShieldCheck,    bg: "bg-blue-50 dark:bg-blue-900/30",     border: "border-blue-200 dark:border-blue-700",     text: "text-blue-700 dark:text-blue-300"     },
  pending:       { label: "ממתין לאימות",  icon: ShieldQuestion, bg: "bg-muted",                            border: "border-border",                             text: "text-muted-foreground"                },
  manual_review: { label: "בבדיקה",        icon: ShieldAlert,    bg: "bg-amber-50 dark:bg-amber-900/30",   border: "border-amber-200 dark:border-amber-700",   text: "text-amber-700 dark:text-amber-300"   },
  flagged:       { label: "מסומן לבדיקה",  icon: ShieldAlert,    bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300" },
  rejected:      { label: "נדחה — זיוף",   icon: ShieldX,        bg: "bg-red-50 dark:bg-red-900/30",       border: "border-red-200 dark:border-red-700",       text: "text-red-700 dark:text-red-300"       },
};

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE: Record<string, { pill: string; icon: number; text: string; gap: string }> = {
  xs: { pill: "px-1.5 py-0.5 rounded text-[10px]",     icon: 10, text: "text-[10px]", gap: "gap-0.5" },
  sm: { pill: "px-2 py-0.5 rounded-full text-xs",       icon: 11, text: "text-xs",     gap: "gap-1"   },
  md: { pill: "px-2.5 py-1 rounded-full text-xs",       icon: 13, text: "text-xs",     gap: "gap-1.5" },
  lg: { pill: "px-3 py-1.5 rounded-full text-sm",       icon: 15, text: "text-sm",     gap: "gap-2"   },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VerificationBadge({
  methods = [],
  score,
  status = "pending",
  size = "md",
  showTooltip = true,
  showLabel = true,
  className = "",
}: VerificationBadgeProps) {
  const [open, setOpen] = useState(false);
  const sz = SIZE[size];

  // Sort methods by weight (strongest first)
  const sortedMethods = [...methods].sort(
    (a, b) => (METHOD_META[b]?.weight ?? 0) - (METHOD_META[a]?.weight ?? 0)
  );

  const primaryMethod = sortedMethods[0];
  const extraCount    = sortedMethods.length - 1;

  // Determine display variant
  const isVerified = status === "verified" || (methods.length > 0 && status !== "rejected" && status !== "flagged");

  const statusMeta  = STATUS_META[status] ?? STATUS_META.pending;
  const methodMeta  = primaryMethod ? METHOD_META[primaryMethod] : null;

  const ShieldIcon = methodMeta ? (isVerified ? ShieldCheck : ShieldAlert) : statusMeta.icon;
  const MethodIcon = methodMeta?.icon;

  // Colors: if verified and has a method, use method color; else use status color
  const textClass   = (isVerified && methodMeta) ? methodMeta.color : statusMeta.text;
  const bgClass     = isVerified ? "bg-emerald-50 dark:bg-emerald-900/30" : statusMeta.bg;
  const borderClass = isVerified ? "border-emerald-200 dark:border-emerald-700" : statusMeta.border;

  const label = methodMeta
    ? methodMeta.labelHe
    : statusMeta.label;

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Badge pill */}
      <button
        type="button"
        onClick={() => showTooltip && setOpen((v) => !v)}
        className={`
          inline-flex items-center border font-medium transition-all
          ${sz.pill} ${sz.gap} ${bgClass} ${borderClass} ${textClass}
          ${showTooltip ? "cursor-pointer hover:brightness-95" : "cursor-default"}
          focus:outline-none
        `}
        aria-label={`Verification: ${label}`}
      >
        <ShieldIcon size={sz.icon} className="flex-shrink-0" />
        {showLabel && (
          <>
            <span className={sz.text}>{label}</span>
            {MethodIcon && primaryMethod !== "invoice_hash" && (
              <MethodIcon size={sz.icon} className="opacity-70 flex-shrink-0" />
            )}
            {extraCount > 0 && (
              <span className={`${sz.text} opacity-70`}>+{extraCount}</span>
            )}
          </>
        )}
        {score != null && showLabel && (
          <span className={`${sz.text} opacity-60`}>
            {Math.round(score * 100)}%
          </span>
        )}
      </button>

      {/* Tooltip panel */}
      <AnimatePresence>
        {showTooltip && open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-4 text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-foreground">אימות AFVE</span>
                </div>
              </div>

              {/* Methods list */}
              {sortedMethods.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {sortedMethods.map((method) => {
                    const m = METHOD_META[method];
                    if (!m) return null;
                    const Icon = m.icon;
                    return (
                      <div key={method} className="flex items-start gap-2">
                        <div className={`mt-0.5 flex-shrink-0 ${m.color}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${m.color}`}>{m.labelHe}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{m.tooltip}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">{statusMeta.label}</p>
              )}

              {/* Score bar */}
              {score != null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">ציון אמון</span>
                    <span className="text-xs font-bold text-foreground">{Math.round(score * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className={`h-full rounded-full ${
                        score >= 0.8 ? "bg-emerald-500" : score >= 0.5 ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Footer note */}
              <div className="mt-3 pt-3 border-t border-border flex items-start gap-1.5">
                <Info size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  המסמך המקורי אינו נשמר. רק גיבוב SHA-256 נשמר לצורכי Safe Harbor ופרטיות.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compact inline variant ────────────────────────────────────────────────────

/**
 * TrustScorePill — shows a user's trust_score as a colored pill.
 * Usage: <TrustScorePill score={75} />
 */
export function TrustScorePill({ score }: { score: number }) {
  const clr =
    score >= 70  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
  : score >= 40  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
  :               "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700";

  const label =
    score >= 70 ? "אמינות גבוהה"
  : score >= 40 ? "אמינות בינונית"
  :               "אמינות נמוכה";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${clr}`}>
      <ShieldCheck size={11} />
      {label} · {score}
    </span>
  );
}

export default VerificationBadge;

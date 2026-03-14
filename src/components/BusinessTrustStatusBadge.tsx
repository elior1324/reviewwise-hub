/**
 * BusinessTrustStatusBadge.tsx
 *
 * Displays the platform-controlled trust status of a business.
 * Controlled by moderation logic; visible on the public business profile.
 *
 * States:
 *   normal       — no issues, default state
 *   under_review — ReviewHub is actively investigating reports about this business
 *   warning      — confirmed policy violation, business is on notice
 *   restricted   — severe or repeat violations; content limited
 *
 * Design:
 *   • "normal" shows nothing (or a small verified-operation chip for Pro+)
 *   • Non-normal states show a prominent, clearly worded notice
 *   • A "Why am I seeing this?" tooltip is always available
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, SearchCheck, AlertTriangle, Ban, HelpCircle } from "lucide-react";

export type BusinessTrustStatus = "normal" | "under_review" | "warning" | "restricted";

interface BusinessTrustStatusBadgeProps {
  status: BusinessTrustStatus;
  /** If true, renders as a full-width notice bar (for profile page top) */
  variant?: "badge" | "banner";
  /** Whether the viewing user is the business owner (shows extra detail) */
  isOwner?: boolean;
  /** Internal reason text, only shown to the owner */
  reason?: string | null;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  publicExplanation: string;
  ownerExplanation: string;
}

const STATUS_CONFIG: Record<BusinessTrustStatus, StatusConfig> = {
  normal: {
    label: "פעיל ותקין",
    icon: ShieldCheck,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    publicExplanation:
      "עסק זה פועל בהתאם למדיניות ReviewHub ואין כלפיו כל סמנים פעילים.",
    ownerExplanation:
      "הפרופיל שלכם תקין. אין בעיות פעילות.",
  },
  under_review: {
    label: "בבדיקה",
    icon: SearchCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    publicExplanation:
      "ReviewHub בוחנת כרגע דיווחים שהתקבלו לגבי עסק זה. הביקורות הקיימות מוצגות כרגיל בזמן הבדיקה.",
    ownerExplanation:
      "קיבלנו דיווחים הנוגעים לפרופיל שלכם. הצוות שלנו בוחן את הנושא. לשאלות, פנו לצוות הציות שלנו.",
  },
  warning: {
    label: "אזהרת ציות",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    publicExplanation:
      "ReviewHub מצאה הפרות מסוימות של מדיניות הפלטפורמה הנוגעות לעסק זה. חלק מהתכנים עשויים להיות מוגבלים.",
    ownerExplanation:
      "זוהו הפרות מדיניות בפרופיל שלכם. אם לא יינקטו פעולות תיקון, חשבונכם עשוי להיות מוגבל. צרו קשר עם הצוות שלנו.",
  },
  restricted: {
    label: "גישה מוגבלת",
    icon: Ban,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    publicExplanation:
      "עסק זה הוגבל על ידי ReviewHub עקב הפרות חמורות או חוזרות של מדיניות הפלטפורמה. חלק מהתכנים אינם מוצגים.",
    ownerExplanation:
      "הפרופיל שלכם הוגבל. צרו קשר עם trust@reviewhub.co.il לשחרור המגבלה.",
  },
};

const BusinessTrustStatusBadge = ({
  status,
  variant = "badge",
  isOwner = false,
  reason,
  className = "",
}: BusinessTrustStatusBadgeProps) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.normal;
  const Icon = cfg.icon;
  const explanation = isOwner ? cfg.ownerExplanation : cfg.publicExplanation;

  // Don't render anything for normal status in badge mode
  if (status === "normal" && variant === "badge") return null;

  if (variant === "banner") {
    if (status === "normal") return null;

    return (
      <div
        className={`rounded-xl border ${cfg.bg} ${cfg.border} px-4 py-3
          flex items-start gap-3 ${className}`}
        role="alert"
      >
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border}
          flex items-center justify-center shrink-0`}>
          <Icon size={15} className={cfg.color} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">{explanation}</p>
          {isOwner && reason && (
            <p className="text-xs text-muted-foreground/70 mt-1.5 font-mono bg-muted/30
              rounded px-2 py-1 leading-snug"
            >
              פרטים: {reason}
            </p>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="מידע נוסף"
              type="button"
            >
              <HelpCircle size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[280px] text-xs leading-relaxed">
            <p className="font-semibold mb-1">מהו סטטוס זה?</p>
            <p>{explanation}</p>
            <p className="mt-2 text-muted-foreground">
              ReviewHub מנהלת מערכת ציות לשמירה על שלמות הפלטפורמה.
              לשאלות, פנו לצוות Trust &amp; Safety שלנו.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Badge variant
  const badgeEl = (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold
        rounded-full px-2.5 py-1 border cursor-help select-none
        ${cfg.bg} ${cfg.color} ${cfg.border} ${className}`}
    >
      <Icon size={11} aria-hidden="true" />
      {cfg.label}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] space-y-1.5 p-3">
        <p className="font-semibold text-xs">{cfg.label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default BusinessTrustStatusBadge;

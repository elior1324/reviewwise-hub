/**
 * ReviewProvenanceBadge.tsx
 *
 * Shows exactly HOW a review was verified — its provenance.
 * Trustpilot calls these "Review labels / Verification".
 *
 * Four source types (matching DB enum in review_source column):
 *   verified_purchase — receipt or invoice uploaded and AI-approved
 *   crm_verified      — CRM / transaction data confirmed by integration
 *   email_verified    — email-verified account but no purchase proof
 *   community         — no verification, open community review
 *
 * The badge is designed to be instantly scannable:
 *   • Green  = strong proof (purchase / CRM)
 *   • Blue   = partial proof (email)
 *   • Grey   = no proof (community)
 *
 * A tooltip always explains WHY the badge is shown and what it means
 * for the review's trust level — meeting the "why am I seeing this?"
 * transparency requirement.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Receipt, Database, Mail, Users, HelpCircle } from "lucide-react";

export type ReviewSource =
  | "verified_purchase"
  | "crm_verified"
  | "email_verified"
  | "community";

interface ReviewProvenanceBadgeProps {
  source: ReviewSource;
  /** Show an extended explanation panel under the badge */
  showExplanation?: boolean;
  className?: string;
}

interface SourceConfig {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  explanation: string;
  whySeeing: string;
  trustLevel: "high" | "medium" | "low";
}

const SOURCE_CONFIG: Record<ReviewSource, SourceConfig> = {
  verified_purchase: {
    label: "מאומת — הוכחת רכישה",
    shortLabel: "הוכחת רכישה",
    icon: Receipt,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    explanation:
      "הכותב העלה קבלה, חשבונית, או אסמכתה אחרת, ומערכת ה-AI אישרה שהיא תואמת לרכישה אמיתית.",
    whySeeing:
      "ביקורת זו מוצגת עם תג אימות מכיוון שהכותב הוכיח שרכש בפועל את המוצר או השירות לפני כתיבת הביקורת.",
    trustLevel: "high",
  },
  crm_verified: {
    label: "מאומת — מערכת CRM",
    shortLabel: "CRM",
    icon: Database,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    explanation:
      "הביקורת אומתה ישירות מול נתוני רכישה ממערכת ה-CRM של העסק (HubSpot, Salesforce, WooCommerce ועוד). הזהות והרכישה אומתו אוטומטית.",
    whySeeing:
      "ביקורת זו קושרה לרכישה מתועדת במערכת ניהול הלקוחות של העסק, מה שמבטיח שהכותב הוא לקוח אמיתי.",
    trustLevel: "high",
  },
  email_verified: {
    label: "כתובת אימייל מאומתת",
    shortLabel: "אימייל מאומת",
    icon: Mail,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    explanation:
      "הכותב אימת את כתובת האימייל שלו, אך לא סיפק הוכחת רכישה. הביקורת לא נספרת בחישוב ציון האמון הדיגיטלי.",
    whySeeing:
      "ביקורת זו נכתבה על ידי משתמש שאימת את זהות האימייל שלו. אין לנו אישור שהוא רכש את המוצר.",
    trustLevel: "medium",
  },
  community: {
    label: "ביקורת קהילתית",
    shortLabel: "קהילתי",
    icon: Users,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border/50",
    explanation:
      "ביקורת זו לא עברה אימות רכישה. היא נכתבה על ידי משתמש רשום, אך ReviewHub לא יכולה לאמת שהוא לקוח בפועל של העסק. ביקורת זו אינה נספרת בציון האמון.",
    whySeeing:
      "אנו מציגים ביקורות קהילתיות בנפרד ומסמנים אותן בבירור כדי שתדעו שלא עברו בדיקת רכישה.",
    trustLevel: "low",
  },
};

const TRUST_LEVEL_BAR: Record<"high" | "medium" | "low", React.ReactNode> = {
  high: (
    <div className="flex items-center gap-0.5 mt-1.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-4 h-1 rounded-full bg-green-500" />
      ))}
      <span className="text-[10px] text-green-600 dark:text-green-400 mr-1.5">אמינות גבוהה</span>
    </div>
  ),
  medium: (
    <div className="flex items-center gap-0.5 mt-1.5">
      {[1, 2].map(i => (
        <div key={i} className="w-4 h-1 rounded-full bg-blue-500" />
      ))}
      <div className="w-4 h-1 rounded-full bg-border" />
      <span className="text-[10px] text-blue-500 mr-1.5">אמינות בינונית</span>
    </div>
  ),
  low: (
    <div className="flex items-center gap-0.5 mt-1.5">
      <div className="w-4 h-1 rounded-full bg-muted-foreground/40" />
      <div className="w-4 h-1 rounded-full bg-border" />
      <div className="w-4 h-1 rounded-full bg-border" />
      <span className="text-[10px] text-muted-foreground mr-1.5">לא מאומת</span>
    </div>
  ),
};

const ReviewProvenanceBadge = ({
  source,
  showExplanation = false,
  className = "",
}: ReviewProvenanceBadgeProps) => {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.community;
  const Icon = cfg.icon;

  const badgeEl = (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold
        rounded-full px-2.5 py-1 border cursor-help select-none
        ${cfg.bg} ${cfg.color} ${cfg.border} ${className}`}
    >
      <Icon size={11} aria-hidden="true" />
      {cfg.shortLabel}
    </div>
  );

  if (showExplanation) {
    return (
      <div className={`space-y-1 ${className}`}>
        {badgeEl}
        <div className={`rounded-lg border px-3 py-2.5 ${cfg.bg} ${cfg.border} text-xs leading-relaxed`}>
          <div className={`flex items-start gap-2 ${cfg.color}`}>
            <HelpCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-foreground/80">{cfg.explanation}</span>
          </div>
          {TRUST_LEVEL_BAR[cfg.trustLevel]}
        </div>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeEl}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px] space-y-2 p-3">
        <p className="font-semibold text-xs">{cfg.label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{cfg.explanation}</p>
        <div className="border-t border-border/30 pt-2">
          <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wide mb-1">
            למה אני רואה את זה?
          </p>
          <p className="text-xs leading-snug">{cfg.whySeeing}</p>
        </div>
        {TRUST_LEVEL_BAR[cfg.trustLevel]}
      </TooltipContent>
    </Tooltip>
  );
};

export default ReviewProvenanceBadge;

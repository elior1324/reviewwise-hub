/**
 * ReviewProvenanceBadge.tsx
 *
 * Shows exactly WHERE and HOW a review was verified — its provenance.
 *
 * Supported sources (matches DB review_source values):
 *   verified_purchase — receipt/invoice uploaded and AI-approved
 *   email_verified    — email-verified account, no purchase proof
 *   community         — no verification, open community review
 *   google            — imported from Google Reviews
 *   whatsapp          — customer submitted via WhatsApp review link
 *   facebook          — imported from Facebook Reviews
 *
 * Trust hierarchy (highest → lowest):
 *   verified_purchase > google/facebook > whatsapp > email_verified > community
 *
 * Visual language:
 *   Green  = strong ReviewHub-verified proof
 *   Blue   = partial proof (email)
 *   Grey   = no ReviewHub proof (community)
 *   Branded colors = external platform sources
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeCheck, Mail, Users, HelpCircle, MessageCircle, Facebook } from "lucide-react";

export type ReviewSource =
  | "verified_purchase"
  | "email_verified"
  | "crm_verified"
  | "community"
  | "google"
  | "whatsapp"
  | "instagram_dm"
  | "facebook";

interface ReviewProvenanceBadgeProps {
  source: ReviewSource;
  showExplanation?: boolean;
  className?: string;
}

interface SourceConfig {
  label: string;
  shortLabel: string;
  icon: React.ElementType | (() => JSX.Element);
  color: string;
  bg: string;
  border: string;
  explanation: string;
  whySeeing: string;
  trustLevel: "high" | "medium" | "low" | "external";
}

// ── Inline SVG icons for external platforms ──────────────────────────────────

const GoogleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-badge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#E1306C" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <path fill="url(#ig-badge-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SOURCE_CONFIG: Record<ReviewSource, SourceConfig> = {
  verified_purchase: {
    label:      "רכישה מאומתת",
    shortLabel: "רכישה מאומתת",
    icon:       BadgeCheck,
    color:      "text-green-700 dark:text-green-400",
    bg:         "bg-green-500/10",
    border:     "border-green-500/30",
    explanation:
      "הכותב העלה קבלה, חשבונית, או אסמכתה אחרת, ומערכת ה-AI אישרה שהיא תואמת לרכישה אמיתית.",
    whySeeing:
      "ביקורת זו מוצגת עם תג אימות מכיוון שהכותב הוכיח שרכש בפועל את המוצר לפני כתיבת הביקורת.",
    trustLevel: "high",
  },
  crm_verified: {
    label:      "אומת דרך CRM",
    shortLabel: "CRM מאומת",
    icon:       BadgeCheck,
    color:      "text-green-700 dark:text-green-400",
    bg:         "bg-green-500/10",
    border:     "border-green-500/30",
    explanation: "הכותב אומת דרך מערכת CRM של העסק.",
    whySeeing:   "ביקורת זו מוצגת עם תג אימות CRM.",
    trustLevel: "high",
  },
  email_verified: {
    label:      "כתובת אימייל מאומתת",
    shortLabel: "אימייל מאומת",
    icon:       Mail,
    color:      "text-blue-600 dark:text-blue-400",
    bg:         "bg-blue-500/10",
    border:     "border-blue-500/30",
    explanation:
      "הכותב אימת את כתובת האימייל שלו, אך לא סיפק הוכחת רכישה. הביקורת לא נספרת בחישוב ציון האמון.",
    whySeeing:
      "ביקורת זו נכתבה על ידי משתמש שאימת את זהות האימייל שלו. אין לנו אישור שהוא רכש את המוצר.",
    trustLevel: "medium",
  },
  community: {
    label:      "ביקורת קהילתית",
    shortLabel: "קהילתי",
    icon:       Users,
    color:      "text-muted-foreground",
    bg:         "bg-muted/40",
    border:     "border-border/50",
    explanation:
      "ביקורת זו לא עברה אימות רכישה. נכתבה על ידי משתמש רשום, אך ReviewHub לא מוודאת שהוא לקוח בפועל.",
    whySeeing:
      "אנו מציגים ביקורות קהילתיות בנפרד ומסמנים אותן בבירור כדי שתדעו שלא עברו בדיקת רכישה.",
    trustLevel: "low",
  },
  google: {
    label:      "ביקורת Google",
    shortLabel: "Google Review",
    icon:       GoogleIcon,
    color:      "text-[#4285F4]",
    bg:         "bg-[#4285F4]/8",
    border:     "border-[#4285F4]/20",
    explanation:
      "ביקורת זו יובאה ישירות מ-Google Reviews. היא מוצגת כמידע נוסף ואינה חלק ממדד האמון של ReviewHub.",
    whySeeing:
      "בעל העסק חיבר את פרופיל Google שלו ל-ReviewHub. ביקורות Google מוצגות בנפרד עם ייחוס ברור.",
    trustLevel: "external",
  },
  whatsapp: {
    label:      "משוב לקוח WhatsApp",
    shortLabel: "WhatsApp",
    icon:       WhatsAppIcon,
    color:      "text-[#25D366]",
    bg:         "bg-[#25D366]/8",
    border:     "border-[#25D366]/20",
    explanation:
      "משוב זה נאסף ישירות מלקוחות דרך קישור ביקורת ייחודי של WhatsApp. אושר על ידי בעל העסק לפני פרסום.",
    whySeeing:
      "בעל העסק שיתף קישור ביקורת ייחודי עם לקוחות. המשוב עבר אישור בעל עסק לפני שהוצג כאן.",
    trustLevel: "external",
  },
  instagram_dm: {
    label:      "משוב לקוח Instagram",
    shortLabel: "Instagram DM",
    icon:       InstagramIcon,
    color:      "text-[#E1306C]",
    bg:         "bg-[#E1306C]/8",
    border:     "border-[#E1306C]/20",
    explanation:
      "משוב זה נאסף ישירות מלקוחות דרך קישור ביקורת ייחודי שנשלח ב-Instagram. אושר על ידי בעל העסק לפני פרסום.",
    whySeeing:
      "בעל העסק שיתף קישור ביקורת ייחודי עם לקוחות דרך Instagram. המשוב עבר אישור בעל עסק לפני שהוצג כאן.",
    trustLevel: "external",
  },
  facebook: {
    label:      "ביקורת Facebook",
    shortLabel: "Facebook",
    icon:       Facebook,
    color:      "text-[#1877F2]",
    bg:         "bg-[#1877F2]/8",
    border:     "border-[#1877F2]/20",
    explanation:
      "ביקורת זו יובאה מדף הפייסבוק של העסק. היא מוצגת כמידע נוסף ואינה חלק ממדד האמון של ReviewHub.",
    whySeeing:
      "בעל העסק חיבר את דף הפייסבוק שלו. ביקורות Facebook מוצגות בנפרד עם ייחוס ברור.",
    trustLevel: "external",
  },
};

const TRUST_LEVEL_BAR: Record<"high" | "medium" | "low" | "external", React.ReactNode> = {
  high: (
    <div className="flex items-center gap-0.5 mt-1.5">
      {[1, 2, 3].map(i => <div key={i} className="w-4 h-1 rounded-full bg-green-500" />)}
      <span className="text-[10px] text-green-600 dark:text-green-400 mr-1.5">אמינות גבוהה</span>
    </div>
  ),
  medium: (
    <div className="flex items-center gap-0.5 mt-1.5">
      {[1, 2].map(i => <div key={i} className="w-4 h-1 rounded-full bg-blue-500" />)}
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
  external: (
    <div className="flex items-center gap-0.5 mt-1.5">
      <div className="w-4 h-1 rounded-full bg-muted-foreground/30" />
      <div className="w-4 h-1 rounded-full bg-muted-foreground/30" />
      <div className="w-4 h-1 rounded-full bg-border" />
      <span className="text-[10px] text-muted-foreground mr-1.5">מקור חיצוני</span>
    </div>
  ),
};

const ReviewProvenanceBadge = ({
  source,
  showExplanation = false,
  className = "",
}: ReviewProvenanceBadgeProps) => {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.community;
  const Icon = cfg.icon as React.ElementType;

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
            <HelpCircle size={12} className="shrink-0 mt-0.5" />
            <span className="text-foreground/80">{cfg.explanation}</span>
          </div>
          {TRUST_LEVEL_BAR[cfg.trustLevel]}
        </div>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
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

/**
 * ReviewSourceBreakdown
 *
 * Dual-purpose panel that shows a count breakdown by review source
 * AND acts as the source filter for the business profile page.
 *
 * Design goals:
 *  - Communicates trust hierarchy at a glance (Verified Purchase = top tier)
 *  - Makes the multi-source nature of ReviewHub transparent to visitors
 *  - Doubles as a clickable filter so users drill into a specific source
 *  - Shows the "business value" — what connecting each source enables
 */

import { motion } from "framer-motion";
import { ShieldCheck, Users, ExternalLink, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ReviewSource } from "./ReviewProvenanceBadge";

// ── Inline SVG platform icons ─────────────────────────────────────────────────
const GoogleIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const WhatsAppIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type SourceFilterValue = ReviewSource | "all";

export interface ReviewSourceBreakdownProps {
  /** ReviewHub native review counts */
  verifiedCount: number;
  communityCount: number;
  /** External review counts */
  googleCount: number;
  whatsappCount: number;
  facebookCount: number;
  /** Active filter — drives highlighting */
  activeFilter: SourceFilterValue;
  onFilterChange: (source: SourceFilterValue) => void;
  className?: string;
}

// ── Source definitions ────────────────────────────────────────────────────────

interface SourceDef {
  key: SourceFilterValue;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;           // active text
  activeBg: string;        // active background
  activeBorder: string;    // active border
  inactiveBg: string;
  inactiveBorder: string;
  tooltip: string;
  /** Tier number for hierarchy display */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Badge shown in the "no reviews" state to encourage business adoption */
  valueMessage: string;
}

const SOURCE_DEFS: SourceDef[] = [
  {
    key: "verified_purchase",
    label: "ביקורות מאומתות",
    shortLabel: "הוכחת רכישה",
    icon: <ShieldCheck size={13} />,
    color: "text-green-700 dark:text-green-400",
    activeBg: "bg-green-500/15",
    activeBorder: "border-green-500/40",
    inactiveBg: "bg-muted/30",
    inactiveBorder: "border-border/40",
    tooltip: "ביקורות שנכתבו לאחר הגשת הוכחת רכישה ממשית. נספרות בציון האמון.",
    tier: 1,
    valueMessage: "שלחו קישור לקוחות לאחר רכישה",
  },
  {
    key: "whatsapp",
    label: "משוב WhatsApp",
    shortLabel: "WhatsApp",
    icon: <WhatsAppIcon size={13} />,
    color: "text-[#25D366]",
    activeBg: "bg-[#25D366]/12",
    activeBorder: "border-[#25D366]/40",
    inactiveBg: "bg-muted/30",
    inactiveBorder: "border-border/40",
    tooltip: "משוב שנאסף ישירות מלקוחות דרך קישור ייחודי של WhatsApp. עבר אישור בעל העסק.",
    tier: 2,
    valueMessage: "שתפו קישור ביקורת ב-WhatsApp",
  },
  {
    key: "google",
    label: "ביקורות Google",
    shortLabel: "Google",
    icon: <GoogleIcon size={13} />,
    color: "text-[#4285F4]",
    activeBg: "bg-[#4285F4]/8",
    activeBorder: "border-[#4285F4]/30",
    inactiveBg: "bg-muted/30",
    inactiveBorder: "border-border/40",
    tooltip: "יובאו מ-Google Reviews. מוצגות כמידע נוסף ואינן חלק ממדד האמון של ReviewHub.",
    tier: 3,
    valueMessage: "חיברו את פרופיל Google שלכם",
  },
  {
    key: "facebook",
    label: "ביקורות Facebook",
    shortLabel: "Facebook",
    icon: <FacebookIcon size={13} />,
    color: "text-[#1877F2]",
    activeBg: "bg-[#1877F2]/8",
    activeBorder: "border-[#1877F2]/30",
    inactiveBg: "bg-muted/30",
    inactiveBorder: "border-border/40",
    tooltip: "יובאו מדף Facebook. מוצגות כמידע נוסף ואינן חלק ממדד האמון של ReviewHub.",
    tier: 3,
    valueMessage: "חיברו את דף Facebook שלכם",
  },
  {
    key: "community",
    label: "משוב קהילה",
    shortLabel: "קהילה",
    icon: <Users size={13} />,
    color: "text-muted-foreground",
    activeBg: "bg-muted/60",
    activeBorder: "border-border/60",
    inactiveBg: "bg-muted/30",
    inactiveBorder: "border-border/40",
    tooltip: "ביקורות שנכתבו ללא הוכחת רכישה. מוצגות בנפרד ואינן נספרות בחישוב.",
    tier: 4,
    valueMessage: "ביקורות קהילה פתוחות לכולם",
  },
];

// ── Sub-component: source chip ────────────────────────────────────────────────

function SourceChip({
  def,
  count,
  active,
  onClick,
}: {
  def: SourceDef;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const hasContent = count > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          onClick={onClick}
          whileTap={{ scale: 0.96 }}
          className={`
            inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-medium
            transition-all duration-200 cursor-pointer select-none
            ${active
              ? `${def.activeBg} ${def.activeBorder} ${def.color} shadow-sm ring-1 ring-inset ring-current/10`
              : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40 hover:border-border/50"
            }
            ${!hasContent ? "opacity-50" : ""}
          `}
          aria-pressed={active}
        >
          {def.icon}
          <span>{def.shortLabel}</span>
          <span className={`
            ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
            ${active
              ? "bg-current/15 text-current"
              : "bg-border/40 text-muted-foreground"
            }
          `}>
            {count}
          </span>
          {/* Tier badge */}
          <span className="text-[9px] opacity-50 font-normal">
            T{def.tier}
          </span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] text-xs">
        {def.tooltip}
        {!hasContent && (
          <p className="mt-1 text-muted-foreground border-t border-border/30 pt-1 text-[10px]">
            {def.valueMessage}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Tier legend row ───────────────────────────────────────────────────────────

function TierLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground/70" dir="rtl">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        T1 — הוכחת רכישה
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#25D366] inline-block" />
        T2 — WhatsApp
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#4285F4] inline-block" />
        T3 — Google / Facebook
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
        T4 — קהילה
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ReviewSourceBreakdown = ({
  verifiedCount,
  communityCount,
  googleCount,
  whatsappCount,
  facebookCount,
  activeFilter,
  onFilterChange,
  className = "",
}: ReviewSourceBreakdownProps) => {
  const total = verifiedCount + communityCount + googleCount + whatsappCount + facebookCount;

  const counts: Record<ReviewSource | "all", number> = {
    all: total,
    verified_purchase: verifiedCount,
    community: communityCount,
    google: googleCount,
    whatsapp: whatsappCount,
    facebook: facebookCount,
    email_verified: 0, // not shown as separate filter
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-border/40 bg-card/50 p-4 mb-6 ${className}`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ExternalLink size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            ביקורות לפי מקור
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={11} className="text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              ReviewHub מאגדת ביקורות ממקורות מרובים — ReviewHub נייטיב, Google,
              WhatsApp ו-Facebook — כדי לתת לכם תמונה מלאה ושקופה של כל עסק.
              ביקורות מאומתות רכישה נחשבות אמינות ביותר.
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-xs text-muted-foreground">
          {total} ביקורות בסך הכל
        </span>
      </div>

      {/* Source chips — "All" button + per-source */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {/* All button */}
        <motion.button
          type="button"
          onClick={() => onFilterChange("all")}
          whileTap={{ scale: 0.96 }}
          className={`
            inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-medium
            transition-all duration-200
            ${activeFilter === "all"
              ? "bg-primary/15 border-primary/40 text-primary shadow-sm"
              : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40"
            }
          `}
          aria-pressed={activeFilter === "all"}
        >
          הכל
          <span className={`
            px-1.5 py-0.5 rounded-full text-[10px] font-semibold
            ${activeFilter === "all" ? "bg-primary/15 text-primary" : "bg-border/40 text-muted-foreground"}
          `}>
            {total}
          </span>
        </motion.button>

        {/* Per-source chips */}
        {SOURCE_DEFS.map(def => (
          <SourceChip
            key={def.key}
            def={def}
            count={counts[def.key as ReviewSource] ?? 0}
            active={activeFilter === def.key}
            onClick={() => onFilterChange(activeFilter === def.key ? "all" : def.key)}
          />
        ))}
      </div>

      {/* Trust hierarchy legend */}
      <div className="border-t border-border/30 pt-2.5">
        <TierLegend />
      </div>
    </motion.div>
  );
};

export default ReviewSourceBreakdown;

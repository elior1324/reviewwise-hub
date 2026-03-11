/**
 * ProofBadge — Composable Proof of Experience badge system.
 *
 * Renders verified proof signals as compact, accessible badges.
 * Designed to sit alongside the existing VerifiedBadge and VerificationBadge
 * components without replacing them — ProofBadge covers the 4 new proof types
 * from migration 000012.
 *
 * Exports:
 *   ProofBadge        — single badge for one proof type
 *   ProofBadgeStrip   — horizontal row of all verified proofs for a review
 *   ProofBadgeCompact — icon-only mini version for dense layouts (ReviewCard)
 *
 * Usage:
 *   // All verified proofs for a review
 *   <ProofBadgeStrip reviewId={id} proofTypes={['purchase_receipt', 'location_gps']} />
 *
 *   // Single badge
 *   <ProofBadge type="photo_evidence" size="sm" />
 *
 *   // Compact icon row (ReviewCard footer)
 *   <ProofBadgeCompact proofTypes={review.proof_types} />
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  MapPin,
  Camera,
  CalendarCheck,
  ShieldCheck,
  X,
  Star,
  Clock,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProofType =
  | "purchase_receipt"
  | "location_gps"
  | "photo_evidence"
  | "booking_ref";

export interface ProofBadgeProps {
  type: ProofType;
  size?: "xs" | "sm" | "md" | "lg";
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  distanceFromBusiness?: number | null;
  multiplier?: number;
  showTooltip?: boolean;
  className?: string;
}

export interface ProofBadgeStripProps {
  proofTypes: ProofType[];
  /** Full proof detail (optional — from v_review_proof_badges view) */
  proofDetails?: ProofDetail[];
  size?: "xs" | "sm" | "md";
  maxVisible?: number;
  className?: string;
}

export interface ProofDetail {
  proof_type:              ProofType;
  verified_at:             string | null;
  verified_by:             string | null;
  multiplier_granted:      number;
  distance_from_business_m: number | null;
}

// ─── Proof metadata ───────────────────────────────────────────────────────────

export const PROOF_META: Record<ProofType, {
  labelHe:      string;
  labelEn:      string;
  icon:         React.FC<{ size?: number; className?: string }>;
  color:        string;          // Tailwind text colour
  bg:           string;          // Tailwind bg colour
  border:       string;          // Tailwind border colour
  tooltipHe:    string;
  multiplier:   number;
}> = {
  purchase_receipt: {
    labelHe:    "קנייה מאומתת",
    labelEn:    "Verified Purchase",
    icon:       Receipt,
    color:      "text-emerald-700 dark:text-emerald-300",
    bg:         "bg-emerald-50 dark:bg-emerald-900/30",
    border:     "border-emerald-200 dark:border-emerald-700",
    tooltipHe:  "המשתמש העלה קבלת רכישה מקורית שעברה אימות. זו הרמה הגבוהה ביותר של אמינות.",
    multiplier: 2.0,
  },
  booking_ref: {
    labelHe:    "הזמנה מאומתת",
    labelEn:    "Booking Verified",
    icon:       CalendarCheck,
    color:      "text-blue-700 dark:text-blue-300",
    bg:         "bg-blue-50 dark:bg-blue-900/30",
    border:     "border-blue-200 dark:border-blue-700",
    tooltipHe:  "ההזמנה בוצעה דרך לינק ReviewHub ואומתה אוטומטית על-ידי המערכת.",
    multiplier: 2.0,
  },
  photo_evidence: {
    labelHe:    "צילום עדות",
    labelEn:    "Photo Evidence",
    icon:       Camera,
    color:      "text-violet-700 dark:text-violet-300",
    bg:         "bg-violet-50 dark:bg-violet-900/30",
    border:     "border-violet-200 dark:border-violet-700",
    tooltipHe:  "המשתמש צירף תמונה מהביקור. התמונה עברה בדיקת אותנטיות.",
    multiplier: 1.5,
  },
  location_gps: {
    labelHe:    "מיקום GPS",
    labelEn:    "Location Verified",
    icon:       MapPin,
    color:      "text-amber-700 dark:text-amber-300",
    bg:         "bg-amber-50 dark:bg-amber-900/30",
    border:     "border-amber-200 dark:border-amber-700",
    tooltipHe:  "מיקום הטלפון של המשתמש אומת קרוב לעסק בזמן כתיבת הביקורת.",
    multiplier: 1.3,
  },
};

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  xs: { pill: "px-1.5 py-0.5 rounded text-[10px]",    icon: 10, gap: "gap-0.5" },
  sm: { pill: "px-2 py-0.5 rounded-full text-xs",      icon: 11, gap: "gap-1"   },
  md: { pill: "px-2.5 py-1 rounded-full text-xs",      icon: 13, gap: "gap-1.5" },
  lg: { pill: "px-3 py-1.5 rounded-full text-sm",      icon: 15, gap: "gap-2"   },
};

// ─── ProofBadge ───────────────────────────────────────────────────────────────

export function ProofBadge({
  type,
  size = "sm",
  verifiedAt,
  verifiedBy,
  distanceFromBusiness,
  multiplier,
  showTooltip = true,
  className = "",
}: ProofBadgeProps) {
  const [open, setOpen] = useState(false);
  const meta   = PROOF_META[type];
  const sz     = SIZE_CONFIG[size];
  const Icon   = meta.icon;
  const mult   = multiplier ?? meta.multiplier;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => showTooltip && setOpen((v) => !v)}
        className={`
          inline-flex items-center border font-medium transition-all
          ${sz.pill} ${sz.gap} ${meta.bg} ${meta.border} ${meta.color}
          ${showTooltip ? "cursor-pointer hover:brightness-95" : "cursor-default"}
          focus:outline-none select-none
        `}
      >
        <Icon size={sz.icon} className="flex-shrink-0" />
        <span>{meta.labelHe}</span>
        {mult > 1 && size !== "xs" && (
          <span className="opacity-60 text-[10px] font-bold">{mult}×</span>
        )}
      </button>

      <AnimatePresence>
        {showTooltip && open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={   { opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 z-50 w-64 bg-card border border-border rounded-xl shadow-xl p-4 text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
                <div className={`flex items-center gap-1.5 ${meta.color}`}>
                  <Icon size={15} />
                  <span className="text-sm font-bold">{meta.labelHe}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3">{meta.tooltipHe}</p>

              {/* Details grid */}
              <div className="space-y-1.5">
                {/* Multiplier */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${meta.color}`}>{mult}× נקודות</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star size={10} />
                    <span>מכפיל נקודות</span>
                  </div>
                </div>

                {/* Verified at */}
                {verifiedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      {new Date(verifiedAt).toLocaleDateString("he-IL")}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ShieldCheck size={10} />
                      <span>תאריך אימות</span>
                    </div>
                  </div>
                )}

                {/* Distance (GPS only) */}
                {type === "location_gps" && distanceFromBusiness != null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{distanceFromBusiness}מ'</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={10} />
                      <span>מרחק מהעסק</span>
                    </div>
                  </div>
                )}

                {/* Verified by */}
                {verifiedBy && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground capitalize">{verifiedBy}</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Info size={10} />
                      <span>אומת על-ידי</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ProofBadgeStrip ─────────────────────────────────────────────────────────
// Renders all verified proofs for one review in a horizontal row.

export function ProofBadgeStrip({
  proofTypes,
  proofDetails = [],
  size = "sm",
  maxVisible = 4,
  className = "",
}: ProofBadgeStripProps) {
  // Sort by multiplier descending so highest-trust badge is first
  const sorted = [...new Set(proofTypes)].sort(
    (a, b) => (PROOF_META[b]?.multiplier ?? 0) - (PROOF_META[a]?.multiplier ?? 0)
  );
  const visible = sorted.slice(0, maxVisible);
  const overflow = sorted.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} dir="rtl">
      {visible.map((type) => {
        const detail = proofDetails.find((d) => d.proof_type === type);
        return (
          <ProofBadge
            key={type}
            type={type}
            size={size}
            verifiedAt={detail?.verified_at}
            verifiedBy={detail?.verified_by}
            distanceFromBusiness={detail?.distance_from_business_m}
            multiplier={detail?.multiplier_granted}
          />
        );
      })}
      {overflow > 0 && (
        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full border border-border">
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── ProofBadgeCompact ────────────────────────────────────────────────────────
// Icon-only row for dense layouts like ReviewCard.
// Shows coloured dots with tooltips; no text label.

export function ProofBadgeCompact({
  proofTypes,
  className = "",
}: {
  proofTypes: ProofType[];
  className?: string;
}) {
  if (!proofTypes || proofTypes.length === 0) return null;

  const sorted = [...new Set(proofTypes)].sort(
    (a, b) => (PROOF_META[b]?.multiplier ?? 0) - (PROOF_META[a]?.multiplier ?? 0)
  );

  return (
    <div className={`flex items-center gap-1 ${className}`} dir="rtl">
      {sorted.map((type) => {
        const meta = PROOF_META[type];
        const Icon = meta.icon;
        return (
          <div
            key={type}
            title={meta.labelHe}
            className={`
              inline-flex items-center justify-center
              w-5 h-5 rounded-full border
              ${meta.bg} ${meta.border}
            `}
          >
            <Icon size={10} className={meta.color} />
          </div>
        );
      })}
    </div>
  );
}

// ─── ProofScoreSummary ────────────────────────────────────────────────────────
// Shows the combined effect of all proofs as a single score summary line.
// Used in EarningsDashboard and reviewer profile pages.

export function ProofScoreSummary({
  proofTypes,
  basePoints = 100,
}: {
  proofTypes: ProofType[];
  basePoints?: number;
}) {
  if (!proofTypes || proofTypes.length === 0) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock size={11} />
        ללא הוכחת ניסיון
      </span>
    );
  }

  const bestMultiplier = Math.max(
    ...proofTypes.map((t) => PROOF_META[t]?.multiplier ?? 1.0)
  );
  const earnedPoints   = Math.round(basePoints * bestMultiplier);

  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      <span className="text-xs text-muted-foreground">
        {basePoints} × {bestMultiplier} =
      </span>
      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
        {earnedPoints} נקודות
      </span>
      <ProofBadgeCompact proofTypes={proofTypes} />
    </div>
  );
}

export default ProofBadge;

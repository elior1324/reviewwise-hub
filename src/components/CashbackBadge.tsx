/**
 * CashbackBadge — Shows "₪XX קאשבק דרך ReviewHub" on course/business cards.
 *
 * Props:
 *   amount        — cashback amount in ILS (calculated from price × cashback_rate)
 *   size          — 'sm' (inline chip) | 'md' (card badge) | 'lg' (sticky banner)
 *   showTooltip   — hover tooltip explaining the cashback model
 *   animated      — pulse animation on mount
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, X } from "lucide-react";

interface CashbackBadgeProps {
  /** Cashback amount in ILS. Pass 0 or undefined to hide. */
  amount: number;
  /** Visual size variant */
  size?: "sm" | "md" | "lg";
  /** Show info tooltip on hover */
  showTooltip?: boolean;
  /** Pulse animation on mount */
  animated?: boolean;
  /** Override badge text (default: "₪X.XX קאשבק") */
  label?: string;
  className?: string;
}

// ─── Tooltip content ──────────────────────────────────────────────────────────

const TooltipContent = ({ amount, onClose }: { amount: number; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 4, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 4, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className="absolute bottom-full right-0 mb-2 z-50 w-64 p-3 rounded-xl bg-popover border border-border/60 shadow-xl shadow-black/20"
    dir="rtl"
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="font-semibold text-sm text-foreground">מה זה קאשבק ReviewHub?</p>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0">
        <X size={13} />
      </button>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">
      כשתרכוש קורס זה דרך ReviewHub, תקבל{" "}
      <span className="text-emerald-400 font-bold">₪{amount.toFixed(2)}</span> חזרה
      לחשבונך תוך 72 שעות.
    </p>
    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
      הקאשבק מגיע מחלקת ה-50/50 שלנו — כי אתה עזרת לקהילה עם ביקורת אמיתית.{" "}
      <a href="/partner" className="text-emerald-400 hover:underline">למידע נוסף</a>.
    </p>
    {/* Arrow */}
    <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-popover border-r border-b border-border/60 rotate-45" />
  </motion.div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const CashbackBadge = ({
  amount,
  size = "md",
  showTooltip = true,
  animated = true,
  label,
  className = "",
}: CashbackBadgeProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  if (!amount || amount <= 0) return null;

  const formattedAmount = amount % 1 === 0
    ? `₪${amount.toFixed(0)}`
    : `₪${amount.toFixed(2)}`;

  const displayLabel = label ?? `${formattedAmount} קאשבק`;

  // ── Size variants ──────────────────────────────────────────────────────────
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 ${className}`}
      >
        <Sparkles size={8} />
        {displayLabel}
      </span>
    );
  }

  if (size === "lg") {
    // Sticky banner at bottom of course card / page section
    return (
      <motion.div
        initial={animated ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between px-4 py-3 bg-gradient-to-l from-emerald-500/15 to-emerald-600/10 border border-emerald-500/25 rounded-xl ${className}`}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400">קנה דרך ReviewHub — קבל קאשבק</p>
            <p className="text-[10px] text-emerald-400/70">מאושר לחשבונך תוך 72 שעות</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-emerald-400 leading-none">{formattedAmount}</p>
          <p className="text-[9px] text-emerald-400/60 mt-0.5">קאשבק</p>
        </div>
      </motion.div>
    );
  }

  // ── Default: md (card badge with optional tooltip) ─────────────────────────
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.button
        type="button"
        initial={animated ? { scale: 0.8, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onClick={() => showTooltip && setTooltipOpen(v => !v)}
        onBlur={() => setTooltipOpen(false)}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full
          bg-gradient-to-l from-emerald-500/20 to-emerald-600/15
          border border-emerald-500/35
          text-emerald-400 font-semibold text-xs
          transition-all duration-200
          ${showTooltip ? "cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/25" : "cursor-default"}
        `}
        dir="rtl"
      >
        <Sparkles size={11} className="shrink-0" />
        <span>{displayLabel}</span>
        <span className="text-[9px] font-normal opacity-70 mr-0.5">דרך ReviewHub</span>
        {showTooltip && (
          <Info size={10} className="opacity-50 shrink-0" />
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <AnimatePresence>
          {tooltipOpen && (
            <TooltipContent
              amount={amount}
              onClose={() => setTooltipOpen(false)}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// ─── Utility: calculate cashback from price + rate ────────────────────────────

export const calcCashback = (
  priceIls: number,
  cashbackRate: number = 0.025
): number => parseFloat((priceIls * cashbackRate).toFixed(2));

export default CashbackBadge;

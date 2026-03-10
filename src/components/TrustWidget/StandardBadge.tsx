/**
 * StandardBadge.tsx
 *
 * Mid-size widget — perfect for sidebars, landing page trust sections,
 * and product detail pages where you want more credibility signal than
 * the compact badge but don't need a full review snippet.
 *
 * Visual anatomy (~280 × 110 px):
 *   ┌─────────────────────────────────────┐
 *   │  [Shield]  ReviewWise  ✓ Verified   │
 *   │  ─────────────────────────────────  │
 *   │  4.8  ★★★★½                         │
 *   │  מבוסס על 318 ביקורות מאומתות       │
 *   │  ─────────────────────────────────  │
 *   │  [ ← כל הביקורות ]                  │
 *   └─────────────────────────────────────┘
 */

import { motion } from "framer-motion";
import { BadgeCheck, ArrowLeft } from "lucide-react";
import { Stars } from "./Stars";
import type { TrustWidgetProps } from "./types";

// Inline SVG shield — identical to Logo.tsx but inlined so it's iframe-safe
const ShieldMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="hsl(168 45% 30%)" />
    <path
      d="M16 5L7 9v7c0 5 4 9.7 9 11 5-1.3 9-6 9-11V9L16 5z"
      fill="hsl(168 55% 70% / 0.25)"
      stroke="hsl(168 55% 72%)"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M16 10.5l1.25 2.6 2.75.4-2 2 .47 2.8L16 17.1l-2.47 1.2.47-2.8-2-2 2.75-.4L16 10.5z"
      fill="hsl(38 100% 58%)"
    />
  </svg>
);

export const StandardBadge = ({
  businessName,
  slug,
  rating,
  reviewCount,
  profileUrl,
}: TrustWidgetProps) => {
  const href = profileUrl ?? `/biz/${slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      dir="rtl"
      className="flex flex-col overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 295,
        borderRadius: 16,
        border: "1px solid hsl(168 45% 30% / 0.28)",
        background: "linear-gradient(160deg, hsl(0 0% 8%), hsl(168 15% 6%))",
        boxShadow: "0 4px 24px hsl(0 0% 0% / 0.45), inset 0 1px 0 hsl(168 45% 50% / 0.08)",
      }}
    >
      {/* ── Header row ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <ShieldMark size={22} />
        <div className="flex flex-col leading-none">
          <span
            className="font-bold tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              color: "hsl(0 0% 95%)",
            }}
          >
            ReviewWise
          </span>
          <span
            className="flex items-center gap-0.5"
            style={{ color: "hsl(168 50% 55%)", fontSize: 10 }}
          >
            <BadgeCheck size={10} strokeWidth={2.2} />
            <span style={{ fontWeight: 500 }}>Verified Reviews</span>
          </span>
        </div>
      </div>

      {/* ── Rating block ── */}
      <div className="flex flex-col gap-1 px-4 py-4">
        <div className="flex items-end gap-2">
          <span
            className="font-bold tabular-nums leading-none"
            style={{ fontSize: 36, color: "hsl(0 0% 97%)" }}
          >
            {rating.toFixed(1)}
          </span>
          <div className="flex flex-col gap-1 pb-1">
            <Stars rating={rating} size={16} />
            <span style={{ color: "hsl(168 45% 55%)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>
              מצוין
            </span>
          </div>
        </div>

        <span style={{ color: "hsl(0 0% 100% / 0.4)", fontSize: 11 }}>
          מבוסס על {reviewCount.toLocaleString("he-IL")} ביקורות מאומתות
        </span>
      </div>

      {/* ── CTA ── */}
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ backgroundColor: "hsl(168 45% 20% / 0.3)" }}
        className="flex items-center justify-between px-4 py-2.5 no-underline"
        style={{
          borderTop: "1px solid hsl(0 0% 100% / 0.06)",
          color: "hsl(168 55% 60%)",
          fontSize: 11,
          fontWeight: 600,
          transition: "background 0.15s",
        }}
      >
        <span>כל הביקורות של {businessName}</span>
        <ArrowLeft size={12} />
      </motion.a>
    </motion.div>
  );
};

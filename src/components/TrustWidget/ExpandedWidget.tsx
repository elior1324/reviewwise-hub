/**
 * ExpandedWidget.tsx
 *
 * The largest embeddable variant — designed for hero sections,
 * dedicated "What our customers say" blocks, and marketing landing pages.
 *
 * Visual anatomy (~340 × auto):
 *   ┌─────────────────────────────────────────┐
 *   │  [Shield]  ReviewWise  ✓ Verified       │
 *   │  ─────────────────────────────────────  │
 *   │  4.8  ★★★★½  ·  318 ביקורות            │
 *   │  ████████████████████░░░  מצוין         │
 *   │  ─────────────────────────────────────  │
 *   │  ❝  "Highlighted review text..."        │
 *   │     — Reviewer · Course · Date          │
 *   │  ─────────────────────────────────────  │
 *   │  [ ← קראו ביקורות ב-ReviewWise ]        │
 *   └─────────────────────────────────────────┘
 *
 * If no reviews are provided the snippet section is hidden automatically.
 */

import { motion } from "framer-motion";
import { BadgeCheck, ArrowLeft, Quote } from "lucide-react";
import { Stars } from "./Stars";
import type { TrustWidgetProps, WidgetReview } from "./types";

// ─── Inline shield (same mark as Logo.tsx, keeps iframe-safe) ────────────────

const ShieldMark = ({ size = 24 }: { size?: number }) => (
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

// ─── Animated progress bar (trust score bar) ─────────────────────────────────

const TrustBar = ({ pct }: { pct: number }) => (
  <div
    className="w-full rounded-full overflow-hidden"
    style={{ height: 4, background: "hsl(0 0% 100% / 0.08)" }}
  >
    <motion.div
      className="h-full rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
      style={{
        background: "linear-gradient(90deg, hsl(168 45% 30%), hsl(168 55% 55%))",
      }}
    />
  </div>
);

// ─── Highlighted review card ──────────────────────────────────────────────────

const ReviewSnippet = ({ review }: { review: WidgetReview }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25, duration: 0.35 }}
    className="flex flex-col gap-2 px-4 py-3.5 mx-4 mb-1 rounded-xl"
    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
  >
    {/* Quote icon + stars */}
    <div className="flex items-center justify-between">
      <Quote size={14} style={{ color: "hsl(168 45% 40%)", opacity: 0.8 }} />
      <Stars rating={review.rating} size={12} />
    </div>

    {/* Review text */}
    <p
      className="leading-relaxed"
      style={{
        fontSize: 12,
        color: "hsl(0 0% 100% / 0.72)",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {review.text}
    </p>

    {/* Meta */}
    <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: 10, color: "hsl(0 0% 100% / 0.35)" }}>
      <span style={{ color: "hsl(0 0% 100% / 0.55)", fontWeight: 600 }}>
        {review.anonymous ? "אנונימי" : review.reviewerName}
      </span>
      {review.verified && (
        <span
          className="inline-flex items-center gap-0.5"
          style={{ color: "hsl(168 55% 55%)" }}
        >
          <BadgeCheck size={9} strokeWidth={2.5} />
          <span>מאומת</span>
        </span>
      )}
      {review.courseName && (
        <>
          <span>·</span>
          <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {review.courseName}
          </span>
        </>
      )}
      {review.date && (
        <>
          <span>·</span>
          <span>{review.date}</span>
        </>
      )}
    </div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ExpandedWidget = ({
  businessName,
  slug,
  rating,
  reviewCount,
  reviews = [],
  profileUrl,
}: TrustWidgetProps) => {
  const href = profileUrl ?? `/biz/${slug}`;

  // Pick the highest-rated, most verbose review as the featured snippet
  const featured: WidgetReview | undefined = reviews
    .filter(r => r.rating >= 4 && r.text && r.text.length >= 40)
    .sort((a, b) => b.text.length - a.text.length)[0];

  // Trust score as a percentage of max (5.0)
  const trustPct = Math.min(100, (rating / 5) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      dir="rtl"
      className="flex flex-col overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 340,
        borderRadius: 18,
        border: "1px solid hsl(168 45% 30% / 0.3)",
        background: "linear-gradient(175deg, hsl(0 0% 8%), hsl(168 15% 6%))",
        boxShadow: "0 6px 40px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(168 45% 50% / 0.1)",
      }}
    >
      {/* ── Brand header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <ShieldMark size={26} />
        <div className="flex flex-col leading-none">
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "hsl(0 0% 95%)",
              letterSpacing: "-0.01em",
            }}
          >
            ReviewWise
          </span>
          <span
            className="flex items-center gap-0.5 mt-0.5"
            style={{ color: "hsl(168 50% 55%)", fontSize: 10 }}
          >
            <BadgeCheck size={10} strokeWidth={2.3} />
            <span style={{ fontWeight: 500 }}>ביקורות מאומתות</span>
          </span>
        </div>

        {/* Trust score pill */}
        <div
          className="mr-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "hsl(168 45% 18% / 0.5)",
            border: "1px solid hsl(168 45% 35% / 0.3)",
          }}
        >
          <span style={{ color: "hsl(168 55% 65%)", fontSize: 11, fontWeight: 700 }}>
            {rating.toFixed(1)}
          </span>
          <span style={{ color: "hsl(168 45% 40%)", fontSize: 10 }}>/ 5</span>
        </div>
      </div>

      {/* ── Rating block ── */}
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <Stars rating={rating} size={18} />
          <span style={{ color: "hsl(168 45% 58%)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>
            מצוין
          </span>
        </div>

        {/* Trust bar */}
        <TrustBar pct={trustPct} />

        <span style={{ color: "hsl(0 0% 100% / 0.38)", fontSize: 10 }}>
          {reviewCount.toLocaleString("he-IL")} ביקורות מאומתות · עודכן בזמן אמת
        </span>
      </div>

      {/* ── Featured review snippet ── */}
      {featured && (
        <div style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)", paddingTop: 12 }}>
          <ReviewSnippet review={featured} />
        </div>
      )}

      {/* ── CTA button ── */}
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ backgroundColor: "hsl(168 45% 20% / 0.35)" }}
        className="flex items-center justify-center gap-2 no-underline mx-4 mb-4 mt-3 rounded-xl"
        style={{
          padding: "10px 16px",
          border: "1px solid hsl(168 45% 30% / 0.4)",
          background: "hsl(168 45% 14% / 0.5)",
          color: "hsl(168 55% 65%)",
          fontSize: 12,
          fontWeight: 600,
          transition: "background 0.15s",
        }}
      >
        <span>קראו ביקורות ב-ReviewWise</span>
        <ArrowLeft size={13} />
      </motion.a>
    </motion.div>
  );
};

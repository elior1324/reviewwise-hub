import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Star } from "lucide-react";
import { Stars } from "./Stars";
import { ReviewWiseLogo } from "./Logo";
import type { TrustWidgetProps, WidgetReview } from "./types";

// ─── Single review row ────────────────────────────────────────────────────────

const SidebarReviewItem = ({
  review,
  index,
}: {
  review: WidgetReview;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 12 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.07, duration: 0.3 }}
    className="group flex flex-col gap-1.5 py-3 border-b border-white/6 last:border-b-0"
  >
    {/* Stars + verified */}
    <div className="flex items-center justify-between gap-2">
      <Stars rating={review.rating} size={12} />
      {review.verified && (
        <span className="inline-flex items-center gap-0.5 text-emerald-400/80 text-[9px] font-medium">
          <BadgeCheck size={9} strokeWidth={2.5} />
          מאומת
        </span>
      )}
    </div>

    {/* Review text */}
    <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
      {review.text}
    </p>

    {/* Meta */}
    <div className="flex items-center gap-1.5 text-[10px] text-white/35">
      <span className="font-medium text-white/55">
        {review.anonymous ? "אנונימי" : review.reviewerName}
      </span>
      {review.courseName && (
        <>
          <span>·</span>
          <span className="truncate">{review.courseName}</span>
        </>
      )}
      <span>·</span>
      <span>{review.date}</span>
    </div>
  </motion.div>
);

// ─── Rating bar (like Trustpilot's breakdown) ─────────────────────────────────

const RatingBar = ({
  label,
  pct,
  delay,
}: {
  label: string;
  pct: number;
  delay: number;
}) => (
  <div className="flex items-center gap-2 text-[10px] text-white/45">
    <span className="w-8 shrink-0 text-left">{label}</span>
    <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
      />
    </div>
    <span className="w-7 text-right shrink-0">{pct}%</span>
  </div>
);

// ─── Sidebar widget ───────────────────────────────────────────────────────────

const MAX_SIDEBAR_REVIEWS = 4;

export const SidebarList = ({
  businessName,
  slug,
  rating,
  reviewCount,
  reviews = [],
  profileUrl,
}: TrustWidgetProps) => {
  const href = profileUrl ?? `/biz/${slug}`;

  // Compute star breakdown from provided reviews (or simulate it)
  const breakdown = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    return {
      label: `${star}★`,
      pct: reviewCount > 0
        ? Math.round((count / Math.max(reviews.length, 1)) * 100)
        : [72, 18, 6, 3, 1][5 - star],
    };
  });

  const displayed = reviews
    .filter(r => r.rating >= 4)
    .slice(0, MAX_SIDEBAR_REVIEWS);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      dir="rtl"
      className="flex flex-col gap-0 rounded-2xl border border-white/8 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(0 0% 7%), hsl(168 12% 5%))",
        boxShadow: "0 4px 30px hsl(0 0% 0% / 0.45), inset 0 1px 0 hsl(168 45% 30% / 0.1)",
        width: "100%",
        maxWidth: 320,
      }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <ReviewWiseLogo size="sm" showVerified />

        {/* Aggregate score */}
        <div className="flex items-end gap-2 mt-3">
          <span className="text-3xl font-bold text-white leading-none tabular-nums">
            {rating.toFixed(1)}
          </span>
          <div className="flex flex-col gap-0.5 pb-0.5">
            <Stars rating={rating} size={14} />
            <span className="text-[10px] text-white/35 leading-none">
              מתוך {reviewCount.toLocaleString("he-IL")} ביקורות
            </span>
          </div>
        </div>

        {/* Distribution bars */}
        <div className="flex flex-col gap-1 mt-3">
          {breakdown.map((b, i) => (
            <RatingBar key={b.label} label={b.label} pct={b.pct} delay={i * 0.05} />
          ))}
        </div>
      </div>

      {/* ── Review list ── */}
      <div className="px-4 py-1">
        {displayed.length > 0 ? (
          displayed.map((r, i) => (
            <SidebarReviewItem key={r.id} review={r} index={i} />
          ))
        ) : (
          <p className="py-4 text-center text-xs text-white/30">אין ביקורות להצגה עדיין</p>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-white/8 text-[11px] font-medium text-primary/70 hover:text-primary hover:bg-primary/5 transition-all"
      >
        <Star size={11} strokeWidth={2.5} />
        <span>כל הביקורות של {businessName}</span>
        <ExternalLink size={9} className="mr-auto" />
      </a>
    </motion.div>
  );
};

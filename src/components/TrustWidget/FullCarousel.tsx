import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, BadgeCheck, ExternalLink } from "lucide-react";
import { Stars } from "./Stars";
import { ReviewWiseLogo } from "./Logo";
import type { TrustWidgetProps, WidgetReview } from "./types";

// ─── Review card inside the carousel ─────────────────────────────────────────

const ReviewCard = ({
  review,
  index,
}: {
  review: WidgetReview;
  index: number;
}) => (
  <motion.div
    key={review.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.06 }}
    className="flex flex-col gap-2.5 px-5 py-4 rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-sm min-w-0 flex-1"
    style={{ minHeight: 148 }}
  >
    {/* Stars row */}
    <Stars rating={review.rating} size={14} />

    {/* Review text */}
    <p className="text-sm text-white/80 leading-relaxed line-clamp-3 flex-1">
      {review.text}
    </p>

    {/* Footer */}
    <div className="flex items-center justify-between gap-2 mt-auto">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-white/90">
          {review.anonymous ? "אנונימי" : review.reviewerName}
        </span>
        <span className="text-[10px] text-white/35">{review.date}</span>
      </div>
      {review.verified && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium shrink-0">
          <BadgeCheck size={10} strokeWidth={2.5} />
          רכישה מאומתת
        </span>
      )}
    </div>
  </motion.div>
);

// ─── Full Carousel variant ────────────────────────────────────────────────────

const SLIDE_INTERVAL = 5000;
const PER_PAGE = 3;

export const FullCarousel = ({
  businessName,
  slug,
  rating,
  reviewCount,
  reviews = [],
  profileUrl,
}: TrustWidgetProps) => {
  const href = profileUrl ?? `/biz/${slug}`;
  const fiveStarReviews = reviews.filter(r => r.rating >= 4);
  const pages = Math.max(1, Math.ceil(fiveStarReviews.length / PER_PAGE));

  const [page, setPage]     = useState(0);
  const [dir, setDir]       = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setDir(-1);
    setPage(p => (p - 1 + pages) % pages);
  }, [pages]);

  const next = useCallback(() => {
    setDir(1);
    setPage(p => (p + 1) % pages);
  }, [pages]);

  useEffect(() => {
    if (paused || pages <= 1) return;
    const id = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [paused, pages, next]);

  const visibleReviews = fiveStarReviews.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60  : -60,  opacity: 0 }),
    center:              ({ x: 0,             opacity: 1 }),
    exit:  (d: number) => ({ x: d > 0 ? -60 :  60,  opacity: 0 }),
  };

  return (
    <div
      className="relative w-full rounded-2xl border border-white/8 overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, hsl(0 0% 6%), hsl(168 20% 5%))" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      dir="rtl"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
           style={{ background: "radial-gradient(ellipse 70% 50% at 20% 50%, hsl(168 45% 30% / 0.12), transparent)" }} />

      <div className="relative flex flex-col md:flex-row gap-0 md:gap-0">

        {/* ── Left panel: brand + aggregate rating ── */}
        <div className="flex flex-col justify-center gap-4 px-6 py-6 md:px-8 md:py-8 md:w-56 shrink-0 border-b md:border-b-0 md:border-l border-white/8">
          <ReviewWiseLogo size="md" showVerified />

          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-white tabular-nums">
              {rating.toFixed(1)}
            </span>
            <Stars rating={rating} size={18} />
            <span className="text-xs text-white/45 mt-0.5">
              {reviewCount.toLocaleString("he-IL")} ביקורות מאומתות
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              מצוין
            </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-white/70 transition-colors"
            >
              <ExternalLink size={9} />
              {businessName}
            </a>
          </div>
        </div>

        {/* ── Right panel: sliding reviews ── */}
        <div className="flex-1 flex flex-col gap-3 p-4 md:p-5 min-w-0">
          <div className="relative overflow-hidden" style={{ minHeight: 156 }}>
            <AnimatePresence custom={dir} mode="popLayout">
              <motion.div
                key={page}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
                className="flex gap-3 w-full"
              >
                {visibleReviews.length > 0
                  ? visibleReviews.map((r, i) => (
                      <ReviewCard key={r.id} review={r} index={i} />
                    ))
                  : (
                    <div className="flex-1 flex items-center justify-center text-white/30 text-sm py-8">
                      אין עדיין ביקורות להצגה
                    </div>
                  )
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-1">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDir(i > page ? 1 : -1); setPage(i); }}
                    className={`transition-all rounded-full ${
                      i === page
                        ? "w-4 h-1.5 bg-primary"
                        : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`עמוד ${i + 1}`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/12 border border-white/10 text-white/50 hover:text-white transition-all"
                  aria-label="הקודם"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={next}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/12 border border-white/10 text-white/50 hover:text-white transition-all"
                  aria-label="הבא"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

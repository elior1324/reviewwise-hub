// src/components/ReviewsMarquee.tsx
//
// Scrolling testimonial strip for ReviewHub — continuous marquee social-proof wall.
// Two rows of review cards scroll in opposite directions (LTR / RTL-neutral),
// creating a social-proof "wall of trust" effect.
//
// Props:
//   reviews     – override the built-in sample data
//   title       – section heading (default: "מה אומרים עלינו?")
//   subtitle    – section sub-heading (default: "ביקורות אמיתיות ממשתמשים מאומתים")
//   pauseOnHover – pause marquee on mouse-over (default: true)
//   speed       – "slow" | "normal" (default: "normal")
//
// Design tokens used:
//   --star / --star-empty     – star fill colours (defined in index.css)
//   --trust-green             – verified badge colour
//   --card / --border         – card surface & outline
//   --card-shadow / --card-shadow-hover

import { Star, ShieldCheck, MessageCircle, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const SOURCE_TAG_CONFIG = {
  verified_purchase: { label: "רכישה מאומתת", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40", Icon: ShieldCheck },
  whatsapp:          { label: "WhatsApp", className: "text-green-500 bg-green-50 dark:bg-green-950/30", Icon: MessageCircle },
  website:           { label: "אתר ReviewHub", className: "text-muted-foreground bg-muted/50", Icon: Globe },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewTestimonial {
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  rating: number; // 1–5
  text: string;
  verified?: boolean;
  date?: string;
  business?: string;
  /** If provided, business name becomes a clickable link to the profile */
  businessSlug?: string;
  /** Source platform tag shown below business name */
  sourceTag?: "verified_purchase" | "whatsapp" | "website";
}

interface ReviewsMarqueeProps {
  reviews?: ReviewTestimonial[];
  title?: string;
  subtitle?: string;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal";
  className?: string;
}

// ─── Star rating sub-component ────────────────────────────────────────────────

const MARQUEE_STAR_COLORS: Record<number, string> = {
  1: "fill-red-500 text-red-500",
  2: "fill-orange-500 text-orange-500",
  3: "fill-amber-400 text-amber-400",
  4: "fill-lime-400 text-lime-400",
  5: "fill-emerald-400 text-emerald-400",
};

function StarRating({ rating }: { rating: number }) {
  const color = MARQUEE_STAR_COLORS[Math.max(1, Math.min(5, Math.round(rating)))] || MARQUEE_STAR_COLORS[3];
  return (
    <div className="flex gap-0.5" aria-label={`דירוג ${rating} מתוך 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? color
              : "fill-transparent text-muted-foreground/20"
          }
        />
      ))}
    </div>
  );
}

// ─── Single testimonial card ───────────────────────────────────────────────────

function TestimonialCard({ review }: { review: ReviewTestimonial }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex-shrink-0 w-72 rounded-2xl p-5 mx-3",
        "border border-border/40 bg-card",
        "shadow-card hover:shadow-card-hover hover:border-primary/30",
        "transition-colors duration-300 cursor-default select-none",
      )}
    >
      {/* Top: stars + verified badge */}
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} />
        {review.verified && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-trust-green shrink-0">
            <ShieldCheck size={12} strokeWidth={2.5} />
            מאומת
          </span>
        )}
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 mb-3 font-body">
        {review.text}
      </p>

      {/* Business tag — clickable link if businessSlug is provided */}
      {review.business && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {review.businessSlug ? (
            <Link
              to={`/business/${review.businessSlug}`}
              className="text-[11px] text-primary/80 font-semibold hover:text-primary transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              ★ {review.business}
            </Link>
          ) : (
            <p className="text-[11px] text-primary/70 font-medium truncate">★ {review.business}</p>
          )}
          {review.sourceTag && (() => {
            const cfg = SOURCE_TAG_CONFIG[review.sourceTag];
            return (
              <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.className}`}>
                <cfg.Icon size={9} />
                {cfg.label}
              </span>
            );
          })()}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/30 pt-3">
        <div className="flex items-center gap-2.5">
          <img
            src={review.author.avatar}
            alt={review.author.name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-border/50 bg-muted flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              // Fallback to initials-based colour block on load failure
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate font-display">
              {review.author.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {review.author.handle}
            </p>
          </div>
          {review.date && (
            <p className="text-[11px] text-muted-foreground/60 flex-shrink-0">
              {review.date}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Marquee row ──────────────────────────────────────────────────────────────

interface MarqueeRowProps {
  reviews: ReviewTestimonial[];
  reverse?: boolean;
  pauseOnHover?: boolean;
  animClass: string;
}

function MarqueeRow({
  reviews,
  reverse = false,
  pauseOnHover = true,
  animClass,
}: MarqueeRowProps) {
  // Duplicate for seamless loop
  const items = [...reviews, ...reviews];

  return (
    <div
      className="overflow-hidden w-full"
      dir="ltr" // force LTR scroll direction for visual consistency
    >
      <div
        className={cn(
          "flex w-max",
          animClass,
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{ direction: "rtl" }} // keep text RTL inside each card
      >
        {items.map((review, idx) => (
          <TestimonialCard key={`${review.author.handle}-${idx}`} review={review} />
        ))}
      </div>
    </div>
  );
}

// ─── Section fade-in animation ────────────────────────────────────────────────

const sectionFade = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReviewsMarquee({
  reviews,
  title = "מה אומרים עלינו?",
  subtitle = "ביקורות אמיתיות ממשתמשים מאומתים",
  pauseOnHover = true,
  speed = "normal",
  className,
}: ReviewsMarqueeProps) {
  const allReviews = reviews ?? [];

  // Split into two rows of equal size; if odd total, first row gets extra
  const mid = Math.ceil(allReviews.length / 2);
  const row1 = allReviews.slice(0, mid);
  const row2 = allReviews.slice(mid);

  const fwdAnim = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";
  const revAnim =
    speed === "slow" ? "animate-marquee-reverse-slow" : "animate-marquee-reverse";

  return (
    <section className={cn("py-16 md:py-20 overflow-hidden", className)}>
      {/* Gradient edge fades */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 md:w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 md:w-32 bg-gradient-to-l from-background to-transparent" />

        {/* Heading */}
        <motion.div
          className="container mb-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={sectionFade}
        >
          {/* Trust badge row */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={20}
                  className="fill-emerald-400 text-emerald-400"
                />
              ))}
            </span>
            <span className="text-sm font-semibold text-foreground">
              4.9 / 5
            </span>
            <span className="text-xs text-muted-foreground">
              מבוסס על ביקורות מאומתות
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Row 1 — scrolls right to left */}
        <div className="mb-4">
          <MarqueeRow
            reviews={row1}
            reverse={false}
            pauseOnHover={pauseOnHover}
            animClass={fwdAnim}
          />
        </div>

        {/* Row 2 — scrolls left to right */}
        {row2.length > 0 && (
          <MarqueeRow
            reviews={row2}
            reverse={true}
            pauseOnHover={pauseOnHover}
            animClass={revAnim}
          />
        )}
      </div>
    </section>
  );
}

export default ReviewsMarquee;

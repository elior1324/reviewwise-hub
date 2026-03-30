import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  animated?: boolean;
}

// Dynamic star colors matching the review form picker
const RATING_STAR_COLORS: Record<number, { fill: string; text: string }> = {
  1: { fill: "fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]",         text: "text-red-500" },
  2: { fill: "fill-orange-500 text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]",   text: "text-orange-500" },
  3: { fill: "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]",     text: "text-amber-400" },
  4: { fill: "fill-lime-400 text-lime-400 drop-shadow-[0_0_4px_rgba(163,230,53,0.5)]",       text: "text-lime-400" },
  5: { fill: "fill-emerald-400 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]", text: "text-emerald-400" },
};

const StarRating = ({ rating, maxRating = 5, size = 20, showValue = false, animated = false }: StarRatingProps) => {
  const rounded = Math.round(rating);
  const colors = RATING_STAR_COLORS[Math.max(1, Math.min(5, rounded))] || RATING_STAR_COLORS[3];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < rounded;
        const StarWrapper = animated ? motion.div : "div";
        const animProps = animated
          ? {
              initial: { opacity: 0, scale: 0, rotate: -30 },
              animate: { opacity: 1, scale: 1, rotate: 0 },
              transition: { delay: i * 0.08, duration: 0.35, type: "spring" as const, stiffness: 400, damping: 15 },
            }
          : {};
        return (
          <StarWrapper key={i} {...animProps} className="inline-flex">
            <Star
              size={size}
              className={
                filled
                  ? `${colors.fill} transition-all duration-200`
                  : "fill-star-empty text-star-empty transition-all duration-200"
              }
            />
          </StarWrapper>
        );
      })}
      {showValue && (
        <span className={`mr-1.5 font-display font-bold text-sm tracking-tight ${colors.text}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;

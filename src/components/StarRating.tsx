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
  1: { fill: "fill-red-500 text-red-500",       text: "text-red-500" },
  2: { fill: "fill-orange-400 text-orange-400",  text: "text-orange-400" },
  3: { fill: "fill-yellow-400 text-yellow-400",  text: "text-yellow-400" },
  4: { fill: "fill-lime-500 text-lime-500",      text: "text-lime-500" },
  5: { fill: "fill-emerald-500 text-emerald-500", text: "text-emerald-500" },
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

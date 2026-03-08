import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  animated?: boolean;
}

const StarRating = ({ rating, maxRating = 5, size = 20, showValue = false, animated = false }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.round(rating);
        const StarWrapper = animated ? motion.div : "div";
        const animProps = animated
          ? {
              initial: { opacity: 0, scale: 0, rotate: -30 },
              animate: { opacity: 1, scale: 1, rotate: 0 },
              transition: { delay: i * 0.08, duration: 0.35, type: "spring", stiffness: 400, damping: 15 },
            }
          : {};
        return (
          <StarWrapper key={i} {...animProps} className="inline-flex">
            <Star
              size={size}
              className={
                filled
                  ? "fill-star text-star drop-shadow-[0_0_6px_hsl(38,100%,50%,0.5)] transition-all duration-200"
                  : "fill-star-empty text-star-empty transition-all duration-200"
              }
            />
          </StarWrapper>
        );
      })}
      {showValue && (
        <span className="mr-1.5 font-display font-bold text-star text-sm tracking-tight">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;

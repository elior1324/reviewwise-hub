import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
}

const StarRating = ({ rating, maxRating = 5, size = 20, showValue = false }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={
              filled
                ? "fill-star text-star drop-shadow-[0_0_6px_hsl(38,100%,50%,0.5)] transition-all duration-200"
                : "fill-star-empty text-star-empty transition-all duration-200"
            }
          />
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

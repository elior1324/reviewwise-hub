import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
}

const StarRating = ({ rating, maxRating = 5, size = 20, showValue = false }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-star text-star" : "fill-star-empty text-star-empty"}
        />
      ))}
      {showValue && <span className="ml-1 font-display font-semibold text-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;

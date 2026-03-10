import { Star } from "lucide-react";

interface StarsProps {
  rating: number;
  size?: number;
  className?: string;
}

/**
 * Renders filled / half / empty stars that match the ReviewWise accent palette.
 * Uses SVG clip-path for precise partial fills.
 */
export const Stars = ({ rating, size = 16, className = "" }: StarsProps) => {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`דירוג ${rating} מתוך 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled    = rating >= i + 1;
        const halfFill  = !filled && rating >= i + 0.5;
        const pct       = filled ? 100 : halfFill ? 50 : 0;
        const uid       = `star-clip-${i}-${Math.random().toString(36).slice(2, 7)}`;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
          >
            {/* Background (empty) star */}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="hsl(var(--star-empty, 0 0% 22%))"
            />
            {/* Foreground (filled) star — clipped to the fill percentage */}
            {pct > 0 && (
              <>
                <defs>
                  <clipPath id={uid}>
                    <rect x="0" y="0" width={`${pct}%`} height="100%" />
                  </clipPath>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="hsl(var(--star, 38 100% 50%))"
                  clipPath={`url(#${uid})`}
                />
              </>
            )}
          </svg>
        );
      })}
    </span>
  );
};

/** Compact "4.8 ★★★★★" inline display */
export const RatingPill = ({
  rating,
  reviewCount,
  size = 14,
}: {
  rating: number;
  reviewCount: number;
  size?: number;
}) => (
  <div className="inline-flex items-center gap-1.5 flex-wrap">
    <span className="font-bold text-foreground text-sm tabular-nums">
      {rating.toFixed(1)}
    </span>
    <Stars rating={rating} size={size} />
    <span className="text-muted-foreground text-xs">
      ({reviewCount.toLocaleString("he-IL")} ביקורות)
    </span>
  </div>
);

export default Stars;

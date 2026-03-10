import { BadgeCheck } from "lucide-react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showVerified?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { icon: 14, text: "text-[10px]", gap: "gap-1",   badge: 10 },
  sm: { icon: 18, text: "text-xs",     gap: "gap-1.5", badge: 12 },
  md: { icon: 24, text: "text-sm",     gap: "gap-2",   badge: 14 },
  lg: { icon: 32, text: "text-base",   gap: "gap-2.5", badge: 16 },
};

/**
 * ReviewWise brand lock-up.
 * Inline SVG so it renders correctly even inside iframes / external embeds.
 */
export const ReviewWiseLogo = ({
  size = "md",
  showVerified = true,
  className = "",
}: LogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Shield icon — the ReviewWise mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="ReviewWise"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="hsl(168 45% 30%)" />
        {/* Shield */}
        <path
          d="M16 5L7 9v7c0 5 4 9.7 9 11 5-1.3 9-6 9-11V9L16 5z"
          fill="hsl(168 55% 70% / 0.25)"
          stroke="hsl(168 55% 72%)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Star inside shield */}
        <path
          d="M16 10.5l1.25 2.6 2.75.4-2 2 .47 2.8L16 17.1l-2.47 1.2.47-2.8-2-2 2.75-.4L16 10.5z"
          fill="hsl(38 100% 58%)"
        />
      </svg>

      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-bold text-foreground tracking-tight ${s.text}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          ReviewWise
        </span>
        {showVerified && (
          <span
            className="flex items-center gap-0.5 text-[hsl(168_45%_55%)]"
            style={{ fontSize: `${parseInt(s.text.replace(/\D/g, "") || "10") - 1}px` }}
          >
            <BadgeCheck size={s.badge} strokeWidth={2.2} />
            <span className="text-[10px] font-medium">Verified</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewWiseLogo;

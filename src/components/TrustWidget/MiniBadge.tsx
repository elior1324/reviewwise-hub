import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Stars } from "./Stars";
import { ReviewWiseLogo } from "./Logo";
import type { TrustWidgetProps } from "./types";

/**
 * MiniBadge — compact floating card (~240px wide).
 *
 * Perfect for embedding in the bottom corner of a landing page.
 * Fully self-contained so it works inside an <iframe>.
 */
export const MiniBadge = ({
  businessName,
  slug,
  rating,
  reviewCount,
  profileUrl,
}: TrustWidgetProps) => {
  const href = profileUrl ?? `/biz/${slug}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px hsl(168 45% 30% / 0.25)" }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      dir="rtl"
      className="group inline-flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 text-inherit no-underline cursor-pointer"
      style={{
        background: "linear-gradient(145deg, hsl(0 0% 8%), hsl(0 0% 6%))",
        boxShadow: "0 4px 24px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(168 45% 30% / 0.12)",
        minWidth: 220,
        maxWidth: 280,
      }}
    >
      {/* Logo */}
      <ReviewWiseLogo size="sm" showVerified={false} />

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 shrink-0" />

      {/* Rating data */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-base tabular-nums leading-none">
            {rating.toFixed(1)}
          </span>
          <Stars rating={rating} size={13} />
        </div>
        <span className="text-[10px] text-white/40 leading-none">
          {reviewCount.toLocaleString("he-IL")} ביקורות
        </span>
      </div>

      {/* External link hint */}
      <ExternalLink
        size={11}
        className="text-white/20 group-hover:text-primary transition-colors mr-auto shrink-0"
      />
    </motion.a>
  );
};

/**
 * FixedMiniBadge — absolutely positioned variant for demo purposes.
 * Shows the badge anchored to the bottom-right of its container.
 */
export const FixedMiniBadge = (props: TrustWidgetProps & { position?: "bottom-right" | "bottom-left" }) => {
  const { position = "bottom-right", ...widgetProps } = props;
  const posClass = position === "bottom-right" ? "bottom-5 left-5" : "bottom-5 right-5";

  return (
    <div className={`absolute ${posClass} z-10`}>
      <MiniBadge {...widgetProps} />
    </div>
  );
};

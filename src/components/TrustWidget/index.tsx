/**
 * TrustWidget/index.tsx
 *
 * Unified entry point for the complete ReviewWise Trust Badge system.
 *
 * ── Platform widgets (React, for reviewhub.co.il pages) ──────────────────────
 *   <TrustWidget variant="full"    {...props} />   // Full-width carousel
 *   <TrustWidget variant="mini"    {...props} />   // Compact floating badge
 *   <TrustWidget variant="sidebar" {...props} />   // Vertical sidebar list
 *   <FixedMiniBadge position="bottom-right" {...props} />
 *
 * ── Embeddable badge variants (render inside BusinessDashboard preview) ───────
 *   <CompactBadge  {...props} />   // ~260 × 48 px  — footer / navbar
 *   <StandardBadge {...props} />   // ~290 × 110 px — sidebar / landing page
 *   <ExpandedWidget {...props} />  // ~340 × auto   — hero / marketing blocks
 *
 * These three components are also self-rendered by the vanilla JS embed script
 * (public/reviewhub-widget.js) on external websites.
 */

import React from "react";
import { FullCarousel }   from "./FullCarousel";
import { MiniBadge, FixedMiniBadge } from "./MiniBadge";
import { SidebarList }    from "./SidebarList";
import type { TrustWidgetProps } from "./types";

// ─── Platform widget (carousel / mini / sidebar) ─────────────────────────────

export const TrustWidget = ({
  variant = "full",
  ...props
}: TrustWidgetProps) => {
  switch (variant) {
    case "mini":
      return <MiniBadge {...props} />;
    case "sidebar":
      return <SidebarList {...props} />;
    case "full":
    default:
      return <FullCarousel {...props} />;
  }
};

// ─── Platform widget named exports ───────────────────────────────────────────

export { FullCarousel }              from "./FullCarousel";
export { MiniBadge, FixedMiniBadge } from "./MiniBadge";
export { SidebarList }               from "./SidebarList";

// ─── Embeddable badge exports ─────────────────────────────────────────────────

export { CompactBadge }   from "./CompactBadge";
export { StandardBadge }  from "./StandardBadge";
export { ExpandedWidget } from "./ExpandedWidget";

// ─── Shared utilities ─────────────────────────────────────────────────────────

export { Stars, RatingPill } from "./Stars";
export { ReviewWiseLogo }    from "./Logo";

export type { TrustWidgetProps, WidgetReview } from "./types";

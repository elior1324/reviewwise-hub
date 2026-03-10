// ─── Shared types for the TrustWidget system ────────────────────────────────

export interface WidgetReview {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  courseName?: string;
  date: string;
  verified: boolean;
  anonymous: boolean;
}

export interface TrustWidgetProps {
  /** Visual variant of the widget */
  variant?: "full" | "mini" | "sidebar";
  /** Business display name */
  businessName: string;
  /** Supabase slug — used to build the profile URL */
  slug: string;
  /** Average rating 0–5 */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
  /** Reviews to display in the carousel / list */
  reviews?: WidgetReview[];
  /** Override the link target (defaults to /biz/:slug) */
  profileUrl?: string;
  /** Force a theme; defaults to dark */
  theme?: "dark" | "light";
}

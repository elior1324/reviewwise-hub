/**
 * WidgetPage.tsx
 *
 * Standalone, iframe-safe page that renders a live TrustWidget for a
 * specific business. This page is served at:
 *
 *   https://reviewhub.co.il/widget/:slug?v=full|mini|sidebar
 *
 * It is embedded on EXTERNAL business websites via the copy-paste iframe
 * code generated in /partners/prestige-badges?tab=widgets.
 *
 * Design principles:
 *  • No navbar, no footer — purely the widget component
 *  • Transparent background so it blends into the host website
 *  • All click links use the FULL absolute URL to reviewhub.co.il/biz/:slug
 *    so that clicking always lands on the correct ReviewHub profile,
 *    regardless of which external site is embedding the widget
 *  • target="_blank" rel="noopener noreferrer" on all outbound links
 *    so the customer stays on the business's site while ReviewHub opens
 *    in a new tab
 *  • noindex meta tag — search engines should not index this page
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrustWidget } from "@/components/TrustWidget";
import type { TrustWidgetProps, WidgetReview } from "@/components/TrustWidget";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://reviewhub.co.il";
const VALID_VARIANTS = ["full", "mini", "sidebar"] as const;
type WidgetVariant = typeof VALID_VARIANTS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format Hebrew date from ISO string
// ─────────────────────────────────────────────────────────────────────────────

function heDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WidgetPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const rawVariant = searchParams.get("v") ?? "full";
  const variant: WidgetVariant = VALID_VARIANTS.includes(rawVariant as WidgetVariant)
    ? (rawVariant as WidgetVariant)
    : "full";

  const [widgetProps, setWidgetProps] = useState<Omit<TrustWidgetProps, "variant"> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) { setError(true); return; }

    let cancelled = false;

    async function load() {
      // ── 1. Fetch business ────────────────────────────────────────────────
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("id, name, slug, rating, review_count, logo_url")
        .eq("slug", slug)
        .maybeSingle();

      if (bizErr || !biz || cancelled) { setError(true); return; }

      // ── 2. Fetch top reviews ─────────────────────────────────────────────
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, review_text, anonymous, verified, created_at, courses(course_name)")
        .eq("business_id", biz.id)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;

      const reviews: WidgetReview[] = (reviewRows ?? []).map((r: any) => ({
        id:           r.id,
        reviewerName: r.anonymous ? "אנונימי" : (r.reviewer_name || "משתמש"),
        rating:       r.rating ?? 0,
        text:         r.review_text ?? "",
        courseName:   r.courses?.course_name ?? "",
        date:         heDate(r.created_at),
        verified:     r.verified ?? false,
        anonymous:    r.anonymous ?? false,
      }));

      // Compute average rating from fetched reviews if DB value is missing
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : (biz.rating ?? 0);

      setWidgetProps({
        businessName: biz.name,
        slug:         biz.slug,
        rating:       avgRating,
        reviewCount:  biz.review_count ?? reviews.length,
        // ✅ ABSOLUTE URL — so any click from any external website lands on
        //    the correct ReviewHub profile page, not a broken relative path
        profileUrl:   `${BASE_URL}/biz/${biz.slug}`,
        reviews,
      });
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Transparent shell — just the widget, nothing else ──────────────────────
  return (
    <>
      {/* noindex so search bots don't index the bare iframe URL */}
      <meta name="robots" content="noindex, nofollow" />

      <div
        dir="rtl"
        style={{
          background: "transparent",
          padding: variant === "mini" ? 0 : "4px",
          maxWidth: variant === "sidebar" ? 320 : variant === "mini" ? 280 : "100%",
          width: "100%",
        }}
      >
        {widgetProps ? (
          <TrustWidget variant={variant} {...widgetProps} />
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 64,
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            לא נמצא פרופיל
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 64,
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            טוען...
          </div>
        )}
      </div>
    </>
  );
}

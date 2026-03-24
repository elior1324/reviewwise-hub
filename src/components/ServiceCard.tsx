/**
 * ServiceCard — Public-facing service/product card
 *
 * Inspired by Trustpilot's clean trust-first aesthetic, adapted for
 * ReviewHub's trust + affiliate model.
 *
 * Decision logic:
 *   hasAffiliate (affiliate_url + affiliate_percentage > 0):
 *     → Primary CTA: "קבל X% הנחה"
 *     → Trust text: "רכישה דרך הקישור מעניקה לך X% הנחה"
 *     → Card has subtle highlight border
 *
 *   affiliate_url only (no percentage):
 *     → Primary CTA: "לרכישה"
 *
 *   url only (no affiliate):
 *     → Secondary CTA: "למידע נוסף"
 *
 *   no url at all:
 *     → No CTA
 */

import { ExternalLink, Tag, ChevronLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export interface ServiceCardProps {
  id: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  price?: number | null;
  url?: string | null;
  affiliateUrl?: string | null;
  affiliatePercentage?: number | null;
  category?: string | null;
  rating?: number;
  reviewCount?: number;
  businessSlug?: string;
}

const ServiceCard = ({
  id,
  name,
  shortDescription,
  description,
  price,
  url,
  affiliateUrl,
  affiliatePercentage,
  category,
  rating = 0,
  reviewCount = 0,
  businessSlug,
}: ServiceCardProps) => {
  const hasAffiliate = !!affiliateUrl;
  const hasDiscount = hasAffiliate && affiliatePercentage != null && affiliatePercentage > 0;
  const ctaUrl = affiliateUrl || url || null;
  const displayDescription = shortDescription || description || null;

  return (
    <div
      className={`
        relative rounded-2xl border bg-card h-full flex flex-col
        transition-all duration-300 overflow-hidden
        ${hasAffiliate
          ? "border-primary/25 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          : "border-border/50 hover:border-border hover:shadow-md"
        }
      `}
    >
      {/* ── Affiliate highlight strip ──────────────────────────────── */}
      {hasDiscount && (
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent px-5 py-2 flex items-center gap-2 border-b border-primary/10">
          <Tag size={12} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary">
            {affiliatePercentage}% הנחה דרך ReviewHub
          </span>
        </div>
      )}

      {/* ── Card body ──────────────────────────────────────────────── */}
      <div className="p-5 flex flex-col flex-1 gap-3">

        {/* Top row: category + price */}
        <div className="flex items-start justify-between gap-2">
          {category ? (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {category}
            </span>
          ) : <span />}
          {price != null && price > 0 && (
            <span className="font-display font-bold text-lg text-foreground shrink-0">
              ₪{price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-display font-bold text-foreground text-base leading-snug">
          {name}
        </h4>

        {/* Rating row (if available) */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  width={14}
                  height={14}
                  viewBox="0 0 20 20"
                  className={star <= Math.round(rating) ? "text-amber-400" : "text-muted-foreground/20"}
                  fill="currentColor"
                >
                  <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {rating > 0 ? rating.toFixed(1) : ""} ({reviewCount} ביקורות)
            </span>
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
            {displayDescription}
          </p>
        )}

        {/* Trust text for affiliate */}
        {hasDiscount && (
          <div className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-200/50 dark:border-amber-800/30">
            <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              רכישה דרך הקישור הזה מעניקה לך {affiliatePercentage}% הנחה
            </p>
          </div>
        )}

        {/* ── CTA area ──────────────────────────────────────────── */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          {ctaUrl && (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {hasDiscount ? (
                <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors">
                  <Tag size={14} />
                  קבל {affiliatePercentage}% הנחה
                </button>
              ) : hasAffiliate ? (
                <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors">
                  <ExternalLink size={14} />
                  לרכישה
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground font-medium text-sm rounded-xl px-4 py-2.5 transition-colors">
                  למידע נוסף
                  <ChevronLeft size={14} />
                </button>
              )}
            </a>
          )}

          {/* Course detail link */}
          {businessSlug && (
            <Link
              to={`/course/${id}`}
              className="text-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              צפו בביקורות ודירוגים
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;

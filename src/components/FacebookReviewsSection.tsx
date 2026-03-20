/**
 * FacebookReviewsSection
 *
 * Renders Facebook page reviews on a business profile page.
 *
 * Trust hierarchy position:
 *   Tier 1 — ReviewHub Verified Purchase   (above)
 *   Tier 2 — ReviewHub Community           (above)
 *   Tier 3 — Google Reviews               (above, if connected)
 *   Tier 4 — WhatsApp Feedback             (above, if connected)
 *   Tier 5 — Facebook Reviews             ← THIS COMPONENT
 *
 * Design rules:
 *  - Clearly labeled with Facebook blue branding
 *  - Attribution note links to Facebook page
 *  - No ReviewHub shield badge — external source
 *  - "Representative sample" note for API-limited imports
 */

import { useState } from "react";
import { Star, ExternalLink, ChevronDown, ChevronUp, Info, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Facebook SVG icon (inline) ────────────────────────────────────────────────

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const StarRow = ({ rating, size = 11 }: { rating: number; size?: number }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array(full).fill(null).map((_, i) => (
        <Star key={`f${i}`} size={size} className="fill-amber-400 text-amber-400" />
      ))}
      {half && <Star size={size} className="fill-amber-200 text-amber-400" />}
      {Array(empty).fill(null).map((_, i) => (
        <Star key={`e${i}`} size={size} className="fill-transparent text-amber-300" />
      ))}
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacebookReview {
  id: string;
  author_name?: string | null;
  author_profile_url?: string | null;
  author_photo_url?: string | null;
  rating?: number | null;
  text?: string | null;
  published_at?: string | null;
  source_url?: string | null;
}

interface FacebookReviewsSectionProps {
  reviews: FacebookReview[];
  pageUrl?: string | null;   // Facebook page URL for attribution link
  pageName?: string | null;  // Facebook page name
}

// ── Individual card ───────────────────────────────────────────────────────────

const FacebookReviewCard = ({ review }: { review: FacebookReview }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const toggle = () => {
    setLiked(prev => {
      const next = !prev;
      setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
      return next;
    });
  };
  return (
    <Card className="border border-[#1877F2]/15 bg-[#1877F2]/3 hover:bg-[#1877F2]/5 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          {review.author_photo_url ? (
            <img
              src={review.author_photo_url}
              alt={review.author_name ?? "Facebook user"}
              className="w-7 h-7 rounded-full object-cover shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#1877F2]/15 flex items-center justify-center shrink-0">
              <FacebookIcon size={12} />
            </div>
          )}
          <div className="min-w-0">
            {review.author_profile_url ? (
              <a href={review.author_profile_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-foreground hover:text-[#1877F2] transition-colors flex items-center gap-0.5 truncate">
                <span className="truncate">{review.author_name || "משתמש Facebook"}</span>
                <ExternalLink size={8} className="opacity-50 shrink-0" />
              </a>
            ) : (
              <p className="text-xs font-medium text-foreground truncate">{review.author_name || "משתמש Facebook"}</p>
            )}
            {review.published_at && (
              <p className="text-[10px] text-muted-foreground/60">
                {new Date(review.published_at).toLocaleDateString("he-IL")}
              </p>
            )}
          </div>
        </div>
        {review.rating != null && <StarRow rating={review.rating} />}
        {review.text && (
          <p className="text-xs text-foreground/80 leading-relaxed mt-1.5 line-clamp-4">
            {review.text}
          </p>
        )}
        <button
          onClick={toggle}
          className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <ThumbsUp size={10} className={liked ? "fill-primary" : ""} />
          {likeCount > 0 ? likeCount : "מועיל"}
        </button>
      </CardContent>
    </Card>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const PREVIEW_COUNT = 3;

const FacebookReviewsSection = ({
  reviews,
  pageUrl,
  pageName,
}: FacebookReviewsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const visible = expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-8 border-t border-border/30 pt-8" dir="rtl">
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-7 rounded-full bg-[#1877F2]/30" />
          <FacebookIcon size={20} />
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              ביקורות Facebook
              {pageUrl && (
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#1877F2] transition-colors"
                  aria-label="פתח בפייסבוק"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {reviews.length} ביקורות
              {pageName ? ` · ${pageName}` : ""}
              {reviews.length >= PREVIEW_COUNT ? " · מדגם מייצג" : ""}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              <p className="font-semibold mb-1">ביקורות Facebook</p>
              <p className="text-muted-foreground leading-relaxed">
                ביקורות אלה יובאו ישירות מדף הפייסבוק של העסק.
                הן מוצגות כמידע נוסף ואינן חלק ממדד האמון של ReviewHub.
                לצפייה בכל הביקורות, בקרו בדף הפייסבוק.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {pageUrl && (
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-[#1877F2] border border-[#1877F2]/30 bg-[#1877F2]/5 px-2 py-0.5 rounded-full hover:bg-[#1877F2]/10 transition-colors flex items-center gap-1"
            >
              <ExternalLink size={9} />
              ראה בפייסבוק
            </a>
          )}
          <span className="text-[10px] font-medium text-[#1877F2]/60 border border-[#1877F2]/15 bg-[#1877F2]/5 px-2 py-0.5 rounded-full">
            לא מאומת על ידי ReviewHub
          </span>
        </div>
      </div>

      {/* ── Review cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {visible.map((review) => (
          <FacebookReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* ── Show more / less ───────────────────────────────────────────── */}
      {reviews.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          {expanded ? (
            <>הצג פחות <ChevronUp size={13} /></>
          ) : (
            <>הצג את כל {reviews.length} הביקורות <ChevronDown size={13} /></>
          )}
        </button>
      )}
    </div>
  );
};

export default FacebookReviewsSection;

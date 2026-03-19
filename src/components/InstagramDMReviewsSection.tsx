/**
 * InstagramDMReviewsSection
 *
 * Renders Instagram DM customer feedback on a business profile page.
 *
 * Trust hierarchy position:
 *   Tier 1 — ReviewHub Verified Purchase   (above)
 *   Tier 2 — ReviewHub Community           (above)
 *   Tier 3 — Google Reviews               (above, if connected)
 *   Tier 4 — WhatsApp Feedback             (above, if connected)
 *   Tier 5 — Instagram DM Feedback        ← THIS COMPONENT
 *   Tier 6 — Facebook Reviews             (below, if connected)
 *
 * Design rules:
 *  - Instagram gradient branding (#833AB4 → #E1306C → #F77737)
 *  - Attribution note: "אסופה דרך בוט Instagram"
 *  - Stars shown only when rating is provided
 *  - No ReviewHub shield badge — not ReviewHub-verified
 *  - Business owner must approve before public display (is_approved=true)
 */

import { useState } from "react";
import { Star, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Instagram SVG icon (inline, gradient) ────────────────────────────────────
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-section-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#E1306C" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <path
      fill="url(#ig-section-grad)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
    />
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

export interface InstagramDMReview {
  id: string;
  author_name?: string | null;
  rating?: number | null;
  text: string;
  received_at: string;
}

interface InstagramDMReviewsSectionProps {
  reviews: InstagramDMReview[];
}

const PREVIEW_COUNT = 3;
const IG_GRADIENT   = "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
const IG_PINK       = "#E1306C";

const InstagramDMReviewsSection = ({ reviews }: InstagramDMReviewsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const visible = expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-8 border-t border-border/30 pt-8" dir="rtl">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          {/* Visual separator */}
          <div className="w-1 h-7 rounded-full" style={{ background: IG_GRADIENT }} />
          <InstagramIcon size={20} />
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              משוב לקוחות Instagram
            </h3>
            <p className="text-xs text-muted-foreground">
              {reviews.length} משובים · אסופה דרך בוט Instagram
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              <p className="font-semibold mb-1">משוב Instagram</p>
              <p className="text-muted-foreground leading-relaxed">
                משובים אלה נאספו ישירות מלקוחות דרך קישור ייחודי שבעל העסק שלח ב-Instagram.
                כל משוב עבר אישור בעל עסק לפני פרסום. אלו אינן ביקורות מאומתות על ידי ReviewHub.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <span
          className="text-[10px] font-medium border rounded-full px-2 py-0.5"
          style={{ color: `${IG_PINK}b3`, borderColor: `${IG_PINK}33`, background: `${IG_PINK}0d` }}
        >
          לא מאומת על ידי ReviewHub
        </span>
      </div>

      {/* ── Review cards ── */}
      <div className="space-y-3">
        {visible.map((review) => (
          <Card
            key={review.id}
            className="transition-colors"
            style={{ borderColor: `${IG_PINK}26`, background: `${IG_PINK}08` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  {/* Instagram avatar placeholder */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${IG_PINK}1a` }}
                  >
                    <InstagramIcon size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {review.author_name || "לקוח אנונימי"}
                    </p>
                    {review.rating != null && <StarRow rating={review.rating} />}
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(review.received_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 shrink-0"
                  style={{ color: `${IG_PINK}b3`, borderColor: `${IG_PINK}33`, background: `${IG_PINK}0d` }}
                >
                  <InstagramIcon size={9} />
                  Instagram DM
                </div>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed mt-3 pr-11">
                {review.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Show more / less ── */}
      {reviews.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          {expanded ? (
            <>הצג פחות <ChevronUp size={13} /></>
          ) : (
            <>הצג את כל {reviews.length} המשובים <ChevronDown size={13} /></>
          )}
        </button>
      )}
    </div>
  );
};

export default InstagramDMReviewsSection;

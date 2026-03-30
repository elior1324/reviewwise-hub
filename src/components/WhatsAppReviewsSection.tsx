/**
 * WhatsAppReviewsSection
 *
 * Renders WhatsApp customer feedback on a business profile page.
 *
 * Trust hierarchy position:
 *   Tier 1 — ReviewHub Verified Purchase   (above)
 *   Tier 2 — ReviewHub Community           (above)
 *   Tier 3 — Google Reviews               (above, if connected)
 *   Tier 4 — WhatsApp Feedback             ← THIS COMPONENT
 *   Tier 5 — Facebook Reviews             (below, if connected)
 *
 * Design rules:
 *  - Clearly labeled with WhatsApp green branding
 *  - Attribution note: "אסופה דרך קישור ביקורת ייחודי"
 *  - Stars shown only when rating is provided
 *  - No ReviewHub shield badge — these are not ReviewHub-verified
 *  - Business owner must approve before public display (is_approved=true)
 */

import { useState } from "react";
import { Star, ChevronDown, ChevronUp, Info, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── WhatsApp SVG icon (inline) ────────────────────────────────────────────────

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WA_STAR_COLORS: Record<number, string> = {
  1: "fill-red-500 text-red-500",
  2: "fill-orange-500 text-orange-500",
  3: "fill-amber-400 text-amber-400",
  4: "fill-lime-400 text-lime-400",
  5: "fill-emerald-400 text-emerald-400",
};

const StarRow = ({ rating, size = 11 }: { rating: number; size?: number }) => {
  const rounded = Math.round(rating);
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const color = WA_STAR_COLORS[Math.max(1, Math.min(5, rounded))] || WA_STAR_COLORS[3];
  return (
    <div className="flex items-center gap-0.5">
      {Array(full).fill(null).map((_, i) => (
        <Star key={`f${i}`} size={size} className={color} />
      ))}
      {half && <Star size={size} className={color} style={{ opacity: 0.6 }} />}
      {Array(empty).fill(null).map((_, i) => (
        <Star key={`e${i}`} size={size} className="fill-transparent text-muted-foreground/20" />
      ))}
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WhatsAppReview {
  id: string;
  author_name?: string | null;
  rating?: number | null;
  text: string;
  received_at: string;
  source_url?: string | null;
}

interface WhatsAppReviewsSectionProps {
  reviews: WhatsAppReview[];
}

// ── Individual card with local like state ─────────────────────────────────────

const WhatsAppReviewCard = ({ review }: { review: WhatsAppReview }) => {
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
    <Card className="border border-[#25D366]/15 bg-[#25D366]/3 hover:bg-[#25D366]/5 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
            <WhatsAppIcon size={12} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {review.author_name || "לקוח אנונימי"}
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {new Date(review.received_at).toLocaleDateString("he-IL")}
            </p>
          </div>
        </div>
        {review.rating != null && <StarRow rating={review.rating} />}
        <p className="text-xs text-foreground/80 leading-relaxed mt-1.5 line-clamp-4">
          {review.text}
        </p>
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

const WhatsAppReviewsSection = ({ reviews }: WhatsAppReviewsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const visible = expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-8 border-t border-border/30 pt-8" dir="rtl">
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          {/* Visual separator from ReviewHub reviews */}
          <div className="w-1 h-7 rounded-full bg-[#25D366]/40" />
          <WhatsAppIcon size={20} />
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              משוב לקוחות WhatsApp
            </h3>
            <p className="text-xs text-muted-foreground">
              {reviews.length} משובים · אסופה דרך קישור ביקורת ייחודי
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              <p className="font-semibold mb-1">משוב WhatsApp</p>
              <p className="text-muted-foreground leading-relaxed">
                משובים אלה נאספו ישירות מלקוחות דרך קישור ייחודי שבעל העסק שיתף.
                כל משוב עבר אישור בעל עסק לפני פרסום. אלו אינן ביקורות מאומתות על ידי ReviewHub.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* External trust disclaimer */}
        <span className="text-[10px] font-medium text-[#25D366]/70 border border-[#25D366]/20 bg-[#25D366]/5 px-2 py-0.5 rounded-full">
          לא מאומת על ידי ReviewHub
        </span>
      </div>

      {/* ── Review cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {visible.map((review) => (
          <WhatsAppReviewCard key={review.id} review={review} />
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
            <>הצג את כל {reviews.length} המשובים <ChevronDown size={13} /></>
          )}
        </button>
      )}
    </div>
  );
};

export default WhatsAppReviewsSection;

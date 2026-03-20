/**
 * GoogleReviewsSection
 *
 * Renders external Google reviews on a business profile page.
 *
 * Trust hierarchy enforced by design:
 *   1. ReviewHub Verified Reviews   — primary (rendered elsewhere, above this)
 *   2. ReviewHub Community Reviews  — secondary (rendered elsewhere, above this)
 *   3. Google Reviews               — tertiary, THIS component, visually distinct
 *
 * Design rules:
 *  - Always clearly labeled as "ביקורות מ-Google" with Google's G logo
 *  - Shows aggregate Google rating separately from ReviewHub rating
 *  - Attribution link to Google Maps required per ToS
 *  - Sync recency is shown so users understand data freshness
 *  - "Representative sample" disclaimer for the 5-review API limit
 *  - Cannot be mistaken for ReviewHub-verified reviews (no shield badge, no tier badge)
 */

import { useState } from "react";
import { Star, RefreshCw, ExternalLink, Info, Clock, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Google G logo SVG (inline — no external asset dependency) ─────────────────

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Star renderer ─────────────────────────────────────────────────────────────

const StarRow = ({ rating, size = 12 }: { rating: number; size?: number }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} כוכבים`}>
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

export interface GoogleReview {
  id: string;
  author_name: string;
  author_photo_url?: string | null;
  rating: number;
  text?: string | null;
  published_at?: string | null;
  source_url?: string | null;
}

export interface GoogleProfileData {
  external_id: string;
  external_url?: string | null;
  external_name?: string | null;
  external_rating?: number | null;
  external_review_count?: number | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
}

interface GoogleReviewsSectionProps {
  businessId: string;
  businessSlug: string;
  profile: GoogleProfileData;
  reviews: GoogleReview[];
  isOwner?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const GoogleReviewsSection = ({
  businessId,
  businessSlug,
  profile,
  reviews,
  isOwner = false,
}: GoogleReviewsSectionProps) => {
  const [expanded, setExpanded]       = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState<string | null>(null);
  const { user } = useAuth();

  if (!profile || !profile.external_id) return null;

  const displayedReviews = expanded ? reviews : reviews.slice(0, 3);
  const hasMore = reviews.length > 3;

  const syncAgo = profile.last_synced_at
    ? formatSyncAgo(profile.last_synced_at)
    : null;

  const handleManualSync = async () => {
    if (syncing || !user) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { error } = await supabase.functions.invoke("google-places-sync", {
        body: { action: "sync_business", business_id: businessId },
      });
      setSyncMsg(error ? `שגיאה: ${error.message}` : "סונכרן בהצלחה!");
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (e: any) {
      setSyncMsg("שגיאת רשת. נסה שוב.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section aria-labelledby="google-reviews-heading" className="mt-8">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          {/* Clear visual separator from ReviewHub reviews */}
          <div className="w-1 h-7 rounded-full bg-border/60" aria-hidden="true" />
          <GoogleIcon size={20} />
          <h2
            id="google-reviews-heading"
            className="text-base font-semibold text-foreground"
          >
            ביקורות מ-Google
          </h2>

          {/* Trust tier disclaimer */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="מידע על ביקורות גוגל">
                <Info size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed text-right">
              <p className="font-semibold mb-1">על ביקורות אלו</p>
              <p>
                ביקורות אלו מקורן ב-Google ומוצגות לצורכי הקשר בלבד.
                הן <strong>לא אומתו על ידי ReviewHub</strong> ואינן חלק מציון האמון המוגן של הפלטפורמה.
              </p>
              <p className="mt-1.5 text-muted-foreground/80">
                לביקורות מאומתות עם ראיות רכישה, ראה את הביקורות הרשמיות של ReviewHub למעלה.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Google aggregate rating */}
        {profile.external_rating != null && (
          <a
            href={profile.external_url || `https://maps.google.com/?q=${encodeURIComponent(profile.external_name || businessSlug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
            aria-label={`דירוג Google: ${profile.external_rating} מתוך 5`}
          >
            <span className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
              {Number(profile.external_rating).toFixed(1)}
            </span>
            <StarRow rating={Number(profile.external_rating)} size={13} />
            {profile.external_review_count != null && (
              <span className="text-xs text-muted-foreground">
                ({profile.external_review_count.toLocaleString("he-IL")} ביקורות)
              </span>
            )}
            <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        )}
      </div>

      {/* ── Disclaimer banner ── */}
      <div className="flex items-start gap-2 bg-muted/40 border border-border/50 rounded-lg px-3.5 py-2.5 mb-4 text-xs text-muted-foreground">
        <GoogleIcon size={14} />
        <span>
          ביקורות אלו מגיעות מ-Google ומשקפות את הדירוג הציבורי שם.
          <strong className="text-foreground"> הן אינן מאומתות על ידי ReviewHub</strong> ואינן משפיעות על ציון האמון הרשמי.
          {" "}
          <a
            href={profile.external_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-foreground/70 hover:text-foreground"
          >
            צפה בכל הביקורות ב-Google
          </a>
        </span>
      </div>

      {/* ── Review cards ── */}
      {reviews.length === 0 ? (
        <Card className="shadow-card bg-card">
          <CardContent className="py-8 text-center">
            <GoogleIcon size={28} />
            <p className="text-sm text-muted-foreground mt-2">
              {profile.sync_status === "never"
                ? "טרם בוצע סנכרון עם Google."
                : "לא נמצאו ביקורות Google זמינות כרגע."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {displayedReviews.map((review) => (
            <GoogleReviewCard key={review.id} review={review} />
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-muted/30 transition-all"
            >
              {expanded ? (
                <><ChevronUp size={13} /> הסתר ביקורות</>
              ) : (
                <><ChevronDown size={13} /> הצג {reviews.length - 3} ביקורות נוספות</>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Footer: sync status + owner controls ── */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground/70">
        <div className="flex items-center gap-1.5">
          <Clock size={10} />
          {syncAgo
            ? <span>עודכן לאחרונה: {syncAgo}</span>
            : <span>לא סונכרן עדיין</span>
          }
          {profile.sync_status === "rate_limited" && (
            <span className="text-amber-500 ml-1">(הגבלת קצב — יתעדכן בקרוב)</span>
          )}
          {profile.sync_status === "error" && (
            <span className="text-destructive ml-1">(שגיאת סנכרון)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sample size disclosure */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted">דגימה מייצגת</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[220px] text-right">
              Google API מחזיר עד 5 ביקורות נבחרות. לכל הביקורות, לחץ "צפה ב-Google".
            </TooltipContent>
          </Tooltip>

          {/* Owner-only manual refresh */}
          {isOwner && user && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] gap-1"
              onClick={handleManualSync}
              disabled={syncing}
            >
              <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
              {syncing ? "מסנכרן..." : "רענן"}
            </Button>
          )}
        </div>
      </div>

      {syncMsg && (
        <p className={`text-xs mt-1 ${syncMsg.startsWith("שגיאה") ? "text-destructive" : "text-green-600"}`}>
          {syncMsg}
        </p>
      )}
    </section>
  );
};

// ── Individual review card ────────────────────────────────────────────────────

const GoogleReviewCard = ({ review }: { review: GoogleReview }) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const toggleLike = () => {
    setLiked(prev => !prev);
    setLikeCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);
  };
  const text = review.text || "";
  const isLong = text.length > 180;

  const dateStr = review.published_at
    ? new Date(review.published_at).toLocaleDateString("he-IL", { year: "numeric", month: "short" })
    : null;

  return (
    <Card className="shadow-card bg-card border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {review.author_photo_url ? (
              <img src={review.author_photo_url} alt={review.author_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground uppercase">{review.author_name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-foreground truncate">{review.author_name}</span>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 border border-border/30 rounded px-1 py-0.5 shrink-0">
                <GoogleIcon size={8} />
                <span>Google</span>
              </div>
            </div>
            {dateStr && <span className="text-[10px] text-muted-foreground">{dateStr}</span>}
          </div>
        </div>

        <StarRow rating={review.rating} size={11} />

        {text && (
          <div className="mt-1.5">
            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">
              {isLong && !expanded ? `${text.slice(0, 160)}…` : text}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)} className="text-[10px] text-primary hover:underline mt-0.5">
                {expanded ? "הצג פחות" : "קרא עוד"}
              </button>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 text-[10px] transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <ThumbsUp size={10} className={liked ? "fill-primary" : ""} />
            {likeCount > 0 ? likeCount : "מועיל"}
          </button>
          {review.source_url && (
            <a href={review.source_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              <ExternalLink size={9} />
              צפה ב-Google
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSyncAgo(iso: string): string {
  const ms    = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3600000);
  const days  = Math.floor(hours / 24);
  if (days >= 2)  return `לפני ${days} ימים`;
  if (days === 1) return "אתמול";
  if (hours >= 1) return `לפני ${hours} שעות`;
  return "לפני פחות משעה";
}

export default GoogleReviewsSection;

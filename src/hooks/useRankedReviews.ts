/**
 * useRankedReviews.ts
 *
 * React Query hook for fetching reviews ranked by the ReviewHub
 * Review Ranking Algorithm v1 (migration 000014).
 *
 * Ranking formula (server-side via fn_get_ranked_reviews):
 *
 *   rank_score = base_score × dispute_factor × afve_factor
 *
 *   base_score = CLAMP(
 *     trust_signal    × 0.40   ← reviewer trust score
 *   + proof_signal    × 0.25   ← proof of experience
 *   + likes_signal    × 0.20   ← community likes (log-normalised)
 *   + recency_signal  × 0.15   ← exponential decay (half-life 90 days)
 *   , 0.00, 1.00)
 *
 * Range: [0.00, 1.10]  (AFVE-verified review can score above 1.00)
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankedReview = {
  review_id:            string;
  business_id:          string;
  reviewer_id:          string;
  reviewer_name:        string | null;
  reviewer_avatar:      string | null;
  reviewer_trust_score: number;       // 0–100
  rating:               number;       // 1–5
  body:                 string;
  proof_types:          string[];     // e.g. ['purchase_receipt', 'photo_evidence']
  proof_count:          number;
  verification_status:  string | null;
  dispute_status:       string | null;
  like_count:           number;
  computed_points:      number;
  created_at:           string;       // ISO 8601
  // ── Sub-signals (0–1 each, exposed for UI breakdown tooltips) ──
  trust_signal:   number;
  proof_signal:   number;
  likes_signal:   number;
  recency_signal: number;
  // ── Final composite score ──
  rank_score:     number;             // [0.00, 1.10]
};

export type UseRankedReviewsOptions = {
  /** Business UUID — required */
  businessId:    string;
  /** Page size (default 20) */
  limit?:        number;
  /** Pagination offset (default 0) */
  offset?:       number;
  /** Minimum star rating filter 1–5 (default 1 = all) */
  minRating?:    number;
  /** If true, only return reviews with at least one proof */
  proofOnly?:    boolean;
  /**
   * If true (default), reads from the 15-min materialized view (fast).
   * If false, reads live from base tables (admin / debug).
   */
  useCache?:     boolean;
  /** Minimum rank_score threshold — filter out very low-quality reviews */
  minRankScore?: number;
  /** Disable the query */
  enabled?:      boolean;
};

// ─── Query key factory ────────────────────────────────────────────────────────

export const rankedReviewsKeys = {
  all:     (businessId: string) => ["rankedReviews", businessId] as const,
  list:    (opts: UseRankedReviewsOptions) =>
    ["rankedReviews", opts.businessId, opts] as const,
  infinite: (opts: Omit<UseRankedReviewsOptions, "offset">) =>
    ["rankedReviews", "infinite", opts.businessId, opts] as const,
};

// ─── Core fetch function ──────────────────────────────────────────────────────

async function fetchRankedReviews(
  opts: UseRankedReviewsOptions,
): Promise<RankedReview[]> {
  const { data, error } = await supabase.rpc("fn_get_ranked_reviews", {
    p_business_id:    opts.businessId,
    p_limit:          opts.limit          ?? 20,
    p_offset:         opts.offset         ?? 0,
    p_min_rating:     opts.minRating      ?? 1,
    p_proof_only:     opts.proofOnly      ?? false,
    p_use_cache:      opts.useCache       ?? true,
    p_min_rank_score: opts.minRankScore   ?? 0.0,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as RankedReview[];
}

// ─── Paginated hook (default) ─────────────────────────────────────────────────

/**
 * useRankedReviews
 *
 * Fetches a single page of ranked reviews for a business.
 * Reads from the 15-min materialized view by default (fast path).
 *
 * @example
 * const { data: reviews, isLoading } = useRankedReviews({ businessId });
 */
export function useRankedReviews(opts: UseRankedReviewsOptions) {
  const { enabled = true, ...rest } = opts;

  return useQuery<RankedReview[], Error>({
    queryKey: rankedReviewsKeys.list(opts),
    queryFn:  () => fetchRankedReviews(rest),
    enabled:  enabled && Boolean(opts.businessId),

    // Matches the MV refresh cadence — stale after 5 minutes triggers a background refetch.
    staleTime:    5 * 60 * 1000,   // 5 min
    gcTime:       10 * 60 * 1000,  // 10 min
    refetchOnWindowFocus: false,   // reviews don't change that rapidly
  });
}

// ─── Infinite-scroll hook ─────────────────────────────────────────────────────

type InfiniteOpts = Omit<UseRankedReviewsOptions, "offset"> & {
  pageSize?: number;
};

/**
 * useRankedReviewsInfinite
 *
 * Infinite-scroll variant — loads pages on demand.
 * Use with a virtualised list or an "Load more" button.
 *
 * @example
 * const {
 *   data, fetchNextPage, hasNextPage, isFetchingNextPage
 * } = useRankedReviewsInfinite({ businessId, pageSize: 10 });
 */
export function useRankedReviewsInfinite(opts: InfiniteOpts) {
  const { enabled = true, pageSize = 20, ...rest } = opts;

  return useInfiniteQuery<RankedReview[], Error>({
    queryKey:  rankedReviewsKeys.infinite(opts),
    queryFn:   ({ pageParam = 0 }) =>
      fetchRankedReviews({ ...rest, offset: pageParam as number, limit: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned a full page, there are more pages.
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    enabled:   enabled && Boolean(opts.businessId),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Formats a rank_score as a human-readable trust tier label (Hebrew).
 * Used in review cards to show why a review ranks high.
 */
export function getRankTierLabel(rankScore: number): {
  label: string;
  labelEn: string;
  color: string;
} {
  if (rankScore >= 0.85) return { label: "מהימנות גבוהה מאוד", labelEn: "Top Ranked",      color: "text-emerald-600" };
  if (rankScore >= 0.65) return { label: "מהימנות גבוהה",       labelEn: "High Trust",      color: "text-blue-600"    };
  if (rankScore >= 0.40) return { label: "מהימנות בינונית",     labelEn: "Moderate Trust",  color: "text-amber-600"   };
  if (rankScore >= 0.15) return { label: "מהימנות נמוכה",       labelEn: "Low Trust",       color: "text-orange-500"  };
  return                        { label: "בדיקה בתהליך",        labelEn: "Under Review",    color: "text-red-500"     };
}

/**
 * Builds a breakdown array for the rank score tooltip.
 * Returns an array of signal contributions, sorted by impact descending.
 */
export function buildRankBreakdown(review: RankedReview): Array<{
  label:       string;
  labelEn:     string;
  signal:      number;   // raw signal value [0, 1]
  weight:      number;   // weight in formula
  contribution: number;  // signal × weight
  icon:        string;
}> {
  const rows = [
    {
      label:   "אמינות סוקר",
      labelEn: "Reviewer Trust",
      signal:  review.trust_signal,
      weight:  0.40,
      icon:    "🛡️",
    },
    {
      label:   "הוכחת חוויה",
      labelEn: "Proof of Experience",
      signal:  review.proof_signal,
      weight:  0.25,
      icon:    "📋",
    },
    {
      label:   "לייקים",
      labelEn: "Community Likes",
      signal:  review.likes_signal,
      weight:  0.20,
      icon:    "👍",
    },
    {
      label:   "עדכניות",
      labelEn: "Recency",
      signal:  review.recency_signal,
      weight:  0.15,
      icon:    "🕐",
    },
  ].map((row) => ({
    ...row,
    contribution: row.signal * row.weight,
  }));

  return rows.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Returns a human-readable proof tier label.
 */
export function getProofTierLabel(proofTypes: string[]): {
  tier:   "gold" | "silver" | "bronze" | "basic" | "none";
  label:  string;
  signal: number;
} {
  if (proofTypes.includes("purchase_receipt") || proofTypes.includes("booking_ref")) {
    return { tier: "gold",   label: "קנייה מאומתת",       signal: 1.00 };
  }
  if (proofTypes.includes("photo_evidence")) {
    return { tier: "silver", label: "ראיה צילומית",        signal: 0.75 };
  }
  if (proofTypes.includes("location_gps")) {
    return { tier: "bronze", label: "אימות מיקום",         signal: 0.65 };
  }
  if (proofTypes.length > 0) {
    return { tier: "basic",  label: "הוכחה בסיסית",        signal: 0.40 };
  }
  return   { tier: "none",   label: "ללא הוכחה",           signal: 0.00 };
}

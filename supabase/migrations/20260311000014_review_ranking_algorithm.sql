-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260311000014_review_ranking_algorithm.sql
-- ReviewHub – Review Ranking Algorithm v1
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │                    RANKING FORMULA — EXECUTIVE SUMMARY                      │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │                                                                             │
-- │  rank_score = base_score × dispute_factor × afve_factor                    │
-- │                                                                             │
-- │  base_score = CLAMP(                                                        │
-- │    trust_signal    × 0.40   ← Who wrote it?    (trust_score 0–100)         │
-- │  + proof_signal    × 0.25   ← Did they prove it? (proof type ladder)       │
-- │  + likes_signal    × 0.20   ← Does community agree? (log-normalised)       │
-- │  + recency_signal  × 0.15   ← Is it fresh?    (90-day half-life decay)     │
-- │  , 0.00, 1.00)                                                              │
-- │                                                                             │
-- │  dispute_factor:                                                            │
-- │    NULL / resolved_upheld / escalated → 1.00  (normal / vindicated)        │
-- │    evidence_submitted                 → 0.40  (under review)               │
-- │    open / evidence_pending            → 0.15  (active dispute, demoted)    │
-- │    resolved_removed                   → 0.00  (review removed)             │
-- │                                                                             │
-- │  afve_factor:                                                               │
-- │    verified       → 1.10  (small boost – fraud engine approved)            │
-- │    pending        → 1.00  (unchecked – neutral)                            │
-- │    partial        → 0.85  (some signals failed)                            │
-- │    manual_review  → 0.50  (held for human review)                          │
-- │    flagged        → 0.20  (highly suspicious)                              │
-- │    rejected       → 0.00  (confirmed fraud – hidden)                       │
-- │                                                                             │
-- │  Score range: [0.00, 1.10]                                                  │
-- │    1.10 = verified, trust=100, purchase proof, 200+ likes, posted today    │
-- │    0.00 = fraud-confirmed or dispute-removed (hidden from all feeds)       │
-- │                                                                             │
-- │  Recency half-life: 90 days  (after 1 year: signal ≈ 0.06)                │
-- │  Likes ceiling:     200      (log-normalised, diminishing returns)         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- DELIVERABLES IN THIS MIGRATION:
--   §1  Supporting indexes on base tables
--   §2  fn_review_rank_score()           — STABLE PARALLEL SAFE formula fn
--   §3  v_review_rankings                — live view (always current)
--   §4  mv_review_rankings               — materialized view (fast reads)
--   §5  ranking_refresh_queue            — smart invalidation queue
--   §6  fn_queue_ranking_refresh()       — trigger function
--   §7  Triggers wired to base tables
--   §8  fn_get_ranked_reviews()          — primary API (cache + live modes)
--   §9  pg_cron jobs
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── §1  SUPPORTING INDEXES ON BASE TABLES ───────────────────────────────────

-- Core ranking query: filter by business, exclude hard-removed rows, sort by rank.
-- Covers: business_id filter + dispute/afve exclusion + created_at for recency reads.
CREATE INDEX IF NOT EXISTS idx_reviews_ranking_core
  ON public.reviews (business_id, created_at DESC)
  WHERE dispute_status <> 'resolved_removed'
    AND afve_status     <> 'rejected';

-- Partial index for hot-path: only verified / clean reviews (fastest default sort).
CREATE INDEX IF NOT EXISTS idx_reviews_ranking_verified
  ON public.reviews (business_id, like_count DESC, created_at DESC)
  WHERE dispute_status IS NULL
    AND afve_status IN ('pending', 'verified', 'partial');

-- GIN index for proof_types array membership tests (used in proof_signal CASE).
CREATE INDEX IF NOT EXISTS idx_reviews_proof_types_gin
  ON public.reviews USING GIN (proof_types)
  WHERE proof_count > 0;

-- Trust score lookup from profiles (used in the ranking view JOIN).
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score
  ON public.profiles (id, trust_score);

-- reviewer_metrics lookup (used when trust_score alone isn't enough context).
CREATE INDEX IF NOT EXISTS idx_reviewer_metrics_user_id
  ON public.reviewer_metrics (user_id)
  WHERE user_id IS NOT NULL;

-- Dispute status filter (used in fn_queue_ranking_refresh trigger condition).
CREATE INDEX IF NOT EXISTS idx_reviews_dispute_afve_composite
  ON public.reviews (dispute_status, afve_status)
  WHERE dispute_status IS NOT NULL OR afve_status <> 'pending';


-- ─── §2  CORE RANKING FORMULA FUNCTION ────────────────────────────────────────
--
-- fn_review_rank_score()
--
-- Produces a rank score in [0.00, 1.10] for a single review.
-- Marked STABLE (not IMMUTABLE) because the recency signal uses CURRENT_TIMESTAMP.
-- Marked PARALLEL SAFE — no writes, no global state, no subtransactions.
--
-- Signal breakdown:
--   trust_signal    = trust_score / 100
--                     Default 10 for new accounts (avoids cold-start zero)
--
--   proof_signal    = tier ladder:
--                     purchase_receipt | booking_ref         → 1.00  (gold)
--                     photo_evidence                         → 0.75  (silver)
--                     location_gps                           → 0.65  (bronze)
--                     any proof present (proof_count > 0)    → 0.40  (basic)
--                     no proof                               → 0.00
--                     verification_status = 'purchase_verified' also → 1.00
--                     (catches dispute-upheld reviews that lack explicit proof rows)
--
--   likes_signal    = LN(1 + like_count) / LN(201)
--                     Ceiling at 200 likes = 1.00; logarithmic diminishing returns.
--                     First like: +0.0664; 10th like: +0.0297; 100th like: +0.0133
--
--   recency_signal  = EXP(-LN(2) × elapsed_days / 90)
--                     Exponential decay, half-life = 90 days.
--                     At  0 days: 1.000   At  90 days: 0.500
--                     At 180 days: 0.250  At 360 days: 0.063
--
--   dispute_factor  = multiplier for dispute state (see table above)
--   afve_factor     = multiplier for fraud engine verdict (see table above)
--
CREATE OR REPLACE FUNCTION public.fn_review_rank_score(
  p_trust_score         SMALLINT,    -- profiles.trust_score          (0–100)
  p_proof_types         TEXT[],      -- reviews.proof_types           (array)
  p_proof_count         SMALLINT,    -- reviews.proof_count           (0–N)
  p_verification_status TEXT,        -- reviews.verification_status
  p_like_count          INTEGER,     -- reviews.like_count            (denormed)
  p_created_at          TIMESTAMPTZ, -- reviews.created_at
  p_dispute_status      TEXT,        -- reviews.dispute_status
  p_afve_status         TEXT         -- reviews.afve_status
)
RETURNS NUMERIC(8, 6)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  WITH signals AS (
    SELECT
      -- ── Signal 1: Reviewer Trust (weight 0.40) ──────────────────────────
      -- New / anonymous accounts default to 10 (not zero) to prevent
      -- legitimate first-time reviewers from being buried entirely.
      COALESCE(p_trust_score, 10)::NUMERIC / 100.0
        AS trust_signal,

      -- ── Signal 2: Proof of Experience (weight 0.25) ──────────────────────
      -- Best-proof-wins ladder — holds multiple proof types, picks highest tier.
      -- 'purchase_verified' verification_status (set by dispute engine on upheld
      -- disputes) is treated as equivalent to a purchase_receipt proof row.
      CASE
        WHEN p_proof_types && ARRAY['purchase_receipt', 'booking_ref']
          OR p_verification_status = 'purchase_verified'              THEN 1.00
        WHEN 'photo_evidence' = ANY(p_proof_types)                    THEN 0.75
        WHEN 'location_gps'   = ANY(p_proof_types)                    THEN 0.65
        WHEN COALESCE(p_proof_count, 0) > 0                           THEN 0.40
        ELSE                                                                0.00
      END::NUMERIC
        AS proof_signal,

      -- ── Signal 3: Community Likes (weight 0.20) ──────────────────────────
      -- Log-normalised with ceiling at 200 likes (= full 1.00 signal).
      -- LN(1 + 0)   = 0.000  → likes_signal = 0.000
      -- LN(1 + 10)  = 2.398  → likes_signal = 0.444
      -- LN(1 + 50)  = 3.932  → likes_signal = 0.729
      -- LN(1 + 200) = 5.303  → likes_signal = 1.000  (ceiling)
      LEAST(
        LN(1.0 + COALESCE(p_like_count, 0)::NUMERIC)
        / LN(201.0),
        1.0
      )
        AS likes_signal,

      -- ── Signal 4: Recency / Freshness (weight 0.15) ──────────────────────
      -- Exponential decay with 90-day half-life.
      -- EXP(-LN(2) × t/90) where t = elapsed days.
      -- LN(2) ≈ 0.6931471805599453
      EXP(
        -0.6931471805599453
        * EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(p_created_at, CURRENT_TIMESTAMP)))
        / (90.0 * 86400.0)
      )
        AS recency_signal,

      -- ── Dispute Penalty Multiplier ────────────────────────────────────────
      -- Active disputes heavily demote; removed reviews score 0.
      -- 'escalated' = business threatened legal AFTER proof verified → reviewer
      -- effectively vindicated, so no demotion.
      CASE p_dispute_status
        WHEN 'resolved_removed'    THEN 0.00   -- review should be deleted; guard
        WHEN 'open'                THEN 0.15   -- active dispute, heavy demotion
        WHEN 'evidence_pending'    THEN 0.15   -- same bucket as open
        WHEN 'evidence_submitted'  THEN 0.40   -- reviewer responded, partial demotion
        WHEN 'resolved_upheld'     THEN 1.00   -- vindicated — full weight restored
        WHEN 'escalated'           THEN 1.00   -- proof verified before escalation
        ELSE                            1.00   -- NULL (no dispute) — normal
      END::NUMERIC
        AS dispute_factor,

      -- ── AFVE (Fraud Engine) Multiplier ────────────────────────────────────
      -- Verified reviews get a small boost; flagged/rejected are demoted/hidden.
      CASE p_afve_status
        WHEN 'verified'       THEN 1.10   -- fraud engine approved — small boost
        WHEN 'pending'        THEN 1.00   -- not yet checked — neutral
        WHEN 'partial'        THEN 0.85   -- some signals failed — mild demotion
        WHEN 'manual_review'  THEN 0.50   -- awaiting human verdict
        WHEN 'flagged'        THEN 0.20   -- highly suspicious — heavy demotion
        WHEN 'rejected'       THEN 0.00   -- confirmed fraud — hidden
        ELSE                       1.00   -- unknown status — neutral fallback
      END::NUMERIC
        AS afve_factor
  )
  SELECT
    -- Apply weights, clamp base to [0, 1], then apply penalty multipliers.
    -- Final range: [0.00, 1.10]
    GREATEST(0.0,
      LEAST(1.0,
          (trust_signal   * 0.40)
        + (proof_signal   * 0.25)
        + (likes_signal   * 0.20)
        + (recency_signal * 0.15)
      )
    )
    * dispute_factor
    * afve_factor
  FROM signals
$$;

COMMENT ON FUNCTION public.fn_review_rank_score IS
  'ReviewHub Review Ranking Algorithm v1.
   Returns rank_score in [0.00, 1.10].
   Weights: trust×0.40, proof×0.25, likes×0.20, recency×0.15.
   Penalty multipliers: dispute_factor, afve_factor.
   Recency half-life: 90 days. Likes ceiling: 200 (log-normalised).';


-- ─── §3  LIVE RANKING VIEW ────────────────────────────────────────────────────
--
-- v_review_rankings
--
-- Always-current view — joins reviews + profiles for each query.
-- Use for: admin dashboards, real-time debugging, low-traffic pages.
-- Use mv_review_rankings for high-traffic business pages.
--
-- Exposes all four sub-signals so the client can render a mini breakdown
-- (e.g. "★ Why is this ranked first? High trust reviewer + purchase receipt")
--
CREATE OR REPLACE VIEW public.v_review_rankings AS
SELECT
  r.id                                         AS review_id,
  r.business_id,
  r.user_id                                    AS reviewer_id,
  r.rating,
  r.body,
  r.created_at,
  r.dispute_status,
  r.afve_status,
  r.verification_status,
  r.proof_types,
  r.proof_count,
  r.like_count,
  r.computed_points,

  -- Reviewer fields
  p.display_name                               AS reviewer_name,
  p.avatar_url                                 AS reviewer_avatar,
  COALESCE(p.trust_score, 10)                  AS reviewer_trust_score,

  -- ── Debug / display sub-signals ─────────────────────────────────────────
  ROUND(COALESCE(p.trust_score, 10)::NUMERIC / 100.0, 4)
    AS trust_signal,

  ROUND(
    CASE
      WHEN r.proof_types && ARRAY['purchase_receipt','booking_ref']
        OR r.verification_status = 'purchase_verified'             THEN 1.00
      WHEN 'photo_evidence' = ANY(r.proof_types)                   THEN 0.75
      WHEN 'location_gps'   = ANY(r.proof_types)                   THEN 0.65
      WHEN COALESCE(r.proof_count, 0) > 0                          THEN 0.40
      ELSE                                                               0.00
    END::NUMERIC, 4)
    AS proof_signal,

  ROUND(
    LEAST(LN(1.0 + COALESCE(r.like_count, 0)::NUMERIC) / LN(201.0), 1.0),
    4)
    AS likes_signal,

  ROUND(
    EXP(-0.6931471805599453
      * EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.created_at))
      / (90.0 * 86400.0)),
    4)
    AS recency_signal,

  -- ── Final rank score ──────────────────────────────────────────────────────
  fn_review_rank_score(
    p.trust_score,
    r.proof_types,
    r.proof_count,
    r.verification_status,
    r.like_count,
    r.created_at,
    r.dispute_status,
    r.afve_status
  )                                            AS rank_score

FROM public.reviews        r
LEFT JOIN public.profiles  p ON p.id = r.user_id

-- Exclude hard-removed rows — these should not appear anywhere in the UI.
WHERE r.dispute_status <> 'resolved_removed'
  AND r.afve_status    <> 'rejected';

COMMENT ON VIEW public.v_review_rankings IS
  'Live review ranking view. Always current. High I/O cost per query.
   Use mv_review_rankings for high-traffic pages.';


-- ─── §4  MATERIALIZED VIEW (RANKING CACHE) ───────────────────────────────────
--
-- mv_review_rankings
--
-- Refreshed every 15 minutes by pg_cron (CONCURRENTLY — zero downtime).
-- Also invalidated intelligently via ranking_refresh_queue (§5–§7).
--
-- Why a MV is appropriate here:
--   • trust_signal    — changes only when trust_score recomputes (rare)
--   • proof_signal    — changes only when proofs are verified (rare)
--   • likes_signal    — log-normalised; 15-min staleness is imperceptible
--   • recency_signal  — 90-day half-life; 15 min ≈ 0.008% change (negligible)
--   • dispute/afve    — trigger-queued for near-real-time refresh on change
--
DROP MATERIALIZED VIEW IF EXISTS public.mv_review_rankings;

CREATE MATERIALIZED VIEW public.mv_review_rankings AS
SELECT * FROM public.v_review_rankings
WITH NO DATA;

-- ── MV Indexes ───────────────────────────────────────────────────────────────

-- Required for CONCURRENT refresh (must be unique).
CREATE UNIQUE INDEX mv_review_rankings_pk
  ON public.mv_review_rankings (review_id);

-- Primary access pattern: business page sorted by rank.
CREATE INDEX mv_review_rankings_business_rank
  ON public.mv_review_rankings (business_id, rank_score DESC);

-- Secondary: reviewer profile page (their reviews ranked).
CREATE INDEX mv_review_rankings_reviewer_rank
  ON public.mv_review_rankings (reviewer_id, rank_score DESC);

-- Filter by rating (star filter on business page).
CREATE INDEX mv_review_rankings_business_rating
  ON public.mv_review_rankings (business_id, rating, rank_score DESC);

-- Filter for proof-only views.
CREATE INDEX mv_review_rankings_proof_filter
  ON public.mv_review_rankings (business_id, proof_count, rank_score DESC)
  WHERE proof_count > 0;

-- Initial populate (non-concurrent OK for first run — no readers yet).
REFRESH MATERIALIZED VIEW public.mv_review_rankings;


-- ─── §5  SMART INVALIDATION QUEUE ────────────────────────────────────────────
--
-- ranking_refresh_queue
--
-- Tracks which businesses need an out-of-cycle MV refresh.
-- One row per business — UPSERT ensures no duplicate queuing.
-- Cleared after each pg_cron cycle completes.
--
CREATE TABLE IF NOT EXISTS public.ranking_refresh_queue (
  business_id   UUID        NOT NULL
                            REFERENCES public.businesses (id) ON DELETE CASCADE,
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason        TEXT,
  PRIMARY KEY (business_id)   -- one pending entry per business maximum
);

ALTER TABLE public.ranking_refresh_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can read the queue (internal use only).
CREATE POLICY "service role full access ranking_refresh_queue"
  ON public.ranking_refresh_queue FOR ALL
  TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE public.ranking_refresh_queue IS
  'Businesses queued for an out-of-cycle ranking MV refresh.
   Populated by triggers on reviews and review_likes.
   Consumed and cleared by the pg_cron smart-refresh job.';


-- ─── §6  TRIGGER FUNCTION — QUEUE INVALIDATION ───────────────────────────────
--
-- fn_queue_ranking_refresh()
--
-- Called by triggers on reviews and review_likes.
-- UPSERTs the business into the refresh queue; the pg_cron job handles the rest.
--
CREATE OR REPLACE FUNCTION public.fn_queue_ranking_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Resolve business_id from whichever table fired the trigger.
  -- review_likes does not have business_id, so we join to reviews.
  IF TG_TABLE_NAME = 'review_likes' THEN
    SELECT r.business_id
    INTO   v_business_id
    FROM   public.reviews r
    WHERE  r.id = COALESCE(NEW.review_id, OLD.review_id)
    LIMIT  1;
  ELSE
    v_business_id := COALESCE(NEW.business_id, OLD.business_id);
  END IF;

  IF v_business_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.ranking_refresh_queue (business_id, reason)
  VALUES (
    v_business_id,
    TG_TABLE_NAME || ':' || TG_OP || ':' || TG_WHEN
  )
  ON CONFLICT (business_id) DO UPDATE
    SET queued_at = NOW(),
        reason    = EXCLUDED.reason;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.fn_queue_ranking_refresh IS
  'Trigger function: queues a business for ranking MV refresh when a ranking signal changes.
   Safe to fire frequently — UPSERT collapses multiple changes into one queue entry.';


-- ─── §7  TRIGGERS ON BASE TABLES ─────────────────────────────────────────────
--
-- Any change that affects one of the 4 signals + 2 penalty multipliers
-- → queue the business for refresh.
--
-- Signals affected:
--   like_count        → likes_signal
--   dispute_status    → dispute_factor
--   afve_status       → afve_factor
--   proof_types       → proof_signal
--   proof_count       → proof_signal
--   verification_status→ proof_signal (purchase_verified bonus)
--   created_at        → recency_signal (immutable after INSERT)
--   trust_score       → trust_signal  (handled by profiles trigger below)

-- Reviews table — queue when ranking-relevant columns change.
DROP TRIGGER IF EXISTS trg_queue_ranking_on_review ON public.reviews;
CREATE TRIGGER trg_queue_ranking_on_review
  AFTER INSERT OR UPDATE OF
    dispute_status,
    afve_status,
    proof_types,
    proof_count,
    verification_status,
    like_count
  ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_queue_ranking_refresh();

-- review_likes table — queue when likes change (like_count is denormed,
-- but the trigger also handles the reviewer_metrics update path).
DROP TRIGGER IF EXISTS trg_queue_ranking_on_like ON public.review_likes;
CREATE TRIGGER trg_queue_ranking_on_like
  AFTER INSERT OR DELETE
  ON public.review_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_queue_ranking_refresh();

-- profiles table — queue ALL businesses where this user has reviews
-- when their trust_score changes (fan-out, batched by pg_cron).
CREATE OR REPLACE FUNCTION public.fn_queue_ranking_refresh_on_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.trust_score IS NOT DISTINCT FROM NEW.trust_score THEN
    RETURN NEW;
  END IF;

  -- Fan-out: one queue entry per affected business.
  INSERT INTO public.ranking_refresh_queue (business_id, reason)
  SELECT DISTINCT r.business_id,
         'profiles:trust_score_changed:user=' || NEW.id
  FROM   public.reviews r
  WHERE  r.user_id = NEW.id
    AND  r.dispute_status <> 'resolved_removed'
    AND  r.afve_status    <> 'rejected'
  ON CONFLICT (business_id) DO UPDATE
    SET queued_at = NOW(),
        reason    = EXCLUDED.reason;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_ranking_on_trust ON public.profiles;
CREATE TRIGGER trg_queue_ranking_on_trust
  AFTER UPDATE OF trust_score
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_queue_ranking_refresh_on_trust();


-- ─── §8  PRIMARY API FUNCTION ─────────────────────────────────────────────────
--
-- fn_get_ranked_reviews()
--
-- The main function clients call to fetch reviews for a business, sorted by rank.
--
-- Parameters:
--   p_business_id    — required
--   p_limit          — page size (default 20)
--   p_offset         — pagination offset (default 0)
--   p_min_rating     — filter by minimum star rating (default 1 = all)
--   p_proof_only     — if TRUE, return only reviews with at least one proof
--   p_use_cache      — TRUE = materialized view (fast), FALSE = live view (fresh)
--   p_min_rank_score — minimum rank_score threshold (default 0.0 = no filter)
--
-- Returns:
--   All ranking signal sub-scores so the client can render a rank breakdown tooltip.
--
CREATE OR REPLACE FUNCTION public.fn_get_ranked_reviews(
  p_business_id    UUID,
  p_limit          INTEGER  DEFAULT 20,
  p_offset         INTEGER  DEFAULT 0,
  p_min_rating     SMALLINT DEFAULT 1,
  p_proof_only     BOOLEAN  DEFAULT FALSE,
  p_use_cache      BOOLEAN  DEFAULT TRUE,
  p_min_rank_score NUMERIC  DEFAULT 0.0
)
RETURNS TABLE (
  review_id            UUID,
  business_id          UUID,
  reviewer_id          UUID,
  reviewer_name        TEXT,
  reviewer_avatar      TEXT,
  reviewer_trust_score SMALLINT,
  rating               SMALLINT,
  body                 TEXT,
  proof_types          TEXT[],
  proof_count          SMALLINT,
  verification_status  TEXT,
  dispute_status       TEXT,
  like_count           INTEGER,
  computed_points      INTEGER,
  created_at           TIMESTAMPTZ,
  -- Sub-signals (for UI breakdown tooltips)
  trust_signal         NUMERIC,
  proof_signal         NUMERIC,
  likes_signal         NUMERIC,
  recency_signal       NUMERIC,
  -- Final score
  rank_score           NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_use_cache THEN
    -- ── Fast path: materialized view ─────────────────────────────────────────
    -- Staleness ≤ 15 minutes. Suitable for all production page loads.
    RETURN QUERY
    SELECT
      mv.review_id,   mv.business_id,  mv.reviewer_id,
      mv.reviewer_name, mv.reviewer_avatar, mv.reviewer_trust_score,
      mv.rating,      mv.body,
      mv.proof_types, mv.proof_count,  mv.verification_status,
      mv.dispute_status, mv.like_count, mv.computed_points, mv.created_at,
      mv.trust_signal,   mv.proof_signal,
      mv.likes_signal,   mv.recency_signal,
      mv.rank_score
    FROM public.mv_review_rankings mv
    WHERE mv.business_id    = p_business_id
      AND mv.rating         >= p_min_rating
      AND mv.rank_score     >= p_min_rank_score
      AND (NOT p_proof_only OR mv.proof_count > 0)
    ORDER BY mv.rank_score DESC
    LIMIT  p_limit
    OFFSET p_offset;

  ELSE
    -- ── Live path: real-time from base tables ────────────────────────────────
    -- Suitable for: admin review, post-update verification, low-traffic pages.
    RETURN QUERY
    SELECT
      v.review_id,    v.business_id,   v.reviewer_id,
      v.reviewer_name, v.reviewer_avatar, v.reviewer_trust_score,
      v.rating,       v.body,
      v.proof_types,  v.proof_count,   v.verification_status,
      v.dispute_status, v.like_count,  v.computed_points, v.created_at,
      v.trust_signal,    v.proof_signal,
      v.likes_signal,    v.recency_signal,
      v.rank_score
    FROM public.v_review_rankings v
    WHERE v.business_id    = p_business_id
      AND v.rating         >= p_min_rating
      AND v.rank_score     >= p_min_rank_score
      AND (NOT p_proof_only OR v.proof_count > 0)
    ORDER BY v.rank_score DESC
    LIMIT  p_limit
    OFFSET p_offset;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.fn_get_ranked_reviews IS
  'Primary API for fetching ranked reviews for a business page.
   p_use_cache=TRUE (default) reads from the 15-min materialized view.
   p_use_cache=FALSE reads live from base tables (admin/debug use).
   Returns sub-signals (trust_signal, proof_signal, etc.) for UI breakdown tooltips.';


-- ─── §9  PG_CRON JOBS ────────────────────────────────────────────────────────

-- ── Job A: Full concurrent refresh every 15 minutes ─────────────────────────
-- Handles recency decay drift and any signals missed by triggers.
SELECT cron.schedule(
  'review-ranking-full-refresh',
  '*/15 * * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_review_rankings $$
);

-- ── Job B: Smart targeted refresh (every 5 minutes) ──────────────────────────
-- Picks up businesses queued by triggers and refreshes only their rows
-- via a targeted DELETE+INSERT into the MV. Faster than a full refresh
-- for small bursts of activity (e.g. a single review gets a new like).
--
-- Implementation note: REFRESH MATERIALIZED VIEW CONCURRENTLY refreshes the
-- ENTIRE view. For targeted updates, we use a DO block that updates only
-- the changed rows by deleting them from the MV and re-inserting from the live view.
-- This is safe because CONCURRENTLY holds a ShareUpdateExclusiveLock (readers are fine).
SELECT cron.schedule(
  'review-ranking-smart-refresh',
  '*/5 * * * *',
  $$
  DO $$
  DECLARE
    v_biz_ids UUID[];
  BEGIN
    -- Collect all queued businesses (max 50 per cycle to bound execution time).
    SELECT ARRAY_AGG(business_id)
    INTO   v_biz_ids
    FROM  (
      SELECT business_id
      FROM   public.ranking_refresh_queue
      ORDER  BY queued_at
      LIMIT  50
    ) q;

    IF v_biz_ids IS NULL OR CARDINALITY(v_biz_ids) = 0 THEN
      RETURN;
    END IF;

    -- Remove stale rows from the MV for these businesses.
    DELETE FROM public.mv_review_rankings
    WHERE business_id = ANY(v_biz_ids);

    -- Re-insert fresh rows from the live view.
    INSERT INTO public.mv_review_rankings
    SELECT * FROM public.v_review_rankings
    WHERE  business_id = ANY(v_biz_ids);

    -- Clear processed entries from the queue.
    DELETE FROM public.ranking_refresh_queue
    WHERE business_id = ANY(v_biz_ids);

  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail — the full 15-min refresh will catch up.
    RAISE WARNING 'review-ranking-smart-refresh failed: %', SQLERRM;
  END;
  $$ $$
);

-- ── Job C: Clear orphan queue entries older than 20 minutes ──────────────────
-- Safety net: any entry older than a full refresh cycle is already covered.
SELECT cron.schedule(
  'review-ranking-queue-cleanup',
  '3,18,33,48 * * * *',
  $$
    DELETE FROM public.ranking_refresh_queue
    WHERE queued_at < NOW() - INTERVAL '20 minutes'
  $$
);


-- ─── GRANT EXECUTE TO AUTHENTICATED USERS ────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.fn_review_rank_score TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_ranked_reviews TO authenticated, anon;

-- View SELECT granted to authenticated users (RLS on underlying tables still applies).
GRANT SELECT ON public.v_review_rankings     TO authenticated, anon;
GRANT SELECT ON public.mv_review_rankings    TO authenticated, anon;


-- ═══════════════════════════════════════════════════════════════════════════════
-- APPENDIX A: EXAMPLE QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── A1: Business page — top 20 reviews, default (cached) ─────────────────────
-- SELECT * FROM fn_get_ranked_reviews('biz-uuid-here');

-- ── A2: Business page — proof-only filter, 5-star only ───────────────────────
-- SELECT * FROM fn_get_ranked_reviews(
--   'biz-uuid-here',
--   p_min_rating  := 5,
--   p_proof_only  := TRUE
-- );

-- ── A3: Admin live view — real-time scores for a business ────────────────────
-- SELECT * FROM fn_get_ranked_reviews('biz-uuid-here', p_use_cache := FALSE);

-- ── A4: Direct MV query — paginated, sorted by rank ──────────────────────────
-- SELECT review_id, reviewer_name, rating, rank_score,
--        trust_signal, proof_signal, likes_signal, recency_signal
-- FROM   mv_review_rankings
-- WHERE  business_id = 'biz-uuid-here'
-- ORDER  BY rank_score DESC
-- LIMIT  20 OFFSET 40;

-- ── A5: Top reviewers on the platform (leaderboard signal) ───────────────────
-- SELECT reviewer_id, reviewer_name, reviewer_trust_score,
--        AVG(rank_score)::NUMERIC(5,4)   AS avg_rank_score,
--        COUNT(*)                          AS review_count
-- FROM   mv_review_rankings
-- GROUP  BY reviewer_id, reviewer_name, reviewer_trust_score
-- HAVING COUNT(*) >= 3
-- ORDER  BY avg_rank_score DESC
-- LIMIT  50;

-- ── A6: Dispute impact analysis — compare rank before/after demotion ─────────
-- SELECT dispute_status,
--        AVG(rank_score)::NUMERIC(5,4)   AS avg_rank_score,
--        COUNT(*)                          AS review_count
-- FROM   mv_review_rankings
-- GROUP  BY dispute_status
-- ORDER  BY avg_rank_score DESC;

-- ── A7: Proof ROI — rank score lift by proof type ────────────────────────────
-- SELECT
--   CASE
--     WHEN proof_types && ARRAY['purchase_receipt','booking_ref'] THEN 'Gold (purchase/booking)'
--     WHEN 'photo_evidence' = ANY(proof_types)                    THEN 'Silver (photo)'
--     WHEN 'location_gps'   = ANY(proof_types)                    THEN 'Bronze (GPS)'
--     WHEN proof_count > 0                                         THEN 'Basic (other)'
--     ELSE 'None'
--   END                              AS proof_tier,
--   COUNT(*)                          AS review_count,
--   AVG(rank_score)::NUMERIC(5,4)    AS avg_rank_score,
--   AVG(rank_score - trust_signal * 0.40 - likes_signal * 0.20 - recency_signal * 0.15)::NUMERIC(5,4)
--                                    AS avg_proof_contribution
-- FROM   mv_review_rankings
-- GROUP  BY proof_tier
-- ORDER  BY avg_rank_score DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- APPENDIX B: CACHING & INDEXING NOTES
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- MATERIALIZED VIEW STRATEGY (implemented above):
--   • Full refresh every 15 min via pg_cron Job A (CONCURRENT — no read locks)
--   • Smart targeted refresh every 5 min via pg_cron Job B (only changed businesses)
--   • Trigger-driven invalidation queue (§5–§7) ensures near-real-time updates
--     for high-impact events: disputes, AFVE verdicts, new proofs
--
-- CLIENT-SIDE CACHING (application layer — not in this migration):
--   • Supabase client: staleTime = 5 minutes for React Query / SWR
--   • CDN/Edge cache: Cache-Control: s-maxage=300 on /api/reviews endpoints
--   • Redis / Upstash: hot businesses (>100 reviews/day) can cache at L1
--     KEY: rr:{business_id}:p{page}  TTL: 300s  Invalidate on queue trigger
--
-- FUTURE INDEX RECOMMENDATIONS (add as traffic grows):
--   • BRIN index on reviews(created_at) — very cheap for time-range scans
--   • Bloom filter index on reviews(user_id, business_id) — duplicate detection
--   • pg_trgm GIN on reviews(body) — full-text search ranking integration
--
-- ═══════════════════════════════════════════════════════════════════════════════
-- APPENDIX C: AI-ASSISTED FRAUD DETECTION ROADMAP
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PHASE 1 (current — AFVE Pillar 4, already implemented in migration 000010):
--   ✓ AI text perplexity / burstiness via Gemini 2.5 Flash
--   ✓ PDF producer metadata analysis
--   ✓ SHA-256 hash collision detection
--   ✓ Merchant verification loop
--   ✓ SPF/DKIM/DMARC email verification (E2V)
--
-- PHASE 2 (near-term — add to afve-check edge function):
--   • Velocity detection: >N reviews from same IP/device_id in 24h → flag
--     Table: afve_velocity_log(ip_hash, device_id, hour_bucket, count)
--   • Semantic clustering: embed review body with text-embedding-004,
--     cosine similarity >0.92 against existing reviews → near-duplicate flag
--     Table: review_embeddings(review_id, embedding VECTOR(768))  [pgvector]
--   • Named entity consistency: NLP check that review mentions correct
--     city/product category / price range for the business → coherence score
--   • Sentiment vs. rating mismatch: 5-star review with net-negative sentiment → flag
--
-- PHASE 3 (medium-term — ML pipeline):
--   • Reviewer behaviour graph: GNN to detect coordinated inauthentic behaviour
--     (ring of accounts all reviewing the same business within 48h)
--   • Cross-platform signal: webhook from Google/Yelp if same reviewer pattern
--     flagged elsewhere (industry trust consortium)
--   • Adversarial review detection: fine-tuned classifier on ReviewHub's own
--     labelled fraud/not-fraud dataset (export from dispute outcomes)
--   • Real-time anomaly scoring: streaming pipeline (Supabase Realtime →
--     Kafka → ML inference → write back afve_score) for sub-second decisions
--
-- PHASE 4 (long-term — closed-loop learning):
--   • Human-in-the-loop labels feed back into the ranking model as ground truth
--   • Dispute outcomes auto-label training data (resolved_removed = fraud signal)
--   • A/B test ranking weights (0.40/0.25/0.20/0.15) against conversion metrics
--   • Personalised re-ranking: user's trust graph (migration 000013) applied
--     on top of the base rank_score for individualised orderings
--
-- ═══════════════════════════════════════════════════════════════════════════════

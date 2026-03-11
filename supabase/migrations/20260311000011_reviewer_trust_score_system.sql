-- ============================================================
-- Migration 000011: Reviewer Trust Score System (v2)
-- ============================================================
--
-- Context:
--   Migration 000010 added profiles.trust_score and a basic
--   fn_calculate_trust_score() driven only by AFVE verification state.
--   This migration replaces that formula with a full multi-signal
--   trust model while preserving all existing column names and
--   trigger wiring so nothing downstream breaks.
--
-- What this adds:
--   1. reviewer_metrics     — one-row-per-user denormalised aggregates
--                             (maintained by triggers, used by formula)
--   2. trust_score_events   — append-only event log (immutable audit trail)
--                             every meaningful score change is recorded
--   3. reviewer_trust_score — snapshot table; each full recomputation
--                             writes a row here for history / rollback
--
-- What this REPLACES (CREATE OR REPLACE — same function name):
--   fn_calculate_trust_score()  →  now calls fn_compute_trust_score_v2()
--   The trigger trg_refresh_trust_score already points at the wrapper,
--   so the new formula activates automatically on deploy.
--
-- Score formula (v2):
--   trust_score = CLAMP(
--     20                                    ← base
--     + LEAST(verified_reviews × 5, 30)    ← purchase-verified reviews
--     + LEAST(total_likes ÷ 5, 15)         ← community endorsement
--     + account_age_bonus (0/4/7/10/15)    ← longevity
--     + LEAST(disputes_survived × 3, 10)   ← reviews upheld under challenge
--     − LEAST(disputes_lost × 15, 30)      ← reviews removed after dispute
--     − LEAST(abuse_reports_accepted × 10, 20) ← platform action taken
--     − anonymous_excess_penalty (0/5/10)  ← > 50 % / > 70 % anon reviews
--   , 0, 100)
--   Hard override: profiles.fraud_locked = TRUE → score = 0
--
-- Principles:
--   • profiles.trust_score remains the canonical live column
--   • reviewer_metrics is the fast read layer (no JOINs at score time)
--   • trust_score_events is write-only from functions; never UPDATEd
--   • All new tables follow existing RLS patterns
-- ============================================================

-- ─── 1. reviewer_metrics ──────────────────────────────────────────────────────
-- One row per user. Maintained incrementally by triggers on reviews,
-- review_likes, and review_reports. Full recompute available via
-- fn_refresh_reviewer_metrics().

CREATE TABLE IF NOT EXISTS public.reviewer_metrics (
  user_id                 UUID        PRIMARY KEY
                                      REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review counts
  total_review_count      INTEGER     NOT NULL DEFAULT 0
                                      CHECK (total_review_count >= 0),
  verified_review_count   INTEGER     NOT NULL DEFAULT 0
                                      CHECK (verified_review_count >= 0),
  -- verified = verification_status = 'purchase_verified'
  -- email_verified reviews still count but at a lower rate (handled in formula)
  email_verified_count    INTEGER     NOT NULL DEFAULT 0
                                      CHECK (email_verified_count >= 0),
  anonymous_review_count  INTEGER     NOT NULL DEFAULT 0
                                      CHECK (anonymous_review_count >= 0),

  -- Engagement
  total_likes_received    INTEGER     NOT NULL DEFAULT 0
                                      CHECK (total_likes_received >= 0),

  -- Dispute outcomes
  disputes_opened         INTEGER     NOT NULL DEFAULT 0,
  disputes_survived       INTEGER     NOT NULL DEFAULT 0,
  -- "survived" = dispute closed with review upheld (dispute_status = 'resolved_for_reviewer')
  disputes_lost           INTEGER     NOT NULL DEFAULT 0,
  -- "lost" = review removed / hidden after dispute (dispute_status IN ('resolved_for_business','removed'))

  -- Abuse signals
  abuse_reports_accepted  INTEGER     NOT NULL DEFAULT 0,
  -- = review_reports where status = 'action_taken' against this reviewer

  -- Timestamps
  last_recomputed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviewer_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own metrics"
  ON public.reviewer_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service role full access reviewer_metrics"
  ON public.reviewer_metrics FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE  public.reviewer_metrics IS 'Denormalised trust-signal aggregates per reviewer. Source of truth for fn_compute_trust_score_v2().';
COMMENT ON COLUMN public.reviewer_metrics.verified_review_count IS 'Reviews with verification_status = purchase_verified.';
COMMENT ON COLUMN public.reviewer_metrics.disputes_survived     IS 'Disputes closed in reviewer favour (dispute_status = resolved_for_reviewer).';
COMMENT ON COLUMN public.reviewer_metrics.disputes_lost         IS 'Disputes where review was removed or hidden.';

-- ─── 2. trust_score_events ────────────────────────────────────────────────────
-- Append-only. Records every meaningful score movement with full context.
-- Never UPDATE or DELETE. Used for audit, debugging, and user-facing history.

CREATE TABLE IF NOT EXISTS public.trust_score_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type      TEXT        NOT NULL CHECK (event_type IN (
                                'review_purchase_verified',  -- +5 per verified review
                                'review_email_verified',     -- +2 per email-verified review
                                'review_liked',              -- accumulates → like_bonus recalc
                                'account_age_milestone',     -- 30/90/180/365 days
                                'dispute_survived',          -- review upheld under challenge
                                'dispute_lost',              -- review removed after dispute
                                'abuse_report_accepted',     -- platform acted on a report
                                'anonymous_excess',          -- > 50% anon reviews
                                'fraud_lock',                -- account locked → score = 0
                                'full_recompute',            -- fn_calculate_trust_score called
                                'manual_admin_adjust'        -- admin override
                              )),

  -- The delta applied to the score for this specific event
  -- NULL for 'full_recompute' (use snapshot_after − snapshot_before instead)
  points_delta    SMALLINT,

  -- Score before and after this event was processed
  snapshot_before SMALLINT    NOT NULL CHECK (snapshot_before BETWEEN 0 AND 100),
  snapshot_after  SMALLINT    NOT NULL CHECK (snapshot_after  BETWEEN 0 AND 100),

  -- Optional reference to the review / report / dispute that caused this event
  reference_id    UUID,
  reference_table TEXT,   -- 'reviews' | 'review_reports' | 'fraud_alerts'

  -- Human-readable reason (for admin dashboard)
  reason          TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO updated_at — immutable
);

ALTER TABLE public.trust_score_events ENABLE ROW LEVEL SECURITY;

-- Reviewers can see their own history (transparency)
CREATE POLICY "users read own score events"
  ON public.trust_score_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service role full access score events"
  ON public.trust_score_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_tse_user_id    ON public.trust_score_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tse_event_type ON public.trust_score_events(event_type);

COMMENT ON TABLE public.trust_score_events IS 'Append-only audit log of every trust score change. Immutable — no UPDATE or DELETE.';

-- ─── 3. reviewer_trust_score ─────────────────────────────────────────────────
-- One row per full recomputation. Stores the breakdown so the formula
-- can be inspected historically and rolled back if the formula changes.

CREATE TABLE IF NOT EXISTS public.reviewer_trust_score (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  score            SMALLINT    NOT NULL CHECK (score BETWEEN 0 AND 100),

  -- Formula version tag — update when formula changes
  formula_version  TEXT        NOT NULL DEFAULT 'v2',

  -- Component breakdown (stored for transparency / debugging)
  -- {
  --   "base": 20,
  --   "verified_bonus": 25,
  --   "email_bonus": 4,
  --   "like_bonus": 12,
  --   "age_bonus": 10,
  --   "dispute_survived_bonus": 6,
  --   "dispute_lost_penalty": 15,
  --   "abuse_penalty": 10,
  --   "anonymous_penalty": 5,
  --   "raw": 67,
  --   "fraud_locked": false
  -- }
  breakdown        JSONB       NOT NULL DEFAULT '{}',

  -- Snapshot of the metrics used (point-in-time)
  metrics_snapshot JSONB       NOT NULL DEFAULT '{}',

  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviewer_trust_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own score history"
  ON public.reviewer_trust_score FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service role full access rts"
  ON public.reviewer_trust_score FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_rts_user_id
  ON public.reviewer_trust_score(user_id, computed_at DESC);

COMMENT ON TABLE public.reviewer_trust_score IS 'Snapshot history of every full trust score computation. Breakdown stored for audit and formula versioning.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 4. fn_compute_trust_score_v2 ────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Core formula. Returns the computed score AND writes a snapshot row.
-- Does NOT update profiles.trust_score — that is done by the wrapper
-- fn_calculate_trust_score() so existing callers are unaffected.
--
-- Formula components:
--
--   COMPONENT                       MIN    MAX    CAP LOGIC
--   ─────────────────────────────── ─────  ─────  ──────────────────────────────
--   base_score                         20     20   constant
--   verified_review_bonus               0     30   verified_count × 5,  cap 30
--   email_verified_bonus                0     10   email_count × 2,     cap 10
--   like_bonus                          0     15   FLOOR(likes ÷ 5),    cap 15
--   account_age_bonus                   0     15   tiered (30/90/180/365 days)
--   dispute_survived_bonus              0     10   survived × 3,        cap 10
--   ─── Penalties ───
--   dispute_lost_penalty                0    -30   lost × 15,           cap 30
--   abuse_report_penalty                0    -20   reports × 10,        cap 20
--   anonymous_excess_penalty            0    -10   >50% → -5, >70% → -10
--
--   raw_score = sum of above components
--   trust_score = GREATEST(LEAST(raw_score, 100), 0)
--   fraud override: fraud_locked = TRUE → trust_score = 0
--
-- Recomputable: calling this function twice in a row gives the same result.

CREATE OR REPLACE FUNCTION public.fn_compute_trust_score_v2(
  p_user_id       UUID,
  p_write_snapshot BOOLEAN DEFAULT TRUE   -- set FALSE for dry-run / preview
)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Inputs from reviewer_metrics
  v_verified_count    INTEGER := 0;
  v_email_count       INTEGER := 0;
  v_anon_count        INTEGER := 0;
  v_total_count       INTEGER := 0;
  v_likes             INTEGER := 0;
  v_survived          INTEGER := 0;
  v_lost              INTEGER := 0;
  v_abuse             INTEGER := 0;

  -- Account age
  v_age_days          INTEGER := 0;
  v_created_at        TIMESTAMPTZ;

  -- Fraud lock
  v_fraud_locked      BOOLEAN := FALSE;

  -- Score components
  v_base              SMALLINT := 20;
  v_verified_bonus    SMALLINT := 0;
  v_email_bonus       SMALLINT := 0;
  v_like_bonus        SMALLINT := 0;
  v_age_bonus         SMALLINT := 0;
  v_survived_bonus    SMALLINT := 0;
  v_dispute_penalty   SMALLINT := 0;
  v_abuse_penalty     SMALLINT := 0;
  v_anon_penalty      SMALLINT := 0;

  v_raw               INTEGER  := 0;
  v_final             SMALLINT := 0;

  -- For snapshot
  v_old_score         SMALLINT := 10;
BEGIN
  -- ── 1. Fraud lock fast-path ───────────────────────────────────────────────
  SELECT fraud_locked, created_at, trust_score
  INTO   v_fraud_locked, v_created_at, v_old_score
  FROM   public.profiles
  WHERE  id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_fraud_locked THEN
    IF p_write_snapshot THEN
      UPDATE public.profiles SET trust_score = 0 WHERE id = p_user_id;
    END IF;
    RETURN 0;
  END IF;

  -- ── 2. Pull reviewer_metrics (upsert a default row if missing) ───────────
  -- Ensure the row exists (idempotent)
  INSERT INTO public.reviewer_metrics (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT
    verified_review_count,
    email_verified_count,
    anonymous_review_count,
    total_review_count,
    total_likes_received,
    disputes_survived,
    disputes_lost,
    abuse_reports_accepted
  INTO
    v_verified_count,
    v_email_count,
    v_anon_count,
    v_total_count,
    v_likes,
    v_survived,
    v_lost,
    v_abuse
  FROM public.reviewer_metrics
  WHERE user_id = p_user_id;

  -- ── 3. Account age bonus ──────────────────────────────────────────────────
  v_age_days := EXTRACT(DAY FROM NOW() - COALESCE(v_created_at, NOW()))::INTEGER;

  v_age_bonus :=
    CASE
      WHEN v_age_days >= 365 THEN 15
      WHEN v_age_days >= 180 THEN 10
      WHEN v_age_days >= 90  THEN  7
      WHEN v_age_days >= 30  THEN  4
      ELSE                        0
    END;

  -- ── 4. Positive signal components ────────────────────────────────────────
  -- Purchase-verified reviews: +5 each, max +30
  v_verified_bonus := LEAST(v_verified_count * 5, 30)::SMALLINT;

  -- Email-verified reviews: +2 each, max +10
  v_email_bonus    := LEAST(v_email_count * 2, 10)::SMALLINT;

  -- Likes: every 5 likes = +1 point, max +15
  v_like_bonus     := LEAST(FLOOR(v_likes::NUMERIC / 5.0), 15)::SMALLINT;

  -- Dispute survived: +3 per upheld review, max +10
  v_survived_bonus := LEAST(v_survived * 3, 10)::SMALLINT;

  -- ── 5. Penalty components ─────────────────────────────────────────────────
  -- Dispute lost (review removed): -15 per loss, max -30
  v_dispute_penalty := LEAST(v_lost * 15, 30)::SMALLINT;

  -- Accepted abuse reports: -10 per accepted report, max -20
  v_abuse_penalty   := LEAST(v_abuse * 10, 20)::SMALLINT;

  -- Anonymous excess penalty
  -- > 70% of reviews are anonymous → -10 (severe)
  -- > 50% of reviews are anonymous → -5  (moderate)
  IF v_total_count > 0 THEN
    v_anon_penalty :=
      CASE
        WHEN v_anon_count::NUMERIC / v_total_count > 0.70 THEN 10
        WHEN v_anon_count::NUMERIC / v_total_count > 0.50 THEN  5
        ELSE                                                     0
      END;
  ELSE
    v_anon_penalty := 0;
  END IF;

  -- ── 6. Aggregate ──────────────────────────────────────────────────────────
  v_raw :=
      v_base
    + v_verified_bonus
    + v_email_bonus
    + v_like_bonus
    + v_age_bonus
    + v_survived_bonus
    - v_dispute_penalty
    - v_abuse_penalty
    - v_anon_penalty;

  -- Clamp to [0, 100]
  v_final := GREATEST(LEAST(v_raw, 100), 0)::SMALLINT;

  -- ── 7. Persist ───────────────────────────────────────────────────────────
  IF p_write_snapshot THEN
    -- Update profiles.trust_score (the live column)
    UPDATE public.profiles
    SET trust_score = v_final
    WHERE id = p_user_id;

    -- Write snapshot row with full breakdown
    INSERT INTO public.reviewer_trust_score
      (user_id, score, formula_version, breakdown, metrics_snapshot)
    VALUES (
      p_user_id,
      v_final,
      'v2',
      jsonb_build_object(
        'base',                   v_base,
        'verified_bonus',         v_verified_bonus,
        'email_bonus',            v_email_bonus,
        'like_bonus',             v_like_bonus,
        'age_bonus',              v_age_bonus,
        'dispute_survived_bonus', v_survived_bonus,
        'dispute_lost_penalty',   v_dispute_penalty,
        'abuse_penalty',          v_abuse_penalty,
        'anonymous_penalty',      v_anon_penalty,
        'raw',                    v_raw,
        'fraud_locked',           FALSE
      ),
      jsonb_build_object(
        'verified_review_count',  v_verified_count,
        'email_verified_count',   v_email_count,
        'anonymous_review_count', v_anon_count,
        'total_review_count',     v_total_count,
        'total_likes_received',   v_likes,
        'disputes_survived',      v_survived,
        'disputes_lost',          v_lost,
        'abuse_reports_accepted', v_abuse,
        'account_age_days',       v_age_days
      )
    );

    -- Write trust_score_event for the full recompute
    INSERT INTO public.trust_score_events
      (user_id, event_type, snapshot_before, snapshot_after, reason)
    VALUES
      (p_user_id, 'full_recompute', v_old_score, v_final,
       FORMAT('v2 recompute: raw=%s, verified=%s, likes=%s, age_days=%s',
              v_raw, v_verified_count, v_likes, v_age_days));
  END IF;

  RETURN v_final;
END;
$$;

COMMENT ON FUNCTION public.fn_compute_trust_score_v2 IS
  'v2 trust score formula. Reads reviewer_metrics, computes all signal components, '
  'clamps to [0,100], persists to profiles.trust_score and writes a reviewer_trust_score snapshot.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 5. fn_calculate_trust_score (wrapper — keeps existing callers intact) ───
-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 000010 wired everything to this function name.
-- We replace its body to call the v2 formula — zero changes to triggers or
-- edge functions that already call fn_calculate_trust_score().

CREATE OR REPLACE FUNCTION public.fn_calculate_trust_score(p_user_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.fn_compute_trust_score_v2(p_user_id, TRUE);
END;
$$;

COMMENT ON FUNCTION public.fn_calculate_trust_score IS
  'Compatibility wrapper → delegates to fn_compute_trust_score_v2(). '
  'Existing triggers and edge functions call this name.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 6. fn_refresh_reviewer_metrics ──────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- Full recompute of reviewer_metrics from source tables.
-- Called by pg_cron nightly and on-demand after bulk imports.
-- Individual triggers do incremental updates; this is the "reconcile" path.

CREATE OR REPLACE FUNCTION public.fn_refresh_reviewer_metrics(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified   INTEGER;
  v_email      INTEGER;
  v_anon       INTEGER;
  v_total      INTEGER;
  v_likes      INTEGER;
  v_survived   INTEGER;
  v_lost       INTEGER;
  v_abuse      INTEGER;
BEGIN
  -- Count review categories from source
  SELECT
    COUNT(*)                                                    FILTER (WHERE verification_status = 'purchase_verified' AND is_hidden = FALSE),
    COUNT(*)                                                    FILTER (WHERE verification_status = 'email_verified'    AND is_hidden = FALSE),
    COUNT(*)                                                    FILTER (WHERE verification_status = 'anonymous'         AND is_hidden = FALSE),
    COUNT(*)                                                    FILTER (WHERE is_hidden = FALSE),
    COALESCE(SUM(likes_count), 0)                              FILTER (WHERE is_hidden = FALSE),
    COUNT(*)                                                    FILTER (WHERE dispute_status = 'resolved_for_reviewer'),
    COUNT(*)                                                    FILTER (WHERE dispute_status IN ('resolved_for_business', 'removed') OR
                                                                               (is_disputed = TRUE AND is_hidden = TRUE)),
    0   -- abuse_reports_accepted computed separately below
  INTO v_verified, v_email, v_anon, v_total, v_likes, v_survived, v_lost, v_abuse
  FROM public.reviews
  WHERE user_id = p_user_id;

  -- Count accepted abuse reports against this reviewer
  SELECT COUNT(*)
  INTO   v_abuse
  FROM   public.review_reports rr
  JOIN   public.reviews         r ON r.id = rr.review_id
  WHERE  r.user_id = p_user_id
    AND  rr.status = 'action_taken';

  -- Upsert reviewer_metrics
  INSERT INTO public.reviewer_metrics
    (user_id, verified_review_count, email_verified_count,
     anonymous_review_count, total_review_count,
     total_likes_received, disputes_survived, disputes_lost,
     abuse_reports_accepted, last_recomputed_at, updated_at)
  VALUES
    (p_user_id, v_verified, v_email, v_anon, v_total,
     v_likes, v_survived, v_lost, v_abuse, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    verified_review_count  = EXCLUDED.verified_review_count,
    email_verified_count   = EXCLUDED.email_verified_count,
    anonymous_review_count = EXCLUDED.anonymous_review_count,
    total_review_count     = EXCLUDED.total_review_count,
    total_likes_received   = EXCLUDED.total_likes_received,
    disputes_survived      = EXCLUDED.disputes_survived,
    disputes_lost          = EXCLUDED.disputes_lost,
    abuse_reports_accepted = EXCLUDED.abuse_reports_accepted,
    last_recomputed_at     = NOW(),
    updated_at             = NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 7. Incremental triggers on source tables ─────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- These maintain reviewer_metrics in real-time so that fn_compute_trust_score_v2
-- can read a single row without re-aggregating millions of review rows.

-- ── 7a. reviews → update review counts and verification state ────────────────

CREATE OR REPLACE FUNCTION public.trg_fn_sync_review_to_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Ensure metrics row exists
  INSERT INTO public.reviewer_metrics (user_id)
  VALUES (COALESCE(NEW.user_id, OLD.user_id))
  ON CONFLICT (user_id) DO NOTHING;

  -- Full refresh is cheapest here because verification_status and dispute_status
  -- can each change on UPDATE and simple +/-1 logic gets complex fast.
  -- fn_refresh_reviewer_metrics is fast (single-user aggregate query).
  PERFORM public.fn_refresh_reviewer_metrics(COALESCE(NEW.user_id, OLD.user_id));

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_review_to_metrics ON public.reviews;
CREATE TRIGGER trg_sync_review_to_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_sync_review_to_metrics();

-- ── 7b. review_likes → increment likes counter ───────────────────────────────
-- review_likes was created in migration 000009.
-- We add an incremental +1 here (cheaper than full refresh for high-volume likes).

CREATE OR REPLACE FUNCTION public.trg_fn_sync_like_to_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  -- Find the review owner
  SELECT user_id INTO v_reviewer_id
  FROM   public.reviews
  WHERE  id = NEW.review_id;

  IF v_reviewer_id IS NULL THEN RETURN NEW; END IF;

  -- Ensure row exists
  INSERT INTO public.reviewer_metrics (user_id)
  VALUES (v_reviewer_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Increment
  UPDATE public.reviewer_metrics
  SET    total_likes_received = total_likes_received + 1,
         updated_at           = NOW()
  WHERE  user_id = v_reviewer_id;

  -- Recalculate trust score after like milestone (like_bonus changes every 5 likes)
  -- Only trigger a recalc when a new 5-like threshold is crossed to avoid thrashing.
  IF ((SELECT total_likes_received FROM public.reviewer_metrics WHERE user_id = v_reviewer_id) % 5) = 0 THEN
    PERFORM public.fn_calculate_trust_score(v_reviewer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_like_to_metrics ON public.review_likes;
CREATE TRIGGER trg_sync_like_to_metrics
  AFTER INSERT ON public.review_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_sync_like_to_metrics();

-- ── 7c. review_reports → update abuse count when status → action_taken ───────

CREATE OR REPLACE FUNCTION public.trg_fn_sync_report_to_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  -- Only act when report moves to action_taken
  IF NEW.status <> 'action_taken' THEN RETURN NEW; END IF;
  IF OLD.status = 'action_taken'  THEN RETURN NEW; END IF;  -- already counted

  -- Find the review owner
  SELECT user_id INTO v_reviewer_id
  FROM   public.reviews
  WHERE  id = NEW.review_id;

  IF v_reviewer_id IS NULL THEN RETURN NEW; END IF;

  -- Ensure row exists
  INSERT INTO public.reviewer_metrics (user_id)
  VALUES (v_reviewer_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Increment abuse counter
  UPDATE public.reviewer_metrics
  SET    abuse_reports_accepted = abuse_reports_accepted + 1,
         updated_at             = NOW()
  WHERE  user_id = v_reviewer_id;

  -- Write a trust_score_event for transparency
  INSERT INTO public.trust_score_events
    (user_id, event_type, snapshot_before, snapshot_after,
     reference_id, reference_table, reason)
  SELECT
    v_reviewer_id,
    'abuse_report_accepted',
    p.trust_score,
    p.trust_score,      -- actual delta applied on next full recompute
    NEW.review_id,
    'review_reports',
    'Abuse report accepted by moderation team'
  FROM public.profiles p
  WHERE p.id = v_reviewer_id;

  -- Trigger a full recalculation
  PERFORM public.fn_calculate_trust_score(v_reviewer_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_report_to_metrics ON public.review_reports;
CREATE TRIGGER trg_sync_report_to_metrics
  AFTER UPDATE OF status ON public.review_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_sync_report_to_metrics();

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 8. trg_refresh_trust_score — extend existing trigger ────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 000010 created this trigger but only fired on afve_status changes.
-- We extend the condition to also fire on dispute_status and verification_status
-- changes so the score stays current without a separate cron sweep.

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_trust_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.afve_status       IS DISTINCT FROM OLD.afve_status       OR
     NEW.dispute_status    IS DISTINCT FROM OLD.dispute_status    OR
     NEW.verification_status IS DISTINCT FROM OLD.verification_status OR
     NEW.is_hidden         IS DISTINCT FROM OLD.is_hidden         THEN
    PERFORM public.fn_calculate_trust_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
-- Trigger already exists (migration 000010); CREATE OR REPLACE of the function
-- is enough — the trigger binding remains intact.

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 9. pg_cron: nightly full reconcile ──────────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- Re-runs fn_refresh_reviewer_metrics + fn_calculate_trust_score for all
-- active users. Catches any drift from edge cases (bulk deletes, admin ops).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Nightly metrics reconcile (02:00 UTC)
    PERFORM cron.schedule(
      'reviewhub-nightly-trust-reconcile',
      '0 2 * * *',
      $$
        SELECT public.fn_refresh_reviewer_metrics(id)
        FROM   auth.users
        WHERE  created_at > NOW() - INTERVAL '1 year'
          AND  last_sign_in_at > NOW() - INTERVAL '90 days';
      $$
    );

    -- After metrics are refreshed, recompute scores for affected users (02:30 UTC)
    PERFORM cron.schedule(
      'reviewhub-nightly-trust-recompute',
      '30 2 * * *',
      $$
        SELECT public.fn_calculate_trust_score(user_id)
        FROM   public.reviewer_metrics
        WHERE  updated_at > NOW() - INTERVAL '25 hours';
      $$
    );
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ─── 10. Back-fill existing users ────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- Seed reviewer_metrics for all existing users who have written reviews,
-- then recompute their trust scores with the new formula.
-- Runs once at migration time; safe to re-run (UPSERT).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM   public.reviews
    WHERE  user_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM public.fn_refresh_reviewer_metrics(r.user_id);
      PERFORM public.fn_calculate_trust_score(r.user_id);
    EXCEPTION WHEN OTHERS THEN
      -- Skip users whose profile row may be missing; non-fatal.
      NULL;
    END;
  END LOOP;
END;
$$;

-- ─── Final comments ───────────────────────────────────────────────────────────

COMMENT ON FUNCTION public.fn_compute_trust_score_v2 IS
  'v2 trust score formula (migration 000011). '
  'base(20) + verified_bonus(max 30) + email_bonus(max 10) + like_bonus(max 15) '
  '+ age_bonus(max 15) + dispute_survived(max 10) '
  '- dispute_lost(max 30) - abuse_reports(max 20) - anon_excess(max 10). '
  'Hard floor 0, hard cap 100. fraud_locked → 0.';

COMMENT ON FUNCTION public.fn_refresh_reviewer_metrics IS
  'Full recompute of reviewer_metrics for one user from source tables. '
  'Called by triggers (per-user) and pg_cron (batch nightly).';

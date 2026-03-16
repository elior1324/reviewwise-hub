-- ─────────────────────────────────────────────────────────────────────────────
-- AI Intelligence Layer — schema additions
--
-- New columns on `businesses` (all nullable — populated by background AI scans):
--   ai_summary            TEXT       short 3-4 sentence AI-written profile summary
--   ai_summary_updated_at TIMESTAMPTZ when summary was last regenerated
--   sentiment_score       FLOAT      0.0–1.0 avg sentiment from recent reviews
--   quality_score         FLOAT      0.0–1.0 review quality / detail score
--   review_velocity       FLOAT      reviews per day (30d rolling avg)
--   trending_score        FLOAT      velocity ratio 30d vs 90d baseline (1.0 = stable)
--   response_rate         FLOAT      fraction of reviews that received a response
--   last_ai_scan_at       TIMESTAMPTZ timestamp of last full AI profile scan
--   ai_flags              JSONB      active anomaly flag types (array of strings)
--
-- New table:
--   ai_anomaly_flags      individual anomaly events detected by the AI scanner
--
-- New view:
--   v_business_rankings   AI-enhanced composite ranking score (0–100)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns on businesses ──────────────────────────────────────────────

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS ai_summary            TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sentiment_score       FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quality_score         FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_velocity       FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trending_score        FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS response_rate         FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_ai_scan_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_flags              JSONB    DEFAULT '[]'::jsonb;

-- Indexes for ranking / discovery queries
CREATE INDEX IF NOT EXISTS idx_businesses_trending_score
  ON businesses (trending_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_businesses_sentiment_score
  ON businesses (sentiment_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_businesses_last_ai_scan
  ON businesses (last_ai_scan_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_businesses_composite
  ON businesses (rating DESC, review_count DESC, trending_score DESC NULLS LAST);

-- ── 2. ai_anomaly_flags table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_anomaly_flags (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Type of anomaly detected
  -- 'rating_spike'       — sudden influx of 1-star or 5-star reviews
  -- 'review_flood'       — volume far exceeds normal velocity
  -- 'coordinated_timing' — multiple reviews within minutes of each other
  -- 'sentiment_mismatch' — positive text paired with very low rating
  -- 'velocity_anomaly'   — trending_score > 5x baseline
  -- 'fake_review_pattern'— AI-detected linguistic patterns of fake reviews
  flag_type    TEXT        NOT NULL,

  severity     TEXT        NOT NULL DEFAULT 'medium',
  -- 'low' | 'medium' | 'high' | 'critical'

  details      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- Structured evidence: counts, timestamps, example review IDs, etc.

  detected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,

  status       TEXT        NOT NULL DEFAULT 'open'
  -- 'open' | 'investigating' | 'resolved' | 'false_positive'
);

CREATE INDEX IF NOT EXISTS idx_anomaly_flags_business
  ON ai_anomaly_flags (business_id, status);
CREATE INDEX IF NOT EXISTS idx_anomaly_flags_detected
  ON ai_anomaly_flags (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_flags_open
  ON ai_anomaly_flags (status, severity)
  WHERE status = 'open';

-- RLS: business owners see their own flags; writes are service-role only
ALTER TABLE ai_anomaly_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business owners read own anomaly flags"
  ON ai_anomaly_flags FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ── 3. Register new functions in ai_function_limits ───────────────────────────

INSERT INTO ai_function_limits (function_name, daily_limit, description)
VALUES
  ('analyze-profiles',         0, 'Internal cron — unlimited, no user-facing cap'),
  ('generate-profile-summary', 3, 'On-demand AI profile summary (3/day per business owner)'),
  ('detect-review-anomalies',  0, 'Internal cron — unlimited, no user-facing cap'),
  ('daily-ai-scan',            0, 'Master cron orchestrator — no user-facing cap')
ON CONFLICT (function_name) DO NOTHING;

-- ── 4. AI-enhanced composite ranking view ────────────────────────────────────
-- Combines existing trust signals with new AI signals.
-- All AI columns fall back gracefully to base signals when NULL.
--
-- composite_rank_score components (weights sum to 1.0):
--   40% — verified rating quality  (trust-weighted avg rating)
--   20% — sentiment score          (AI-computed, falls back to rating)
--   15% — review volume            (log-normalised, capped at ~500 reviews = max)
--   15% — trending momentum        (velocity growth ratio, capped at 3×)
--   10% — engagement / response    (fraction of reviews answered)

CREATE OR REPLACE VIEW v_business_rankings AS
SELECT
  b.id,
  b.slug,
  b.name,
  b.category,
  b.rating,
  b.review_count,
  b.verified_review_count,
  b.sentiment_score,
  b.quality_score,
  b.review_velocity,
  b.trending_score,
  b.response_rate,
  b.ai_summary,
  b.ai_flags,
  b.last_ai_scan_at,

  -- Composite AI-enhanced rank score (0–100, higher = better rank)
  ROUND(CAST(
    -- [40%] Verified rating quality
    (COALESCE(b.rating, 0) / 5.0) * 0.40 * 100.0

    -- [20%] Sentiment (AI signal; falls back to normalised rating)
    + COALESCE(b.sentiment_score, COALESCE(b.rating, 0) / 5.0) * 0.20 * 100.0

    -- [15%] Review volume (log-normalised, LN(501)≈6.2 → 1.0 at ~500 reviews)
    + LEAST(
        LN(GREATEST(COALESCE(b.review_count, 0), 1) + 1) / LN(502),
        1.0
      ) * 0.15 * 100.0

    -- [15%] Trending momentum (capped at 3× baseline = max)
    + LEAST(COALESCE(b.trending_score, 1.0), 3.0) / 3.0 * 0.15 * 100.0

    -- [10%] Response rate
    + COALESCE(b.response_rate, 0.0) * 0.10 * 100.0

  AS NUMERIC), 2) AS composite_rank_score

FROM businesses b;

COMMENT ON VIEW v_business_rankings IS
  'AI-enhanced composite ranking. composite_rank_score (0–100) blends rating quality (40%), sentiment (20%), volume (15%), trending momentum (15%), and response rate (10%). All AI signals degrade gracefully to base signals when NULL (unscanned profiles).';

-- ── 5. Function: get top businesses with AI ranking ──────────────────────────

CREATE OR REPLACE FUNCTION fn_get_ranked_businesses(
  p_category    TEXT    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 20,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                   UUID,
  slug                 TEXT,
  name                 TEXT,
  category             TEXT,
  rating               FLOAT,
  review_count         INTEGER,
  verified_review_count INTEGER,
  ai_summary           TEXT,
  sentiment_score      FLOAT,
  trending_score       FLOAT,
  composite_rank_score NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id, r.slug, r.name, r.category, r.rating,
    r.review_count, r.verified_review_count,
    r.ai_summary, r.sentiment_score, r.trending_score,
    r.composite_rank_score
  FROM v_business_rankings r
  WHERE (p_category IS NULL OR r.category = p_category)
  ORDER BY r.composite_rank_score DESC NULLS LAST
  LIMIT  p_limit
  OFFSET p_offset;
$$;

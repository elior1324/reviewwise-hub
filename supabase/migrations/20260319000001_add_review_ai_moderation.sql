-- ─────────────────────────────────────────────────────────────────────────────
-- AI Moderation columns on `reviews`
--
-- Adds per-review fields populated asynchronously by the `moderate-review`
-- Edge Function after each INSERT. All columns are nullable until moderation
-- completes, and all existing queries continue to work unchanged.
--
-- Design decisions:
--   • moderation_status defaults to 'pending' so all new reviews are in a
--     known, safe state before Claude processes them.
--   • When moderation_status = 'flagged', the function ALSO sets the existing
--     `flagged` boolean and `flag_reason` columns, ensuring that all existing
--     api-gateway filters and frontend queries that filter on `flagged = false`
--     continue to exclude AI-flagged reviews with zero code changes.
--   • ai_spam_risk is Claude's independent spam assessment, kept separate from
--     the rule-based `spam_score` populated by submit-review. Both coexist.
--   • quality_score is per-review (0–100 integer). The existing quality_score
--     FLOAT on the `businesses` table is a separate, business-level aggregate.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status    TEXT         NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged')),
  ADD COLUMN IF NOT EXISTS quality_score        SMALLINT
    CHECK (quality_score >= 0 AND quality_score <= 100),
  ADD COLUMN IF NOT EXISTS ai_spam_risk         NUMERIC(4,3)
    CHECK (ai_spam_risk  >= 0 AND ai_spam_risk  <= 1),
  ADD COLUMN IF NOT EXISTS toxicity_risk        NUMERIC(4,3)
    CHECK (toxicity_risk >= 0 AND toxicity_risk <= 1),
  ADD COLUMN IF NOT EXISTS ai_moderation_tags   TEXT[],
  ADD COLUMN IF NOT EXISTS ai_moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_moderated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_moderation_model  TEXT;

-- Index for admin queries that filter on moderation_status.
-- Partial index: only rows that still need attention (not approved + already processed).
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status
  ON public.reviews (moderation_status, created_at DESC)
  WHERE moderation_status IN ('pending', 'flagged');

-- ── Register moderate-review in ai_function_limits ────────────────────────────
-- daily_limit = 0 means no user-facing cap (internal system function).
INSERT INTO ai_function_limits (function_name, daily_limit, description)
VALUES (
  'moderate-review',
  0,
  'Per-review AI moderation via Claude — triggered by database webhook, no user cap'
)
ON CONFLICT (function_name) DO NOTHING;

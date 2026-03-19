-- ─────────────────────────────────────────────────────────────────────────────
-- Moderation audit log + confidence score
--
-- Depends on: 20260319000001_add_review_ai_moderation.sql
--
-- Changes:
--   1. Add ai_moderation_confidence column to reviews.
--   2. Create moderation_audit_log table — one row per moderation run.
--      Stores the complete AI response and final decision for every review,
--      including runs that fell back to 'pending' due to AI failure.
--
-- Design decisions:
--   • Audit log is append-only. Multiple rows per review_id are intentional —
--     they record retries, re-moderation, and fallback runs separately.
--   • raw_ai_response JSONB stores the full Anthropic API response object,
--     not just the extracted content. This preserves stop_reason, usage
--     tokens, and model version for debugging.
--   • fallback_reason is NULL when Claude ran successfully. Non-null values
--     indicate why the system defaulted to 'pending' without AI input:
--     'anthropic_key_missing', 'network_error', 'timeout', 'invalid_json',
--     'validation_failed'.
--   • RLS: service role writes only. No user-facing reads — the raw AI
--     reasoning must not be readable by the review author (it could be used
--     to game the system).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Confidence score on reviews ───────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS ai_moderation_confidence NUMERIC(4,3)
    CHECK (ai_moderation_confidence >= 0 AND ai_moderation_confidence <= 1);

-- ── 2. Audit log table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.moderation_audit_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The review that was moderated
  review_id         UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,

  -- When this moderation run completed (may differ from reviews.ai_moderated_at
  -- on retries — ai_moderated_at records the FIRST successful write)
  decided_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Final status written to the reviews row for this run
  moderation_status TEXT        NOT NULL
    CHECK (moderation_status IN ('pending', 'approved', 'flagged')),

  -- Claude model that produced this decision (NULL if AI was not called)
  model_id          TEXT,

  -- AI output scores (NULL when fallback_reason is set)
  confidence        NUMERIC(4,3) CHECK (confidence        >= 0 AND confidence        <= 1),
  quality_score     SMALLINT     CHECK (quality_score     >= 0 AND quality_score     <= 100),
  spam_risk         NUMERIC(4,3) CHECK (spam_risk         >= 0 AND spam_risk         <= 1),
  toxicity_risk     NUMERIC(4,3) CHECK (toxicity_risk     >= 0 AND toxicity_risk     <= 1),
  tags              TEXT[],
  reason            TEXT,

  -- Full Anthropic API response object for debugging (stop_reason, usage, etc.)
  -- NULL when Claude was not called (fallback runs)
  raw_ai_response   JSONB,

  -- NULL = AI ran and result was used.
  -- Non-null = AI was not used; value describes why:
  --   'anthropic_key_missing'  — ANTHROPIC_API_KEY secret not configured
  --   'network_error'          — fetch threw before getting a response
  --   'timeout'                — AbortSignal fired (> 20s)
  --   'api_error'              — Anthropic returned a non-200 status
  --   'invalid_json'           — Claude response could not be parsed as JSON
  --   'validation_failed'      — JSON parsed but failed shape/range validation
  fallback_reason   TEXT,

  -- How this moderation run was triggered
  trigger_source    TEXT        NOT NULL DEFAULT 'webhook_insert'
    CHECK (trigger_source IN ('webhook_insert', 'manual_requeue', 'retry'))
);

-- Index for admin review queue: fetch pending/flagged decisions newest-first
CREATE INDEX IF NOT EXISTS idx_moderation_audit_review
  ON public.moderation_audit_log (review_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_status
  ON public.moderation_audit_log (moderation_status, decided_at DESC)
  WHERE moderation_status IN ('pending', 'flagged');

CREATE INDEX IF NOT EXISTS idx_moderation_audit_fallbacks
  ON public.moderation_audit_log (decided_at DESC)
  WHERE fallback_reason IS NOT NULL;

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.moderation_audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for authenticated or anon — service role only.
-- Admins access this via the Supabase dashboard or a privileged Edge Function.
-- Do not expose raw AI reasoning to review authors.

-- =============================================================================
-- Migration: 20260311000003_ai_rate_limits.sql
-- Purpose  : Protect AI/LLM Edge Functions from credit exhaustion
--
-- Creates a lightweight usage-tracking table that Edge Functions insert into.
-- A SECURITY DEFINER function provides a single atomic check+increment so
-- the rate-limit check cannot be bypassed by a race condition.
-- =============================================================================

-- ── Usage log table ────────────────────────────────────────────────────────
-- One row per (user_id, function_name, day).
-- The count column is incremented atomically by the upsert below.

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT        NOT NULL,
  usage_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  call_count    INTEGER     NOT NULL DEFAULT 1,
  UNIQUE (user_id, function_name, usage_date)
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own usage (useful for a "you have X calls left today" UI)
CREATE POLICY "Users can view own AI usage" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role may write (the Edge Functions use service-role key)
-- No INSERT/UPDATE/DELETE policy for anon or authenticated → denied by default

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_fn_date
  ON public.ai_usage_log (user_id, function_name, usage_date);

-- ── Per-function daily call limits ────────────────────────────────────────
-- Stored in a simple lookup table so limits can be changed without redeploying.

CREATE TABLE IF NOT EXISTS public.ai_function_limits (
  function_name TEXT PRIMARY KEY,
  daily_limit   INTEGER NOT NULL,
  description   TEXT
);

ALTER TABLE public.ai_function_limits ENABLE ROW LEVEL SECURITY;

-- Read-only for everyone (Edge Functions use service role anyway)
CREATE POLICY "Anyone can read AI limits" ON public.ai_function_limits
  FOR SELECT USING (true);

-- Seed the default per-function limits
INSERT INTO public.ai_function_limits (function_name, daily_limit, description) VALUES
  ('generate-ai-report', 5,  'AI business reports — expensive Gemini call'),
  ('verify-invoice',     10, 'AI receipt verification — Gemini vision call'),
  ('compare-items',      30, 'AI comparison chat — medium-cost streaming'),
  ('evaluate-category',  3,  'AI category scan — admin/scheduled use'),
  ('submit-review',      20, 'Review submissions including Turnstile + insert')
ON CONFLICT (function_name) DO NOTHING;

-- ── Atomic check-and-increment function ────────────────────────────────────
-- Returns:
--   allowed    BOOLEAN  — true if the call is within the daily limit
--   remaining  INTEGER  — calls remaining after this one (0 if blocked)
--   used       INTEGER  — total calls used today (including this one if allowed)

CREATE OR REPLACE FUNCTION public.ai_rate_limit_check(
  p_user_id       UUID,
  p_function_name TEXT
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, used INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit     INTEGER;
  v_current   INTEGER := 0;
BEGIN
  -- Look up the configured limit for this function
  SELECT daily_limit INTO v_limit
  FROM public.ai_function_limits
  WHERE function_name = p_function_name;

  -- Unknown functions get a conservative default of 10
  IF v_limit IS NULL THEN
    v_limit := 10;
  END IF;

  -- Get or create today's usage row
  SELECT call_count INTO v_current
  FROM public.ai_usage_log
  WHERE user_id      = p_user_id
    AND function_name = p_function_name
    AND usage_date   = CURRENT_DATE;

  IF v_current IS NULL THEN
    v_current := 0;
  END IF;

  -- Check limit before incrementing
  IF v_current >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_current;
    RETURN;
  END IF;

  -- Atomic upsert to increment the counter
  INSERT INTO public.ai_usage_log (user_id, function_name, usage_date, call_count)
  VALUES (p_user_id, p_function_name, CURRENT_DATE, 1)
  ON CONFLICT (user_id, function_name, usage_date)
  DO UPDATE SET call_count = ai_usage_log.call_count + 1
  RETURNING call_count INTO v_current;

  RETURN QUERY SELECT true, (v_limit - v_current), v_current;
END;
$$;

-- Allow Edge Functions (authenticated and service role) to call this RPC
GRANT EXECUTE ON FUNCTION public.ai_rate_limit_check(UUID, TEXT) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: login_security
-- Adds:
--   1. login_attempts table   — tracks every password-login attempt per email
--   2. check_login_rate_limit — returns whether an email is currently blocked
--   3. record_login_attempt   — appends one attempt record (success or failure)
-- Policy: 5 failed attempts within 15 minutes → 30-minute lockout.
--
-- Both RPCs are SECURITY DEFINER (SET search_path = public) with no direct
-- table access granted to anon / authenticated roles — callers go through the
-- functions only, preventing direct SELECT/INSERT on the attempts table.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. ── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  -- ip_address stored for future audit use; NULL is fine for now (SPA has no server IP).
  ip_address    text,
  success       boolean     NOT NULL DEFAULT false,
  attempted_at  timestamptz NOT NULL DEFAULT now()
);

-- Compound index: email + time descending — the only query pattern used.
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts (email, attempted_at DESC);

-- RLS: no direct table reads/writes from the client.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_no_direct_access"
  ON public.login_attempts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2. ── check_login_rate_limit ─────────────────────────────────────────────────
-- Returns a JSONB object:
--   { allowed: true,  failed_attempts: N, remaining_attempts: M }
--   { allowed: false, reason: 'account_locked',
--     locked_until: <ISO timestamp>, failed_attempts: N }
--
-- Constants (change here to tune policy):
--   MAX_FAILURES  = 5   failed attempts in the rolling window before lockout
--   WINDOW        = 15  minute rolling window for counting failures
--   LOCKOUT       = 30  minute lockout once threshold is crossed

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_max_failures  constant integer  := 5;
  c_window        constant interval := '15 minutes';
  c_lockout       constant interval := '30 minutes';

  v_window_start  timestamptz := now() - c_window;
  v_failed_count  integer;
  v_last_failure  timestamptz;
  v_locked_until  timestamptz;
BEGIN
  -- Count failures in the rolling window
  SELECT COUNT(*), MAX(attempted_at)
    INTO v_failed_count, v_last_failure
    FROM public.login_attempts
   WHERE email      = lower(trim(p_email))
     AND attempted_at > v_window_start
     AND success    = false;

  IF v_failed_count >= c_max_failures THEN
    v_locked_until := v_last_failure + c_lockout;

    -- Still within lockout window?
    IF now() < v_locked_until THEN
      RETURN jsonb_build_object(
        'allowed',          false,
        'reason',           'account_locked',
        'locked_until',     v_locked_until,
        'failed_attempts',  v_failed_count
      );
    END IF;
    -- Lockout has expired — allow the attempt (failures will roll off naturally)
  END IF;

  RETURN jsonb_build_object(
    'allowed',             true,
    'failed_attempts',     v_failed_count,
    'remaining_attempts',  c_max_failures - v_failed_count
  );
END;
$$;

-- 3. ── record_login_attempt ───────────────────────────────────────────────────
-- Inserts one row and prunes records older than 24 hours to cap table growth.

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email   text,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success)
  VALUES (lower(trim(p_email)), p_success);

  -- Prune rows older than 24 h (best-effort; failures here are non-fatal)
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- 4. ── Grants ─────────────────────────────────────────────────────────────────
-- Clients call these RPCs via supabase.rpc(). The anon role is needed because
-- the check must happen BEFORE the user is authenticated.

GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean)  TO anon, authenticated;

-- =============================================================================
-- Migration: 20260311000008_safe_review_columns_and_cron.sql
-- ReviewHub — גרסת בטא
-- Safe-adds submission_ip, submission_user_agent, points_locked to reviews.
-- Enables pg_cron for automatic 72-hour points unlock.
-- Run in: Supabase Dashboard → SQL Editor → "Run"
-- =============================================================================

-- ─── 1. submission_ip ─────────────────────────────────────────────────────────
-- Stores the reviewer's IP at submission time (admin-only, auto-purged at 90d).
DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN submission_ip INET;
  COMMENT ON COLUMN public.reviews.submission_ip IS
    'כתובת IP של כותב הביקורת בעת השליחה. גלויה למנהלים בלבד. נמחקת אחרי 90 יום.';
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'submission_ip already exists — skipping';
END $$;

-- ─── 2. submission_user_agent ─────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN submission_user_agent TEXT;
  COMMENT ON COLUMN public.reviews.submission_user_agent IS
    'User-Agent של הדפדפן בעת שליחת הביקורת. לזיהוי בוטים ומניעת הונאה.';
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'submission_user_agent already exists — skipping';
END $$;

-- ─── 3. points_locked ────────────────────────────────────────────────────────
-- TRUE = points are frozen (new review or active dispute).
-- FALSE = points are credited to the reviewer's balance.
DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN points_locked BOOLEAN NOT NULL DEFAULT TRUE;
  COMMENT ON COLUMN public.reviews.points_locked IS
    'נקודות נעולות = TRUE (ביקורת חדשה / Dispute פעיל). FALSE = נקודות זוכו לכותב.';
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'points_locked already exists — skipping';
END $$;

-- ─── 4. Backfill: unlock old, non-disputed reviews ────────────────────────────
-- Reviews older than 72 h with no active dispute → unlock immediately.
UPDATE public.reviews
SET    points_locked = FALSE
WHERE  points_locked = TRUE
  AND  (is_disputed IS NOT DISTINCT FROM FALSE OR is_disputed IS NULL)
  AND  created_at < NOW() - INTERVAL '72 hours';

-- ─── 5. RLS for new sensitive columns ─────────────────────────────────────────
-- submission_ip and submission_user_agent are already revoked for
-- anon/authenticated in migration 20260311000006.
-- Here we add a belt-and-suspenders row-level policy for the admin role.

-- Ensure the admin UPDATE policy for reviews exists (idempotent).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'Admin can update reviews'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Admin can update reviews"
        ON public.reviews
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
          )
        );
    $pol$;
  END IF;
END $$;

-- ─── 6. pg_cron: enable the extension (requires superuser / Supabase dashboard) ─
-- NOTE: Run this block separately in Supabase Dashboard → Database → Extensions
-- and enable "pg_cron". Then run the schedule block below.
-- If pg_cron is already enabled, the next CREATE EXTENSION line is harmless.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA cron TO postgres;

-- ─── 7. Remove existing cron jobs (idempotent re-run safety) ──────────────────
DO $$ BEGIN
  PERFORM cron.unschedule('reviewhub-unlock-points');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job didn't exist yet
END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('reviewhub-purge-ip');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ─── 8. Cron job A: Unlock points every hour ──────────────────────────────────
-- Runs at minute 5 of every hour.
-- Unlocks points for reviews that are:
--   • older than 72 hours
--   • not disputed (or dispute resolved)
SELECT cron.schedule(
  'reviewhub-unlock-points',          -- job name (unique)
  '5 * * * *',                        -- every hour at :05
  $$
    UPDATE public.reviews
    SET    points_locked = FALSE
    WHERE  points_locked = TRUE
      AND  (is_disputed IS NOT DISTINCT FROM FALSE OR is_disputed IS NULL)
      AND  created_at < NOW() - INTERVAL '72 hours';
  $$
);

-- ─── 9. Cron job B: Purge IP addresses older than 90 days ─────────────────────
-- Runs daily at 03:00 (server time = UTC).
-- Sets submission_ip = NULL after retention window to comply with privacy policy.
SELECT cron.schedule(
  'reviewhub-purge-ip',               -- job name
  '0 3 * * *',                        -- daily at 03:00 UTC
  $$
    UPDATE public.reviews
    SET    submission_ip        = NULL,
           submission_user_agent = NULL
    WHERE  (submission_ip IS NOT NULL OR submission_user_agent IS NOT NULL)
      AND  created_at < NOW() - INTERVAL '90 days';
  $$
);

-- ─── 10. Verify cron jobs are registered ──────────────────────────────────────
-- Run this query after migration to confirm:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname LIKE 'reviewhub-%';

-- =============================================================================
-- HOW TO RUN IN SUPABASE DASHBOARD:
-- 1. Go to: Database → Extensions → search "pg_cron" → Enable it.
-- 2. Go to: SQL Editor → paste this entire file → click "Run".
-- 3. To verify columns: SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'reviews' AND column_name IN ('submission_ip','submission_user_agent','points_locked');
-- 4. To verify cron jobs: SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'reviewhub-%';
-- =============================================================================

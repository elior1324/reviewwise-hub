-- ============================================================
-- Migration: Fix review_requests schema
-- Date: 2026-03-23
--
-- ROOT CAUSE:
--   The review_requests table in the linked DB was created with
--   simplified columns (id, business_id, course_id, email,
--   unique_token, sent_at, completed) — likely via the Supabase
--   dashboard. The frontend code (WriteReview.tsx) and the
--   send-review-request Edge Function expect columns from the
--   giveaway_system migration: user_email, token, reviewed_at,
--   expires_at, verified_purchase_id, opened_at.
--
--   The giveaway migration used CREATE TABLE IF NOT EXISTS which
--   was a no-op since the table already existed. The intended
--   columns were never added.
--
-- CHANGES:
--   1. Rename email → user_email (code uses user_email)
--   2. Rename unique_token → token (code uses token)
--   3. Rename completed → reviewed_at (code uses timestamptz, not boolean)
--   4. Add missing columns: verified_purchase_id, expires_at,
--      opened_at, created_at, status
--   5. Index on token for lookup
-- ============================================================

-- 1. Rename columns to match code expectations
ALTER TABLE public.review_requests
  RENAME COLUMN email TO user_email;

ALTER TABLE public.review_requests
  RENAME COLUMN unique_token TO token;

-- 2. Drop the boolean 'completed' column and add timestamptz 'reviewed_at'
--    (completed was boolean; reviewed_at is a timestamp indicating when)
ALTER TABLE public.review_requests
  DROP COLUMN IF EXISTS completed;

ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 3. Add the remaining missing columns
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS verified_purchase_id uuid,
  ADD COLUMN IF NOT EXISTS expires_at           timestamptz DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS opened_at            timestamptz,
  ADD COLUMN IF NOT EXISTS created_at           timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status               text NOT NULL DEFAULT 'sent';

-- 4. Index on token for lookup (may already exist)
CREATE INDEX IF NOT EXISTS idx_review_requests_token
  ON public.review_requests (token);

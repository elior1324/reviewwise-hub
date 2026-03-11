-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: lock_reviews_direct_insert
--
-- PROBLEM (identified in final pre-launch audit):
--   The reviews table has an INSERT RLS policy:
--     CREATE POLICY "Verified buyers can insert reviews"
--       ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
--   This policy allows ANY authenticated user to call:
--     POST /rest/v1/reviews   (Supabase REST API)
--   bypassing the submit-review Edge Function entirely.
--   That means Turnstile verification, business-existence checks, input
--   sanitisation, and rate-limiting are all skippable with a direct API call.
--
-- FIX:
--   Drop the permissive INSERT policy and replace it with a strict
--   WITH CHECK (false) policy that blocks all authenticated-role inserts.
--
--   The submit-review Edge Function uses the service_role key which
--   BYPASSES RLS entirely — so legitimate review submissions are unaffected.
--
-- RESULT:
--   Direct REST inserts:  BLOCKED  (authenticated role → WITH CHECK (false))
--   Edge Function insert: ALLOWED  (service_role → RLS bypassed)
--   Read access:          UNCHANGED (existing SELECT policy untouched)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "Verified buyers can insert reviews" ON public.reviews;

-- New policy: explicitly block all direct client inserts.
-- The error message surfaces if someone tries to insert via REST anyway.
CREATE POLICY "Reviews must be submitted via secure Edge Function"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Defensive: also block anonymous inserts (belt-and-suspenders)
DROP POLICY IF EXISTS "Anon cannot insert reviews" ON public.reviews;
CREATE POLICY "Anon cannot insert reviews"
  ON public.reviews
  FOR INSERT
  TO anon
  WITH CHECK (false);

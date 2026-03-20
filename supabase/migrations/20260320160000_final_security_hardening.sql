-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL SECURITY HARDENING
-- This migration runs AFTER all Lovable-generated migrations and permanently
-- fixes security issues that keep getting reset.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. leaderboard_entries: remove any FOR ALL policy that allows user writes
DROP POLICY IF EXISTS "Users can manage own entries" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.leaderboard_entries;

-- Ensure block policies exist
DROP POLICY IF EXISTS "Block direct writes to leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Block direct updates to leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Block direct deletes to leaderboard" ON public.leaderboard_entries;

CREATE POLICY "Block direct writes to leaderboard"
  ON public.leaderboard_entries FOR INSERT WITH CHECK (false);
CREATE POLICY "Block direct updates to leaderboard"
  ON public.leaderboard_entries FOR UPDATE USING (false);
CREATE POLICY "Block direct deletes to leaderboard"
  ON public.leaderboard_entries FOR DELETE USING (false);

-- 2. affiliate_clicks: remove old open INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert affiliate clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can insert valid affiliate clicks" ON public.affiliate_clicks;

CREATE POLICY "Anyone can insert valid affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id)
  );

-- 3. reviews: fix public_reviews view with correct column names
DROP VIEW IF EXISTS public.public_reviews CASCADE;

CREATE VIEW public.public_reviews
WITH (security_invoker = true)
AS
  SELECT
    id,
    business_id,
    course_id,
    rating,
    review_text,
    anonymous,
    reviewer_name,
    CASE
      WHEN anonymous = true AND (auth.uid() IS NULL OR auth.uid() != user_id)
      THEN NULL
      ELSE user_id
    END AS user_id,
    moderation_status,
    is_purchase_verified,
    review_source,
    is_flagged_spam,
    like_count,
    created_at,
    updated_at
    -- submission_ip and submission_user_agent intentionally excluded (PII)
  FROM public.reviews
  WHERE moderation_status = 'approved'
    AND deleted_at IS NULL;

GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- 4. businesses: revoke email/phone from anon
REVOKE SELECT (email, phone) ON public.businesses FROM anon;

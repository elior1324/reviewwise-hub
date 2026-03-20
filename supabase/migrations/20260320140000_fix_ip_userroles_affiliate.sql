-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: reviews.submission_ip — IP address publicly readable
-- submission_ip is stored for fraud detection but must never be exposed to
-- public SELECT queries. Mask it via a security view update.
-- The public_reviews view (created earlier) already selects specific columns —
-- ensure submission_ip is NOT included there (it isn't — view uses explicit cols).
-- For the underlying table: restrict submission_ip to service_role only.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE SELECT (submission_ip) ON public.reviews FROM anon;
REVOKE SELECT (submission_ip) ON public.reviews FROM authenticated;

-- Recreate public_reviews view explicitly without submission_ip
-- (already excluded, but be explicit to prevent future accidental inclusion)
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true)
AS
  SELECT
    id,
    business_id,
    course_id,
    rating,
    text,
    anonymous,
    CASE
      WHEN anonymous = true AND (auth.uid() IS NULL OR auth.uid() != user_id)
      THEN NULL
      ELSE user_id
    END AS user_id,
    moderation_status,
    verified,
    helpful_count,
    is_purchase_verified,
    review_source,
    is_flagged_spam,
    created_at,
    updated_at
    -- submission_ip intentionally excluded: PII / fraud-detection only
  FROM public.reviews
  WHERE moderation_status = 'approved';

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: user_roles — authenticated users can grant themselves admin via INSERT
-- The "Admins can manage roles" policy uses FOR ALL which includes INSERT.
-- A chicken-and-egg problem: the first admin is seeded via trigger.
-- Block direct INSERT/UPDATE from any user; only service_role / trigger can write.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can SELECT and DELETE roles (for user management UI)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Block direct INSERT/UPDATE — role assignment goes through service_role only
-- (the handle_new_user trigger runs as SECURITY DEFINER and bypasses RLS)
CREATE POLICY "Block direct role inserts"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct role updates"
  ON public.user_roles FOR UPDATE
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 3: affiliate_clicks — unvalidated INSERT allows spam/fraud
-- Previous fix required course_id to exist, but still allows:
--   - any user to insert unlimited rows for any course
--   - duplicate clicks from same referral code / session
-- Tighten: require the referral_code to exist in a valid affiliate record.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;

CREATE POLICY "Anyone can insert valid affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (
    -- course must exist
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id)
    AND
    -- referral_code must correspond to a real active affiliate
    (
      referral_code IS NULL
      OR EXISTS (
        SELECT 1 FROM public.businesses
        WHERE affiliate_referral_code = referral_code
          AND affiliate_enrolled = true
      )
    )
  );

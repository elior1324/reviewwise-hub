-- =============================================================================
-- Migration: 20260315000003_security_fixes.sql
-- Purpose  : Fix security issues flagged by the Lovable security scanner
--
--   ERROR-1  : Reviewer IP addresses and anonymous user identities are
--              publicly readable → REVOKE column-level SELECT on submission_ip
--              for anon/authenticated; grant access to masked view instead.
--
--   ERROR-2  : Users can insert/update reviews with arbitrary user_id,
--              inflating scores for others → add WITH CHECK to INSERT + UPDATE.
--
--   WARNING-5: users table UPDATE has no WITH CHECK — a user could self-promote
--              their role → add WITH CHECK that prevents role changes.
--
--   WARNING-8: review_requests "Token holders" policy matches every row
--              (unique_token IS NOT NULL is always true) → replace with
--              business-owner-scoped policy; edge functions use service_role.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ERROR-1a: Block direct column-level access to submission IP on reviews table
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE SELECT (submission_ip, submission_user_agent)
  ON public.reviews
  FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ERROR-1b: Grant the masked public_reviews view to both roles
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ERROR-2: Lock reviews INSERT and UPDATE to the authenticated user's own id
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WARNING-5: Prevent self-promotion via users table UPDATE
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- WARNING-8: review_requests — restrict to business owners only
--            (edge functions use service_role and bypass RLS)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Token holders can read review requests" ON public.review_requests;
DROP POLICY IF EXISTS "Anyone can view by token" ON public.review_requests;

CREATE POLICY "Token holders can read own review requests"
  ON public.review_requests FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

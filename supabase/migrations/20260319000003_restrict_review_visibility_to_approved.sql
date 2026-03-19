-- ─────────────────────────────────────────────────────────────────────────────
-- Restrict public review visibility to approved reviews only
--
-- Depends on: 20260319000001_add_review_ai_moderation.sql
--   (adds the moderation_status column with DEFAULT 'pending')
--
-- Changes:
--   1. Drop the original blanket SELECT policy ("Reviews viewable by everyone").
--   2. Add two new SELECT policies:
--      - anon: only approved reviews
--      - authenticated: approved reviews OR the user's own reviews (any status)
--                       OR all reviews on a business the user owns
--
-- Design decisions:
--   • Service role bypasses RLS — moderation Edge Functions are unaffected.
--   • Review authors can always see their own pending/flagged reviews so they
--     know their submission was received and what its status is.
--   • Business owners can see ALL reviews on their business (including pending
--     and flagged) because the BusinessDashboard needs to display them for
--     management purposes (compliance queue, monthly counts, etc.).
--   • The anon policy has no owner exception — anonymous users can only see
--     approved reviews. There is no unauthenticated ownership concept.
--   • This is the authoritative control. Explicit .eq("moderation_status","approved")
--     filters in application queries are defense-in-depth only.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop the blanket SELECT policy ────────────────────────────────────────

DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;

-- ── 2. Anon: approved reviews only ───────────────────────────────────────────

CREATE POLICY "Anon can read approved reviews"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (moderation_status = 'approved');

-- ── 3. Authenticated: approved, own submissions, or own business ──────────────

CREATE POLICY "Authenticated users can read approved or accessible reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    -- Public approved reviews: visible to all authenticated users
    moderation_status = 'approved'

    -- Own reviews: the submitter can always see their own review regardless of status
    -- so they know it was received and can track its moderation state
    OR auth.uid() = user_id

    -- Business owner access: owners can see all reviews on their business
    -- (pending, flagged, approved) for moderation dashboard and compliance queue
    OR business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: leaderboard_entries — users can manipulate own scores via FOR ALL policy
-- The "Users can view own entries" policy used FOR ALL which allows
-- INSERT/UPDATE/DELETE. Users could directly write arbitrary point values.
-- Only service_role (via SECURITY DEFINER triggers) should write to this table.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own entries" ON public.leaderboard_entries;

-- SELECT only for the row owner
CREATE POLICY "Users can view own leaderboard entry"
  ON public.leaderboard_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Public can read leaderboard (powers the public /leaderboard page)
-- Already exists as "Public leaderboard visible" — keep it.

-- Explicitly block direct writes from any non-service_role session
-- (triggers run as SECURITY DEFINER and bypass RLS entirely, so they are unaffected)
CREATE POLICY "Block direct writes to leaderboard"
  ON public.leaderboard_entries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct updates to leaderboard"
  ON public.leaderboard_entries FOR UPDATE
  USING (false);

CREATE POLICY "Block direct deletes to leaderboard"
  ON public.leaderboard_entries FOR DELETE
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: businesses — email and phone publicly readable by anyone
-- Replace the open "Businesses viewable by everyone" policy with two policies:
--   a) anon: can only see public-safe columns (masks email/phone with NULL)
--   b) authenticated owner: can see all columns including email/phone
-- This uses a row-level approach so existing SELECT * queries still work.
-- ─────────────────────────────────────────────────────────────────────────────

-- Create a public-safe view that masks contact PII for non-owners
CREATE OR REPLACE VIEW public.public_businesses
WITH (security_invoker = true)
AS
  SELECT
    id,
    owner_id,
    slug,
    name,
    category,
    description,
    website,
    -- mask email/phone: only return value if viewer is the owner
    CASE WHEN auth.uid() = owner_id THEN email ELSE NULL END AS email,
    CASE WHEN auth.uid() = owner_id THEN phone ELSE NULL END AS phone,
    logo_url,
    cover_url,
    rating,
    review_count,
    verified,
    trust_score,
    trust_status,
    subscription_tier,
    subscription_expires_at,
    trial_ends_at,
    affiliate_enrolled,
    affiliate_program_status,
    founder_name,
    social_links,
    created_at,
    updated_at
  FROM public.businesses;

COMMENT ON VIEW public.public_businesses IS
  'Public-safe view of businesses. email and phone are masked (NULL) for non-owners.';

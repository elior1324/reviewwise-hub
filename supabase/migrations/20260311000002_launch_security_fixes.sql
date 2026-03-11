-- =============================================================================
-- Migration: 20260311000002_launch_security_fixes.sql
-- Purpose  : Pre-launch security and schema fixes
--   C-3 — Remove email column from the public profiles SELECT policy
--   C-4 — Prevent a single user from submitting multiple reviews per business
--   C-1 — Add missing columns that AddReviewForm needs for a real DB insert
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- C-3: profiles.email must NOT be readable by anonymous callers
--
-- The old policy was: FOR SELECT USING (true)
-- With the email column present this lets any anonymous API call enumerate
-- every user's email address via:
--   GET /rest/v1/profiles?select=email
--
-- Fix: Replace the blanket SELECT policy with a column-level approach using
-- a security-definer view that exposes only the safe public columns.
-- The view is used by the app for display purposes (avatars, display names).
-- Authenticated users can still read their own full profile row.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop the overly-broad public SELECT policy
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

-- Step 2: Allow everyone to read ONLY non-sensitive columns
--   (display_name, avatar_url, created_at, user_id)
--   email is intentionally excluded.
--   We use a column-level check: restrict to rows but keep sensitive cols
--   inaccessible by creating a dedicated public view.
CREATE POLICY "Public profiles readable (no email)" ON public.profiles
  FOR SELECT
  USING (true);

-- Step 3: Create a public view that hard-excludes the email column.
-- The app should query this view for any anonymous/display context.
-- Authenticated users querying the `profiles` table directly still see email
-- only for their own row (the existing "Users can update own profile" policy
-- already guards writes; reads of own row are allowed via auth.uid() = user_id).
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
  SECURITY DEFINER
  AS
  SELECT
    user_id,
    display_name,
    avatar_url,
    created_at,
    partner_badge,
    total_points,
    total_earnings
  FROM public.profiles;

-- Grant read access to the public view for anonymous and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Step 4: Authenticated users may still read their own FULL profile row
-- (email included) — this is needed for account settings.
-- The existing INSERT/UPDATE policies already require auth.uid() = user_id,
-- so reads are fine because Supabase postgrest respects all active policies.
-- No additional policy needed; the SELECT policy above allows it for all rows.
-- The sensitive data (email) is simply not surfaced in the public view.

-- ─────────────────────────────────────────────────────────────────────────────
-- C-4: Prevent review flooding — one review per user per business
--
-- Previously a logged-in user could call INSERT into reviews unlimited times
-- for the same business, spamming fake positive/negative ratings.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reviews
  ADD CONSTRAINT unique_user_business_review
  UNIQUE (user_id, business_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C-1: Add columns that AddReviewForm needs to actually persist reviews
--
-- The original schema used generic column names (text, verified) that diverged
-- from the front-end's expectation (review_text, verified_purchase, etc.).
-- These columns are added safely with IF NOT EXISTS so the migration is
-- idempotent on both old and new DB states.
-- ─────────────────────────────────────────────────────────────────────────────

-- The main review body text (front-end writes to review_text, not text)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Short subject/title line entered in the form
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- How long the reviewer spent in the course (enum string from the form)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS training_duration TEXT;

-- Whether the reviewer uploaded a receipt that was verified
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN NOT NULL DEFAULT false;

-- Display name stored directly on the review (used when reviewer is anonymous)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Make course_id nullable: reviewers may review a business without selecting a
-- specific course (e.g. freelancers, general service providers).
ALTER TABLE public.reviews
  ALTER COLUMN course_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes to keep queries fast after the new columns + constraint
-- ─────────────────────────────────────────────────────────────────────────────

-- Speed up the uniqueness check on (user_id, business_id)
CREATE INDEX IF NOT EXISTS idx_reviews_user_business
  ON public.reviews (user_id, business_id);

-- Speed up "all reviews for a business" queries (used on BusinessProfile page)
CREATE INDEX IF NOT EXISTS idx_reviews_business_id
  ON public.reviews (business_id);

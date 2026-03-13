-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP SCRIPT — Remove all seed/demo data
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- All demo businesses have slugs that start with "seed-"
-- Their reviews + any related data cascade-delete automatically.
--
-- Run this in Supabase SQL Editor or via the MCP execute_sql tool.
-- Safe to run multiple times — IF NOT EXISTS / WHERE filters prevent errors.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Delete review responses tied to seed reviews
DELETE FROM public.review_responses
WHERE business_id IN (
  SELECT id FROM public.businesses WHERE slug LIKE 'seed-%'
);

-- 2. Delete all reviews for seed businesses (hard delete, not soft delete)
DELETE FROM public.reviews
WHERE business_id IN (
  SELECT id FROM public.businesses WHERE slug LIKE 'seed-%'
);

-- 3. Delete courses for seed businesses
DELETE FROM public.courses
WHERE business_id IN (
  SELECT id FROM public.businesses WHERE slug LIKE 'seed-%'
);

-- 4. Delete the seed businesses themselves
DELETE FROM public.businesses
WHERE slug LIKE 'seed-%';

COMMIT;

-- ── Verify cleanup ────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM public.businesses WHERE slug LIKE 'seed-%') AS remaining_businesses,
  (SELECT COUNT(*) FROM public.reviews    WHERE business_id IN (SELECT id FROM public.businesses WHERE slug LIKE 'seed-%')) AS remaining_reviews;

-- Expected result: remaining_businesses = 0, remaining_reviews = 0

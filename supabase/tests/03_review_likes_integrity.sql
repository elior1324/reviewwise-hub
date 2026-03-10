-- supabase/tests/03_review_likes_integrity.sql
--
-- pgTAP tests for the review_likes table (F05 fix).
-- Verifies: table exists, RLS correct, FK cascade, unique constraint,
-- and that increment/decrement RPCs exist.
--
-- Run: supabase test db

BEGIN;
SELECT plan(12);

-- ── 1. Table exists ──────────────────────────────────────────────────────────
SELECT has_table(
  'public', 'review_likes',
  'review_likes table exists (F05 fix — was missing from DB)'
);

-- ── 2. Required columns exist ─────────────────────────────────────────────────
SELECT has_column('public', 'review_likes', 'id',         'review_likes has id column');
SELECT has_column('public', 'review_likes', 'review_id',  'review_likes has review_id column');
SELECT has_column('public', 'review_likes', 'user_id',    'review_likes has user_id column');
SELECT has_column('public', 'review_likes', 'created_at', 'review_likes has created_at column');

-- ── 3. RLS is enabled on review_likes ────────────────────────────────────────
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'review_likes' AND relnamespace = 'public'::regnamespace),
  'RLS is enabled on review_likes'
);

-- ── 4. Setup test data ────────────────────────────────────────────────────────
-- Insert a test review to like
INSERT INTO public.reviews (id, business_id, reviewer_name, rating, text, verified, anonymous, user_id)
VALUES (
  'rv333333-0000-0000-0000-000000000003'::uuid,
  'b3333333-0000-0000-0000-000000000003'::uuid,
  'Tester',
  5,
  'Great product!',
  false,
  false,
  '00000000-0000-0000-0000-000000000003'::uuid
) ON CONFLICT (id) DO NOTHING;

-- ── 5. Authenticated user can INSERT a like ───────────────────────────────────
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';

SELECT lives_ok(
  $$ INSERT INTO public.review_likes (review_id, user_id)
     VALUES (
       'rv333333-0000-0000-0000-000000000003'::uuid,
       '00000000-0000-0000-0000-000000000003'::uuid
     ) $$,
  'AUTH: Authenticated user can like a review'
);

-- ── 6. Unique constraint — cannot like the same review twice ─────────────────
SELECT throws_ok(
  $$ INSERT INTO public.review_likes (review_id, user_id)
     VALUES (
       'rv333333-0000-0000-0000-000000000003'::uuid,
       '00000000-0000-0000-0000-000000000003'::uuid
     ) $$,
  'duplicate key value violates unique constraint',
  'Unique constraint prevents liking the same review twice'
);

-- ── 7. Anon user can SELECT (read like counts) ───────────────────────────────
RESET ROLE;
SET LOCAL ROLE anon;

SELECT ok(
  (SELECT COUNT(*) FROM public.review_likes
   WHERE review_id = 'rv333333-0000-0000-0000-000000000003'::uuid) >= 1,
  'ANON: Can read review_likes count (public SELECT policy)'
);

-- ── 8. Anon user cannot INSERT ────────────────────────────────────────────────
SELECT throws_ok(
  $$ INSERT INTO public.review_likes (review_id, user_id)
     VALUES (
       'rv333333-0000-0000-0000-000000000003'::uuid,
       '99999999-9999-9999-9999-999999999999'::uuid
     ) $$,
  'new row violates row-level security policy',
  'ANON: Cannot like a review (INSERT blocked)'
);

-- ── 9. FK cascade — deleting the review deletes its likes ────────────────────
RESET ROLE;

-- Count likes before
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_likes
     WHERE review_id = 'rv333333-0000-0000-0000-000000000003'::uuid $$,
  ARRAY[1],
  'Setup: 1 like exists before review deletion'
);

DELETE FROM public.reviews WHERE id = 'rv333333-0000-0000-0000-000000000003'::uuid;

SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_likes
     WHERE review_id = 'rv333333-0000-0000-0000-000000000003'::uuid $$,
  ARRAY[0],
  'FK CASCADE: Deleting a review cascade-deletes its review_likes (no orphans)'
);

-- ── 10. RPC stubs exist ───────────────────────────────────────────────────────
SELECT has_function(
  'public', 'increment_review_likes', ARRAY['uuid'],
  'increment_review_likes(uuid) RPC exists (F07 fix)'
);

SELECT has_function(
  'public', 'decrement_review_likes', ARRAY['uuid'],
  'decrement_review_likes(uuid) RPC exists (F07 fix)'
);

SELECT * FROM finish();
ROLLBACK;

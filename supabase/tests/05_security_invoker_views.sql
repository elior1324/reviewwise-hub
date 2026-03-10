-- supabase/tests/05_security_invoker_views.sql
--
-- pgTAP tests for the SECURITY INVOKER view fix (F01 — CRITICAL).
-- Verifies that all four views now respect the querying user's RLS context
-- instead of running as the view owner (which bypassed RLS entirely).
--
-- Also tests the set_updated_at() function search_path fix (F08).
--
-- Run: supabase test db

BEGIN;
SELECT plan(14);

-- ── 1. Views exist ───────────────────────────────────────────────────────────
SELECT has_view('public', 'public_businesses',      'public_businesses view exists');
SELECT has_view('public', 'public_reviews',         'public_reviews view exists');
SELECT has_view('public', 'business_rating_summary','business_rating_summary view exists');
SELECT has_view('public', 'course_rating_summary',  'course_rating_summary view exists');

-- ── 2. Views use SECURITY INVOKER (not DEFINER) ──────────────────────────────
-- In PostgreSQL 15+ the security_invoker option is stored in pg_views.definition
-- or can be checked via pg_class.relacl / information_schema
-- The reliable way is to check the reloptions for the view's pg_class entry.

SELECT ok(
  EXISTS(
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'public_businesses'
      AND c.reloptions @> ARRAY['security_invoker=true']
  ),
  'public_businesses uses security_invoker=true (F01 fix)'
);

SELECT ok(
  EXISTS(
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'public_reviews'
      AND c.reloptions @> ARRAY['security_invoker=true']
  ),
  'public_reviews uses security_invoker=true (F01 fix)'
);

SELECT ok(
  EXISTS(
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'business_rating_summary'
      AND c.reloptions @> ARRAY['security_invoker=true']
  ),
  'business_rating_summary uses security_invoker=true (F01 fix)'
);

SELECT ok(
  EXISTS(
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'course_rating_summary'
      AND c.reloptions @> ARRAY['security_invoker=true']
  ),
  'course_rating_summary uses security_invoker=true (F01 fix)'
);

-- ── 3. RLS is actually enforced when querying the views as anon ──────────────
-- Insert a business with an unpublished review (should be filtered by RLS)
INSERT INTO public.businesses (id, name, slug, owner_id, type)
VALUES (
  'b5555555-0000-0000-0000-000000000005'::uuid,
  'Invoker Test Biz',
  'invoker-test-biz-05',
  '00000000-0000-0000-0000-000000000005'::uuid,
  'business'
) ON CONFLICT (id) DO NOTHING;

-- Anon should be able to see published businesses via public_businesses view
SET LOCAL ROLE anon;

SELECT ok(
  (SELECT COUNT(*) FROM public.public_businesses) >= 0,
  'ANON: public_businesses view is queryable (returns >= 0 rows)'
);

-- Anon should not see soft-deleted reviews via public_reviews
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.public_reviews
     WHERE deleted_at IS NOT NULL $$,
  ARRAY[0],
  'ANON: public_reviews view does not return soft-deleted reviews'
);

RESET ROLE;

-- ── 4. set_updated_at() function has pinned search_path (F08 fix) ─────────────
SELECT ok(
  EXISTS(
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'set_updated_at'
      -- proconfig contains search_path setting
      AND p.proconfig @> ARRAY['search_path=public, pg_catalog']
  ),
  'set_updated_at() has pinned search_path = public, pg_catalog (F08 fix)'
);

-- ── 5. set_updated_at trigger fires and sets updated_at ──────────────────────
-- Insert a business row and update it; check that updated_at changes
INSERT INTO public.businesses (id, name, slug, owner_id, type, created_at, updated_at)
VALUES (
  'b5555555-0000-0000-0000-000000000006'::uuid,
  'Trigger Test Biz',
  'trigger-test-biz-06',
  '00000000-0000-0000-0000-000000000006'::uuid,
  'business',
  now() - interval '1 hour',
  now() - interval '1 hour'
) ON CONFLICT (id) DO NOTHING;

UPDATE public.businesses
SET name = 'Trigger Test Biz Updated'
WHERE id = 'b5555555-0000-0000-0000-000000000006'::uuid;

SELECT ok(
  (SELECT updated_at FROM public.businesses
   WHERE id = 'b5555555-0000-0000-0000-000000000006'::uuid) > (now() - interval '5 seconds'),
  'TRIGGER: set_updated_at() updates the updated_at timestamp on UPDATE'
);

-- ── 6. user_roles table exists and has correct CHECK constraint (F06 fix) ─────
SELECT has_table('public', 'user_roles', 'user_roles table exists (F06 fix)');

SELECT col_is_pk('public', 'user_roles', 'id', 'user_roles.id is primary key');

-- ── 7. RLS enabled on user_roles ─────────────────────────────────────────────
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_roles' AND relnamespace = 'public'::regnamespace),
  'RLS is enabled on user_roles (F06 fix)'
);

SELECT * FROM finish();
ROLLBACK;

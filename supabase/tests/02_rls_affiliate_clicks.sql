-- supabase/tests/02_rls_affiliate_clicks.sql
--
-- pgTAP tests for affiliate_clicks Row Level Security.
-- Verifies F04 fix: anon INSERT is now blocked (was WITH CHECK (true)).
--
-- Run: supabase test db

BEGIN;
SELECT plan(7);

-- ── Setup ─────────────────────────────────────────────────────────────────────
-- Course needed as FK target for affiliate_clicks.course_id
INSERT INTO public.courses (id, business_id, title, slug, price, is_published, owner_id)
VALUES (
  'c2222222-0000-0000-0000-000000000002'::uuid,
  'b1111111-0000-0000-0000-000000000002'::uuid,
  'Test Course Affiliate',
  'test-course-affiliate-02',
  99.00,
  true,
  '00000000-0000-0000-0000-000000000002'::uuid
) ON CONFLICT (id) DO NOTHING;

-- ── 1. Anon INSERT is blocked ─────────────────────────────────────────────────
-- F04 fix: removed the "Anyone can insert affiliate clicks" anon policy.
SET LOCAL ROLE anon;

SELECT throws_ok(
  $$ INSERT INTO public.affiliate_clicks (course_id, referrer)
     VALUES ('c2222222-0000-0000-0000-000000000002'::uuid, 'https://evil.com') $$,
  'new row violates row-level security policy',
  'ANON: INSERT into affiliate_clicks is blocked (F04 fix)'
);

-- ── 2. Anon cannot SELECT affiliate_clicks ───────────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.affiliate_clicks $$,
  ARRAY[0],
  'ANON: SELECT returns 0 rows (no anon read policy)'
);

-- ── 3. Authenticated user CAN insert with a valid course_id ──────────────────
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

SELECT lives_ok(
  $$ INSERT INTO public.affiliate_clicks (course_id, referrer)
     VALUES ('c2222222-0000-0000-0000-000000000002'::uuid, 'https://partner.com') $$,
  'AUTH: Authenticated user can INSERT affiliate_click with valid course_id'
);

-- ── 4. WITH CHECK prevents setting created_at in the past (audit trail) ──────
SELECT throws_ok(
  $$ INSERT INTO public.affiliate_clicks (course_id, created_at)
     VALUES (
       'c2222222-0000-0000-0000-000000000002'::uuid,
       '2020-01-01 00:00:00+00'::timestamptz
     ) $$,
  'new row violates row-level security policy',
  'AUTH: Cannot backdate affiliate_clicks by setting created_at (F04 fix)'
);

-- ── 5. Authenticated user can see their own clicks ───────────────────────────
SELECT ok(
  (SELECT COUNT(*) FROM public.affiliate_clicks
   WHERE course_id = 'c2222222-0000-0000-0000-000000000002'::uuid) >= 1,
  'AUTH: Can read own affiliate_clicks after insert'
);

-- ── 6. Different authenticated user cannot see others' clicks ────────────────
SET LOCAL request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.affiliate_clicks
     WHERE course_id = 'c2222222-0000-0000-0000-000000000002'::uuid $$,
  ARRAY[0],
  'AUTH: Different user cannot read other users affiliate_clicks'
);

-- ── 7. Null course_id is rejected ────────────────────────────────────────────
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

SELECT throws_ok(
  $$ INSERT INTO public.affiliate_clicks (course_id) VALUES (NULL) $$,
  'new row violates row-level security policy',
  'AUTH: NULL course_id is rejected by WITH CHECK constraint (F04 fix)'
);

SELECT * FROM finish();
ROLLBACK;

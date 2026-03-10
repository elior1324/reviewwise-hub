-- supabase/tests/01_rls_review_requests.sql
--
-- pgTAP tests for review_requests Row Level Security.
-- Verifies F03 fix: customer emails no longer exposed to anon users
-- without a token filter.
--
-- Run locally: supabase test db
-- Run single file: psql "$DATABASE_URL" -f supabase/tests/01_rls_review_requests.sql

BEGIN;
SELECT plan(8);

-- ── Test data setup ─────────────────────────────────────────────────────────
-- Insert a test business and review request (cleaned up on ROLLBACK)
INSERT INTO public.businesses (id, name, slug, owner_id, type)
VALUES (
  'b1111111-0000-0000-0000-000000000001'::uuid,
  'Test Business RLS',
  'test-biz-rls-01',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'business'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.review_requests (
  id, business_id, customer_email, customer_name, unique_token
) VALUES (
  'r1111111-0000-0000-0000-000000000001'::uuid,
  'b1111111-0000-0000-0000-000000000001'::uuid,
  'customer@example.com',
  'Test Customer',
  'valid-test-token-abc123'
) ON CONFLICT (id) DO NOTHING;

-- ── 1. Anon role sees ZERO rows without any filter ───────────────────────────
-- This was the bug: USING (true) allowed full-table scans by anon users.
-- Fixed by: USING (unique_token IS NOT NULL)
SET LOCAL ROLE anon;

SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_requests $$,
  ARRAY[0],
  'ANON: SELECT without filter returns 0 rows (F03 fix - prevents email harvesting)'
);

-- ── 2. Anon cannot SELECT even with a WHERE clause on other columns ───────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_requests
     WHERE customer_email LIKE '%@example.com' $$,
  ARRAY[0],
  'ANON: SELECT with email filter still returns 0 rows (RLS applied before WHERE)'
);

-- ── 3. Anon CAN see a row when filtering by the exact token ─────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_requests
     WHERE unique_token = 'valid-test-token-abc123' $$,
  ARRAY[1],
  'ANON: SELECT filtered by valid unique_token returns 1 row'
);

-- ── 4. Anon sees correct customer name when filtering by token ───────────────
SELECT results_eq(
  $$ SELECT customer_name FROM public.review_requests
     WHERE unique_token = 'valid-test-token-abc123' $$,
  $$ VALUES ('Test Customer'::text) $$,
  'ANON: customer_name visible when querying by token'
);

-- ── 5. Anon CANNOT INSERT into review_requests ───────────────────────────────
SELECT throws_ok(
  $$ INSERT INTO public.review_requests (business_id, customer_email, customer_name, unique_token)
     VALUES (
       'b1111111-0000-0000-0000-000000000001'::uuid,
       'evil@attacker.com',
       'Evil',
       'hacked-token'
     ) $$,
  'new row violates row-level security policy',
  'ANON: INSERT is blocked by RLS'
);

-- ── 6. Switch to authenticated role ─────────────────────────────────────────
RESET ROLE;
-- Simulate an authenticated user (business owner)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_requests
     WHERE business_id = 'b1111111-0000-0000-0000-000000000001'::uuid $$,
  ARRAY[1],
  'AUTH: Business owner can see their own review_requests'
);

-- ── 7. Authenticated user from a DIFFERENT business cannot see these rows ────
SET LOCAL request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_requests
     WHERE business_id = 'b1111111-0000-0000-0000-000000000001'::uuid $$,
  ARRAY[0],
  'AUTH: Different user cannot read another business review_requests'
);

-- ── 8. Service role bypasses RLS entirely ───────────────────────────────────
RESET ROLE;
SET LOCAL ROLE service_role;

SELECT ok(
  (SELECT COUNT(*) FROM public.review_requests
   WHERE id = 'r1111111-0000-0000-0000-000000000001'::uuid) >= 1,
  'SERVICE_ROLE: Can read review_requests (bypasses RLS)'
);

SELECT * FROM finish();
ROLLBACK;

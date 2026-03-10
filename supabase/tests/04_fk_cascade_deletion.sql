-- supabase/tests/04_fk_cascade_deletion.sql
--
-- pgTAP tests for user deletion relational integrity.
-- Verifies that deleting a user (from auth.users) cascade-deletes or
-- nullifies all FK-linked rows across the public schema.
--
-- Run: supabase test db

BEGIN;
SELECT plan(10);

-- ── Setup — create a complete user profile with all related records ───────────
-- Simulate an auth.users row (test only — real deletion goes through Supabase Auth)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'del99999-0000-0000-0000-000000000099'::uuid) THEN
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      'del99999-0000-0000-0000-000000000099'::uuid,
      'delete-test@example.com',
      crypt('TestPass77!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Delete Test User"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );
  END IF;
END $$;

-- Public user profile
INSERT INTO public.users (id, email, display_name)
VALUES (
  'del99999-0000-0000-0000-000000000099'::uuid,
  'delete-test@example.com',
  'Delete Test User'
) ON CONFLICT (id) DO NOTHING;

-- Business owned by this user
INSERT INTO public.businesses (id, name, slug, owner_id, type)
VALUES (
  'biz99999-0000-0000-0000-000000000099'::uuid,
  'Delete Test Business',
  'delete-test-biz-99',
  'del99999-0000-0000-0000-000000000099'::uuid,
  'business'
) ON CONFLICT (id) DO NOTHING;

-- Review written by this user
INSERT INTO public.reviews (id, business_id, reviewer_name, rating, text, verified, anonymous, user_id)
VALUES (
  'rev99999-0000-0000-0000-000000000099'::uuid,
  'biz99999-0000-0000-0000-000000000099'::uuid,
  'Delete Test User',
  4,
  'This is a test review for deletion testing.',
  false,
  false,
  'del99999-0000-0000-0000-000000000099'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Like made by this user
INSERT INTO public.review_likes (review_id, user_id)
VALUES (
  'rev99999-0000-0000-0000-000000000099'::uuid,
  'del99999-0000-0000-0000-000000000099'::uuid
) ON CONFLICT DO NOTHING;

-- Notification for this user
INSERT INTO public.notifications (user_id, type, message)
VALUES (
  'del99999-0000-0000-0000-000000000099'::uuid,
  'info',
  'Test notification'
) ON CONFLICT DO NOTHING;

-- User points record
INSERT INTO public.user_points (user_id, points)
VALUES (
  'del99999-0000-0000-0000-000000000099'::uuid,
  100
) ON CONFLICT (user_id) DO UPDATE SET points = 100;

-- User role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'del99999-0000-0000-0000-000000000099'::uuid,
  'moderator'
) ON CONFLICT DO NOTHING;

-- ── Verify test data exists before deletion ───────────────────────────────────
SELECT ok(
  EXISTS(SELECT 1 FROM auth.users WHERE id = 'del99999-0000-0000-0000-000000000099'::uuid),
  'Setup: auth.users row exists'
);
SELECT ok(
  EXISTS(SELECT 1 FROM public.users WHERE id = 'del99999-0000-0000-0000-000000000099'::uuid),
  'Setup: public.users row exists'
);
SELECT ok(
  EXISTS(SELECT 1 FROM public.review_likes WHERE user_id = 'del99999-0000-0000-0000-000000000099'::uuid),
  'Setup: review_likes row exists'
);

-- ── DELETE the auth.users row (simulates Supabase Auth deletion) ─────────────
DELETE FROM auth.users WHERE id = 'del99999-0000-0000-0000-000000000099'::uuid;

-- ── Verify cascade: public.users should be gone ──────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.users
     WHERE id = 'del99999-0000-0000-0000-000000000099'::uuid $$,
  ARRAY[0],
  'CASCADE: public.users row deleted when auth.users row is removed'
);

-- ── Verify cascade: review_likes should be gone ──────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_likes
     WHERE user_id = 'del99999-0000-0000-0000-000000000099'::uuid $$,
  ARRAY[0],
  'CASCADE: review_likes cascade-deleted on user deletion'
);

-- ── Verify cascade: notifications should be gone ────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.notifications
     WHERE user_id = 'del99999-0000-0000-0000-000000000099'::uuid $$,
  ARRAY[0],
  'CASCADE: notifications cascade-deleted on user deletion'
);

-- ── Verify cascade: user_points should be gone ──────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.user_points
     WHERE user_id = 'del99999-0000-0000-0000-000000000099'::uuid $$,
  ARRAY[0],
  'CASCADE: user_points cascade-deleted on user deletion'
);

-- ── Verify cascade: user_roles should be gone ───────────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.user_roles
     WHERE user_id = 'del99999-0000-0000-0000-000000000099'::uuid $$,
  ARRAY[0],
  'CASCADE: user_roles cascade-deleted on user deletion (F06 fix table)'
);

-- ── Verify: no orphaned review_likes from the deleted review ─────────────────
-- The review itself may remain (authored content) but likes should be consistent
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_likes rl
     LEFT JOIN public.reviews r ON rl.review_id = r.id
     WHERE r.id IS NULL $$,
  ARRAY[0],
  'INTEGRITY: No orphaned review_likes (all reference existing reviews)'
);

-- ── Verify: no orphaned rows in review_helpful_votes ────────────────────────
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.review_helpful_votes rhv
     LEFT JOIN public.reviews r ON rhv.review_id = r.id
     WHERE r.id IS NULL $$,
  ARRAY[0],
  'INTEGRITY: No orphaned review_helpful_votes rows after deletions'
);

SELECT * FROM finish();
ROLLBACK;

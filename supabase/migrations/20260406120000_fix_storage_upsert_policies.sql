-- ============================================================================
-- Migration: Fix avatars/covers UPDATE policies for upsert uploads
-- Date: 2026-04-06
--
-- Problem:
--   ImageUploadField uploads with { upsert: true }. When the object already
--   exists (e.g. re-uploading a logo), Supabase Storage performs an UPDATE
--   on storage.objects. The original hardening migration
--   (20260329100000_storage_bucket_hardening.sql) created the UPDATE policies
--   with only a USING clause and no WITH CHECK clause. Postgres RLS requires
--   WITH CHECK on UPDATE to validate the new row — without it, PostgREST /
--   storage-api rejects the operation, causing business owners to see a
--   "row-level security policy" error when replacing their profile picture.
--
-- Fix:
--   Drop the broken UPDATE policies and recreate them with matching USING
--   and WITH CHECK clauses so upsert uploads succeed when the path's first
--   folder segment equals auth.uid().
-- ============================================================================

-- ── avatars: UPDATE policy ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "avatars: users update own" ON storage.objects;

CREATE POLICY "avatars: users update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ── covers: UPDATE policy ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "covers: users update own" ON storage.objects;

CREATE POLICY "covers: users update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'covers'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'covers'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

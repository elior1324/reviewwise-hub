-- ============================================================================
-- Migration: Storage bucket hardening
-- Date: 2026-03-29
--
-- Fixes:
--   1. Creates avatars and covers buckets explicitly (with MIME + size limits)
--   2. Adds RLS policies for avatars and covers (path-based ownership)
--   3. Adds file_size_limit and allowed_mime_types to existing buckets
--   4. Blocks all client uploads to email-assets (service-role only)
-- ============================================================================

-- ── 1. Create avatars bucket (if not exists) ────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,                   -- public read (profile pictures are visible to everyone)
  5242880,                -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 2. Create covers bucket (if not exists) ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  TRUE,                   -- public read (cover banners are visible to everyone)
  10485760,               -- 10 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS is already enabled on storage.objects by Supabase default.

-- ── 3. Avatars RLS policies ─────────────────────────────────────────────────

-- Anyone can view avatars (profile pictures are public)
DO $$ BEGIN
  CREATE POLICY "avatars: public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can upload their own avatar (path must start with their user_id)
DO $$ BEGIN
  CREATE POLICY "avatars: users upload own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "avatars: users update own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "avatars: users delete own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. Covers RLS policies ──────────────────────────────────────────────────

-- Anyone can view covers (cover banners are public)
DO $$ BEGIN
  CREATE POLICY "covers: public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can upload their own cover (path must start with their user_id)
DO $$ BEGIN
  CREATE POLICY "covers: users upload own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'covers'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "covers: users update own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'covers'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "covers: users delete own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'covers'
      AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Harden invoices bucket ───────────────────────────────────────────────
UPDATE storage.buckets
SET
  file_size_limit    = 15728640,  -- 15 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'image/heic', 'image/heif'
  ]
WHERE id = 'invoices';

-- ── 7. Harden testimonials bucket ───────────────────────────────────────────
UPDATE storage.buckets
SET
  file_size_limit    = 52428800,  -- 50 MB (video support)
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
WHERE id = 'testimonials';

-- ── 8. Harden email-assets bucket ───────────────────────────────────────────
UPDATE storage.buckets
SET
  file_size_limit    = 2097152,   -- 2 MB (small email images only)
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
WHERE id = 'email-assets';

-- ── 9. email-assets RLS: public read, block ALL client writes ───────────────
-- Email template images are non-sensitive (public read is fine).
-- Only service_role (Edge Functions) should write to this bucket.

DO $$ BEGIN
  CREATE POLICY "email-assets: public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block authenticated INSERT
DO $$ BEGIN
  CREATE POLICY "email-assets: block client insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block authenticated UPDATE
DO $$ BEGIN
  CREATE POLICY "email-assets: block client update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block authenticated DELETE
DO $$ BEGIN
  CREATE POLICY "email-assets: block client delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block anon INSERT
DO $$ BEGIN
  CREATE POLICY "email-assets: block anon insert"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block anon UPDATE
DO $$ BEGIN
  CREATE POLICY "email-assets: block anon update"
    ON storage.objects FOR UPDATE
    TO anon
    USING (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Block anon DELETE
DO $$ BEGIN
  CREATE POLICY "email-assets: block anon delete"
    ON storage.objects FOR DELETE
    TO anon
    USING (bucket_id != 'email-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

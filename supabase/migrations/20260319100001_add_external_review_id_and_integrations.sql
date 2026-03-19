-- Migration: 20260319100001_add_external_review_id_and_integrations.sql
--
-- Supports imported reviews from Google Business Profile and Facebook Pages.
--
-- Changes:
--   1. reviews.external_review_id — stores the source platform's review ID
--      so re-importing is idempotent (upsert on business_id + external_review_id).
--   2. reviews.review_source — extends allowed values to include 'google' and 'facebook'
--      (the column may already exist from a previous migration; this is additive).
--   3. business_integrations — add google, facebook, salesforce, monday types
--      to the allowed integration_type check constraint (if it exists).

-- ── 1. Add external_review_id to reviews ──────────────────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS external_review_id TEXT DEFAULT NULL;

-- Unique constraint: one external review per business (prevents duplicates on re-import)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_business_external_review_uniq'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_business_external_review_uniq
      UNIQUE (business_id, external_review_id);
  END IF;
END $$;

-- Index for fast upsert lookups
CREATE INDEX IF NOT EXISTS idx_reviews_external_review_id
  ON public.reviews (business_id, external_review_id)
  WHERE external_review_id IS NOT NULL;

-- ── 2. reviews.review_source: ensure 'google' and 'facebook' are accepted ────
-- If the column has a CHECK constraint, drop and recreate it with the full list.
-- If it's a free-text column, this is a no-op.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.reviews'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%review_source%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_review_source_check CHECK (
    review_source IN (
      'community', 'whatsapp', 'facebook', 'google',
      'email_verified', 'verified_purchase', 'api', 'imported'
    )
  );

-- ── 3. Extend business_integrations integration_type check ────────────────────
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.business_integrations'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%integration_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.business_integrations DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.business_integrations
  ADD CONSTRAINT business_integrations_type_check CHECK (
    integration_type IN (
      'google_sheets', 'hubspot', 'salesforce', 'monday',
      'google', 'facebook', 'zapier', 'make', 'custom'
    )
  );

-- ── 4. RLS: imported reviews are readable like any other approved review ──────
-- No additional policies needed — existing RLS on reviews covers review_source.

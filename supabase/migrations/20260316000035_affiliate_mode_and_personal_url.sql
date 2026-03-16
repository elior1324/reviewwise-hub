-- ── Affiliate Mode & Personal Affiliate URL ────────────────────────────────
-- Adds two new columns to businesses:
--   affiliate_mode          TEXT  CHECK ('reviewhub_model' | 'personal_affiliate' | 'none')
--   personal_affiliate_url  TEXT  — only used when affiliate_mode = 'personal_affiliate'
--
-- Backfill rule:
--   • existing rows with affiliate_enrolled = true  → 'reviewhub_model'
--   • all others                                    → 'none'
-- The old affiliate_enrolled boolean is preserved for backwards-compat.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS affiliate_mode TEXT
    CHECK (affiliate_mode IN ('reviewhub_model', 'personal_affiliate', 'none'))
    DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS personal_affiliate_url TEXT;

-- Backfill: enrolled → reviewhub_model
UPDATE businesses
SET affiliate_mode = 'reviewhub_model'
WHERE affiliate_enrolled = true
  AND (affiliate_mode IS NULL OR affiliate_mode = 'none');

-- Ensure every existing row has a non-null value
UPDATE businesses
SET affiliate_mode = 'none'
WHERE affiliate_mode IS NULL;

-- Make column NOT NULL now that every row has a value
ALTER TABLE businesses
  ALTER COLUMN affiliate_mode SET NOT NULL;

-- Index for the redirect lookup (fetched on every /go/:slug hit)
CREATE INDEX IF NOT EXISTS idx_businesses_affiliate_mode
  ON businesses (affiliate_mode)
  WHERE affiliate_mode != 'none';

COMMENT ON COLUMN businesses.affiliate_mode IS
  'reviewhub_model = ReviewHub 5/5 split; personal_affiliate = business uses own affiliate URL; none = no affiliate program';
COMMENT ON COLUMN businesses.personal_affiliate_url IS
  'The business''s own affiliate/tracking URL. Only used when affiliate_mode = personal_affiliate.';

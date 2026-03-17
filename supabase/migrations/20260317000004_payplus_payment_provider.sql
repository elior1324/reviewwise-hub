-- =============================================================================
-- Migration: 20260317000004_payplus_payment_provider.sql
-- ReviewHub — Replace hyp (YaadPay) with PayPlus payment provider
-- =============================================================================
--
-- Summary of changes:
--   • Adds payplus_page_uid  — stores the page_request_uid from generateLink response
--   • Adds payplus_txn_uid   — stores the transaction_uid from the PayPlus IPN
--   • Keeps hyp_card_token + hyp_transaction_id with deprecated comments
--     (safe to drop in a future migration once no live hyp transactions exist)
--
-- No data is lost in this migration. All existing columns are preserved.
-- =============================================================================

-- ── 1. PayPlus columns ───────────────────────────────────────────────────────

-- page_request_uid returned by PayPlus generateLink (for reconciliation)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS payplus_page_uid text;

-- transaction_uid from the PayPlus IPN after a successful charge
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS payplus_txn_uid text;

-- ── 2. Deprecate hyp columns (keep data, update comments) ────────────────────

COMMENT ON COLUMN public.businesses.hyp_card_token
  IS 'DEPRECATED — hyp (YaadPay) only. No longer written since migration to PayPlus. Kept for historical records.';

COMMENT ON COLUMN public.businesses.hyp_transaction_id
  IS 'DEPRECATED — hyp (YaadPay) only. No longer written since migration to PayPlus. Kept for historical records.';

-- ── 3. Update coupon system comment ──────────────────────────────────────────
COMMENT ON COLUMN public.coupons.stripe_phase2_coupon_id
  IS 'DEPRECATED — Stripe only. No longer used since migration to PayPlus. Kept for historical records.';

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_businesses_payplus_page_uid
  ON public.businesses (payplus_page_uid)
  WHERE payplus_page_uid IS NOT NULL;

-- =============================================================================
-- QA CHECKLIST
-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ businesses.payplus_page_uid  → stores page_request_uid from generateLink
-- ✅ businesses.payplus_txn_uid   → stores transaction_uid from IPN
-- ✅ businesses.hyp_card_token    → deprecated comment added, data preserved
-- ✅ businesses.hyp_transaction_id → deprecated comment added, data preserved
-- ✅ businesses.subscription_expires_at → unchanged (still used for access control)
-- ✅ businesses.trial_ends_at     → unchanged (still used for trial logic)
-- =============================================================================

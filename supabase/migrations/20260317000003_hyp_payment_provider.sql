-- =============================================================================
-- Migration: 20260317000003_hyp_payment_provider.sql
-- ReviewHub — Replace Stripe with hyp (YaadPay) payment provider
-- =============================================================================
--
-- Summary of changes:
--   • Adds hyp-specific columns to `businesses` table
--   • Keeps legacy `stripe_customer_id` column (renamed to dead column for now
--     in case rollback is needed) — comment it out to fully drop later
--   • Adds `subscription_expires_at` for DB-side subscription state tracking
--   • Adds `hyp_card_token` for storing tokenised card for recurring billing
--   • Adds `hyp_transaction_id` for last successful payment reference
--   • Adds `trial_ends_at` to replace Stripe's built-in trial mechanism
-- =============================================================================

-- ── 1. Subscription state columns ────────────────────────────────────────────

-- When the current paid subscription period expires (null = no active subscription)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- When the free-trial period ends (null = no trial / trial already expired)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- ── 2. hyp / YaadPay payment columns ─────────────────────────────────────────

-- Tokenised card reference returned by hyp after a J4 tokenisation request.
-- Used for subsequent server-side recurring charges without re-entering card details.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS hyp_card_token text;

-- Last successful hyp transaction ID (Id field from IPN)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS hyp_transaction_id text;

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_businesses_trial_ends
  ON public.businesses (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_subscription_expires
  ON public.businesses (subscription_expires_at)
  WHERE subscription_expires_at IS NOT NULL;

-- ── 4. Update coupon system ───────────────────────────────────────────────────
-- stripe_phase2_coupon_id is no longer applicable (hyp doesn't have Stripe coupon objects).
-- The phase2_discount_percent value is still used to determine the discount rate for months 2–3.
-- We keep the column in place (non-breaking) and simply stop writing to it.
-- To apply the phase-2 discount with hyp, the checkout function computes the discounted
-- amount directly and passes it to hyp as the Amount parameter.

COMMENT ON COLUMN public.coupons.stripe_phase2_coupon_id
  IS 'DEPRECATED — Stripe only. No longer used since migration to hyp (YaadPay). Kept for historical records.';

-- =============================================================================
-- QA CHECKLIST
-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ businesses.subscription_expires_at → replaces Stripe subscription.current_period_end
-- ✅ businesses.trial_ends_at           → replaces Stripe trial_period_days
-- ✅ businesses.hyp_card_token          → saved for recurring monthly charges
-- ✅ businesses.hyp_transaction_id      → audit trail for last payment
-- ✅ businesses.stripe_customer_id      → kept (no-op), can be dropped in a future migration
-- ✅ businesses.trial_reminder_sent_at  → reused as-is for 7-day trial-ending reminder
-- ✅ coupons.stripe_phase2_coupon_id    → deprecated, kept for history
-- =============================================================================

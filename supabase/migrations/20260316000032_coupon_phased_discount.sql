-- =============================================================================
-- Migration: 20260316000032_coupon_phased_discount.sql
-- Purpose  : Extend coupon system with 3-phase pricing
--
--   Phase 1 — Month 1:  100% free
--   Phase 2 — Months 2–3: 70% discount
--   Phase 3 — Month 4+: full regular price
--
--   Changes:
--   1. Add phase2 columns to `coupons`
--   2. Add `discounted_until` + `phase2_reminder_sent_at` to `coupon_redemptions`
--   3. UPDATE the 50 existing beta coupons to the new structure
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend coupons table
-- ─────────────────────────────────────────────────────────────────────────────

-- Discount % during phase 2 (NULL = jump straight to full price after phase 1)
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS phase2_discount_percent integer
    CHECK (phase2_discount_percent IS NULL OR phase2_discount_percent BETWEEN 1 AND 99);

-- How many months the phase 2 discount lasts
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS phase2_duration_months integer
    CHECK (phase2_duration_months IS NULL OR phase2_duration_months > 0);

-- Optional Stripe coupon ID to apply when creating a checkout session during phase 2
-- (create this coupon in the Stripe dashboard: 70% off, repeating for 2 months)
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS stripe_phase2_coupon_id text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Extend coupon_redemptions table
-- ─────────────────────────────────────────────────────────────────────────────

-- When phase 2 discount ends and full price begins (NULL = no phase 2)
ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS discounted_until timestamptz;

-- Stamped once the 30-day warning email for end-of-discount has been sent
ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS phase2_reminder_sent_at timestamptz;

-- Index to efficiently find upcoming phase 2 → full price transitions
CREATE INDEX IF NOT EXISTS idx_redemptions_discounted_until
  ON public.coupon_redemptions (discounted_until)
  WHERE phase2_reminder_sent_at IS NULL AND discounted_until IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update the 50 existing beta coupons
--    Old: 100% off for 3 months (flat)
--    New: 100% off for 1 month (phase 1) + 70% off for 2 months (phase 2)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.coupons
SET
  duration_months        = 1,
  phase2_discount_percent = 70,
  phase2_duration_months  = 2,
  description            = 'חודש חינם + 2 חודשים ב-70% הנחה - ReviewHub Beta'
WHERE code IN (
  'RH-1LSK-WBVN','RH-1RN0-Y0KR','RH-32QW-39YV','RH-333Z-BDS6','RH-46II-SZI1',
  'RH-4COG-ZSEJ','RH-4DEG-UJA5','RH-5B0N-Z307','RH-5IWQ-R8WX','RH-630Z-L5QJ',
  'RH-6B5Y-O8PD','RH-7VTI-QKI1','RH-8968-7XWV','RH-8J9H-J3YG','RH-8K2W-5412',
  'RH-95O3-67FE','RH-9FUZ-OGR4','RH-BPER-S1IX','RH-CXSL-1A5K','RH-D046-BC55',
  'RH-GDCS-AVLL','RH-GRFX-LKPZ','RH-GYCO-P47X','RH-GYEF-H090','RH-HXDW-S62W',
  'RH-I1J4-JVJU','RH-IBBK-RK9O','RH-JHQP-8CJI','RH-JZIU-C05U','RH-K03J-18ZO',
  'RH-L9ZD-3R5X','RH-MA8H-VQ8S','RH-NBD0-L58P','RH-NN1T-QGMX','RH-NNNJ-RFLG',
  'RH-O9QL-59L8','RH-OIXZ-OXTV','RH-OX4O-ER1X','RH-P7B9-NPZ0','RH-PZ3T-UF2Y',
  'RH-REIQ-NNI5','RH-T53G-OE0K','RH-UM83-6AKX','RH-UZGK-RJA1','RH-XHTK-SLZT',
  'RH-XU9U-DJY0','RH-XYP5-OSVR','RH-YLW5-OTQF','RH-Z483-X49L','RH-ZT22-RQXA'
);

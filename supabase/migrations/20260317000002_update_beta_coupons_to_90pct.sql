-- =============================================================================
-- Migration: 20260317000002_update_beta_coupons_to_90pct.sql
-- ReviewHub — Update all beta coupons: phase2_discount_percent 70 → 90
-- =============================================================================
--
-- Business decision: Phase 2 discount raised from 70% to 90% for all beta
-- coupon holders (months 2–3 after the free Stripe trial month).
--
-- Affected rows: up to 50 beta coupons with phase2_discount_percent = 70
-- Safe to re-run: UPDATE is idempotent (70 → 90, already-90 rows unaffected)
-- =============================================================================

-- ── 1. Update phase2_discount_percent on all beta coupons ────────────────────

UPDATE public.coupons
SET
  phase2_discount_percent = 90,
  updated_at              = NOW()
WHERE phase2_discount_percent = 70;

-- ── 2. Update human-readable description column (if it contains the old pct) ─

UPDATE public.coupons
SET
  description  = REPLACE(description, '70%', '90%'),
  updated_at   = NOW()
WHERE description ILIKE '%70%%'
  AND phase2_discount_percent = 90;  -- only already-updated rows

-- =============================================================================
-- QA CHECKLIST
-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ All coupons with phase2_discount_percent = 70 → set to 90
-- ✅ description strings updated where they referenced 70%
-- ✅ Coupons already at 90% are not double-touched
-- ✅ No change to: code, max_uses, used_count, duration_months, valid_until
-- ✅ No change to existing coupon_redemptions rows (historical records preserved)
-- ✅ Downstream: apply-coupon reads phase2_discount_percent live from DB
-- ✅ Downstream: send-billing-reminders fallback updated (?? 70 → ?? 90)
-- =============================================================================

-- =============================================================================
-- Migration: 20260315000004_coupon_system.sql
-- Purpose  : Full coupon / free-trial system
--
--   1. coupons              — coupon definitions (code, discount %, duration)
--   2. coupon_redemptions   — one row per user who redeems a coupon;
--                             tracks billing_starts_at + reminder_sent_at
--   3. 50 unique RH-XXXX-XXXX codes (100% off, 3 months each, single-use)
--   4. RLS policies
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. coupons
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text        NOT NULL UNIQUE,
  description      text,
  discount_percent integer     NOT NULL DEFAULT 100
                               CHECK (discount_percent BETWEEN 1 AND 100),
  duration_months  integer     NOT NULL DEFAULT 3
                               CHECK (duration_months > 0),
  max_uses         integer     NOT NULL DEFAULT 1,
  used_count       integer     NOT NULL DEFAULT 0
                               CHECK (used_count >= 0),
  is_active        boolean     NOT NULL DEFAULT true,
  -- optional global expiry (NULL = never expires)
  valid_until      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a coupon by code (needed for the redemption form)
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Only service_role / admins may insert/update/delete
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. coupon_redemptions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id          uuid        NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id        uuid        REFERENCES public.businesses(id) ON DELETE SET NULL,
  -- When free access ends and paid billing begins
  billing_starts_at  timestamptz NOT NULL,
  -- Stamped once the 30-day warning email has been sent
  reminder_sent_at   timestamptz,
  redeemed_at        timestamptz NOT NULL DEFAULT now(),
  -- Ensure one redemption per coupon per user
  UNIQUE (coupon_id, user_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own redemption(s)
CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins view all redemptions"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserts go through the apply-coupon edge function (service_role)
-- No direct INSERT policy for regular users

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Insert 50 unique coupon codes
--    Format: RH-XXXX-XXXX | 100% off | 3 months | single-use
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.coupons
  (code, description, discount_percent, duration_months, max_uses)
VALUES
  ('RH-1LSK-WBVN', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-1RN0-Y0KR', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-32QW-39YV', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-333Z-BDS6', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-46II-SZI1', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-4COG-ZSEJ', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-4DEG-UJA5', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-5B0N-Z307', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-5IWQ-R8WX', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-630Z-L5QJ', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-6B5Y-O8PD', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-7VTI-QKI1', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-8968-7XWV', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-8J9H-J3YG', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-8K2W-5412', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-95O3-67FE', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-9FUZ-OGR4', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-BPER-S1IX', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-CXSL-1A5K', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-D046-BC55', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-GDCS-AVLL', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-GRFX-LKPZ', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-GYCO-P47X', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-GYEF-H090', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-HXDW-S62W', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-I1J4-JVJU', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-IBBK-RK9O', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-JHQP-8CJI', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-JZIU-C05U', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-K03J-18ZO', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-L9ZD-3R5X', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-MA8H-VQ8S', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-NBD0-L58P', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-NN1T-QGMX', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-NNNJ-RFLG', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-O9QL-59L8', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-OIXZ-OXTV', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-OX4O-ER1X', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-P7B9-NPZ0', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-PZ3T-UF2Y', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-REIQ-NNI5', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-T53G-OE0K', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-UM83-6AKX', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-UZGK-RJA1', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-XHTK-SLZT', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-XU9U-DJY0', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-XYP5-OSVR', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-YLW5-OTQF', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-Z483-X49L', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1),
  ('RH-ZT22-RQXA', '3 חודשים חינם - ReviewHub Beta', 100, 3, 1)
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coupons_code       ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active  ON public.coupons (is_active);

CREATE INDEX IF NOT EXISTS idx_redemptions_user   ON public.coupon_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_billing ON public.coupon_redemptions (billing_starts_at)
  WHERE reminder_sent_at IS NULL;

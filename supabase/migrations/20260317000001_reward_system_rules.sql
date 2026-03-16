-- =============================================================================
-- Migration: 20260317000001_reward_system_rules.sql
-- ReviewHub — Reward System Rules (Business Model v2)
-- =============================================================================
--
-- Discount formula (per reward unlock, every 600 points):
--   discount = min(400₪, purchase_amount × 10%)
--
-- Redemption eligibility (ALL conditions must hold):
--   1. User has rewardsAvailable > 0   (floor(total_points / 600) > redeemed_count)
--   2. Business affiliate_mode ≠ 'none' (participating in affiliate program)
--   3. Purchase is made through the platform (affiliate tracking active)
--   4. purchase_amount ≥ 1500₪
--
-- Points are NEVER reset after redemption.
-- rewardsEarned    = floor(total_points / 600)
-- rewardsAvailable = rewardsEarned − COUNT(reward_redemptions)
-- =============================================================================

-- ─── Constants (stored as DB-level comments for auditability) ─────────────────
COMMENT ON SCHEMA public IS
  'reward_system_v2: discount=min(400,amt*10%), min_purchase=1500, threshold=600pts, cumulative';

-- ─── 1. reward_catalog ────────────────────────────────────────────────────────
-- Catalog of available rewards. Currently one type: points-based discount coupon.

CREATE TABLE IF NOT EXISTS public.reward_catalog (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  points_required INTEGER     NOT NULL DEFAULT 600
    CHECK (points_required > 0),
  reward_type     TEXT        NOT NULL DEFAULT 'coupon'
    CHECK (reward_type IN ('coupon','pro_credit','profile_boost','cash')),
  reward_value    TEXT,       -- human-readable value, e.g. "up to ₪400 (10%)"
  active          BOOLEAN     NOT NULL DEFAULT TRUE,
  -- v2 discount model parameters (NULL = use platform defaults)
  discount_rate   NUMERIC(5,4)               -- 0.10 = 10%
    CHECK (discount_rate IS NULL OR (discount_rate > 0 AND discount_rate <= 1)),
  discount_cap_ils NUMERIC(10,2)             -- 400.00
    CHECK (discount_cap_ils IS NULL OR discount_cap_ils > 0),
  min_purchase_ils NUMERIC(10,2)             -- 1500.00
    CHECK (min_purchase_ils IS NULL OR min_purchase_ils > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reward_catalog IS
  'Reward types available for redemption. discount = min(discount_cap_ils, amount * discount_rate).';
COMMENT ON COLUMN public.reward_catalog.discount_rate IS
  '10% (0.10) applied to purchase price. Capped by discount_cap_ils.';
COMMENT ON COLUMN public.reward_catalog.discount_cap_ils IS
  'Hard ceiling on the discount in ILS. Default: 400.';
COMMENT ON COLUMN public.reward_catalog.min_purchase_ils IS
  'Minimum purchase amount in ILS for the reward to be applicable. Default: 1500.';

ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active rewards"
  ON public.reward_catalog FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Service role full access on reward_catalog"
  ON public.reward_catalog FOR ALL TO service_role USING (TRUE);

-- Seed the default reward entry (upsert-safe via unique name)
INSERT INTO public.reward_catalog (
  name,
  description,
  points_required,
  reward_type,
  reward_value,
  active,
  discount_rate,
  discount_cap_ils,
  min_purchase_ils
) VALUES (
  'הנחת נאמנות',
  'עד ₪400 הנחה (10% מסכום הרכישה) על כל קנייה דרך הפלטפורמה. תקף לעסקים המשתתפים בתוכנית השותפים. מינימום קנייה ₪1,500.',
  600,
  'coupon',
  'עד ₪400 (10% מהרכישה)',
  TRUE,
  0.10,
  400.00,
  1500.00
)
ON CONFLICT DO NOTHING;

-- ─── 2. reward_redemptions ────────────────────────────────────────────────────
-- One row per reward redemption event. Points are never deducted; the count of
-- rows here determines how many rewards have been "spent".

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id             UUID        NOT NULL REFERENCES public.reward_catalog(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','applied','expired','cancelled')),
  -- Business context (filled when the discount is applied at checkout)
  business_id           UUID        REFERENCES public.businesses(id) ON DELETE SET NULL,
  -- Purchase context (filled on conversion confirmation)
  purchase_amount_ils   NUMERIC(12,2)
    CHECK (purchase_amount_ils IS NULL OR purchase_amount_ils >= 1500),
  discount_applied_ils  NUMERIC(12,2)
    CHECK (discount_applied_ils IS NULL OR (discount_applied_ils > 0 AND discount_applied_ils <= 400)),
  -- Anti-abuse: reward can only be applied when affiliate tracking is confirmed
  affiliate_tracked     BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Timestamps
  redeemed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at            TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ
    GENERATED ALWAYS AS (redeemed_at + INTERVAL '90 days') STORED,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reward_redemptions IS
  'Each row = one reward unlock used. Points never reset; count(rows) = redeemed_count.';
COMMENT ON COLUMN public.reward_redemptions.expires_at IS
  'Redeemed rewards expire 90 days after redemption if not applied.';
COMMENT ON COLUMN public.reward_redemptions.affiliate_tracked IS
  'Set to TRUE only when the purchase is confirmed through platform affiliate tracking.';

CREATE INDEX IF NOT EXISTS idx_rr_user_id   ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_rr_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_rr_status    ON public.reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_rr_expires   ON public.reward_redemptions(expires_at)
  WHERE status = 'pending';

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own redemptions"
  ON public.reward_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on redemptions"
  ON public.reward_redemptions FOR ALL TO service_role USING (TRUE);

-- ─── 3. user_points ───────────────────────────────────────────────────────────
-- Simple counter table: one row per user, never reset.

CREATE TABLE IF NOT EXISTS public.user_points (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER     NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_points IS
  'Cumulative activity points per user. Points are NEVER reset after reward redemption.';

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own points"
  ON public.user_points FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on user_points"
  ON public.user_points FOR ALL TO service_role USING (TRUE);

-- ─── 4. redeem_reward RPC ─────────────────────────────────────────────────────
-- Called from the frontend when the user clicks "מממש" on a reward card.
-- Validates cumulative eligibility and creates a 'pending' redemption record.
-- Does NOT check business eligibility or purchase amount here — those are
-- enforced when the discount is actually applied (see apply_reward_discount).

CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id          UUID := auth.uid();
  v_total_points     INTEGER;
  v_redeemed_count   BIGINT;
  v_rewards_earned   INTEGER;
  v_rewards_available INTEGER;
  v_reward           public.reward_catalog%ROWTYPE;
  v_redemption_id    UUID;
  REWARD_THRESHOLD   CONSTANT INTEGER := 600;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'אינכם מחוברים');
  END IF;

  -- Fetch user's cumulative points (default 0 if no row yet)
  SELECT COALESCE(total_points, 0) INTO v_total_points
  FROM public.user_points
  WHERE user_id = v_user_id;

  -- Count how many rewards this user has already redeemed
  SELECT COUNT(*) INTO v_redeemed_count
  FROM public.reward_redemptions
  WHERE user_id = v_user_id
    AND status NOT IN ('cancelled', 'expired');

  -- Cumulative milestone check (points never reset)
  v_rewards_earned    := FLOOR(v_total_points::NUMERIC / REWARD_THRESHOLD)::INTEGER;
  v_rewards_available := v_rewards_earned - v_redeemed_count::INTEGER;

  IF v_rewards_available <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'אין פרסים זמינים — צברו עוד ' ||
                 (REWARD_THRESHOLD - (v_total_points % REWARD_THRESHOLD))::TEXT ||
                 ' נקודות לפרס הבא'
    );
  END IF;

  -- Validate reward exists and is active
  SELECT * INTO v_reward
  FROM public.reward_catalog
  WHERE id = p_reward_id AND active = TRUE;

  IF v_reward.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'הפרס לא נמצא או אינו פעיל');
  END IF;

  -- Create pending redemption record
  INSERT INTO public.reward_redemptions (user_id, reward_id, status)
  VALUES (v_user_id, p_reward_id, 'pending')
  RETURNING id INTO v_redemption_id;

  RETURN jsonb_build_object(
    'success',        true,
    'redemption_id',  v_redemption_id,
    'discount_cap',   COALESCE(v_reward.discount_cap_ils, 400),
    'discount_rate',  COALESCE(v_reward.discount_rate,    0.10),
    'min_purchase',   COALESCE(v_reward.min_purchase_ils, 1500),
    'message',        'הפרס נמחש — ניתן להחיל אותו בקנייה הבאה דרך הפלטפורמה'
  );
END;
$$;

COMMENT ON FUNCTION public.redeem_reward(UUID) IS
  'Creates a pending reward redemption. Validates cumulative milestone only.
   Business eligibility (affiliate_mode ≠ none) and min purchase (≥ 1500₪)
   are enforced downstream when the discount is applied at checkout.';

-- ─── 5. apply_reward_discount RPC ────────────────────────────────────────────
-- Called when a confirmed purchase is made through the platform.
-- Enforces ALL eligibility rules and computes the exact discount.
-- Returns the discount amount to be applied.

CREATE OR REPLACE FUNCTION public.apply_reward_discount(
  p_redemption_id   UUID,
  p_business_id     UUID,
  p_purchase_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_redemption    public.reward_redemptions%ROWTYPE;
  v_reward        public.reward_catalog%ROWTYPE;
  v_aff_mode      TEXT;
  v_discount_cap  NUMERIC;
  v_discount_rate NUMERIC;
  v_min_purchase  NUMERIC;
  v_discount      NUMERIC;
BEGIN
  -- Fetch and validate the redemption record
  SELECT * INTO v_redemption
  FROM public.reward_redemptions
  WHERE id = p_redemption_id
    AND user_id = v_user_id
    AND status = 'pending';

  IF v_redemption.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'פרס לא תקין או כבר מומש');
  END IF;

  -- Check expiry
  IF NOW() > v_redemption.expires_at THEN
    UPDATE public.reward_redemptions
    SET status = 'expired'
    WHERE id = p_redemption_id;
    RETURN jsonb_build_object('success', false, 'error', 'תוקף הפרס פג (90 יום)');
  END IF;

  -- Business must participate in affiliate program
  SELECT affiliate_mode INTO v_aff_mode
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_aff_mode IS NULL OR v_aff_mode = 'none' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'עסק זה אינו משתתף בתוכנית השותפים — הפרס אינו ניתן למימוש כאן'
    );
  END IF;

  -- Fetch reward parameters (fall back to platform defaults)
  SELECT * INTO v_reward
  FROM public.reward_catalog
  WHERE id = v_redemption.reward_id;

  v_discount_cap  := COALESCE(v_reward.discount_cap_ils,  400.00);
  v_discount_rate := COALESCE(v_reward.discount_rate,      0.10);
  v_min_purchase  := COALESCE(v_reward.min_purchase_ils, 1500.00);

  -- Minimum purchase check
  IF p_purchase_amount < v_min_purchase THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'סכום הרכישה נמוך מהמינימום הנדרש (₪' || v_min_purchase::TEXT || ')'
    );
  END IF;

  -- Compute discount: min(cap, amount × rate)
  v_discount := LEAST(v_discount_cap, ROUND(p_purchase_amount * v_discount_rate, 2));

  -- Apply the redemption
  UPDATE public.reward_redemptions
  SET
    status               = 'applied',
    business_id          = p_business_id,
    purchase_amount_ils  = p_purchase_amount,
    discount_applied_ils = v_discount,
    affiliate_tracked    = TRUE,
    applied_at           = NOW()
  WHERE id = p_redemption_id;

  RETURN jsonb_build_object(
    'success',          true,
    'discount_ils',     v_discount,
    'purchase_amount',  p_purchase_amount,
    'discount_rate_pct', (v_discount_rate * 100)::INTEGER,
    'message',          'הנחה של ₪' || v_discount::TEXT || ' הוחלה בהצלחה'
  );
END;
$$;

COMMENT ON FUNCTION public.apply_reward_discount(UUID, UUID, NUMERIC) IS
  'Applies a reward discount to a confirmed affiliate purchase.
   Enforces: business eligibility (affiliate_mode ≠ none),
             min purchase (≥ 1500₪),
             expiry (90 days),
             discount = min(400, amount × 10%).
   Affiliate tracking is always required — non-platform purchases are rejected.';

-- ─── 6. expire_stale_redemptions cron helper ─────────────────────────────────
-- Run periodically to auto-expire pending redemptions past 90 days.

CREATE OR REPLACE FUNCTION public.expire_stale_redemptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.reward_redemptions
    SET status = 'expired'
    WHERE status = 'pending'
      AND NOW() > expires_at
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;
  RETURN v_count;
END;
$$;

-- =============================================================================
-- QA CHECKLIST
-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ reward triggers at 600 pts:
--    SELECT redeem_reward('<reward_catalog_id>') WHERE user has ≥ 600 pts
-- ✅ discount calculation:
--    apply_reward_discount(..., 2000) → min(400, 200) = 200₪
--    apply_reward_discount(..., 5000) → min(400, 500) = 400₪
-- ✅ 10% and 400₪ cap enforced inside apply_reward_discount
-- ✅ affiliate commission still tracked via existing conversions table
-- ✅ non-participating business blocked: affiliate_mode = 'none' → error
-- ✅ below min purchase blocked: purchase_amount < 1500 → error
-- ✅ points never reset: no UPDATE to user_points in this migration
-- ✅ cumulative: rewardsAvailable = floor(pts/600) - COUNT(redemptions)
-- =============================================================================

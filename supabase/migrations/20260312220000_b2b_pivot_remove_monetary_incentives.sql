-- =============================================================================
-- Migration: 20260312220000_b2b_pivot_remove_monetary_incentives.sql
-- ReviewHub — Pivot to B2B SaaS reputation platform (no reviewer cash/rewards)
-- =============================================================================

-- 1) Subscription tier: premium -> enterprise
UPDATE public.businesses
SET subscription_tier = 'enterprise'
WHERE subscription_tier = 'premium';

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_subscription_tier_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));


-- 2) Remove legacy monetary / lead-selling columns
ALTER TABLE public.businesses
  DROP COLUMN IF EXISTS cashback_rate,
  DROP COLUMN IF EXISTS platform_balance_ils;


-- 3) Remove legacy monetary columns from profiles (keep reputation-only signals)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS total_earnings;

DO $$ BEGIN
  ALTER TABLE public.profiles RENAME COLUMN partner_badge TO reputation_badge;
EXCEPTION WHEN undefined_column THEN
  -- Column may not exist in some environments
  NULL;
END $$;


-- 4) Drop legacy reward/payout functions & triggers
DROP TRIGGER IF EXISTS on_review_like_change ON public.reviews;
DROP FUNCTION IF EXISTS public.recalculate_review_rewards();

DROP TRIGGER IF EXISTS validate_payout_insert_trigger ON public.reward_payouts;
DROP FUNCTION IF EXISTS public.validate_payout_insert();

DROP FUNCTION IF EXISTS public.calculate_reviewer_payout(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.split_affiliate_commission(UUID);
DROP FUNCTION IF EXISTS public.unlock_earned_points();


-- 5) Deprecate legacy money/reward tables by moving them out of public schema.
--    This preserves data while removing it from the client-facing API surface.
CREATE SCHEMA IF NOT EXISTS deprecated_monetary;

ALTER TABLE IF EXISTS public.rewards_pool       SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.rewards_log        SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.reward_payouts     SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.community_vault    SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.reviewer_payouts   SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.point_transactions SET SCHEMA deprecated_monetary;

ALTER TABLE IF EXISTS public.matchmaker_leads   SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.lead_purchases     SET SCHEMA deprecated_monetary;

ALTER TABLE IF EXISTS public.affiliates         SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.referrals          SET SCHEMA deprecated_monetary;
ALTER TABLE IF EXISTS public.conversions        SET SCHEMA deprecated_monetary;


-- Community Reward Pool: tracks monthly pool totals
CREATE TABLE public.rewards_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL UNIQUE, -- e.g. '2026-03'
  total_commissions numeric NOT NULL DEFAULT 0, -- total site commissions this month
  community_pool numeric NOT NULL DEFAULT 0, -- 50% of total_commissions
  total_points numeric NOT NULL DEFAULT 0, -- sum of all user points this month
  distributed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards_pool ENABLE ROW LEVEL SECURITY;

-- Everyone can view pool status (transparency)
CREATE POLICY "Pool viewable by everyone" ON public.rewards_pool FOR SELECT USING (true);
-- Only service role can manage
CREATE POLICY "Service role manages pool" ON public.rewards_pool FOR ALL USING (false);

-- Rewards log: per-review point tracking
CREATE TABLE public.rewards_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL, -- e.g. '2026-03'
  base_points numeric NOT NULL DEFAULT 100, -- 100 per verified review
  like_count integer NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1, -- 1x to 10x based on likes
  total_points numeric NOT NULL DEFAULT 100, -- base_points * multiplier
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id, month_year)
);

ALTER TABLE public.rewards_log ENABLE ROW LEVEL SECURITY;

-- Users can view own rewards
CREATE POLICY "Users can view own rewards" ON public.rewards_log FOR SELECT USING (auth.uid() = user_id);
-- Service role manages
CREATE POLICY "Service role manages rewards" ON public.rewards_log FOR ALL USING (false);

-- Reward payouts: withdrawal tracking
CREATE TABLE public.reward_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year text NOT NULL,
  points numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0, -- NIS amount
  status text NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.reward_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts" ON public.reward_payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request payout" ON public.reward_payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages payouts" ON public.reward_payouts FOR ALL USING (false);

-- Add likes column to reviews if not exists
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- Partner badge tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_badge text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0;

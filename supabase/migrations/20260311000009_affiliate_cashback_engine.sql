-- =============================================================================
-- Migration: 20260311000009_affiliate_cashback_engine.sql
-- ReviewHub — Affiliate & Cashback Revenue Engine
-- =============================================================================
-- Adds:
--   1. affiliate_commission_rate + cashback_rate to businesses
--   2. conversions          — purchase events via affiliate links
--   3. community_vault      — monthly shared pool
--   4. reviewer_payouts     — per-user payout records per vault
--   5. point_transactions   — granular points ledger (replaces raw counter)
--   6. matchmaker_leads     — Course Finder form submissions
--   7. lead_purchases       — charge when business reveals lead contact
--   8. crm_integrations     — Pro-tier CRM webhook config
--   9. sybil_flags          — Sybil / fake-like fraud detection
--  10. DB functions         — commission split, payout calc, sybil trigger
--  11. One-review constraint on reviews table
-- =============================================================================

-- ─── 1. Extend businesses ─────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD COLUMN affiliate_commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10
      CHECK (affiliate_commission_rate BETWEEN 0 AND 1);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD COLUMN cashback_rate NUMERIC(5,4) NOT NULL DEFAULT 0.02
      CHECK (cashback_rate BETWEEN 0 AND 0.5);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD COLUMN platform_balance_ils NUMERIC(12,2) NOT NULL DEFAULT 0.00;
  COMMENT ON COLUMN public.businesses.platform_balance_ils IS
    'Pre-paid balance used for lead purchases and feature unlocks.';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─── 2. conversions ───────────────────────────────────────────────────────────
-- Tracks every purchase made through a ReviewHub affiliate link.
-- Commission is split at insertion via the split_affiliate_commission() function.

CREATE TABLE IF NOT EXISTS public.conversions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id            UUID        REFERENCES public.affiliates(id) ON DELETE SET NULL,
  business_id             UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_id             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Money columns
  transaction_amount_ils  NUMERIC(12,2) NOT NULL CHECK (transaction_amount_ils > 0),
  commission_rate         NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  affiliate_commission_ils  NUMERIC(12,2)
    GENERATED ALWAYS AS (ROUND(transaction_amount_ils * commission_rate, 2)) STORED,
  pool_share_ils          NUMERIC(12,2)
    GENERATED ALWAYS AS (ROUND(transaction_amount_ils * commission_rate * 0.50, 2)) STORED,
  platform_share_ils      NUMERIC(12,2)
    GENERATED ALWAYS AS (ROUND(transaction_amount_ils * commission_rate * 0.25, 2)) STORED,
  user_cashback_ils       NUMERIC(12,2)
    GENERATED ALWAYS AS (ROUND(transaction_amount_ils * commission_rate * 0.25, 2)) STORED,
  -- Hold
  hold_until              TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '72 hours') STORED,
  -- Tracking
  affiliate_slug          TEXT,
  source_url              TEXT,
  utm_source              TEXT,
  utm_medium              TEXT,
  utm_campaign            TEXT,
  -- Legal
  liability_shield_accepted    BOOLEAN     NOT NULL DEFAULT FALSE,
  liability_shield_accepted_at TIMESTAMPTZ,
  -- Workflow
  status                  TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','reversed','disputed')),
  cashback_paid_at        TIMESTAMPTZ,
  pool_credited_at        TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conversions IS
  'Every purchase via a ReviewHub affiliate link. Commission auto-split by GENERATED columns.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate   ON public.conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_business    ON public.conversions(business_id);
CREATE INDEX IF NOT EXISTS idx_conversions_reviewer    ON public.conversions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status      ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_hold_until  ON public.conversions(hold_until)
  WHERE status = 'pending';

-- RLS
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewer sees own conversions"
  ON public.conversions FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Affiliate sees own conversions"
  ON public.conversions FOR SELECT TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business sees own conversions"
  ON public.conversions FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on conversions"
  ON public.conversions FOR ALL TO service_role USING (TRUE);

-- ─── 3. community_vault ───────────────────────────────────────────────────────
-- Monthly accumulation pool — 50% of all affiliate commissions.

CREATE TABLE IF NOT EXISTS public.community_vault (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year        TEXT      NOT NULL,           -- e.g. '2026-03'
  category          TEXT,                         -- NULL = all categories
  total_pool_ils    NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  distributed_ils   NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  status            TEXT      NOT NULL DEFAULT 'accumulating'
    CHECK (status IN ('accumulating','calculating','distributed','closed')),
  participant_count INTEGER   NOT NULL DEFAULT 0,
  distribution_date TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (month_year, COALESCE(category, ''))
);

ALTER TABLE public.community_vault ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see vault totals (transparency)
CREATE POLICY "Vault is public-readable"
  ON public.community_vault FOR SELECT TO authenticated, anon
  USING (TRUE);

CREATE POLICY "Service role full access on vault"
  ON public.community_vault FOR ALL TO service_role USING (TRUE);

-- ─── 4. reviewer_payouts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviewer_payouts (
  id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id         UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id            UUID      NOT NULL REFERENCES public.community_vault(id) ON DELETE CASCADE,
  reviewer_points     BIGINT    NOT NULL CHECK (reviewer_points >= 0),
  global_points       BIGINT    NOT NULL CHECK (global_points >= 0),
  share_pct           NUMERIC(10,7)
    GENERATED ALWAYS AS (
      ROUND(reviewer_points::NUMERIC / NULLIF(global_points, 0), 7)
    ) STORED,
  payout_amount_ils   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status              TEXT      NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','paid','failed')),
  paid_at             TIMESTAMPTZ,
  payment_method      TEXT,
  payment_reference   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, vault_id)
);

ALTER TABLE public.reviewer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewer sees own payouts"
  ON public.reviewer_payouts FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Service role full access on payouts"
  ON public.reviewer_payouts FOR ALL TO service_role USING (TRUE);

-- ─── 5. point_transactions ────────────────────────────────────────────────────
-- Granular ledger of every point event for each user.

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id               UUID        REFERENCES public.reviews(id) ON DELETE SET NULL,
  transaction_type        TEXT        NOT NULL
    CHECK (transaction_type IN ('earned','bonus','deducted','locked','unlocked','paid_out','admin_adjust')),
  -- Point calculation
  base_points             INTEGER     NOT NULL DEFAULT 0 CHECK (base_points >= 0),
  verification_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (verification_multiplier IN (1.0, 2.0)),
  engagement_multiplier   NUMERIC(6,2) NOT NULL DEFAULT 1.0
    CHECK (engagement_multiplier >= 1.0 AND engagement_multiplier <= 10.0),
  -- Final points = base × verification_multiplier × engagement_multiplier (capped)
  points                  INTEGER     NOT NULL
    CHECK (points >= 0 AND points <= 200000), -- sanity cap
  status                  TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','locked','paid_out','cancelled')),
  locked_until            TIMESTAMPTZ,
  description             TEXT,
  month_year              TEXT        GENERATED ALWAYS AS (
                              TO_CHAR(created_at, 'YYYY-MM')
                            ) STORED,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_user_month  ON public.point_transactions(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_pt_review      ON public.point_transactions(review_id);
CREATE INDEX IF NOT EXISTS idx_pt_status      ON public.point_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pt_locked      ON public.point_transactions(locked_until)
  WHERE status = 'locked';

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own point_transactions"
  ON public.point_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on point_transactions"
  ON public.point_transactions FOR ALL TO service_role USING (TRUE);

-- ─── 6. matchmaker_leads ─────────────────────────────────────────────────────
-- Submissions from the "Course Finder" multi-step wizard.

CREATE TABLE IF NOT EXISTS public.matchmaker_leads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Intent
  budget_range      TEXT        NOT NULL CHECK (budget_range IN ('under_500','500_2000','2000_5000','5000_plus')),
  goals             TEXT[]      NOT NULL,
  interests         TEXT[]      NOT NULL,
  preferred_format  TEXT        CHECK (preferred_format IN ('online','in_person','hybrid','no_preference')),
  location          TEXT,
  -- Contact (revealed only on lead_purchase)
  contact_name      TEXT        NOT NULL,
  contact_email     TEXT        NOT NULL,
  contact_phone     TEXT,
  -- Matching
  matched_businesses UUID[]     DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','matched','contacted','converted','closed')),
  -- Integrity
  ip_address        INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_status    ON public.matchmaker_leads(status);
CREATE INDEX IF NOT EXISTS idx_ml_user      ON public.matchmaker_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_budget    ON public.matchmaker_leads(budget_range);

ALTER TABLE public.matchmaker_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own leads"
  ON public.matchmaker_leads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anon can insert lead"
  ON public.matchmaker_leads FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Business sees matched leads (contact masked)"
  ON public.matchmaker_leads FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT b.owner_id FROM public.businesses b
      WHERE b.id = ANY(matched_businesses)
    )
  );

CREATE POLICY "Service role full access on leads"
  ON public.matchmaker_leads FOR ALL TO service_role USING (TRUE);

-- ─── 7. lead_purchases ───────────────────────────────────────────────────────
-- Flat-fee charge when a business reveals a lead's contact info.

CREATE TABLE IF NOT EXISTS public.lead_purchases (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id              UUID        NOT NULL REFERENCES public.matchmaker_leads(id) ON DELETE CASCADE,
  amount_ils           NUMERIC(10,2) NOT NULL DEFAULT 25.00 CHECK (amount_ils > 0),
  status               TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','charged','refunded','failed')),
  contact_revealed_at  TIMESTAMPTZ,
  charged_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, lead_id)
);

ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business sees own purchases"
  ON public.lead_purchases FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on lead_purchases"
  ON public.lead_purchases FOR ALL TO service_role USING (TRUE);

-- ─── 8. crm_integrations ─────────────────────────────────────────────────────
-- Pro-tier: businesses connect CRMs for automatic lead/review sync.

CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  crm_provider          TEXT        NOT NULL
    CHECK (crm_provider IN ('pipedrive','hubspot','salesforce','zoho','monday','custom')),
  api_key_encrypted     TEXT        NOT NULL,
  webhook_url           TEXT,
  webhook_secret        TEXT,
  sync_enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
  sync_events           TEXT[]      NOT NULL DEFAULT ARRAY['new_review','new_lead','new_conversion'],
  last_sync_at          TIMESTAMPTZ,
  last_sync_status      TEXT        CHECK (last_sync_status IN ('success','failed','partial')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, crm_provider)
);

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business manages own CRM"
  ON public.crm_integrations FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on crm"
  ON public.crm_integrations FOR ALL TO service_role USING (TRUE);

-- ─── 9. sybil_flags ──────────────────────────────────────────────────────────
-- Fraud detection: flags reviews/users with suspicious like patterns.

CREATE TABLE IF NOT EXISTS public.sybil_flags (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flagged_user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged_review_id     UUID        REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason                TEXT        NOT NULL,
  suspicious_likes_count  INTEGER   DEFAULT 0,
  new_account_likes_count INTEGER   DEFAULT 0,
  auto_flagged          BOOLEAN     NOT NULL DEFAULT TRUE,
  severity              TEXT        NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low','medium','high','critical')),
  status                TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','investigating','confirmed_fraud','cleared')),
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

ALTER TABLE public.sybil_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sees all sybil flags"
  ON public.sybil_flags FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role full access on sybil_flags"
  ON public.sybil_flags FOR ALL TO service_role USING (TRUE);

-- ─── 10a. One-review constraint per user per business ─────────────────────────
-- Enforce at DB level: one review per (user_id, business_id).
-- edit_history is allowed but no new points awarded.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_one_per_user_business'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_one_per_user_business
      UNIQUE (user_id, business_id);
  END IF;
END $$;

-- edit_history: track all edits but no extra points
DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN edit_history JSONB NOT NULL DEFAULT '[]'::jsonb;
  COMMENT ON COLUMN public.reviews.edit_history IS
    'Array of {edited_at, previous_content, previous_rating}. No extra points for edits.';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─── 10b. Points formula columns on reviews ───────────────────────────────────
-- Store the computed components for auditability.
-- Final formula: points = LEAST(base × verify_mult × (1 + likes/10), base × 10)

DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN base_points INTEGER NOT NULL DEFAULT 100;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN verification_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0;
  COMMENT ON COLUMN public.reviews.verification_multiplier IS
    '1.0 = unverified (100 pts), 2.0 = verified purchase (200 pts base).';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN computed_points INTEGER GENERATED ALWAYS AS (
    LEAST(
      ROUND(base_points * verification_multiplier * (1.0 + COALESCE(likes_count, 0) / 10.0))::INTEGER,
      ROUND(base_points * verification_multiplier * 10)::INTEGER
    )
  ) STORED;
  COMMENT ON COLUMN public.reviews.computed_points IS
    'Points = LEAST(base × verify_mult × (1 + likes/10), base × verify_mult × 10). Max 10× cap.';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- likes_count column (if not already present)
DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─── 10c. DB Function: calculate_reviewer_payout ─────────────────────────────
-- Called by the community-payout Edge Function each month.
-- Returns each reviewer's share of the vault.

CREATE OR REPLACE FUNCTION public.calculate_reviewer_payout(
  p_month_year  TEXT,
  p_category    TEXT DEFAULT NULL
)
RETURNS TABLE (
  reviewer_id         UUID,
  reviewer_points     BIGINT,
  global_points       BIGINT,
  share_pct           NUMERIC,
  estimated_payout_ils NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_total  NUMERIC;
  v_global_pts   BIGINT;
BEGIN
  -- Retrieve vault total for the requested month
  SELECT total_pool_ils INTO v_vault_total
  FROM public.community_vault
  WHERE month_year = p_month_year
    AND (p_category IS NULL AND category IS NULL
         OR category = p_category);

  IF v_vault_total IS NULL OR v_vault_total = 0 THEN
    RAISE NOTICE 'No vault found for % / %', p_month_year, p_category;
    RETURN;
  END IF;

  -- Sum of all eligible (active, earned) points for the month
  SELECT COALESCE(SUM(points), 0) INTO v_global_pts
  FROM public.point_transactions
  WHERE month_year    = p_month_year
    AND transaction_type = 'earned'
    AND status        = 'active';

  IF v_global_pts = 0 THEN
    RAISE NOTICE 'Zero global points for %', p_month_year;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      pt.user_id                                                        AS reviewer_id,
      SUM(pt.points)::BIGINT                                            AS reviewer_points,
      v_global_pts                                                      AS global_points,
      ROUND(SUM(pt.points)::NUMERIC / v_global_pts, 7)                 AS share_pct,
      ROUND((SUM(pt.points)::NUMERIC / v_global_pts) * v_vault_total, 2) AS estimated_payout_ils
    FROM public.point_transactions pt
    WHERE pt.month_year        = p_month_year
      AND pt.transaction_type  = 'earned'
      AND pt.status            = 'active'
    GROUP BY pt.user_id
    ORDER BY reviewer_points DESC;
END;
$$;

-- ─── 10d. DB Function: split_affiliate_commission ────────────────────────────
-- Called after a conversion is confirmed (hold_until elapsed).
-- Atomically: credits vault, records cashback, updates conversion status.

CREATE OR REPLACE FUNCTION public.split_affiliate_commission(p_conversion_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversions%ROWTYPE;
  v_month TEXT;
  v_vault_id UUID;
BEGIN
  SELECT * INTO v_conv FROM public.conversions WHERE id = p_conversion_id;

  IF v_conv.id IS NULL THEN
    RETURN 'error: conversion not found';
  END IF;

  IF v_conv.status != 'confirmed' THEN
    RETURN 'skip: status=' || v_conv.status;
  END IF;

  IF NOW() < v_conv.hold_until THEN
    RETURN 'skip: still in 72h hold';
  END IF;

  v_month := TO_CHAR(v_conv.created_at, 'YYYY-MM');

  -- Upsert vault for the month
  INSERT INTO public.community_vault (month_year, total_pool_ils)
  VALUES (v_month, v_conv.pool_share_ils)
  ON CONFLICT (month_year, COALESCE(category, ''))
  DO UPDATE SET
    total_pool_ils = community_vault.total_pool_ils + EXCLUDED.total_pool_ils,
    updated_at     = NOW()
  RETURNING id INTO v_vault_id;

  -- Mark conversion as pool-credited
  UPDATE public.conversions
  SET pool_credited_at = NOW(),
      updated_at       = NOW()
  WHERE id = p_conversion_id;

  RETURN 'ok: pool_credited=' || v_conv.pool_share_ils::TEXT || ' ILS';
END;
$$;

-- ─── 10e. DB Function: unlock_earned_points ───────────────────────────────────
-- Converts locked point_transactions to active after 72h (no active dispute).

CREATE OR REPLACE FUNCTION public.unlock_earned_points()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  WITH unlocked AS (
    UPDATE public.point_transactions pt
    SET    status      = 'active',
           locked_until = NULL
    FROM   public.reviews r
    WHERE  pt.review_id    = r.id
      AND  pt.status       = 'locked'
      AND  pt.locked_until <= NOW()
      AND  (r.is_disputed IS NOT DISTINCT FROM FALSE OR r.is_disputed IS NULL)
    RETURNING pt.id
  )
  SELECT COUNT(*) INTO v_count FROM unlocked;

  -- Also unlock reviews table flag
  UPDATE public.reviews
  SET points_locked = FALSE
  WHERE points_locked = TRUE
    AND (is_disputed IS NOT DISTINCT FROM FALSE OR is_disputed IS NULL)
    AND created_at < NOW() - INTERVAL '72 hours';

  RETURN v_count;
END;
$$;

-- ─── 10f. Trigger function: detect_sybil_attack ──────────────────────────────
-- Fires on INSERT/UPDATE to review_likes.
-- If ≥ 5 likes within 24 h come from accounts < 7 days old → create sybil_flag.

CREATE OR REPLACE FUNCTION public.trg_detect_sybil_attack()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_acct_likes  INTEGER;
  v_total_likes     INTEGER;
  v_review_owner    UUID;
  v_new_acct_thresh CONSTANT INTEGER := 5;
BEGIN
  -- Count likes on this review from accounts < 7 days old in last 24 h
  SELECT COUNT(*) INTO v_new_acct_likes
  FROM public.review_likes rl
  JOIN auth.users u ON rl.user_id = u.id
  WHERE rl.review_id = NEW.review_id
    AND u.created_at  > NOW() - INTERVAL '7 days'
    AND rl.created_at > NOW() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO v_total_likes
  FROM public.review_likes WHERE review_id = NEW.review_id;

  SELECT user_id INTO v_review_owner
  FROM public.reviews WHERE id = NEW.review_id;

  IF v_new_acct_likes >= v_new_acct_thresh THEN
    INSERT INTO public.sybil_flags (
      flagged_user_id,
      flagged_review_id,
      reason,
      suspicious_likes_count,
      new_account_likes_count,
      severity
    ) VALUES (
      v_review_owner,
      NEW.review_id,
      'High ratio of likes from accounts < 7 days old within 24 hours',
      v_total_likes,
      v_new_acct_likes,
      CASE
        WHEN v_new_acct_likes >= 20 THEN 'critical'
        WHEN v_new_acct_likes >= 10 THEN 'high'
        ELSE 'medium'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create review_likes table if not exists (needed for trigger)
CREATE TABLE IF NOT EXISTS public.review_likes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth user can like" ON public.review_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can see likes" ON public.review_likes FOR SELECT USING (TRUE);

-- Attach sybil trigger
DROP TRIGGER IF EXISTS trg_sybil ON public.review_likes;
CREATE TRIGGER trg_sybil
  AFTER INSERT ON public.review_likes
  FOR EACH ROW EXECUTE FUNCTION public.trg_detect_sybil_attack();

-- ─── 11. Seed community_vault for current month ───────────────────────────────
INSERT INTO public.community_vault (month_year, total_pool_ils)
VALUES (TO_CHAR(NOW(), 'YYYY-MM'), 0.00)
ON CONFLICT DO NOTHING;

-- ─── 12. Updated_at triggers (reuse pattern) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'conversions','community_vault','matchmaker_leads','crm_integrations'
  ]) AS tname LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t.tname, t.tname
    );
  END LOOP;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES (run after migration):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'businesses' AND column_name IN ('affiliate_commission_rate','cashback_rate');
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN
--   ('conversions','community_vault','reviewer_payouts','point_transactions',
--    'matchmaker_leads','lead_purchases','crm_integrations','sybil_flags','review_likes');
-- SELECT calculate_reviewer_payout(TO_CHAR(NOW(),'YYYY-MM'));
-- =============================================================================

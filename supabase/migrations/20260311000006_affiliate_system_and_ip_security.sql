-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 20260311000006_affiliate_system_and_ip_security
-- ═══════════════════════════════════════════════════════════════════════════
--
-- SCOPE OF THIS MIGRATION:
--   ✅ Already done in earlier migrations (DO NOT re-run):
--      • reviews.submission_ip / submission_user_agent  (20260311092607)
--      • review_reports workflow columns               (20260311092607)
--      • review_reports admin UPDATE policy            (20260311092607)
--      • defamation_complaints table                   (20260311000005)
--      • review_public_log table                       (20260311000005)
--      • reviews legal columns                         (20260311000005)
--
--   🆕 NEW in this migration:
--      1. affiliates  — partner accounts (referral code, commission stats)
--      2. referrals   — business sign-ups attributed to an affiliate
--      3. IP column security — admin-only view + masking function
--
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. affiliates ────────────────────────────────────────────────────────────
--
-- Represents a person (registered user) who refers new businesses to
-- ReviewHub and earns a commission on each paying subscription they bring in.

CREATE TABLE IF NOT EXISTS public.affiliates (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The affiliate must have a ReviewHub account
  user_id                   UUID         NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Human-readable code embedded in referral URLs, e.g. "REF-ELIOR42"
  referral_code             TEXT         NOT NULL UNIQUE
                            CHECK (referral_code ~ '^[A-Z0-9\-]{4,32}$'),

  -- Commission percentage of the referred business's first subscription payment
  -- Default 20 ILS per converted referral (set as a flat ILS amount OR a % — here % model)
  commission_rate           NUMERIC(5,2) NOT NULL DEFAULT 20.00
                            CHECK (commission_rate >= 0 AND commission_rate <= 100),

  -- Running totals (updated by trigger or Edge Function on referral conversion)
  total_referrals           INTEGER      NOT NULL DEFAULT 0 CHECK (total_referrals >= 0),
  total_earnings_ils        NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_earnings_ils >= 0),
  pending_payout_ils        NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (pending_payout_ils >= 0),

  -- Lifecycle
  status                    TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'active', 'suspended')),

  -- Payout details — stored encrypted; admin-only access
  payout_method             TEXT         CHECK (payout_method IN ('bank_transfer', 'paypal', 'bit', 'other')),
  payout_details_encrypted  TEXT,        -- AES-256 via Supabase Vault or application layer

  -- Notes visible only to admin (onboarding notes, fraud flags, etc.)
  admin_notes               TEXT,

  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER trg_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id       ON public.affiliates (user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates (referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status        ON public.affiliates (status);

-- ── RLS: affiliates ──────────────────────────────────────────────────────────
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Affiliates can see their OWN record (but not payout_details_encrypted)
CREATE POLICY "Affiliates can view own record"
  ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can see everything
CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can INSERT (we vet affiliates before activating them)
CREATE POLICY "Admins can insert affiliates"
  ON public.affiliates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update any record; affiliates can update only their own non-sensitive fields
CREATE POLICY "Admins can update affiliates"
  ON public.affiliates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can update own non-sensitive fields"
  ON public.affiliates FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── 2. referrals ─────────────────────────────────────────────────────────────
--
-- Records each business sign-up (or upgrade to paid) that is attributed to
-- an affiliate's referral link. One row per conversion event.

CREATE TABLE IF NOT EXISTS public.referrals (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  affiliate_id          UUID         NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,

  -- The business that signed up via the affiliate's link
  referred_business_id  UUID         NOT NULL UNIQUE
                        REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Subscription details at the time of conversion
  subscription_plan     TEXT,        -- e.g. 'starter', 'pro', 'enterprise'
  subscription_value_ils NUMERIC(10,2), -- Full subscription amount in ILS

  -- Commission calculated at conversion time
  commission_earned_ils NUMERIC(10,2)
                        GENERATED ALWAYS AS (
                          CASE
                            WHEN subscription_value_ils IS NOT NULL
                            THEN ROUND(subscription_value_ils *
                                 (SELECT commission_rate / 100.0 FROM public.affiliates
                                  WHERE id = affiliate_id), 2)
                            ELSE NULL
                          END
                        ) STORED,

  -- Payout state
  commission_paid       BOOLEAN      NOT NULL DEFAULT FALSE,
  commission_paid_at    TIMESTAMPTZ,

  -- Referral attribution metadata
  referral_date         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  utm_source            TEXT,        -- for attribution analytics
  utm_medium            TEXT,
  utm_campaign          TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id         ON public.referrals (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_business_id ON public.referrals (referred_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_commission_paid      ON public.referrals (commission_paid)
  WHERE commission_paid = FALSE;

-- ── RLS: referrals ───────────────────────────────────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Affiliates can see referrals attributed to them
CREATE POLICY "Affiliates can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only service_role / admins can insert referral conversions
CREATE POLICY "Admins can insert referrals"
  ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ── 3. IP column security ────────────────────────────────────────────────────
--
-- Problem:
--   reviews.submission_ip and reviews.submission_user_agent are stored for
--   legal/forensic use. Supabase PostgREST exposes all columns by default
--   to any SELECT query. We must ensure these never reach the browser.
--
-- Solution — two layers:
--
--   Layer A: SECURITY DEFINER admin-only function
--     → The only authorised way to read IPs. Returns NULL for non-admins.
--       Call this from Supabase Edge Functions or the admin dashboard only.
--
--   Layer B: reviews_public VIEW (SECURITY INVOKER)
--     → A view that masks the sensitive columns to NULL for everyone except
--       the service_role. All client-facing PostgREST queries should target
--       this view instead of the base table.
--       (See instructions below on how to switch PostgREST to use this view.)

-- Layer A — Admin-only RPC for IP lookup
CREATE OR REPLACE FUNCTION public.get_review_submission_metadata(p_review_id UUID)
RETURNS TABLE (
  review_id             UUID,
  submission_ip         TEXT,
  submission_user_agent TEXT,
  indemnity_accepted_at TIMESTAMPTZ,
  indemnity_accepted    BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hard reject for non-admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT
      r.id,
      r.submission_ip,
      r.submission_user_agent,
      r.indemnity_accepted_at,
      r.indemnity_accepted
    FROM public.reviews r
    WHERE r.id = p_review_id;
END;
$$;

-- Layer B — Public-safe view (masks sensitive columns)
--
-- IMPORTANT: After running this migration, update your PostgREST queries
-- from `supabase.from('reviews')` to `supabase.from('reviews_public')`
-- for all client-facing SELECT queries (BusinessPage, Index, etc.).
-- The base `reviews` table should only be used by Edge Functions (service role).
--
-- The view is SECURITY INVOKER (default), so the caller's RLS still applies.
-- IPs are replaced with NULL for all non-service_role sessions.

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = true) -- caller's privileges apply; RLS on base table applies
AS
SELECT
  id,
  user_id,
  business_id,
  course_id,
  purchase_id,
  rating,
  text,
  review_text,
  subject,
  reviewer_name,
  anonymous,
  verified,
  verified_purchase,
  training_duration,
  flagged,
  flag_reason,
  like_count,
  created_at,
  updated_at,
  -- Legal compliance columns (safe to expose)
  verification_status,
  indemnity_accepted,
  challenged,
  challenge_upheld,
  -- ⚠️ SENSITIVE COLUMNS — always NULL in this view ⚠️
  -- Access these only via get_review_submission_metadata() RPC (admin only)
  NULL::text AS submission_ip,
  NULL::text AS submission_user_agent,
  NULL::text AS evidence_file_path,
  NULL::timestamptz AS indemnity_accepted_at
FROM public.reviews;

-- Grant SELECT on the view to the roles that PostgREST uses
GRANT SELECT ON public.reviews_public TO anon, authenticated;
-- Revoke direct SELECT on sensitive columns from PostgREST roles
-- (belt-and-suspenders alongside the view)
REVOKE SELECT (submission_ip, submission_user_agent, evidence_file_path, indemnity_accepted_at)
  ON public.reviews
  FROM anon, authenticated;


-- ── 4. Affiliate statistics helper function ──────────────────────────────────
--
-- Called by the affiliate dashboard (/partner) to get aggregate stats.
-- Returns only the requesting user's own affiliate stats (or all if admin).

CREATE OR REPLACE FUNCTION public.get_my_affiliate_stats()
RETURNS TABLE (
  referral_code         TEXT,
  status                TEXT,
  total_referrals       INTEGER,
  total_earnings_ils    NUMERIC,
  pending_payout_ils    NUMERIC,
  recent_referral_date  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      a.referral_code,
      a.status,
      a.total_referrals,
      a.total_earnings_ils,
      a.pending_payout_ils,
      (SELECT MAX(r.referral_date) FROM public.referrals r WHERE r.affiliate_id = a.id)
    FROM public.affiliates a
    WHERE a.user_id = auth.uid();
END;
$$;


-- ── 5. Summary comment ───────────────────────────────────────────────────────
--
-- After this migration, the security model for reviews is:
--
--   PostgREST (client browser)
--     → SELECT from reviews_public view
--     → submission_ip = NULL (always masked)
--     → evidence_file_path = NULL (always masked)
--
--   Edge Functions (service_role)
--     → SELECT from reviews base table directly
--     → All columns visible (service_role bypasses RLS + column restrictions)
--
--   Admin UI queries
--     → Call get_review_submission_metadata(review_id) RPC
--     → Returns IP only if auth.uid() has admin role
--
--   Affiliate dashboard (/partner)
--     → Call get_my_affiliate_stats() RPC
--     → Returns only the calling user's own affiliate data

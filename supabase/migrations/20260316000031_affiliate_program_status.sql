-- =============================================================================
-- Migration: 20260316000031_affiliate_program_status.sql
-- ReviewHub — Track lifecycle of each business's affiliate program decision
-- =============================================================================
--
-- affiliate_program_status lifecycle:
--   not_set   → Business registered before this migration, or user never touched the opt-in
--   declined  → Business owner explicitly declined during onboarding (toggle was off at submit)
--   enrolled  → Currently active participant
--   paused    → Was enrolled, then manually disabled from the dashboard
--
-- This decouples "has this business ever decided?" from the live `affiliate_enrolled` boolean,
-- enabling the dashboard to show personalised CTAs to businesses that said "no" at registration.
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS affiliate_program_status TEXT NOT NULL DEFAULT 'not_set'
    CHECK (affiliate_program_status IN ('not_set', 'declined', 'enrolled', 'paused'));

-- Backfill existing rows: anyone already enrolled gets 'enrolled', rest stay 'not_set'
UPDATE public.businesses
  SET affiliate_program_status = 'enrolled'
  WHERE affiliate_enrolled = TRUE
    AND affiliate_program_status = 'not_set';

-- Index for dashboard banner query (frequent: filter by owner + status)
CREATE INDEX IF NOT EXISTS idx_businesses_affiliate_status
  ON public.businesses(owner_id, affiliate_program_status);

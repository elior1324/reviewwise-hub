-- =============================================================================
-- Migration: 20260316000033_business_trial_tracking.sql
-- Purpose  : Track Stripe trial per business for 7-day reminder emails
--
--   All paid plans now include a 30-day free trial built into Stripe checkout.
--   This column lets the daily cron mark that a reminder was already sent,
--   preventing duplicate emails.
-- =============================================================================

-- Stamped once the 7-day-before-billing reminder has been sent
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at timestamptz;

-- Stripe customer ID — cached so we can look up subscriptions without email search
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer
  ON public.businesses (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

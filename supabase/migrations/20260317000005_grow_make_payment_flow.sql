-- =============================================================================
-- Migration: 20260317000005_grow_make_payment_flow.sql
-- ReviewHub — Grow + Make payment flow infrastructure
-- =============================================================================
-- Creates:
--   1. payment_webhook_logs              — immutable audit log, every incoming POST
--   2. processed_payment_transactions    — idempotency guard, PRIMARY KEY on transaction_id
--   3. businesses.grow_transaction_id    — audit link from subscription to Grow payment
--   4. businesses.grow_order_id          — our order reference stored on the business row
-- =============================================================================


-- =============================================================================
-- 1. payment_webhook_logs
-- Every POST to grow-make-webhook (and any future provider) is logged here
-- BEFORE any business logic runs. Never deleted. Service-role access only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at       timestamptz NOT NULL DEFAULT now(),

  -- Which provider / integration sent this
  -- Allowed: 'grow_make' | 'payplus' | 'hyp'
  source            text        NOT NULL,

  -- Fields extracted from the payload at logging time (nullable — may be missing)
  transaction_id    text,
  order_id          text,
  user_id           uuid,
  amount_ils        numeric,
  status_raw        text,

  -- Complete incoming payload for replay and debugging
  raw_payload       jsonb       NOT NULL,

  -- Outcome of processing this webhook call.
  -- Allowed values:
  --   pending          — logged, not yet processed (transient only)
  --   done             — subscription successfully updated
  --   failed           — processing error, see error_message
  --   duplicate_skipped — transaction_id already in processed_payment_transactions
  --   status_skipped   — status not in success whitelist
  --   amount_rejected  — amount below minimum floor (₪10)
  processing_status text        NOT NULL DEFAULT 'pending',

  error_message     text,
  processed_at      timestamptz
);

-- RLS: enabled with no public policies — service role only
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pwl_transaction_id
  ON public.payment_webhook_logs (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pwl_received_at
  ON public.payment_webhook_logs (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_pwl_user_id
  ON public.payment_webhook_logs (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pwl_source_status
  ON public.payment_webhook_logs (source, processing_status);

-- Operational alert index: find stuck or failed rows quickly
CREATE INDEX IF NOT EXISTS idx_pwl_needs_attention
  ON public.payment_webhook_logs (processing_status, received_at DESC)
  WHERE processing_status IN ('pending', 'failed');


-- =============================================================================
-- 2. processed_payment_transactions  (idempotency table)
--
-- PRIMARY KEY on transaction_id = hard DB-level uniqueness guarantee.
-- The edge function inserts here BEFORE updating businesses.
-- A concurrent duplicate delivery gets PostgreSQL error 23505 (unique_violation)
-- and is rejected before touching the subscription.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.processed_payment_transactions (
  transaction_id    text        PRIMARY KEY,          -- unique per Grow transaction
  processed_at      timestamptz NOT NULL DEFAULT now(),
  source            text        NOT NULL,              -- 'grow_make' | 'payplus' | 'hyp'
  user_id           uuid        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  business_id       uuid        REFERENCES public.businesses(id)          ON DELETE SET NULL,
  plan_id           text,
  amount_ils        numeric,
  webhook_log_id    uuid        REFERENCES public.payment_webhook_logs(id) ON DELETE SET NULL
);

ALTER TABLE public.processed_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ppt_user_id
  ON public.processed_payment_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_ppt_processed_at
  ON public.processed_payment_transactions (processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ppt_source
  ON public.processed_payment_transactions (source);


-- =============================================================================
-- 3. businesses — Grow audit columns
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS grow_transaction_id text;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS grow_order_id text;

COMMENT ON COLUMN public.businesses.grow_transaction_id
  IS 'Last Grow transaction_id that activated or renewed this subscription. Overwritten on each renewal.';

COMMENT ON COLUMN public.businesses.grow_order_id
  IS 'Our order reference passed to Grow at checkout. Format: RH-{UID6}-{TIMESTAMP36}.';

CREATE INDEX IF NOT EXISTS idx_businesses_grow_txn
  ON public.businesses (grow_transaction_id)
  WHERE grow_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_grow_order
  ON public.businesses (grow_order_id)
  WHERE grow_order_id IS NOT NULL;


-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Run these in Supabase SQL Editor after applying the migration.
-- All four queries must return at least one row.
-- =============================================================================

-- 1. Verify payment_webhook_logs columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'payment_webhook_logs'
-- ORDER BY ordinal_position;

-- 2. Verify processed_payment_transactions columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'processed_payment_transactions'
-- ORDER BY ordinal_position;

-- 3. Verify businesses grow columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'businesses'
--   AND column_name IN ('grow_transaction_id', 'grow_order_id');
-- Expected: 2 rows.

-- 4. Verify RLS is on:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('payment_webhook_logs', 'processed_payment_transactions');
-- Expected: both rows show rowsecurity = true.

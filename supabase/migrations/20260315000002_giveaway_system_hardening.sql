-- ============================================================
-- Migration: Giveaway System — Production Hardening
-- Date: 2026-03-15 (patch)
--
-- Critical fixes:
--   1. UNIQUE(verified_purchase_id) on review_requests
--      → prevents duplicate email sends under concurrent runs
--   2. Compound index on verified_purchases(purchased_at, review_requested)
--      → makes nightly batch query O(log n) instead of full-table-scan
--   3. ip_hash column on purchase_sessions
--      → enables basic spam/abuse rate-limiting queries
--   4. CHECK constraint: giveaway_month must be 'YYYY-MM' format
--   5. UNIQUE(verified_purchase_id) on giveaway_entries
--      → prevents a single purchase generating > 1 giveaway entry
--      (a review can only belong to one purchase, but belt-and-suspenders)
-- ============================================================

-- 1. Idempotency guard: one review_request per verified_purchase
ALTER TABLE public.review_requests
  ADD CONSTRAINT uq_review_requests_purchase
  UNIQUE (verified_purchase_id);

-- 2. Compound index for nightly batch query
--    Query pattern: WHERE review_requested = false AND purchased_at BETWEEN x AND y
CREATE INDEX IF NOT EXISTS idx_verified_purchases_batch_query
  ON public.verified_purchases (review_requested, purchased_at);

-- 3. ip_hash on purchase_sessions for abuse rate-limiting
--    (already had referrer, user_agent; ip_hash completes the fingerprint)
ALTER TABLE public.purchase_sessions
  ADD COLUMN IF NOT EXISTS ip_hash text;

CREATE INDEX IF NOT EXISTS idx_purchase_sessions_ip_hash
  ON public.purchase_sessions (ip_hash)
  WHERE ip_hash IS NOT NULL;

-- 4. Enforce giveaway_month format 'YYYY-MM' at DB level
ALTER TABLE public.giveaway_entries
  ADD CONSTRAINT chk_giveaway_month_format
  CHECK (giveaway_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- 5. Belt-and-suspenders: one giveaway entry per verified_purchase
--    (review_id is already UNIQUE; this adds the purchase-level guard)
ALTER TABLE public.giveaway_entries
  ADD CONSTRAINT uq_giveaway_entries_purchase
  UNIQUE (verified_purchase_id)
  DEFERRABLE INITIALLY DEFERRED;

-- 6. Index on review_requests(verified_purchase_id) for lookup
CREATE INDEX IF NOT EXISTS idx_review_requests_purchase_id
  ON public.review_requests (verified_purchase_id);

-- 7. Index on giveaway_entries(review_id) — already UNIQUE but explicit
--    (covered by the UNIQUE constraint, listed here for documentation)

-- 8. Index on giveaway_winners(month_year) — already UNIQUE, explicit
--    (covered by the UNIQUE constraint, listed here for documentation)

-- 9. Fast lookup for "has this user already submitted a review for
--    this verified_purchase" — used in giveaway entry creation guard.
CREATE INDEX IF NOT EXISTS idx_verified_purchases_business_id
  ON public.verified_purchases (business_id);

COMMENT ON TABLE public.purchase_sessions IS
  'Click-tracking: every visit to /go/:id. One row per browser navigation.
   Deduplicated at app layer via sessionStorage. Basis for giveaway eligibility.';

COMMENT ON TABLE public.verified_purchases IS
  'Confirmed purchases routed through ReviewHub Verified Deal links.
   Created by creator webhook or manual verification. Drives 7-day review request.';

COMMENT ON TABLE public.review_requests IS
  'One row per verified_purchase (UNIQUE constraint enforces idempotency).
   Token-based one-click review link valid for 30 days.';

COMMENT ON TABLE public.giveaway_entries IS
  'One entry per user per giveaway month (UNIQUE user_id+giveaway_month).
   Also one entry per review_id (UNIQUE). Belt-and-suspenders: one per
   verified_purchase_id. Drives fair monthly draw.';

COMMENT ON TABLE public.giveaway_winners IS
  'One winner per month_year (UNIQUE). Announced publicly. 14-day claim window.';

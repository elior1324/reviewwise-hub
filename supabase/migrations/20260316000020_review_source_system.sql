-- ============================================================
-- Review Source System — MVP
-- Date: 2026-03-16
--
-- Adds review source tracking to the platform, supporting:
--   1. verified_purchase  — ReviewHub verified purchase review
--   2. community          — ReviewHub community / open review
--   3. email_verified     — ReviewHub email-verified review
--
-- External sources (Google, WhatsApp, Facebook) live in their
-- own dedicated tables (imported_google_reviews, whatsapp_reviews,
-- facebook_reviews) — NOT in reviews — because they lack a
-- ReviewHub user_id and have different data models.
--
-- Architecture principle: every review source is clearly labeled.
-- The platform must never pretend all reviews are equal.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: Extend reviews table with source fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_source TEXT
    NOT NULL DEFAULT 'community'
    CHECK (review_source IN ('verified_purchase', 'community', 'email_verified')),
  ADD COLUMN IF NOT EXISTS source_label   TEXT,
  ADD COLUMN IF NOT EXISTS source_url     TEXT;

-- Computed alias: is_verified_purchase mirrors the verified_purchase column
-- This satisfies the API contract without data duplication.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN
    GENERATED ALWAYS AS (verified_purchase) STORED;

-- Back-fill existing rows: derive review_source from verified_purchase
-- and verification_status which were set correctly by the server.
UPDATE public.reviews
SET
  review_source = CASE
    WHEN verified_purchase = true THEN 'verified_purchase'
    WHEN verification_status = 'email_verified' THEN 'email_verified'
    ELSE 'community'
  END,
  source_label = CASE
    WHEN verified_purchase = true THEN 'Verified Purchase'
    WHEN verification_status = 'email_verified' THEN 'Community Review'
    ELSE 'Community Review'
  END
WHERE review_source = 'community';  -- only touch un-set rows

-- Index for fast filtering by source
CREATE INDEX IF NOT EXISTS idx_reviews_source
  ON public.reviews (business_id, review_source);

-- ─────────────────────────────────────────────────────────────
-- PART 2: WhatsApp review flows
-- Each business gets exactly one flow with a unique token.
-- The token becomes the URL key: /wa/{flow_token}
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_review_flows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  flow_token   TEXT NOT NULL UNIQUE
               DEFAULT encode(gen_random_bytes(16), 'hex'),
  phone_number TEXT,               -- optional: business WhatsApp number for display
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One flow per business (can be regenerated via token rotation)
  CONSTRAINT uq_whatsapp_flow_business UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_flows_token
  ON public.whatsapp_review_flows (flow_token)
  WHERE active = true;

ALTER TABLE public.whatsapp_review_flows ENABLE ROW LEVEL SECURITY;

-- Business owner can view and manage their own flow
CREATE POLICY "whatsapp_flows_owner_select"
  ON public.whatsapp_review_flows FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "whatsapp_flows_owner_update"
  ON public.whatsapp_review_flows FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Only service role (edge functions) can INSERT / DELETE flows
-- (business owners activate flows through the dashboard, which calls an edge function)

-- ─────────────────────────────────────────────────────────────
-- PART 3: WhatsApp reviews
-- Incoming feedback submitted via the /wa/{token} review page.
-- Separate from reviews table: no user_id required.
-- Business owner must approve before public display.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  flow_id             UUID REFERENCES public.whatsapp_review_flows(id) ON DELETE SET NULL,

  -- Reviewer info (no ReviewHub account required)
  author_name         TEXT,
  author_phone_hash   TEXT,         -- SHA-256 of E.164 number; for dedup only

  -- Content
  rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
  text                TEXT NOT NULL CHECK (length(trim(text)) >= 5),

  -- Source metadata
  review_source       TEXT NOT NULL DEFAULT 'whatsapp'
                      CHECK (review_source = 'whatsapp'),
  source_label        TEXT NOT NULL DEFAULT 'WhatsApp Customer Feedback',
  source_url          TEXT,         -- deep link to WhatsApp chat if available
  whatsapp_message_id TEXT,         -- external ID from WhatsApp Cloud API (future)

  -- Moderation: owner must approve before public display
  is_approved         BOOLEAN NOT NULL DEFAULT false,
  is_flagged          BOOLEAN NOT NULL DEFAULT false,
  approved_at         TIMESTAMPTZ,
  flagged_reason      TEXT,

  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reviews_business
  ON public.whatsapp_reviews (business_id, is_approved, is_flagged);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reviews_flow
  ON public.whatsapp_reviews (flow_id);

ALTER TABLE public.whatsapp_reviews ENABLE ROW LEVEL SECURITY;

-- Public: only see approved, non-flagged reviews
CREATE POLICY "whatsapp_reviews_public_select"
  ON public.whatsapp_reviews FOR SELECT
  USING (is_approved = true AND is_flagged = false);

-- Business owner: see ALL their reviews (including pending / flagged)
CREATE POLICY "whatsapp_reviews_owner_select"
  ON public.whatsapp_reviews FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owner can approve / flag their reviews
CREATE POLICY "whatsapp_reviews_owner_update"
  ON public.whatsapp_reviews FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- PART 4: Facebook reviews
-- Imported from Facebook Graph API (future) or manually entered.
-- Separate table: no user_id, different schema.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.facebook_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Facebook data
  external_id         TEXT,          -- Facebook review_id from Graph API
  author_name         TEXT,
  author_profile_url  TEXT,
  author_photo_url    TEXT,
  rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
  text                TEXT,
  published_at        TIMESTAMPTZ,
  source_url          TEXT,          -- link to Facebook review

  -- Source metadata
  review_source       TEXT NOT NULL DEFAULT 'facebook'
                      CHECK (review_source = 'facebook'),
  source_label        TEXT NOT NULL DEFAULT 'Facebook Review',

  -- Sync metadata
  last_synced_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate imports of same Facebook review
  CONSTRAINT uq_facebook_review UNIQUE (business_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_facebook_reviews_business
  ON public.facebook_reviews (business_id, published_at DESC);

ALTER TABLE public.facebook_reviews ENABLE ROW LEVEL SECURITY;

-- Public: anyone can see Facebook reviews
CREATE POLICY "facebook_reviews_public_select"
  ON public.facebook_reviews FOR SELECT
  USING (true);

-- Only service role can insert/update (Facebook sync edge function)

-- ─────────────────────────────────────────────────────────────
-- PART 5: Helper function — get flow token for a business
-- Used by the dashboard to retrieve the WhatsApp review link.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_or_create_whatsapp_flow(
  p_business_id UUID
)
RETURNS TABLE (
  flow_id    UUID,
  flow_token TEXT,
  active     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return existing flow if it exists
  RETURN QUERY
    SELECT id, whatsapp_review_flows.flow_token, whatsapp_review_flows.active
    FROM public.whatsapp_review_flows
    WHERE business_id = p_business_id;

  -- If no row returned, create one
  IF NOT FOUND THEN
    INSERT INTO public.whatsapp_review_flows (business_id)
    VALUES (p_business_id)
    ON CONFLICT (business_id) DO NOTHING;

    RETURN QUERY
      SELECT id, whatsapp_review_flows.flow_token, whatsapp_review_flows.active
      FROM public.whatsapp_review_flows
      WHERE business_id = p_business_id;
  END IF;
END;
$$;

-- Grant execute to authenticated users (they'll get their own flow only — RLS enforces ownership)
GRANT EXECUTE ON FUNCTION public.get_or_create_whatsapp_flow(UUID) TO authenticated;

COMMENT ON TABLE public.whatsapp_review_flows IS
  'Per-business WhatsApp review collection flows. Each business gets a unique token URL.';

COMMENT ON TABLE public.whatsapp_reviews IS
  'WhatsApp customer feedback. Kept separate from reviews table — no ReviewHub account required. Requires business owner approval before public display.';

COMMENT ON TABLE public.facebook_reviews IS
  'Facebook reviews imported via Graph API. Separate from reviews table — external source with different trust level.';

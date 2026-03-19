-- Migration: 20260319200001_instagram_dm_reviews.sql
--
-- Adds Instagram DM review collection, mirroring the WhatsApp review flow.
--
-- Tables created:
--   1. instagram_dm_review_flows — one flow (link) per business
--   2. instagram_dm_reviews      — customer-submitted reviews through the flow
--
-- Also adds get_or_create_instagram_dm_flow() RPC used by the dashboard panel.

-- ── 1. instagram_dm_review_flows ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.instagram_dm_review_flows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  flow_token   TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_instagram_dm_flow_business UNIQUE (business_id)
);

ALTER TABLE public.instagram_dm_review_flows ENABLE ROW LEVEL SECURITY;

-- Business owner can read and update their own flow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_review_flows'
      AND policyname = 'instagram_dm_flows_owner_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_flows_owner_select
        ON public.instagram_dm_review_flows
        FOR SELECT
        USING (
          business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
          )
        )
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_review_flows'
      AND policyname = 'instagram_dm_flows_owner_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_flows_owner_update
        ON public.instagram_dm_review_flows
        FOR UPDATE
        USING (
          business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
          )
        )
    $p$;
  END IF;
END $$;

-- Public can look up a flow by flow_token (needed for /ig/:token page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_review_flows'
      AND policyname = 'instagram_dm_flows_public_select_by_token'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_flows_public_select_by_token
        ON public.instagram_dm_review_flows
        FOR SELECT
        USING (true)
    $p$;
  END IF;
END $$;

-- Service role bypass
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_review_flows'
      AND policyname = 'instagram_dm_flows_service_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_flows_service_all
        ON public.instagram_dm_review_flows
        FOR ALL
        USING (auth.role() = 'service_role')
    $p$;
  END IF;
END $$;

-- ── 2. instagram_dm_reviews ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.instagram_dm_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  flow_id               UUID REFERENCES public.instagram_dm_review_flows(id) ON DELETE SET NULL,

  -- Reviewer (no ReviewHub account required)
  author_name           TEXT CHECK (length(trim(author_name)) <= 80),
  author_phone_hash     TEXT,   -- SHA-256 of last-10-digits, for dedup only

  -- Content
  rating                INTEGER CHECK (rating >= 1 AND rating <= 5),
  text                  TEXT NOT NULL CHECK (length(trim(text)) >= 5),

  -- Moderation: business owner must approve before public display
  is_approved           BOOLEAN NOT NULL DEFAULT false,
  is_flagged            BOOLEAN NOT NULL DEFAULT false,
  approved_at           TIMESTAMPTZ,
  flagged_reason        TEXT,

  received_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_dm_reviews ENABLE ROW LEVEL SECURITY;

-- Public: only see approved, non-flagged reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_reviews'
      AND policyname = 'instagram_dm_reviews_public_approved'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_reviews_public_approved
        ON public.instagram_dm_reviews
        FOR SELECT
        USING (is_approved = true AND is_flagged = false)
    $p$;
  END IF;
END $$;

-- Business owner: see all their reviews (including pending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_reviews'
      AND policyname = 'instagram_dm_reviews_owner_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_reviews_owner_all
        ON public.instagram_dm_reviews
        FOR ALL
        USING (
          business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
          )
        )
    $p$;
  END IF;
END $$;

-- Service role: full access (used by receive-instagram-dm-review edge function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'instagram_dm_reviews'
      AND policyname = 'instagram_dm_reviews_service_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY instagram_dm_reviews_service_all
        ON public.instagram_dm_reviews
        FOR ALL
        USING (auth.role() = 'service_role')
    $p$;
  END IF;
END $$;

-- ── 3. RPC: get_or_create_instagram_dm_flow ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_instagram_dm_flow(
  p_business_id UUID
)
RETURNS TABLE (flow_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO public.instagram_dm_review_flows (business_id)
  VALUES (p_business_id)
  ON CONFLICT (business_id) DO NOTHING;

  -- Return the token
  RETURN QUERY
    SELECT f.flow_token
    FROM public.instagram_dm_review_flows f
    WHERE f.business_id = p_business_id;
END;
$$;

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_instagram_dm_reviews_business_pending
  ON public.instagram_dm_reviews (business_id, is_approved, is_flagged, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_instagram_dm_reviews_phone_hash
  ON public.instagram_dm_reviews (business_id, author_phone_hash)
  WHERE author_phone_hash IS NOT NULL;

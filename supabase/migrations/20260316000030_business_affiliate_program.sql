-- =============================================================================
-- Migration: 20260316000030_business_affiliate_program.sql
-- ReviewHub — Business-level affiliate program enrollment + tracking
-- =============================================================================

-- 1. Add affiliate enrollment columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS affiliate_enrolled      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS affiliate_enrolled_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affiliate_link_active   BOOLEAN     NOT NULL DEFAULT TRUE;

-- 2. Business affiliate clicks — every visit to /go/<business-slug>
CREATE TABLE IF NOT EXISTS public.business_affiliate_clicks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_token  TEXT,
  referrer       TEXT,
  user_agent     TEXT,
  landing_url    TEXT,
  converted      BOOLEAN     NOT NULL DEFAULT FALSE,
  clicked_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bac_business   ON public.business_affiliate_clicks(business_id);
CREATE INDEX IF NOT EXISTS idx_bac_clicked_at ON public.business_affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_bac_converted  ON public.business_affiliate_clicks(business_id, converted);

-- 3. Business affiliate conversions
CREATE TABLE IF NOT EXISTS public.business_affiliate_conversions (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID         NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  click_id              UUID         REFERENCES public.business_affiliate_clicks(id),
  transaction_amount    NUMERIC(12,2),
  customer_discount     NUMERIC(12,2),
  platform_commission   NUMERIC(12,2),
  business_net          NUMERIC(12,2),
  coupon_code           TEXT         DEFAULT 'RH5',
  customer_email_hash   TEXT,
  status                TEXT         NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','confirmed','cancelled')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  confirmed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bconv_business   ON public.business_affiliate_conversions(business_id);
CREATE INDEX IF NOT EXISTS idx_bconv_created_at ON public.business_affiliate_conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bconv_status     ON public.business_affiliate_conversions(business_id, status);

-- 4. RLS
ALTER TABLE public.business_affiliate_clicks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_affiliate_conversions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert affiliate clicks"
  ON public.business_affiliate_clicks FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owner reads own clicks"
  ON public.business_affiliate_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Business owner reads own conversions"
  ON public.business_affiliate_conversions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Service role manages conversions"
  ON public.business_affiliate_conversions FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 5. Stats helper function
CREATE OR REPLACE FUNCTION public.get_affiliate_stats(p_business_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_clicks BIGINT; v_conversions BIGINT; v_total_revenue NUMERIC;
  v_commission NUMERIC; v_discount NUMERIC; v_clicks_30d BIGINT; v_conv_30d BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT COUNT(*) INTO v_clicks FROM public.business_affiliate_clicks WHERE business_id = p_business_id;
  SELECT COUNT(*) INTO v_clicks_30d FROM public.business_affiliate_clicks
    WHERE business_id = p_business_id AND clicked_at >= now() - INTERVAL '30 days';
  SELECT COUNT(*), COALESCE(SUM(transaction_amount),0), COALESCE(SUM(platform_commission),0), COALESCE(SUM(customer_discount),0)
    INTO v_conversions, v_total_revenue, v_commission, v_discount
    FROM public.business_affiliate_conversions WHERE business_id = p_business_id AND status = 'confirmed';
  SELECT COUNT(*) INTO v_conv_30d FROM public.business_affiliate_conversions
    WHERE business_id = p_business_id AND status = 'confirmed' AND created_at >= now() - INTERVAL '30 days';
  RETURN jsonb_build_object(
    'total_clicks', v_clicks, 'clicks_30d', v_clicks_30d,
    'total_conversions', v_conversions, 'conversions_30d', v_conv_30d,
    'total_revenue', v_total_revenue, 'platform_commission', v_commission,
    'customer_discount', v_discount,
    'conversion_rate', CASE WHEN v_clicks > 0 THEN ROUND((v_conversions::NUMERIC / v_clicks)*100,1) ELSE 0 END
  );
END; $$;

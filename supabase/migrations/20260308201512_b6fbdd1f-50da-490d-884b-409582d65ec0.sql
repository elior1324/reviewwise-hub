
-- 1. ai_reports table
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  content TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own reports"
  ON public.ai_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = ai_reports.business_id AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Service role can manage reports"
  ON public.ai_reports FOR ALL
  USING (false);

-- 2. leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  source TEXT NOT NULL DEFAULT 'positive_review',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own leads"
  ON public.leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = leads.business_id AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can update own leads"
  ON public.leads FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = leads.business_id AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Service role can manage leads"
  ON public.leads FOR ALL
  USING (false);

-- 3. business_webhooks table
CREATE TABLE public.business_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{"new_review","positive_review","affiliate_conversion"}',
  secret TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage own webhooks"
  ON public.business_webhooks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_webhooks.business_id AND businesses.owner_id = auth.uid()
  ));

-- 4. api_keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage own api keys"
  ON public.api_keys FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = api_keys.business_id AND businesses.owner_id = auth.uid()
  ));

-- 5. Trigger to create lead from positive review
CREATE OR REPLACE FUNCTION public.create_lead_from_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.rating >= 4 AND NEW.flagged = false THEN
    INSERT INTO public.leads (business_id, review_id, source, status)
    VALUES (NEW.business_id, NEW.id, 'positive_review', 'new');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_positive_review_create_lead
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.create_lead_from_review();

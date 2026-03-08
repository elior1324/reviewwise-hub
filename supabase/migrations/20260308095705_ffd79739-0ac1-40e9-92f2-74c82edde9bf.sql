
-- Storage bucket for invoice/receipt files
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Table to track business invoice templates (uploaded by business owners)
CREATE TABLE public.invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  ai_extracted_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage own templates"
  ON public.invoice_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = invoice_templates.business_id AND businesses.owner_id = auth.uid()));

CREATE POLICY "Templates viewable by authenticated users"
  ON public.invoice_templates FOR SELECT
  TO authenticated
  USING (true);

-- Table to track customer-uploaded receipts for verification
CREATE TABLE public.customer_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  ai_match_score numeric DEFAULT 0,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  verification_status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own receipts"
  ON public.customer_receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own receipts"
  ON public.customer_receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view receipts for their business"
  ON public.customer_receipts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customer_receipts.business_id AND businesses.owner_id = auth.uid()));

CREATE POLICY "Business owners can update receipt status"
  ON public.customer_receipts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customer_receipts.business_id AND businesses.owner_id = auth.uid()));

-- Storage RLS: business owners can upload to invoices bucket under their business folder
CREATE POLICY "Business owners can upload invoice templates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = 'templates');

CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = 'receipts');

CREATE POLICY "Authenticated users can read invoices bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

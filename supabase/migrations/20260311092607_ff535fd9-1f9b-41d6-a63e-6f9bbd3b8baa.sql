
-- Pillar 2: Add workflow columns to review_reports
ALTER TABLE public.review_reports
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS reviewer_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_response text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid;

-- Pillar 2: Admin update policy for review_reports
CREATE POLICY "Admins can update reports"
  ON public.review_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Pillar 3: Add audit metadata to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS submission_ip text,
  ADD COLUMN IF NOT EXISTS submission_user_agent text;

-- 1. Restrict review verification: only admins can set verified=true
CREATE OR REPLACE FUNCTION public.protect_review_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.verified IS DISTINCT FROM NEW.verified
     AND NEW.verified = true
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can verify reviews';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_review_verification_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.protect_review_verification();

-- 2. Drop overly broad invoice templates SELECT policy
DROP POLICY IF EXISTS "Templates viewable by authenticated users" ON public.invoice_templates;

-- Add admin-only SELECT policy for invoice templates
CREATE POLICY "Admins can view all invoice templates"
ON public.invoice_templates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Fix testimonials storage: drop open upload, restrict to admins
DROP POLICY IF EXISTS "Authenticated users can upload testimonials" ON storage.objects;

CREATE POLICY "Admins can upload testimonials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'testimonials'
  AND public.has_role(auth.uid(), 'admin')
);

-- 4. Restrict invoices storage read to business owners only
DROP POLICY IF EXISTS "Authenticated users can read invoices bucket" ON storage.objects;

CREATE POLICY "Business owners can read own invoices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.businesses
    WHERE owner_id = auth.uid()
      AND id::text = (storage.foldername(name))[1]
  )
);
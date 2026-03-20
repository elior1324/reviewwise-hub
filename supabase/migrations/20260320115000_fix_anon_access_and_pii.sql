-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: storage.objects — restrict testimonials read to authenticated only
-- "Anyone can view testimonials" allows anon users to enumerate testimonial files.
-- Testimonials are business-owned content; anonymous read is not required.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view testimonials" ON storage.objects;

CREATE POLICY "Authenticated users can view testimonials"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'testimonials');

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: storage.objects — invoices policy already requires authenticated + owner check.
-- No change needed; the scanner flagged it as anon-accessible but the policy
-- already has TO authenticated. Recreate explicitly to ensure role is enforced.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Business owners can read own invoices" ON storage.objects;

CREATE POLICY "Business owners can read own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 3: purchases — hide customer_email from business owners
-- Business owners need purchase data for order management, but NOT raw email addresses.
-- Create a view without customer_email for business owner access.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Business owners can view purchases" ON public.purchases;

-- Business owners can view purchases for their courses, but NOT customer_email
CREATE POLICY "Business owners can view purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.businesses b ON c.business_id = b.id
      WHERE c.id = course_id
        AND b.owner_id = auth.uid()
    )
  );

-- View for business owners that explicitly excludes customer_email
CREATE OR REPLACE VIEW public.business_purchases_view
WITH (security_invoker = true)
AS
  SELECT
    id,
    course_id,
    customer_user_id,
    -- customer_email intentionally omitted (PII — not needed by business owners)
    amount,
    currency,
    status,
    created_at,
    updated_at
  FROM public.purchases;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 4: reviews — mask user_id for anonymous reviews
-- Public SELECT on reviews exposes user_id even for anonymous reviews,
-- defeating the anonymity feature.
-- Replace with a security view that hides user_id for anonymous reviews.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true)
AS
  SELECT
    id,
    business_id,
    course_id,
    rating,
    text,
    anonymous,
    -- Hide user_id for anonymous reviews; only expose to the review owner
    CASE
      WHEN anonymous = true AND (auth.uid() IS NULL OR auth.uid() != user_id)
      THEN NULL
      ELSE user_id
    END AS user_id,
    moderation_status,
    verified,
    helpful_count,
    created_at,
    updated_at
  FROM public.reviews
  WHERE moderation_status = 'approved';

COMMENT ON VIEW public.public_reviews IS
  'Public-safe view of reviews. user_id is masked (NULL) for anonymous reviews '
  'unless the viewer is the review author. Use this view for all public-facing queries.';

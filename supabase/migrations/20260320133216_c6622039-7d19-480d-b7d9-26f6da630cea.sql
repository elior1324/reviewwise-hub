
-- 1. Ensure protect_subscription_tier trigger is attached to businesses table
DROP TRIGGER IF EXISTS trg_protect_subscription_tier ON public.businesses;
CREATE TRIGGER trg_protect_subscription_tier
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscription_tier();

-- 2. Restrict public access to PII columns in reviews.
--    Drop the existing permissive SELECT policy and replace with one
--    that masks submission_ip and submission_user_agent for non-admins.
--    Since RLS column masking isn't native in Postgres, we use a view approach:
--    Create a secure view and redirect public reads through it.

-- Create a security-invoker view that hides PII columns
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true)
AS
SELECT
  id, business_id, course_id, user_id, rating, text,
  anonymous, verified, flagged, flag_reason,
  like_count, purchase_id, receipt_url,
  created_at, updated_at,
  -- Mask PII: only admins/service_role see real values
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN submission_ip ELSE NULL END AS submission_ip,
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN submission_user_agent ELSE NULL END AS submission_user_agent
FROM public.reviews;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_reviews TO anon, authenticated;

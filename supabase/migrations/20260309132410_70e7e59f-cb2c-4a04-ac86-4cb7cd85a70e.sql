
-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Anyone can view by token" ON public.review_requests;

-- Business owners already have ALL access via "Business owners can manage requests" policy.
-- No additional policy needed for them.

-- For the review form token-based lookup, we don't expose the full table.
-- Instead, the frontend should look up by exact token match only.
CREATE POLICY "Token holder can view own request"
  ON public.review_requests FOR SELECT
  TO public
  USING (false);

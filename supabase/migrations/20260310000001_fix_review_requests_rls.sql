-- =============================================================================
-- SECURITY FIX #1 — review_requests: PII Leak via "Anyone can view by token"
-- =============================================================================
-- VULNERABILITY:
--   The original migration created:
--     CREATE POLICY "Anyone can view by token"
--     ON public.review_requests FOR SELECT USING (true);
--
--   This allowed ANY unauthenticated caller to run:
--     supabase.from('review_requests').select('*')
--   and receive ALL rows — including customer_email PII for every business.
--
-- WHAT WAS PARTIALLY FIXED:
--   Migration 20260309132410 dropped "Anyone can view by token" and replaced with
--   USING(false), which blocks all RLS-level access. Good — but now the review
--   form can never look up a request by token without a service-role edge function.
--
-- THIS MIGRATION ADDS:
--   1. A SECURITY DEFINER function that does token lookup safely (no full-table scan).
--   2. An RPC the frontend can call without bypassing RLS.
-- =============================================================================

-- Drop the broken stub policy if it still exists (idempotent)
DROP POLICY IF EXISTS "Token holder can view own request" ON public.review_requests;

-- ── Safe token-lookup function ────────────────────────────────────────────────
-- SECURITY DEFINER: runs with owner's permissions, not caller's.
-- search_path locked to public to prevent search-path injection.
CREATE OR REPLACE FUNCTION public.get_review_request_by_token(p_token TEXT)
RETURNS TABLE (
  id            UUID,
  business_id   UUID,
  course_id     UUID,
  status        TEXT,
  sent_at       TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    rr.id,
    rr.business_id,
    rr.course_id,
    rr.status,
    rr.sent_at
  FROM public.review_requests rr
  WHERE rr.token = p_token
    AND rr.status NOT IN ('expired', 'completed')
  LIMIT 1;
$$;

-- Note: customer_email is intentionally NOT returned — the caller already knows
-- their own email; there is no need to round-trip it.

-- Revoke direct table access from anon / authenticated (belt-and-suspenders
-- on top of the existing USING(false) RLS policy).
REVOKE SELECT ON public.review_requests FROM anon;
REVOKE SELECT ON public.review_requests FROM authenticated;

-- Grant execute on the safe function only
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(TEXT) TO authenticated;

-- ── Also mark requests as 'opened' safely ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_review_request_opened(p_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
  UPDATE public.review_requests
  SET status    = 'opened',
      opened_at = now()
  WHERE token  = p_token
    AND status  = 'sent';
$$;

GRANT EXECUTE ON FUNCTION public.mark_review_request_opened(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_review_request_opened(TEXT) TO authenticated;

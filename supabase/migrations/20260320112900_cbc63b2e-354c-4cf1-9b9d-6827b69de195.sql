
-- Attach the existing protect_subscription_tier trigger to businesses table
CREATE TRIGGER trg_protect_subscription_tier
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscription_tier();

-- Attach the existing protect_review_verification trigger to reviews table
CREATE TRIGGER trg_protect_review_verification
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_review_verification();

-- Add a new trigger function to protect like_count and flagged from direct client manipulation
CREATE OR REPLACE FUNCTION public.protect_review_integrity()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Block direct like_count changes from non-service-role
  IF OLD.like_count IS DISTINCT FROM NEW.like_count
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'like_count can only be changed by server functions';
  END IF;

  -- Block direct flagged/flag_reason changes from non-admin/non-service-role
  IF (OLD.flagged IS DISTINCT FROM NEW.flagged OR OLD.flag_reason IS DISTINCT FROM NEW.flag_reason)
     AND current_setting('role') != 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins or server can change flagged status';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_protect_review_integrity
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_review_integrity();

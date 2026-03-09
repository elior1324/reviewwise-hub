
CREATE OR REPLACE FUNCTION public.protect_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Subscription tier can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_subscription_tier_trigger
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscription_tier();


CREATE OR REPLACE FUNCTION public.protect_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     AND current_setting('role') != 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Subscription tier can only be changed by admins or the server';
  END IF;
  RETURN NEW;
END;
$$;

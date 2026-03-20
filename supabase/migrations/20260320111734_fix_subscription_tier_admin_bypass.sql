-- Fix: Remove admin bypass from protect_subscription_tier trigger.
-- Only service_role (payment webhook) may change subscription_tier.
-- Admin users could previously bypass this check, creating a self-upgrade path.

CREATE OR REPLACE FUNCTION public.protect_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Subscription tier can only be changed by the server (payment webhook)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

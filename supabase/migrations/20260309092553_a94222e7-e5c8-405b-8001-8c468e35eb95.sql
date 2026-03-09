
-- Create a function to count reviews per business per month for free tier enforcement
CREATE OR REPLACE FUNCTION public.check_review_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_count integer;
BEGIN
  -- Get the business subscription tier
  SELECT subscription_tier INTO v_tier
  FROM public.businesses
  WHERE id = NEW.business_id;

  -- Free tier: limit to 10 reviews per month
  IF v_tier = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.reviews
    WHERE business_id = NEW.business_id
      AND created_at >= date_trunc('month', now())
      AND created_at < date_trunc('month', now()) + interval '1 month';

    IF v_count >= 10 THEN
      RAISE EXCEPTION 'Free tier businesses are limited to 10 reviews per month. Upgrade to Professional for unlimited reviews.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for review limit
CREATE TRIGGER enforce_review_limit
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_review_limit();

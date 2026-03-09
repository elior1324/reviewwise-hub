
-- Trigger to enforce server-side payout validation
-- Forces status to 'pending', calculates amount/points from rewards data
CREATE OR REPLACE FUNCTION public.validate_payout_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_points numeric;
  v_pool_amount numeric;
  v_pool_total_points numeric;
  v_calculated_amount numeric;
BEGIN
  -- Force status to pending on insert - never trust client
  NEW.status := 'pending';

  -- Check no existing pending payout for this month
  IF EXISTS (
    SELECT 1 FROM public.reward_payouts
    WHERE user_id = NEW.user_id
      AND month_year = NEW.month_year
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending payout already exists for this month';
  END IF;

  -- Calculate actual points from rewards_log
  SELECT COALESCE(SUM(total_points), 0) INTO v_total_points
  FROM public.rewards_log
  WHERE user_id = NEW.user_id
    AND month_year = NEW.month_year;

  IF v_total_points <= 0 THEN
    RAISE EXCEPTION 'No reward points available for this month';
  END IF;

  -- Get pool data for this month
  SELECT COALESCE(community_pool, 0), COALESCE(total_points, 1)
  INTO v_pool_amount, v_pool_total_points
  FROM public.rewards_pool
  WHERE month_year = NEW.month_year;

  IF v_pool_total_points <= 0 THEN
    v_pool_total_points := 1;
  END IF;

  -- Calculate proportional earnings
  v_calculated_amount := ROUND((v_total_points / v_pool_total_points) * v_pool_amount, 2);

  -- Enforce minimum ₪100 threshold
  IF v_calculated_amount < 100 THEN
    RAISE EXCEPTION 'Minimum payout amount is ₪100. Current earnings: ₪%', v_calculated_amount;
  END IF;

  -- Override client-supplied values with server-calculated ones
  NEW.points := v_total_points;
  NEW.amount := v_calculated_amount;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_payout_insert_trigger
  BEFORE INSERT ON public.reward_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payout_insert();

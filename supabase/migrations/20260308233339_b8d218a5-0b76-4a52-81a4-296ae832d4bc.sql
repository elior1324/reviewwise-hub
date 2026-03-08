
-- 1. Allow any authenticated user to increment like_count on reviews (not just the review author)
CREATE POLICY "Anyone authenticated can like reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: The existing "Users can update own reviews" policy is RESTRICTIVE.
-- We need to drop it and recreate both as PERMISSIVE so either condition works.
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

CREATE POLICY "Users can update own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Make the like policy permissive too (default is permissive, but let's be explicit)
-- Actually, let's use a simpler approach: a security definer function for liking

-- Drop the broad policy we just created - it's too permissive (allows changing rating/text too)
DROP POLICY IF EXISTS "Anyone authenticated can like reviews" ON public.reviews;

-- Instead, create a security definer function that only updates like_count
CREATE OR REPLACE FUNCTION public.increment_review_likes(review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET like_count = like_count + 1
  WHERE id = review_id;
END;
$$;

-- 2. Create trigger to recalculate rewards_log when like_count changes on reviews
CREATE OR REPLACE FUNCTION public.recalculate_review_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_multiplier numeric;
  v_total_points numeric;
  v_month_year text;
BEGIN
  -- Calculate multiplier: every 10 likes = 2x, capped at 10x
  v_multiplier := LEAST(FLOOR(NEW.like_count / 10.0) * 2, 10);
  IF v_multiplier < 1 THEN v_multiplier := 1; END IF;
  
  -- Update all rewards_log entries for this review
  UPDATE public.rewards_log
  SET 
    like_count = NEW.like_count,
    multiplier = v_multiplier,
    total_points = base_points * v_multiplier,
    updated_at = now()
  WHERE review_id = NEW.id;
  
  -- Recalculate total_points in rewards_pool for affected months
  UPDATE public.rewards_pool rp
  SET total_points = (
    SELECT COALESCE(SUM(rl.total_points), 0)
    FROM public.rewards_log rl
    WHERE rl.month_year = rp.month_year
  ),
  updated_at = now()
  WHERE rp.month_year IN (
    SELECT DISTINCT rl2.month_year 
    FROM public.rewards_log rl2 
    WHERE rl2.review_id = NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_like_change
AFTER UPDATE OF like_count ON public.reviews
FOR EACH ROW
WHEN (OLD.like_count IS DISTINCT FROM NEW.like_count)
EXECUTE FUNCTION public.recalculate_review_rewards();

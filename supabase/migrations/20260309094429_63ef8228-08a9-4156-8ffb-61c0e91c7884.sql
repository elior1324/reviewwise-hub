
-- Add receipt_url to reviews (is_verified already exists as "verified")
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS receipt_url text;

-- Add total_points to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;

-- Create leaderboard_seasons table for 6-month reset cycles
CREATE TABLE IF NOT EXISTS public.leaderboard_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons viewable by everyone" ON public.leaderboard_seasons
  FOR SELECT USING (true);

CREATE POLICY "Only service role can manage seasons" ON public.leaderboard_seasons
  FOR ALL USING (false);

-- Create leaderboard_entries table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.leaderboard_seasons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  verified_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard viewable by everyone" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can view own entries" ON public.leaderboard_entries
  FOR ALL USING (auth.uid() = user_id);

-- Insert current season (6-month cycle)
INSERT INTO public.leaderboard_seasons (season_name, starts_at, ends_at, is_active)
VALUES (
  'עונה 1 — 2026',
  '2026-01-01T00:00:00Z',
  '2026-06-30T23:59:59Z',
  true
);

-- Function to auto-calculate points when review is created/updated
CREATE OR REPLACE FUNCTION public.update_leaderboard_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_season_id uuid;
  v_points integer;
  v_multiplier integer;
BEGIN
  -- Get active season
  SELECT id INTO v_season_id FROM public.leaderboard_seasons WHERE is_active = true LIMIT 1;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;

  -- Base points: 100 per review, 2x if verified
  v_multiplier := CASE WHEN NEW.verified = true THEN 2 ELSE 1 END;
  v_points := 100 * v_multiplier;

  -- Upsert leaderboard entry
  INSERT INTO public.leaderboard_entries (season_id, user_id, points, review_count, verified_count)
  VALUES (v_season_id, NEW.user_id, v_points, 1, CASE WHEN NEW.verified THEN 1 ELSE 0 END)
  ON CONFLICT (season_id, user_id)
  DO UPDATE SET
    points = public.leaderboard_entries.points + v_points,
    review_count = public.leaderboard_entries.review_count + 1,
    verified_count = public.leaderboard_entries.verified_count + CASE WHEN NEW.verified THEN 1 ELSE 0 END,
    updated_at = now();

  -- Update profile total_points
  UPDATE public.profiles
  SET total_points = total_points + v_points
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger on review insert
CREATE TRIGGER trg_update_leaderboard
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leaderboard_points();

-- Function to recalc points when verified status changes
CREATE OR REPLACE FUNCTION public.handle_verification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_season_id uuid;
  v_bonus integer;
BEGIN
  -- Only when verified changes from false to true
  IF OLD.verified = false AND NEW.verified = true THEN
    SELECT id INTO v_season_id FROM public.leaderboard_seasons WHERE is_active = true LIMIT 1;
    IF v_season_id IS NULL THEN RETURN NEW; END IF;

    v_bonus := 100; -- Add the 2x bonus (they already got 100, now get another 100)

    UPDATE public.leaderboard_entries
    SET points = points + v_bonus,
        verified_count = verified_count + 1,
        updated_at = now()
    WHERE season_id = v_season_id AND user_id = NEW.user_id;

    UPDATE public.profiles
    SET total_points = total_points + v_bonus
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_verification
  AFTER UPDATE OF verified ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verification_change();

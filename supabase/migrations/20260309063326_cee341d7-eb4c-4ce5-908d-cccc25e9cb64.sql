
-- Table to track which user liked which review (prevents double-likes and enables unlike)
CREATE TABLE public.review_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes" ON public.review_likes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes" ON public.review_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.review_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Function to decrement review likes
CREATE OR REPLACE FUNCTION public.decrement_review_likes(review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.reviews
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = review_id;
END;
$$;

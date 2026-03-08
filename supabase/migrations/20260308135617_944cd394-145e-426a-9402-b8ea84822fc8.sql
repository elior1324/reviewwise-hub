
CREATE TABLE public.monthly_top5 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL, -- e.g. '2026-03'
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 5),
  business_slug text NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL, -- 'freelancer' or 'course-provider'
  category text NOT NULL,
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  ai_reasoning text, -- AI explanation for ranking
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (month_year, rank)
);

ALTER TABLE public.monthly_top5 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monthly top5 viewable by everyone"
  ON public.monthly_top5
  FOR SELECT
  USING (true);

CREATE POLICY "Only service role can manage top5"
  ON public.monthly_top5
  FOR ALL
  USING (false);

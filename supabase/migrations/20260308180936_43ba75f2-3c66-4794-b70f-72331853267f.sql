
-- Add extra fields for comparison to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location text;

-- Add extra fields to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS format text;

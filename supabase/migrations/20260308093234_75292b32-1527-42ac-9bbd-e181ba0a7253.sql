ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
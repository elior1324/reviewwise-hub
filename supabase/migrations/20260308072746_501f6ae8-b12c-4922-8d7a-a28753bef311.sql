
-- Approved categories table (dynamic, replaces hardcoded lists)
CREATE TABLE public.approved_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('freelancer', 'course')),
  created_at timestamptz NOT NULL DEFAULT now(),
  auto_approved boolean NOT NULL DEFAULT false
);

ALTER TABLE public.approved_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by everyone" ON public.approved_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.approved_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing categories
INSERT INTO public.approved_categories (name, type) VALUES
  ('שיווק וסושיאל', 'freelancer'),
  ('עיצוב אתרים', 'freelancer'),
  ('עריכת וידאו', 'freelancer'),
  ('כתיבה שיווקית', 'freelancer'),
  ('קידום אורגני (SEO)', 'freelancer'),
  ('פיתוח אתרים', 'freelancer'),
  ('עיצוב גרפי', 'freelancer'),
  ('צילום מקצועי', 'freelancer'),
  ('ניהול קמפיינים', 'freelancer'),
  ('אסטרטגיה דיגיטלית', 'freelancer'),
  ('שיווק דיגיטלי', 'course'),
  ('תכנות ופיתוח', 'course'),
  ('עיצוב UI/UX', 'course'),
  ('מדעי נתונים', 'course'),
  ('עסקים ויזמות', 'course'),
  ('צילום ווידאו', 'course'),
  ('אחר', 'freelancer'),
  ('אחר', 'course')
ON CONFLICT (name) DO NOTHING;

-- Pending category suggestions table
CREATE TABLE public.pending_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('freelancer', 'course')),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert suggestions" ON public.pending_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view suggestions" ON public.pending_categories
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

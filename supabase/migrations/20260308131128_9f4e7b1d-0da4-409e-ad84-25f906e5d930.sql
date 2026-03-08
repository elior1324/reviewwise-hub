
-- Create testimonial_media table
CREATE TABLE public.testimonial_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'video',
  media_type text NOT NULL DEFAULT 'upload',
  external_url text,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonial_media ENABLE ROW LEVEL SECURITY;

-- Everyone can view testimonial media
CREATE POLICY "Testimonial media viewable by everyone"
  ON public.testimonial_media FOR SELECT
  USING (true);

-- Business owners can manage their own testimonial media
CREATE POLICY "Business owners can insert testimonial media"
  ON public.testimonial_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = testimonial_media.business_id
      AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can update testimonial media"
  ON public.testimonial_media FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = testimonial_media.business_id
      AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can delete testimonial media"
  ON public.testimonial_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = testimonial_media.business_id
      AND businesses.owner_id = auth.uid()
  ));

-- Create storage bucket for testimonials
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true);

-- Storage policies for testimonials bucket
CREATE POLICY "Authenticated users can upload testimonials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Anyone can view testimonials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonials');

CREATE POLICY "Business owners can delete testimonials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials');

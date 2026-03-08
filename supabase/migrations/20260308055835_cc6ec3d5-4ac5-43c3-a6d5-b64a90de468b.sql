
-- Fix affiliate_clicks: require course_id to exist
DROP POLICY "Anyone can insert clicks" ON public.affiliate_clicks;
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id)
);

-- Fix review_reports: require review_id to exist and a reason
DROP POLICY "Users can insert reports" ON public.review_reports;
CREATE POLICY "Authenticated users can insert reports" ON public.review_reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id)
);


DROP POLICY "Anyone can insert suggestions" ON public.pending_categories;
CREATE POLICY "Authenticated users can insert suggestions" ON public.pending_categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

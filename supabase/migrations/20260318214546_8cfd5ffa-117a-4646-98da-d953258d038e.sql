DROP POLICY IF EXISTS "Business owners can delete testimonials" ON storage.objects;
CREATE POLICY "Admins can delete testimonials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'testimonials'
    AND public.has_role(auth.uid(), 'admin')
  );
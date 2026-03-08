ALTER TABLE public.pending_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can delete pending categories"
ON public.pending_categories
FOR DELETE
TO service_role
USING (true);
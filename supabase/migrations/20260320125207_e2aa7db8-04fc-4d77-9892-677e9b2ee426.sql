-- Fix 1: Revoke direct UPDATE on subscription_tier from non-service-role users
-- The trigger already blocks it, but belt-and-suspenders: revoke column-level grant
REVOKE UPDATE (subscription_tier) ON public.businesses FROM anon;
REVOKE UPDATE (subscription_tier) ON public.businesses FROM authenticated;

-- Fix 2: Tighten affiliate_clicks INSERT policy to prevent click fraud
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can insert valid affiliate clicks" ON public.affiliate_clicks;

-- New policy: course must exist, converted must be false, revenue must be null
CREATE POLICY "Anyone can insert valid affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id)
    AND (converted IS NULL OR converted = false)
    AND revenue IS NULL
  );

-- Fix 3: Lock down user_roles to prevent privilege escalation
-- The current "Admins can manage roles" FOR ALL policy lets any admin INSERT
-- new admin roles. Tighten: block direct INSERT/UPDATE from all users.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can read and delete roles (for management UI)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Block direct INSERT/UPDATE — only handle_new_user trigger (SECURITY DEFINER) can write
CREATE POLICY "Block direct role inserts"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct role updates"
  ON public.user_roles FOR UPDATE
  USING (false);
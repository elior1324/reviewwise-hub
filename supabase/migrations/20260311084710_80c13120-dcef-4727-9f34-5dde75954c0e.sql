
-- 1. Fix profiles: replace broad SELECT with owner-only SELECT
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles readable (no email)" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public to read non-sensitive fields via a view (display_name, avatar_url, total_points, partner_badge)
-- But block direct anon access to the base table
REVOKE SELECT ON public.profiles FROM anon;

-- 2. Attach the existing protect_subscription_tier trigger function
DROP TRIGGER IF EXISTS prevent_tier_change ON public.businesses;
CREATE TRIGGER prevent_tier_change
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscription_tier();

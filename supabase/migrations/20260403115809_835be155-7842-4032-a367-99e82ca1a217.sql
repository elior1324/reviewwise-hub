-- 1. Fix leaderboard_entries: Replace FOR ALL policy with SELECT-only
DROP POLICY IF EXISTS "Users can view own entries" ON public.leaderboard_entries;
CREATE POLICY "Users can view own entries" ON public.leaderboard_entries
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Fix invoices storage: broken read policy (uses businesses.name instead of object name)
DROP POLICY IF EXISTS "Business owners can read own invoices" ON storage.objects;
CREATE POLICY "Business owners can read own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.owner_id = auth.uid()
        AND businesses.id::text = (storage.foldername(name))[2]
    )
  );

-- 3. Fix receipts upload: add user ownership check
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = 'receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 4. Fix reward_payouts INSERT policy: enforce status=pending and amount/points=0
DROP POLICY IF EXISTS "Users can request payout" ON public.reward_payouts;
CREATE POLICY "Users can request payout" ON public.reward_payouts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND amount = 0
    AND points = 0
  );
-- ============================================================
-- Migration: Verified Purchase + 7-Day Review Request + Monthly Giveaway
-- Date: 2026-03-15
-- ============================================================

-- ── 1. purchase_sessions ──────────────────────────────────────────────────
-- Tracks click-throughs via /go/:id affiliate redirect (before purchase)
CREATE TABLE IF NOT EXISTS public.purchase_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  business_id       uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  session_token     uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_email        text,
  referrer          text,
  user_agent        text,
  converted         boolean NOT NULL DEFAULT false,
  converted_at      timestamptz,
  clicked_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 2. verified_purchases ─────────────────────────────────────────────────
-- A confirmed purchase that came through ReviewHub link
CREATE TABLE IF NOT EXISTS public.verified_purchases (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_session_id     uuid REFERENCES public.purchase_sessions(id) ON DELETE SET NULL,
  course_id               uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  business_id             uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email              text,
  purchased_at            timestamptz NOT NULL DEFAULT now(),
  review_requested        boolean NOT NULL DEFAULT false,
  review_request_sent_at  timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 3. review_requests ────────────────────────────────────────────────────
-- 7-day post-purchase review request emails
CREATE TABLE IF NOT EXISTS public.review_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_purchase_id  uuid REFERENCES public.verified_purchases(id) ON DELETE CASCADE,
  user_email            text NOT NULL,
  course_id             uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  business_id           uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  token                 uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  sent_at               timestamptz,
  opened_at             timestamptz,
  reviewed_at           timestamptz,
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 4. giveaway_entries ───────────────────────────────────────────────────
-- One entry per verified review. Fraud: unique per user per giveaway month.
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_id             uuid REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE,
  verified_purchase_id  uuid REFERENCES public.verified_purchases(id) ON DELETE SET NULL,
  giveaway_month        text NOT NULL,   -- format: 'YYYY-MM'
  entered_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, giveaway_month)       -- one entry per user per month
);

-- ── 5. giveaway_winners ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.giveaway_winners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  giveaway_entry_id uuid REFERENCES public.giveaway_entries(id) ON DELETE SET NULL,
  prize_amount      numeric NOT NULL DEFAULT 5000,
  month_year        text NOT NULL UNIQUE,  -- e.g. '2026-03'
  announced_at      timestamptz,
  claimed_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_course_id    ON public.purchase_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_business_id  ON public.purchase_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_verified_purchases_user_id     ON public.verified_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_purchases_course_id   ON public.verified_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_token          ON public.review_requests(token);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_month         ON public.giveaway_entries(giveaway_month);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_user_id       ON public.giveaway_entries(user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.purchase_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_purchases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_winners     ENABLE ROW LEVEL SECURITY;

-- purchase_sessions: anonymous click tracking — anyone can insert
CREATE POLICY "insert purchase_sessions anon"
  ON public.purchase_sessions FOR INSERT WITH CHECK (true);

-- verified_purchases: service role (edge functions) insert/update
CREATE POLICY "service insert verified_purchases"
  ON public.verified_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "service update verified_purchases"
  ON public.verified_purchases FOR UPDATE USING (true);
-- Users can read their own
CREATE POLICY "select own verified_purchases"
  ON public.verified_purchases FOR SELECT USING (auth.uid() = user_id);

-- review_requests: service role insert/update; public read by token
CREATE POLICY "service insert review_requests"
  ON public.review_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "service update review_requests"
  ON public.review_requests FOR UPDATE USING (true);
CREATE POLICY "public select review_requests"
  ON public.review_requests FOR SELECT USING (true);

-- giveaway_entries: service role insert; users read own
CREATE POLICY "service insert giveaway_entries"
  ON public.giveaway_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "select own giveaway_entries"
  ON public.giveaway_entries FOR SELECT USING (auth.uid() = user_id);

-- giveaway_winners: public read (winner announcements)
CREATE POLICY "public read giveaway_winners"
  ON public.giveaway_winners FOR SELECT USING (true);
CREATE POLICY "service insert giveaway_winners"
  ON public.giveaway_winners FOR INSERT WITH CHECK (true);

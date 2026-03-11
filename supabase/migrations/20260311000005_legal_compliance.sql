-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: legal_compliance
-- Israeli Defamation Law (חוק איסור לשון הרע, התשכ"ה-1965) Compliance
--
-- Creates:
--   1. defamation_complaints — structured legal complaint workflow
--   2. review_public_log     — public transparency log (challenged-and-upheld)
--   3. ALTER reviews         — indemnity, verification_status, challenged columns
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. defamation_complaints ─────────────────────────────────────────────────
--
-- Stores formal legal takedown / defamation complaints submitted by any party
-- (business owners, private persons, or their legal representatives).
-- Drives the Notice & Takedown workflow required for Safe Harbor protection.

CREATE TABLE IF NOT EXISTS public.defamation_complaints (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The review this complaint targets
  review_id         UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,

  -- Who filed the complaint (may be a registered user or an external party)
  complainant_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  complainant_name  TEXT        NOT NULL,
  complainant_email TEXT        NOT NULL,

  -- Legal classification per חוק איסור לשון הרע + related laws
  complaint_type    TEXT        NOT NULL CHECK (complaint_type IN (
    'defamation',           -- לשון הרע — false & damaging statement
    'false_facts',          -- עובדות כוזבות — factually incorrect content
    'privacy_violation',    -- הפרת פרטיות — חוק הגנת הפרטיות התשמ"א-1981
    'confidentiality_breach', -- גילוי סודות — חוק עוולות מסחריות התשנ"ט-1999
    'ip_violation',         -- הפרת קניין רוחני
    'conflict_of_interest'  -- ניגוד עניינים — מתחרה שכתב ביקורת שלילית
  )),

  description       TEXT        NOT NULL CHECK (char_length(description) >= 20),

  -- Optional: URLs / references supporting the claim
  evidence_urls     TEXT[],

  -- Workflow status
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',            -- received, not yet assigned
    'under_review',       -- being reviewed by admin
    'resolved_upheld',    -- review kept — claim dismissed
    'resolved_removed',   -- review removed
    'resolved_edited',    -- review was edited/redacted
    'dismissed'           -- frivolous / bad-faith complaint
  )),

  -- Admin-only fields
  admin_notes       TEXT,
  resolution_date   TIMESTAMPTZ,

  -- Audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_defamation_complaint_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_defamation_complaints_updated_at
  BEFORE UPDATE ON public.defamation_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.set_defamation_complaint_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_defamation_complaints_review_id
  ON public.defamation_complaints (review_id);
CREATE INDEX IF NOT EXISTS idx_defamation_complaints_status
  ON public.defamation_complaints (status);
CREATE INDEX IF NOT EXISTS idx_defamation_complaints_complainant_id
  ON public.defamation_complaints (complainant_id)
  WHERE complainant_id IS NOT NULL;

-- ── RLS for defamation_complaints ────────────────────────────────────────────

ALTER TABLE public.defamation_complaints ENABLE ROW LEVEL SECURITY;

-- Authenticated users can INSERT (submit a complaint)
CREATE POLICY "Authenticated users can submit complaints"
  ON public.defamation_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- complainant_id must be their own uid if they are logged in
    complainant_id = auth.uid() OR complainant_id IS NULL
  );

-- Users can view their own complaints
CREATE POLICY "Users can view their own complaints"
  ON public.defamation_complaints
  FOR SELECT
  TO authenticated
  USING (complainant_id = auth.uid());

-- Anon can INSERT (external legal party submitting via public form)
-- They supply name + email for identity; no auth required
CREATE POLICY "Anon can submit complaints"
  ON public.defamation_complaints
  FOR INSERT
  TO anon
  WITH CHECK (complainant_id IS NULL);

-- Service role has full access (admin operations)
-- (service_role bypasses RLS by default)


-- ── 2. review_public_log ─────────────────────────────────────────────────────
--
-- Public transparency log. Every time a complaint is resolved, an entry is
-- written here so any visitor can see that a review was challenged.
-- This demonstrates the platform's good-faith operation under חוק איסור לשון הרע
-- and supports the "neutral intermediary / צינור" Safe Harbor argument.

CREATE TABLE IF NOT EXISTS public.review_public_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  review_id       UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  complaint_id    UUID        REFERENCES public.defamation_complaints(id) ON DELETE SET NULL,

  log_type        TEXT        NOT NULL CHECK (log_type IN (
    'complaint_received',  -- complaint filed
    'complaint_dismissed', -- dismissed by admin
    'review_upheld',       -- challenged but kept on platform
    'review_removed',      -- removed following complaint
    'review_edited'        -- redacted / edited following complaint
  )),

  -- Short Hebrew message shown to the public (keep PII-free)
  public_message  TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_public_log_review_id
  ON public.review_public_log (review_id);

-- ── RLS for review_public_log ────────────────────────────────────────────────

ALTER TABLE public.review_public_log ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon) can read the transparency log
CREATE POLICY "Public can read transparency log"
  ON public.review_public_log
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role (admin / Edge Functions) can insert/update/delete
-- (service_role bypasses RLS, so no INSERT policy needed for the public)


-- ── 3. ALTER TABLE reviews — legal compliance columns ────────────────────────

-- Indemnity: user explicitly accepted legal responsibility before submitting
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS indemnity_accepted     BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS indemnity_accepted_at  TIMESTAMPTZ;

-- Verification tier at time of submission
--   anonymous       → no email/purchase proof
--   email_verified  → Supabase email-verified account
--   purchase_verified → uploaded receipt that passed AI verification
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS verification_status    TEXT        NOT NULL DEFAULT 'anonymous'
    CHECK (verification_status IN ('anonymous', 'email_verified', 'purchase_verified'));

-- Reference to evidence file uploaded for "Truth Defense" (אמת בפרסום)
-- Stored encrypted in the invoices bucket; readable only by service_role
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS evidence_file_path     TEXT;

-- Flags set by admin when a complaint is resolved
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS challenged             BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS challenge_upheld       BOOLEAN; -- NULL = not yet resolved; TRUE = kept; FALSE = removed

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_reviews_challenged
  ON public.reviews (challenged)
  WHERE challenged = TRUE;

-- ── Summary comment ──────────────────────────────────────────────────────────
-- After this migration:
--   POST /rest/v1/defamation_complaints  → allowed for authenticated + anon (INSERT)
--   GET  /rest/v1/review_public_log      → public read (SELECT)
--   reviews.indemnity_accepted           → gated at submit-review Edge Function
--   reviews.challenged / challenge_upheld → set by admin via service_role

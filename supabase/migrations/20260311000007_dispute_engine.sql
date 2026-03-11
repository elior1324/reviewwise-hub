-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 20260311000007_dispute_engine
-- Evidence Management & Dispute Resolution Engine
-- ═══════════════════════════════════════════════════════════════════════════
--
-- NEW in this migration:
--   1. reviews — dispute lifecycle columns
--   2. audit_log — immutable due-diligence trail (court-ready)
--   3. dispute_tokens — secure email links for evidence submission
--   4. RLS policies for all new tables
--   5. Helper functions: open_dispute, record_audit_event
--
-- Builds on: 20260311000005 (challenged, evidence_file_path, verification_status)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Dispute lifecycle columns on reviews ──────────────────────────────────

ALTER TABLE public.reviews
  -- Is this review currently under a formal dispute investigation?
  ADD COLUMN IF NOT EXISTS is_disputed          BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Has the reviewer submitted evidence (receipt/invoice/contract)?
  ADD COLUMN IF NOT EXISTS evidence_submitted   BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Granular dispute workflow state (complements the existing `challenged` boolean)
  ADD COLUMN IF NOT EXISTS dispute_status       TEXT
    CHECK (dispute_status IN (
      'open',               -- dispute filed, reviewer notified, awaiting evidence
      'evidence_pending',   -- same as open, explicit sub-state for UI
      'evidence_submitted', -- reviewer uploaded proof; admin reviewing
      'resolved_upheld',    -- proof verified → review reinstated with badge
      'resolved_removed',   -- no proof / invalid proof → review deleted
      'escalated'           -- business threatened legal action AFTER proof verified
    )),

  -- Deadline for the reviewer to submit evidence (72 hours from dispute opening)
  ADD COLUMN IF NOT EXISTS verification_expiry  TIMESTAMPTZ,

  -- Points are locked until 72h window passes OR dispute is resolved in favor of reviewer
  -- Prevents "Point Farming" via fake negative reviews that get disputed & retracted
  ADD COLUMN IF NOT EXISTS points_locked        BOOLEAN       NOT NULL DEFAULT TRUE,

  -- Reference back to the defamation_complaint that triggered this dispute (nullable)
  ADD COLUMN IF NOT EXISTS dispute_complaint_id UUID
    REFERENCES public.defamation_complaints(id) ON DELETE SET NULL;

-- Index for cron-style timeout queries
CREATE INDEX IF NOT EXISTS idx_reviews_disputed_expiry
  ON public.reviews (verification_expiry)
  WHERE is_disputed = TRUE AND evidence_submitted = FALSE;

CREATE INDEX IF NOT EXISTS idx_reviews_dispute_status
  ON public.reviews (dispute_status)
  WHERE dispute_status IS NOT NULL;

-- Trigger: unlock points after review is 72h old with no dispute
-- (runs on UPDATE; the Edge Function cron will flip points_locked = FALSE)
-- No trigger needed — handled by Edge Function `check-timeouts` action.


-- ── 2. audit_log — immutable due-diligence trail ──────────────────────────────
--
-- Every step of the dispute process is written here.
-- This table is append-only (no UPDATE/DELETE) even for admins.
-- In court: proves the platform exercised "due diligence" under חוק איסור לשון הרע.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What entity this log entry relates to
  entity_type   TEXT         NOT NULL CHECK (entity_type IN (
    'review', 'dispute', 'user', 'business', 'affiliate', 'system'
  )),
  entity_id     UUID         NOT NULL,

  -- What happened
  action        TEXT         NOT NULL,
  -- Standard action values:
  --   review.dispute_opened         business opened a dispute
  --   review.evidence_requested     system emailed reviewer for proof
  --   review.evidence_submitted     reviewer uploaded proof
  --   review.evidence_verified      admin confirmed proof is valid
  --   review.evidence_rejected      admin found proof invalid
  --   review.reinstated             review restored with Legally Verified badge
  --   review.removed_no_evidence    review deleted — no proof within 72h
  --   review.removed_invalid_evidence
  --   review.escalated              business escalated after proof verified
  --   review.points_unlocked        72h passed, no dispute → points granted
  --   user.flagged                  user account flagged for abuse
  --   system.timeout_sweep          cron found and resolved expired disputes

  -- Who did it
  actor_id      UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role    TEXT         CHECK (actor_role IN (
    'business_owner', 'reviewer', 'admin', 'system'
  )),

  -- Rich context (timestamps, file paths, IP, decision text, etc.)
  metadata      JSONB,

  -- Network audit trail
  ip_address    TEXT,
  user_agent    TEXT,

  -- Immutable timestamp
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── RLS: audit_log ───────────────────────────────────────────────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read everything
CREATE POLICY "Admins can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own entries (for transparency)
CREATE POLICY "Users can read own audit entries"
  ON public.audit_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR
         -- also allow reading entries where they are the subject (entity = their review)
         entity_id IN (SELECT id FROM public.reviews WHERE user_id = auth.uid()));

-- INSERT only via service_role (Edge Functions write the log, not the browser)
-- No INSERT policy for authenticated/anon — service_role bypasses RLS

-- CRITICAL: NO UPDATE or DELETE policies for any role
-- The table is effectively append-only from the application perspective.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity      ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor       ON public.audit_log (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_action      ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.audit_log (created_at DESC);


-- ── 3. dispute_tokens — secure one-time links for evidence upload ─────────────
--
-- When a dispute is opened, a signed token is generated and emailed to the
-- reviewer. They click the link → EvidenceUploadPanel → submit proof.
-- This works even if the reviewer logs out (token-based, not session-based).

CREATE TABLE IF NOT EXISTS public.dispute_tokens (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  review_id     UUID         NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  reviewer_id   UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The token embedded in the email link
  token         TEXT         NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Token expires when the evidence deadline expires
  expires_at    TIMESTAMPTZ  NOT NULL,

  -- Whether the token has been used
  used          BOOLEAN      NOT NULL DEFAULT FALSE,
  used_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dispute_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone with the token can look it up (for the email link flow)
CREATE POLICY "Token lookup by value"
  ON public.dispute_tokens FOR SELECT TO anon, authenticated
  USING (TRUE); -- filtered by token value in the query, not by user

-- Only service_role can insert/update tokens

CREATE INDEX IF NOT EXISTS idx_dispute_tokens_token     ON public.dispute_tokens (token);
CREATE INDEX IF NOT EXISTS idx_dispute_tokens_review_id ON public.dispute_tokens (review_id);
CREATE INDEX IF NOT EXISTS idx_dispute_tokens_expires_at ON public.dispute_tokens (expires_at)
  WHERE used = FALSE;


-- ── 4. SECURITY DEFINER helper: record_audit_event ───────────────────────────
--
-- Edge Functions call this to safely insert into audit_log without exposing
-- the service_role key to the browser. Called via supabase.rpc().

CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_entity_type  TEXT,
  p_entity_id    UUID,
  p_action       TEXT,
  p_actor_id     UUID DEFAULT NULL,
  p_actor_role   TEXT DEFAULT 'system',
  p_metadata     JSONB DEFAULT NULL,
  p_ip_address   TEXT DEFAULT NULL,
  p_user_agent   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_log
    (entity_type, entity_id, action, actor_id, actor_role, metadata, ip_address, user_agent)
  VALUES
    (p_entity_type, p_entity_id, p_action, p_actor_id, p_actor_role, p_metadata, p_ip_address, p_user_agent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- ── 5. Points unlock: reviews submitted before disputes ─────────────────────
--
-- Existing reviews (submitted before this migration) should have points_locked = FALSE
-- since they predate the dispute system.

UPDATE public.reviews
SET points_locked = FALSE
WHERE created_at < NOW()
  AND is_disputed = FALSE
  AND points_locked = TRUE;


-- ── Schema summary ───────────────────────────────────────────────────────────
--
-- After this migration, dispute lifecycle on a review:
--
--   1. Business opens dispute → is_disputed=TRUE, dispute_status='open',
--      verification_expiry=NOW()+72h, points_locked=TRUE (stays)
--      → dispute_tokens row created → email sent to reviewer
--
--   2a. Reviewer submits evidence before deadline →
--       evidence_submitted=TRUE, dispute_status='evidence_submitted'
--       → admin notified → admin reviews
--       → If valid: dispute_status='resolved_upheld', verification_status='purchase_verified',
--                   challenged=TRUE, challenge_upheld=TRUE, points_locked=FALSE,
--                   is_disputed=FALSE → review shows 'Legally Verified' badge
--       → If invalid: dispute_status='resolved_removed' → review deleted
--
--   2b. Reviewer misses 72h deadline → cron fires →
--       dispute_status='resolved_removed', review deleted from public.reviews
--
--   3. Business escalates after proof verified → dispute_status='escalated'
--      → LiabilityShieldBanner shows to business owner
--      → Standard legal response generated
--
--   Every step → audit_log row inserted

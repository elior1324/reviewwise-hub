-- ============================================================
-- Migration 000010: Anti-Fraud Verification Engine (AFVE)
-- ============================================================
--
-- Adds:
--   1. verification_logs    — immutable audit trail per file/review
--   2. fraud_alerts         — triggered investigations & account locks
--   3. e2v_tokens           — Email-to-Verify inbound email tracking
--   4. merchant_verif_queue — Merchant Confirm/Reject workflow
--   5. profiles.trust_score — user trust level (0–100)
--   6. reviews.afve_status  — AFVE result per review
--   7. DB functions:
--        fn_calculate_trust_score()
--        fn_lock_account_for_fraud()
--        fn_process_merchant_decision()
--   8. Trigger: trg_update_trust_score on reviews AFTER UPDATE
-- ============================================================

-- ─── 1. verification_logs ─────────────────────────────────────────────────────
-- Immutable — INSERT only. Stores ONLY hashed evidence, never raw files.
-- Safe Harbor: full invoice is never stored, only SHA-256 hash + result.

CREATE TABLE IF NOT EXISTS public.verification_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id           UUID        REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id             UUID        REFERENCES auth.users(id)     ON DELETE SET NULL,
  business_id         UUID        REFERENCES public.businesses(id) ON DELETE SET NULL,

  -- Method used for this verification pass
  method              TEXT        NOT NULL CHECK (method IN (
                                    'invoice_hash',       -- SHA-256 match on file bytes
                                    'merchant_confirmed', -- business owner confirmed the invoice
                                    'e2v_email',          -- SPF/DKIM/DMARC email chain
                                    'ai_metadata',        -- PDF/image forensic scan
                                    'ai_text',            -- review text perplexity/burstiness
                                    'manual_admin'        -- human review by ReviewHub staff
                                  )),

  -- Result
  passed              BOOLEAN     NOT NULL DEFAULT FALSE,
  confidence_score    NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Safe Harbor: hashed evidence only
  file_hash_sha256    TEXT,        -- SHA-256 of the uploaded file (hex)
  file_mime           TEXT,        -- detected MIME type

  -- Forensic metadata flags (never store file content here)
  metadata_flags      JSONB        NOT NULL DEFAULT '{}',
  -- e.g. { "pdf_producer": "Canva", "flagged_producer": true,
  --        "ai_artifact_score": 0.82, "font_inconsistency": true,
  --        "spf_pass": true, "dkim_pass": true, "dmarc_pass": true,
  --        "text_perplexity": 45.2, "text_burstiness": 0.31 }

  -- Outcome reason string (human-readable, for admin dashboard)
  reason              TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE — immutable audit trail
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own verification logs"
  ON public.verification_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service role full access vlog"
  ON public.verification_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Index for fast review-level lookups
CREATE INDEX IF NOT EXISTS idx_vlog_review_id  ON public.verification_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_vlog_user_id    ON public.verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vlog_file_hash  ON public.verification_logs(file_hash_sha256);

-- ─── 2. fraud_alerts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id)    ON DELETE SET NULL,
  review_id       UUID        REFERENCES public.reviews(id) ON DELETE SET NULL,
  business_id     UUID        REFERENCES public.businesses(id) ON DELETE SET NULL,

  alert_type      TEXT        NOT NULL CHECK (alert_type IN (
                                'merchant_rejected',   -- business owner flagged invoice as non-existent
                                'hash_collision',      -- same invoice hash used by multiple users
                                'ai_generated_text',   -- review text scored as LLM output
                                'ai_artifact_image',   -- image forensics flagged Canva/PS artifact
                                'email_spf_fail',      -- E2V email failed SPF/DKIM/DMARC
                                'velocity_abuse',      -- too many reviews in short window
                                'sybil_likes',         -- sybil attack on review likes
                                'manual_flag'          -- flagged by admin
                              )),

  severity        TEXT        NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          TEXT        NOT NULL DEFAULT 'open'   CHECK (status   IN ('open', 'investigating', 'resolved', 'dismissed')),

  -- Detailed evidence snapshot
  evidence        JSONB        NOT NULL DEFAULT '{}',

  -- Account action taken
  account_locked  BOOLEAN      NOT NULL DEFAULT FALSE,
  review_hidden   BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_by     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access fraud"
  ON public.fraud_alerts FOR ALL
  USING (auth.role() = 'service_role');

-- Users can see alerts about themselves (transparency)
CREATE POLICY "users read own fraud alerts"
  ON public.fraud_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_fraud_user     ON public.fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_status   ON public.fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_type     ON public.fraud_alerts(alert_type);

-- ─── 3. e2v_tokens ────────────────────────────────────────────────────────────
-- Each row represents a unique verify@reviewhub.co.il inbox token
-- bound to a (user, review) pair.

CREATE TABLE IF NOT EXISTS public.e2v_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id       UUID        REFERENCES public.reviews(id)       ON DELETE SET NULL,
  business_id     UUID        REFERENCES public.businesses(id)    ON DELETE SET NULL,

  -- The unique sub-address: verify+<token_code>@reviewhub.co.il
  token_code      TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at         TIMESTAMPTZ,

  -- Email received metadata (stored after inbound email arrives)
  sender_email    TEXT,
  sender_domain   TEXT,
  spf_result      TEXT,   -- 'pass' | 'fail' | 'softfail' | 'neutral'
  dkim_result     TEXT,   -- 'pass' | 'fail' | 'permerror'
  dmarc_result    TEXT,   -- 'pass' | 'fail' | 'none'
  email_subject   TEXT,
  invoice_number  TEXT,   -- extracted from email body
  invoice_amount  NUMERIC(12,2),

  -- Result
  verification_passed BOOLEAN,
  failure_reason      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.e2v_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own e2v tokens"
  ON public.e2v_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users insert own e2v tokens"
  ON public.e2v_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service role full access e2v"
  ON public.e2v_tokens FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_e2v_token_code ON public.e2v_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_e2v_user_id    ON public.e2v_tokens(user_id);

-- ─── 4. merchant_verif_queue ──────────────────────────────────────────────────
-- Pro-tier businesses receive one of these rows per submitted review.
-- The business owner confirms or rejects from their dashboard.

CREATE TABLE IF NOT EXISTS public.merchant_verif_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       UUID        NOT NULL REFERENCES public.reviews(id)     ON DELETE CASCADE,
  business_id     UUID        NOT NULL REFERENCES public.businesses(id)  ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,

  -- The hash we present to the merchant (never the full file)
  invoice_hash    TEXT        NOT NULL,
  invoice_amount  NUMERIC(12,2),
  invoice_number  TEXT,
  invoice_date    DATE,

  -- Status
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),

  -- Token used in email link (so merchant doesn't need to log in)
  confirm_token   TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',

  -- Decision
  decided_at      TIMESTAMPTZ,
  decision_note   TEXT,

  -- Notification state
  notification_sent_at TIMESTAMPTZ,
  reminder_sent_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merchant_verif_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business owners manage their queue"
  ON public.merchant_verif_queue FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "service role full access mvq"
  ON public.merchant_verif_queue FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_mvq_business_id    ON public.merchant_verif_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_mvq_status         ON public.merchant_verif_queue(status);
CREATE INDEX IF NOT EXISTS idx_mvq_confirm_token  ON public.merchant_verif_queue(confirm_token);

-- ─── 5. Add columns to profiles & reviews ────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN trust_score       SMALLINT  NOT NULL DEFAULT 10
                                           CHECK (trust_score BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN fraud_locked      BOOLEAN   NOT NULL DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN fraud_locked_at   TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN afve_status       TEXT      NOT NULL DEFAULT 'pending'
                                           CHECK (afve_status IN (
                                             'pending',          -- not yet checked
                                             'verified',         -- at least one method passed
                                             'partial',          -- some checks passed, some failed
                                             'flagged',          -- suspicious — hidden pending review
                                             'rejected',         -- definitively fraudulent
                                             'manual_review'     -- sent to human queue
                                           ));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN afve_methods      TEXT[]    NOT NULL DEFAULT '{}';
  -- e.g. ARRAY['invoice_hash', 'ai_text']
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN afve_score        NUMERIC(4,3);
  -- Composite confidence 0–1 across all AFVE methods
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─── 6. fn_calculate_trust_score ─────────────────────────────────────────────
-- Recomputes a user's trust_score from their review history.
-- New users: 10 (low). 5+ verified, non-disputed reviews: up to 85.
-- Fraud lock: sets to 0.

CREATE OR REPLACE FUNCTION public.fn_calculate_trust_score(p_user_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_verified_count   INTEGER := 0;
  v_disputed_count   INTEGER := 0;
  v_rejected_count   INTEGER := 0;
  v_fraud_locked     BOOLEAN := FALSE;
  v_score            SMALLINT;
BEGIN
  -- Check if account is already locked
  SELECT fraud_locked INTO v_fraud_locked
  FROM public.profiles WHERE id = p_user_id;
  IF v_fraud_locked THEN RETURN 0; END IF;

  SELECT
    COUNT(*) FILTER (WHERE afve_status = 'verified'),
    COUNT(*) FILTER (WHERE afve_status = 'rejected' OR afve_status = 'flagged'),
    COUNT(*) FILTER (WHERE status = 'disputed')
  INTO v_verified_count, v_rejected_count, v_disputed_count
  FROM public.reviews
  WHERE user_id = p_user_id AND is_hidden = FALSE;

  -- Base score: 10 per verified review, capped at 50
  v_score := LEAST(10 + (v_verified_count * 10), 60);

  -- Penalty: -20 per rejected/flagged review
  v_score := GREATEST(v_score - (v_rejected_count * 20), 0);

  -- Penalty: -10 per disputed review
  v_score := GREATEST(v_score - (v_disputed_count * 10), 0);

  -- Bonus: +10 if >= 5 verified (high-trust tier)
  IF v_verified_count >= 5  THEN v_score := LEAST(v_score + 10, 85); END IF;
  IF v_verified_count >= 10 THEN v_score := LEAST(v_score + 15, 95); END IF;

  -- Never exceed 100
  v_score := LEAST(v_score, 100);

  -- Persist
  UPDATE public.profiles SET trust_score = v_score WHERE id = p_user_id;
  RETURN v_score;
END;
$$;

-- ─── 7. fn_lock_account_for_fraud ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_lock_account_for_fraud(
  p_user_id  UUID,
  p_reason   TEXT DEFAULT 'fraud_investigation'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lock the profile
  UPDATE public.profiles
  SET fraud_locked    = TRUE,
      fraud_locked_at = NOW(),
      trust_score     = 0
  WHERE id = p_user_id;

  -- Hide all pending/flagged reviews from this user
  UPDATE public.reviews
  SET is_hidden  = TRUE,
      afve_status = 'flagged'
  WHERE user_id   = p_user_id
    AND afve_status IN ('pending', 'partial', 'flagged');

  -- Open a critical fraud alert
  INSERT INTO public.fraud_alerts
    (user_id, alert_type, severity, status, account_locked, evidence)
  VALUES
    (p_user_id, 'merchant_rejected', 'critical', 'investigating', TRUE,
     jsonb_build_object('lock_reason', p_reason, 'locked_at', NOW()));
END;
$$;

-- ─── 8. fn_process_merchant_decision ─────────────────────────────────────────
-- Called when a merchant clicks Confirm or Reject via the token link.

CREATE OR REPLACE FUNCTION public.fn_process_merchant_decision(
  p_confirm_token TEXT,
  p_decision      TEXT,   -- 'confirmed' | 'rejected'
  p_decision_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_queue   public.merchant_verif_queue%ROWTYPE;
  v_result  JSONB;
BEGIN
  -- Fetch queue row
  SELECT * INTO v_queue
  FROM public.merchant_verif_queue
  WHERE confirm_token = p_confirm_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'token_invalid_or_expired');
  END IF;

  IF p_decision NOT IN ('confirmed', 'rejected') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_decision');
  END IF;

  -- Update queue row
  UPDATE public.merchant_verif_queue
  SET status       = p_decision,
      decided_at   = NOW(),
      decision_note = p_decision_note,
      updated_at   = NOW()
  WHERE id = v_queue.id;

  IF p_decision = 'confirmed' THEN
    -- Upgrade review afve_status
    UPDATE public.reviews
    SET afve_status  = 'verified',
        afve_methods = array_append(COALESCE(afve_methods, '{}'), 'merchant_confirmed')
    WHERE id = v_queue.review_id;

    -- Insert verification log
    INSERT INTO public.verification_logs
      (review_id, user_id, business_id, method, passed, confidence_score, reason)
    VALUES
      (v_queue.review_id, v_queue.user_id, v_queue.business_id,
       'merchant_confirmed', TRUE, 1.0, 'Business owner confirmed invoice');

    -- Recalculate trust score
    PERFORM public.fn_calculate_trust_score(v_queue.user_id);

    v_result := jsonb_build_object('success', TRUE, 'action', 'review_verified');

  ELSE
    -- Rejected — lock account
    PERFORM public.fn_lock_account_for_fraud(v_queue.user_id, 'merchant_rejected_invoice');

    -- Insert fraud alert
    INSERT INTO public.fraud_alerts
      (user_id, review_id, business_id, alert_type, severity, status,
       account_locked, review_hidden, evidence)
    VALUES
      (v_queue.user_id, v_queue.review_id, v_queue.business_id,
       'merchant_rejected', 'critical', 'investigating',
       TRUE, TRUE,
       jsonb_build_object(
         'invoice_hash',   v_queue.invoice_hash,
         'invoice_amount', v_queue.invoice_amount,
         'decision_note',  p_decision_note
       ));

    -- Insert verification log
    INSERT INTO public.verification_logs
      (review_id, user_id, business_id, method, passed, confidence_score, reason)
    VALUES
      (v_queue.review_id, v_queue.user_id, v_queue.business_id,
       'merchant_confirmed', FALSE, 1.0, 'Business owner rejected — invoice non-existent');

    v_result := jsonb_build_object('success', TRUE, 'action', 'account_locked');
  END IF;

  RETURN v_result;
END;
$$;

-- ─── 9. Trigger: auto-recalculate trust score ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_trust_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.afve_status IS DISTINCT FROM OLD.afve_status
     OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
    PERFORM public.fn_calculate_trust_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_trust_score ON public.reviews;
CREATE TRIGGER trg_refresh_trust_score
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_refresh_trust_score();

-- ─── 10. Hash-collision detector ──────────────────────────────────────────────
-- If the same invoice hash appears for ≥ 2 different users → velocity fraud alert

CREATE OR REPLACE FUNCTION public.fn_detect_hash_collision(
  p_file_hash  TEXT,
  p_user_id    UUID,
  p_review_id  UUID
)
RETURNS BOOLEAN   -- TRUE = collision found
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_other_user UUID;
BEGIN
  SELECT user_id INTO v_other_user
  FROM public.verification_logs
  WHERE file_hash_sha256 = p_file_hash
    AND user_id <> p_user_id
    AND passed = TRUE
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.fraud_alerts
      (user_id, review_id, alert_type, severity, status, account_locked, evidence)
    VALUES
      (p_user_id, p_review_id, 'hash_collision', 'high', 'open', FALSE,
       jsonb_build_object(
         'file_hash',       p_file_hash,
         'colliding_user',  v_other_user
       ));
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- ─── 11. pg_cron: expire stale merchant queue items ──────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'reviewhub-expire-merchant-queue',
      '0 * * * *',   -- every hour
      $$
        UPDATE public.merchant_verif_queue
        SET status     = 'expired',
            updated_at = NOW()
        WHERE status     = 'pending'
          AND expires_at < NOW();
      $$
    );
  END IF;
END;
$$;

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  public.verification_logs       IS 'Immutable AFVE audit trail — Safe Harbor: stores hash only, never raw file.';
COMMENT ON TABLE  public.fraud_alerts            IS 'Fraud investigation ledger — triggers account locks and review suppression.';
COMMENT ON TABLE  public.e2v_tokens              IS 'Email-to-Verify inbound tokens: verify+<code>@reviewhub.co.il';
COMMENT ON TABLE  public.merchant_verif_queue    IS 'Merchant Confirm/Reject workflow for Pro-tier businesses.';
COMMENT ON COLUMN public.profiles.trust_score    IS 'AFVE trust level 0-100. New=10, 5+ verified reviews=55+, fraud=0.';
COMMENT ON COLUMN public.reviews.afve_status     IS 'AFVE result: pending|verified|partial|flagged|rejected|manual_review';

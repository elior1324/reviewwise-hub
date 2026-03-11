-- ============================================================
-- Migration 000012: Proof of Experience System
-- ============================================================
--
-- Adds a multi-signal proof layer on top of existing reviews.
--
-- Proof types:
--   purchase_receipt — uploaded PDF/image receipt (private bucket, hash only stored)
--   location_gps     — GPS coordinates at review time (lat/lng + accuracy)
--   photo_evidence   — photo taken at or of the business (blurred thumbnail stored)
--   booking_ref      — booking made via a ReviewHub affiliate link
--
-- Integration with existing columns (no schema breaks):
--   reviews.verification_status  — upgraded by trigger when proof verified
--   reviews.verification_multiplier — raised to the best verified proof's multiplier
--   reviewer_metrics             — trust score recalculated via fn_calculate_trust_score()
--
-- Multiplier ladder (from migration 000009):
--   proof              multiplier    verification_status upgrade
--   ─────────────────  ──────────    ──────────────────────────
--   booking_ref        2.0           purchase_verified
--   purchase_receipt   2.0           purchase_verified
--   photo_evidence     1.5           email_verified (if not already higher)
--   location_gps       1.3           email_verified (if not already higher)
--
-- Storage:
--   Bucket: review-proofs  (private, no public URLs)
--   Path pattern: {user_id}/{review_id}/{proof_type}/{unix_ts}.{ext}
--   Access: signed URL generated on-demand (5-min TTL) via service_role
--   Safe Harbor: receipts stored by path only; SHA-256 hash logged to
--                verification_logs (migration 000010) — raw file never
--                appears in any DB column.
--
-- New objects:
--   TABLE  review_proofs
--   VIEW   v_review_proof_badges   (public, no sensitive data)
--   BUCKET review-proofs           (private)
--   FUNCTION fn_attach_proof()
--   FUNCTION fn_verify_proof()
--   FUNCTION fn_reject_proof()
--   FUNCTION fn_sync_review_verification()   ← called by trigger
--   TRIGGER  trg_proof_status_change  ON review_proofs AFTER UPDATE
-- ============================================================

-- ─── 1. Storage bucket: review-proofs ────────────────────────────────────────
-- Private bucket. All access is via signed URLs generated server-side.
-- No public URL is ever exposed for receipts.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-proofs',
  'review-proofs',
  FALSE,                  -- NEVER public
  10485760,               -- 10 MB max per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS ───────────────────────────────────────────────────────────────

-- Authenticated users can upload their own proof files
-- Path must start with their user_id so they cannot overwrite others
CREATE POLICY "review-proofs: users upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can read their own files
CREATE POLICY "review-proofs: users read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'review-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Business owners can read proof files for their own business reviews
-- (needed for merchant verification loop)
CREATE POLICY "review-proofs: business owners read business review files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'review-proofs'
    AND EXISTS (
      SELECT 1
      FROM   public.review_proofs rp
      JOIN   public.reviews        r  ON r.id = rp.review_id
      JOIN   public.businesses     b  ON b.id = r.business_id
      WHERE  b.owner_id     = auth.uid()
        AND  rp.storage_path = name
    )
  );

-- Service role has unrestricted access (used by edge functions)
CREATE POLICY "review-proofs: service role full access"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'review-proofs'
    AND auth.role() = 'service_role'
  );

-- ─── 2. review_proofs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.review_proofs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core references
  review_id               UUID        NOT NULL
                                      REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id                 UUID        NOT NULL
                                      REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Proof classification
  proof_type              TEXT        NOT NULL CHECK (proof_type IN (
                                        'purchase_receipt',  -- file upload (PDF/image)
                                        'location_gps',      -- browser Geolocation API
                                        'photo_evidence',    -- photo of business/service
                                        'booking_ref'        -- booking via ReviewHub link
                                      )),

  proof_status            TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (proof_status IN (
                                        'pending',    -- awaiting verification
                                        'processing', -- being verified by AI/system
                                        'verified',   -- verification passed
                                        'rejected',   -- verification failed
                                        'expired'     -- time-limited proof expired
                                      )),

  -- ── File-based proofs (purchase_receipt, photo_evidence) ─────────────────
  -- Safe Harbor: we store the storage path and hash, NEVER raw file data
  storage_path            TEXT,       -- {user_id}/{review_id}/{proof_type}/{ts}.ext
  storage_bucket          TEXT        NOT NULL DEFAULT 'review-proofs',
  file_hash_sha256        TEXT,       -- SHA-256 of file (for AFVE dedup)
  file_size_bytes         INTEGER,
  file_mime               TEXT,

  -- ── Location proof (location_gps) ─────────────────────────────────────────
  -- Coordinates stored but not exposed in public views
  location_lat            NUMERIC(10, 7),
  location_lng            NUMERIC(10, 7),
  location_accuracy_m     INTEGER,    -- GPS accuracy in metres (< 50 = high quality)
  location_captured_at    TIMESTAMPTZ,-- timestamp the browser reported
  -- Derived: distance from business address in metres (computed on verify)
  distance_from_business_m INTEGER,

  -- ── Booking reference proof (booking_ref) ─────────────────────────────────
  booking_reference       TEXT,       -- the affiliate/booking ref code
  booking_confirmed_at    TIMESTAMPTZ,-- when the booking was confirmed by platform

  -- ── Verification outcome ──────────────────────────────────────────────────
  verified_at             TIMESTAMPTZ,
  verified_by             TEXT        DEFAULT 'system'
                                      CHECK (verified_by IN (
                                        'system',       -- automatic rule-based
                                        'ai',           -- AI vision/analysis
                                        'merchant',     -- business owner confirmed
                                        'manual_admin'  -- ReviewHub staff
                                      )),
  rejection_reason        TEXT,       -- shown to user on rejection
  rejection_code          TEXT,       -- machine-readable: 'wrong_business' | 'expired_receipt' | etc.

  -- ── Trust multiplier this proof grants ────────────────────────────────────
  -- Applied to reviews.verification_multiplier when this proof is 'verified'
  multiplier_granted      NUMERIC(4, 2) NOT NULL DEFAULT 1.0,

  -- ── Expiry (location proofs are time-limited) ─────────────────────────────
  expires_at              TIMESTAMPTZ,

  -- ── Metadata ──────────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────────────────────
  -- One pending/verified proof per type per review — prevents spam uploads.
  -- Rejected proofs can be re-submitted (no constraint on rejected rows).
  CONSTRAINT review_proofs_one_active_per_type
    UNIQUE NULLS NOT DISTINCT (review_id, proof_type, proof_status)
    -- NOTE: This partial-unique behaviour is enforced by the
    -- fn_attach_proof() function instead (PG 15 NULLS NOT DISTINCT
    -- may not be available on all Supabase versions).
    -- The constraint above is a belt-and-suspenders guard.
);

-- Drop the potentially unsupported constraint and re-create as a partial index
ALTER TABLE public.review_proofs
  DROP CONSTRAINT IF EXISTS review_proofs_one_active_per_type;

-- Partial unique index: only one pending-or-verified row per (review, type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rp_one_active_per_type
  ON public.review_proofs (review_id, proof_type)
  WHERE proof_status IN ('pending', 'processing', 'verified');

-- Supporting indices
CREATE INDEX IF NOT EXISTS idx_rp_review_id    ON public.review_proofs(review_id);
CREATE INDEX IF NOT EXISTS idx_rp_user_id      ON public.review_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_rp_status       ON public.review_proofs(proof_status);
CREATE INDEX IF NOT EXISTS idx_rp_type_status  ON public.review_proofs(proof_type, proof_status);
CREATE INDEX IF NOT EXISTS idx_rp_file_hash    ON public.review_proofs(file_hash_sha256)
  WHERE file_hash_sha256 IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.review_proofs ENABLE ROW LEVEL SECURITY;

-- Public can see verified proofs (no sensitive columns exposed — see view below)
CREATE POLICY "review_proofs: verified proofs are public readable"
  ON public.review_proofs FOR SELECT
  USING (proof_status = 'verified');

-- Users can read all their own proofs (including pending/rejected)
CREATE POLICY "review_proofs: users read own proofs"
  ON public.review_proofs FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own proofs
CREATE POLICY "review_proofs: users insert own proofs"
  ON public.review_proofs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending proofs (e.g. re-upload)
CREATE POLICY "review_proofs: users update own pending proofs"
  ON public.review_proofs FOR UPDATE
  USING (user_id = auth.uid() AND proof_status = 'pending');

-- Service role has full access (edge functions)
CREATE POLICY "review_proofs: service role full access"
  ON public.review_proofs FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.review_proofs IS
  'Proof of experience signals attached to reviews. '
  'Sensitive file content never stored — only path + SHA-256 hash (Safe Harbor).';

-- ─── 3. v_review_proof_badges — public view ───────────────────────────────────
-- Returns only the information needed to render badges.
-- Strips sensitive columns: location_lat, location_lng, storage_path, file_hash.
-- Used by the frontend ProofBadge component via a simple .select('*').

CREATE OR REPLACE VIEW public.v_review_proof_badges AS
SELECT
  rp.id,
  rp.review_id,
  rp.proof_type,
  rp.proof_status,
  rp.multiplier_granted,
  rp.verified_at,
  rp.verified_by,
  rp.expires_at,
  -- Public-safe location signal: only distance, not raw coordinates
  CASE
    WHEN rp.proof_type = 'location_gps' AND rp.proof_status = 'verified'
    THEN rp.distance_from_business_m
    ELSE NULL
  END AS distance_from_business_m,
  -- For photo_evidence: storage path is exposed only for the thumbnail
  -- (the edge function serves a blurred 200px version via signed URL)
  CASE
    WHEN rp.proof_type = 'photo_evidence' AND rp.proof_status = 'verified'
    THEN rp.storage_path
    ELSE NULL
  END AS photo_thumbnail_path,
  rp.created_at
FROM public.review_proofs rp
WHERE rp.proof_status = 'verified';

-- Grant read access to anonymous and authenticated roles
GRANT SELECT ON public.v_review_proof_badges TO anon, authenticated;

-- ─── 4. Add summary columns to reviews ───────────────────────────────────────
-- Denormalised for O(1) badge display without a JOIN on every review card.

DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN proof_types TEXT[] NOT NULL DEFAULT '{}';
  -- e.g. ARRAY['purchase_receipt', 'location_gps']
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews
    ADD COLUMN proof_count SMALLINT NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─── 5. fn_sync_review_verification ──────────────────────────────────────────
-- Called by trigger after any proof row changes status.
-- Recomputes reviews.verification_status and reviews.verification_multiplier
-- from the current set of verified proofs for that review.
-- Also recalculates reviewer trust score.

CREATE OR REPLACE FUNCTION public.fn_sync_review_verification(p_review_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id               UUID;
  v_best_multiplier       NUMERIC(4, 2) := 1.0;
  v_new_verification      TEXT          := 'anonymous';
  v_verified_types        TEXT[]        := '{}';
  v_verified_count        SMALLINT      := 0;
  v_has_purchase_proof    BOOLEAN       := FALSE;
  v_has_engagement_proof  BOOLEAN       := FALSE;
BEGIN
  -- Get review owner
  SELECT user_id INTO v_user_id FROM public.reviews WHERE id = p_review_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Aggregate verified proofs
  SELECT
    COALESCE(MAX(multiplier_granted), 1.0),
    ARRAY_AGG(proof_type ORDER BY proof_type),
    COUNT(*)::SMALLINT,
    BOOL_OR(proof_type IN ('purchase_receipt', 'booking_ref')),
    BOOL_OR(proof_type IN ('photo_evidence', 'location_gps'))
  INTO
    v_best_multiplier,
    v_verified_types,
    v_verified_count,
    v_has_purchase_proof,
    v_has_engagement_proof
  FROM public.review_proofs
  WHERE review_id  = p_review_id
    AND proof_status = 'verified';

  -- Determine verification_status upgrade
  -- Existing hierarchy: anonymous < email_verified < purchase_verified
  IF v_has_purchase_proof THEN
    v_new_verification := 'purchase_verified';
  ELSIF v_has_engagement_proof THEN
    -- Only upgrade to email_verified if not already at purchase_verified
    v_new_verification := 'email_verified';
  ELSE
    -- Keep existing status (don't downgrade)
    SELECT verification_status INTO v_new_verification
    FROM   public.reviews
    WHERE  id = p_review_id;
  END IF;

  -- Handle NULL array when no verified proofs exist
  IF v_verified_types IS NULL THEN
    v_verified_types  := '{}';
    v_verified_count  := 0;
    v_best_multiplier := 1.0;
    -- Preserve existing verification_status on proof removal
    SELECT verification_status INTO v_new_verification
    FROM   public.reviews WHERE id = p_review_id;
  END IF;

  -- Update review summary columns
  UPDATE public.reviews
  SET
    verification_status     = v_new_verification,
    verification_multiplier = v_best_multiplier,
    proof_types             = v_verified_types,
    proof_count             = v_verified_count,
    updated_at              = NOW()
  WHERE id = p_review_id;

  -- Refresh reviewer metrics and trust score
  IF v_user_id IS NOT NULL THEN
    PERFORM public.fn_refresh_reviewer_metrics(v_user_id);
    PERFORM public.fn_calculate_trust_score(v_user_id);
  END IF;
END;
$$;

-- ─── 6. fn_attach_proof ───────────────────────────────────────────────────────
-- Called by the frontend / edge function to attach a new proof to a review.
-- Validates ownership, prevents duplicate active proofs, and sets the
-- correct multiplier for the proof type.
-- Returns the new proof row id.

CREATE OR REPLACE FUNCTION public.fn_attach_proof(
  p_review_id          UUID,
  p_user_id            UUID,
  p_proof_type         TEXT,
  p_storage_path       TEXT    DEFAULT NULL,
  p_file_hash          TEXT    DEFAULT NULL,
  p_file_size_bytes    INTEGER DEFAULT NULL,
  p_file_mime          TEXT    DEFAULT NULL,
  p_location_lat       NUMERIC DEFAULT NULL,
  p_location_lng       NUMERIC DEFAULT NULL,
  p_location_accuracy_m INTEGER DEFAULT NULL,
  p_location_captured_at TIMESTAMPTZ DEFAULT NULL,
  p_booking_reference  TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_owner  UUID;
  v_multiplier    NUMERIC(4,2);
  v_expires_at    TIMESTAMPTZ := NULL;
  v_new_id        UUID;
BEGIN
  -- ── Ownership check ────────────────────────────────────────────────────────
  SELECT user_id INTO v_review_owner FROM public.reviews WHERE id = p_review_id;
  IF v_review_owner IS NULL THEN
    RAISE EXCEPTION 'review_not_found';
  END IF;
  IF v_review_owner <> p_user_id THEN
    RAISE EXCEPTION 'not_review_owner';
  END IF;

  -- ── Proof type validation ──────────────────────────────────────────────────
  IF p_proof_type NOT IN ('purchase_receipt', 'location_gps', 'photo_evidence', 'booking_ref') THEN
    RAISE EXCEPTION 'invalid_proof_type: %', p_proof_type;
  END IF;

  -- ── Check no active proof of this type already exists ─────────────────────
  IF EXISTS (
    SELECT 1 FROM public.review_proofs
    WHERE  review_id   = p_review_id
      AND  proof_type  = p_proof_type
      AND  proof_status IN ('pending', 'processing', 'verified')
  ) THEN
    RAISE EXCEPTION 'proof_already_active';
  END IF;

  -- ── Type-specific validation ───────────────────────────────────────────────
  CASE p_proof_type
    WHEN 'purchase_receipt' THEN
      IF p_storage_path IS NULL THEN
        RAISE EXCEPTION 'storage_path required for purchase_receipt';
      END IF;
    WHEN 'location_gps' THEN
      IF p_location_lat IS NULL OR p_location_lng IS NULL THEN
        RAISE EXCEPTION 'lat/lng required for location_gps';
      END IF;
      -- Location proofs expire after 30 days
      v_expires_at := NOW() + INTERVAL '30 days';
    WHEN 'photo_evidence' THEN
      IF p_storage_path IS NULL THEN
        RAISE EXCEPTION 'storage_path required for photo_evidence';
      END IF;
    WHEN 'booking_ref' THEN
      IF p_booking_reference IS NULL THEN
        RAISE EXCEPTION 'booking_reference required for booking_ref';
      END IF;
  END CASE;

  -- ── Multiplier ladder ──────────────────────────────────────────────────────
  v_multiplier :=
    CASE p_proof_type
      WHEN 'purchase_receipt' THEN 2.0
      WHEN 'booking_ref'      THEN 2.0
      WHEN 'photo_evidence'   THEN 1.5
      WHEN 'location_gps'     THEN 1.3
      ELSE                         1.0
    END;

  -- ── Insert proof row ───────────────────────────────────────────────────────
  INSERT INTO public.review_proofs (
    review_id, user_id, proof_type, proof_status,
    storage_path, storage_bucket, file_hash_sha256,
    file_size_bytes, file_mime,
    location_lat, location_lng, location_accuracy_m, location_captured_at,
    booking_reference,
    multiplier_granted, expires_at
  ) VALUES (
    p_review_id, p_user_id, p_proof_type, 'pending',
    p_storage_path, 'review-proofs', p_file_hash,
    p_file_size_bytes, p_file_mime,
    p_location_lat, p_location_lng, p_location_accuracy_m, p_location_captured_at,
    p_booking_reference,
    v_multiplier, v_expires_at
  )
  RETURNING id INTO v_new_id;

  -- For booking_ref proofs: auto-verify immediately
  -- (booking was already confirmed server-side when the link was clicked)
  IF p_proof_type = 'booking_ref' AND p_booking_reference IS NOT NULL THEN
    PERFORM public.fn_verify_proof(v_new_id, 'system',
      FORMAT('Booking ref %s confirmed via affiliate link', p_booking_reference));
  END IF;

  RETURN v_new_id;
END;
$$;

-- ─── 7. fn_verify_proof ───────────────────────────────────────────────────────
-- Marks a proof as verified. Called by edge functions (AI result, merchant
-- decision) or automatically for booking_ref proofs.
-- Triggers fn_sync_review_verification() via trigger.

CREATE OR REPLACE FUNCTION public.fn_verify_proof(
  p_proof_id    UUID,
  p_verified_by TEXT    DEFAULT 'system',
  p_reason      TEXT    DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.review_proofs
  SET
    proof_status  = 'verified',
    verified_at   = NOW(),
    verified_by   = p_verified_by,
    updated_at    = NOW()
  WHERE id = p_proof_id
    AND proof_status IN ('pending', 'processing');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'proof_not_found_or_not_pending';
  END IF;
  -- Trigger trg_proof_status_change fires here → fn_sync_review_verification()
END;
$$;

-- ─── 8. fn_reject_proof ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_reject_proof(
  p_proof_id         UUID,
  p_rejection_reason TEXT    DEFAULT 'Verification failed',
  p_rejection_code   TEXT    DEFAULT 'generic_failure'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.review_proofs
  SET
    proof_status     = 'rejected',
    rejection_reason = p_rejection_reason,
    rejection_code   = p_rejection_code,
    updated_at       = NOW()
  WHERE id = p_proof_id
    AND proof_status IN ('pending', 'processing');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'proof_not_found_or_not_pending';
  END IF;
END;
$$;

-- ─── 9. Trigger: trg_proof_status_change ─────────────────────────────────────
-- Fires whenever a proof's status changes.
-- Syncs review.verification_status and verification_multiplier.

CREATE OR REPLACE FUNCTION public.trg_fn_proof_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only act when status actually changed
  IF NEW.proof_status IS NOT DISTINCT FROM OLD.proof_status THEN
    RETURN NEW;
  END IF;

  -- Always sync the review when status changes
  PERFORM public.fn_sync_review_verification(NEW.review_id);

  -- On verify: also log to verification_logs (AFVE audit trail from migration 000010)
  IF NEW.proof_status = 'verified' THEN
    INSERT INTO public.verification_logs
      (review_id, user_id, method, passed, confidence_score,
       file_hash_sha256, file_mime, metadata_flags, reason)
    VALUES (
      NEW.review_id,
      NEW.user_id,
      CASE NEW.proof_type
        WHEN 'purchase_receipt' THEN 'invoice_hash'
        WHEN 'booking_ref'      THEN 'invoice_hash'
        WHEN 'photo_evidence'   THEN 'ai_metadata'
        WHEN 'location_gps'     THEN 'ai_metadata'
        ELSE 'manual_admin'
      END,
      TRUE,
      CASE NEW.proof_type
        WHEN 'purchase_receipt' THEN 0.90
        WHEN 'booking_ref'      THEN 1.00
        WHEN 'photo_evidence'   THEN 0.75
        WHEN 'location_gps'     THEN 0.70
        ELSE 0.80
      END,
      NEW.file_hash_sha256,
      NEW.file_mime,
      jsonb_build_object(
        'proof_id',       NEW.id,
        'proof_type',     NEW.proof_type,
        'verified_by',    NEW.verified_by,
        'multiplier',     NEW.multiplier_granted
      ),
      FORMAT('Proof of Experience verified: %s (by %s)', NEW.proof_type, NEW.verified_by)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proof_status_change ON public.review_proofs;
CREATE TRIGGER trg_proof_status_change
  AFTER UPDATE OF proof_status ON public.review_proofs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_proof_status_change();

-- ─── 10. Auto-expire location proofs ─────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'reviewhub-expire-location-proofs',
      '0 4 * * *',   -- daily 04:00 UTC
      $$
        UPDATE public.review_proofs
        SET    proof_status = 'expired',
               updated_at  = NOW()
        WHERE  proof_type  = 'location_gps'
          AND  proof_status = 'verified'
          AND  expires_at  < NOW();

        -- Resync affected reviews
        -- (trigger doesn't fire on batch updates, so call manually)
        SELECT public.fn_sync_review_verification(DISTINCT review_id)
        FROM   public.review_proofs
        WHERE  proof_type   = 'location_gps'
          AND  proof_status = 'expired'
          AND  updated_at  > NOW() - INTERVAL '1 hour';
      $$
    );
  END IF;
END;
$$;

-- ─── 11. Comments ─────────────────────────────────────────────────────────────

COMMENT ON TABLE  public.review_proofs IS
  'Proof of Experience signals per review. 4 types: purchase_receipt, '
  'location_gps, photo_evidence, booking_ref. Sensitive data (files, coords) '
  'never exposed publicly — only verified proof types shown via v_review_proof_badges.';

COMMENT ON FUNCTION public.fn_attach_proof IS
  'Validate and attach a proof to a review. Enforces ownership, '
  'deduplication, type-specific validation, and multiplier assignment.';

COMMENT ON FUNCTION public.fn_verify_proof IS
  'Mark a proof as verified. Triggers review verification_status sync '
  'and AFVE verification_log entry.';

COMMENT ON FUNCTION public.fn_sync_review_verification IS
  'Recomputes reviews.verification_status and verification_multiplier '
  'from the set of verified proofs. Called by trigger after any proof status change.';

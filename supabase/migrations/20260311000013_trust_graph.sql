-- ============================================================
-- Migration 000013: Trust Graph System
-- ============================================================
--
-- Builds a directed weighted trust network over ReviewHub users.
--
-- A trust edge means: "source_user vouches for the quality of
-- target_user's reviews."  Edges are directional (A trusts B
-- does not imply B trusts A) and weighted (0.10 → 1.00).
--
-- Edge types:
--   explicit       — user pressed "Trust this reviewer" button
--   implicit_like  — auto-created after user likes ≥ 3 reviews
--                    from the same reviewer (trust_weight = 0.40)
--   implicit_booking — auto-created when user books via a link
--                      on a review written by another user
--
-- Guarantees enforced at DB level:
--   • No self-trust        (CHECK source_user_id <> target_user_id)
--   • No duplicate edges   (UNIQUE source+target; upsert on conflict)
--   • Weight always valid  (CHECK 0.10 ≤ trust_weight ≤ 1.00)
--
-- New objects:
--   TABLE   user_trust_edges
--   TABLE   trust_edge_log          (append-only audit trail)
--   VIEW    v_trusted_reviews       (public safe — no PII)
--   VIEW    v_my_trust_network      (auth'd user's outbound edges)
--   FUNCTION fn_toggle_trust()      (add / remove explicit edge)
--   FUNCTION fn_auto_trust_from_likes()   (implicit edge upsert)
--   FUNCTION fn_get_trusted_feed()  (ranked personalised review feed)
--   FUNCTION fn_trust_rank_score()  (per-review trust-adjusted score)
--   TRIGGER  trg_auto_trust_on_like (fires on review_likes INSERT)
--
-- Algorithm (explained at bottom of file):
--   PersonalisedScore(review R, viewer V) =
--     R.computed_points
--     × trust_boost(R.author, V)
--     × (1 + R.proof_count × 0.15)
--     × verification_weight(R.verification_status)
-- ============================================================

-- ─── 1. user_trust_edges ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_trust_edges (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction: source vouches for target
  source_user_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Strength of the trust signal
  -- 0.10 = very weak (auto from 3 likes)
  -- 0.50 = default explicit trust
  -- 1.00 = maximum (manually set or earned through consistent quality)
  trust_weight     NUMERIC(4, 3) NOT NULL DEFAULT 0.50
                                 CHECK (trust_weight BETWEEN 0.10 AND 1.00),

  -- How the edge was established
  edge_type        TEXT          NOT NULL DEFAULT 'explicit'
                                 CHECK (edge_type IN (
                                   'explicit',          -- user manually trusted
                                   'implicit_like',     -- ≥ 3 liked reviews from target
                                   'implicit_booking'   -- booked via target's review link
                                 )),

  -- Bookkeeping
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Hard constraints ────────────────────────────────────────────────────────
  -- No self-trust: a user cannot vouch for themselves
  CONSTRAINT trust_no_self_loop
    CHECK (source_user_id <> target_user_id),

  -- No duplicate edges: one active edge per (source, target) pair
  -- Upsert updates trust_weight and edge_type instead of inserting a duplicate
  CONSTRAINT trust_unique_pair
    UNIQUE (source_user_id, target_user_id)
);

-- Indices for graph traversal (both directions)
CREATE INDEX IF NOT EXISTS idx_ute_source  ON public.user_trust_edges(source_user_id);
CREATE INDEX IF NOT EXISTS idx_ute_target  ON public.user_trust_edges(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ute_weight  ON public.user_trust_edges(trust_weight DESC);
-- Composite for "who does user X trust with weight ≥ threshold"
CREATE INDEX IF NOT EXISTS idx_ute_source_weight
  ON public.user_trust_edges(source_user_id, trust_weight DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_trust_edges ENABLE ROW LEVEL SECURITY;

-- Anyone can see the trust graph (edge existence is public; no PII exposed)
CREATE POLICY "trust_edges: public readable"
  ON public.user_trust_edges FOR SELECT
  USING (TRUE);

-- Users can only INSERT edges where they are the source
CREATE POLICY "trust_edges: users insert own edges"
  ON public.user_trust_edges FOR INSERT
  WITH CHECK (source_user_id = auth.uid());

-- Users can update the weight of edges they own
CREATE POLICY "trust_edges: users update own edges"
  ON public.user_trust_edges FOR UPDATE
  USING (source_user_id = auth.uid());

-- Users can delete (un-trust) edges they own
CREATE POLICY "trust_edges: users delete own edges"
  ON public.user_trust_edges FOR DELETE
  USING (source_user_id = auth.uid());

-- Service role unrestricted (for auto-trust triggers and edge functions)
CREATE POLICY "trust_edges: service role full access"
  ON public.user_trust_edges FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.user_trust_edges IS
  'Directed weighted trust graph. Edge (A→B, weight=0.8) means '
  '"A strongly trusts B''s reviews." Used for personalised feed ranking.';

-- ─── 2. trust_edge_log ────────────────────────────────────────────────────────
-- Append-only. Records every create / update / delete on trust edges.
-- Follows the platform audit-log pattern (no UPDATE or DELETE).

CREATE TABLE IF NOT EXISTS public.trust_edge_log (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action           TEXT          NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  old_weight       NUMERIC(4, 3),
  new_weight       NUMERIC(4, 3),
  old_edge_type    TEXT,
  new_edge_type    TEXT,
  reason           TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- No updated_at — immutable audit trail
);

ALTER TABLE public.trust_edge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_edge_log: users read own log"
  ON public.trust_edge_log FOR SELECT
  USING (source_user_id = auth.uid());

CREATE POLICY "trust_edge_log: service role full access"
  ON public.trust_edge_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_tel_source ON public.trust_edge_log(source_user_id, created_at DESC);

COMMENT ON TABLE public.trust_edge_log IS
  'Append-only audit trail for all trust edge mutations.';

-- ─── 3. v_trusted_reviews ────────────────────────────────────────────────────
-- Public-safe view: reviews written by users trusted by the CURRENT user.
-- Ordered by trust-adjusted score (computed inline).
-- Used directly by the frontend feed — no additional JOIN needed.
--
-- Columns returned:
--   All review columns + trust_weight + reviewer_trust_score +
--   proof_types + proof_count + trust_adjusted_score
--
-- NOTE: This view uses auth.uid() so it's always scoped to the caller.
--       For anonymous visitors it returns an empty result set (no trust edges).

CREATE OR REPLACE VIEW public.v_trusted_reviews AS
SELECT
  r.id                       AS review_id,
  r.business_id,
  r.user_id                  AS reviewer_id,
  r.rating,
  r.text,
  r.anonymous,
  r.verification_status,
  r.verification_multiplier,
  r.afve_status,
  r.proof_types,
  r.proof_count,
  r.likes_count,
  r.computed_points,
  r.created_at,
  r.updated_at,

  -- Trust signal from the current viewer toward this reviewer
  ute.trust_weight,
  ute.edge_type              AS trust_source,

  -- Reviewer's platform-wide quality score
  p.trust_score              AS reviewer_trust_score,

  -- ── Personalised trust-adjusted score ─────────────────────────────────────
  -- Formula (see full explanation in fn_trust_rank_score comments below):
  --   base    = computed_points (already: base × verification_multiplier × like_boost)
  --   boost   = 0.5 + (trust_weight × 0.5)   → range 0.55 – 1.00
  --   proof+  = 1 + proof_count × 0.15        → range 1.00 – 1.60 (max 4 proofs)
  --   verif   = verification weight factor
  --   score   = base × boost × proof+ × verif
  ROUND(
    COALESCE(r.computed_points, 100)
    * (0.5 + (ute.trust_weight * 0.5))
    * (1.0 + COALESCE(r.proof_count, 0) * 0.15)
    * CASE r.verification_status
        WHEN 'purchase_verified' THEN 1.20
        WHEN 'email_verified'    THEN 1.05
        ELSE                          1.00
      END
  )::INTEGER                 AS trust_adjusted_score

FROM public.reviews r

-- Join trust edges: only reviews from users the current viewer trusts
JOIN public.user_trust_edges ute
  ON ute.target_user_id = r.user_id
  AND ute.source_user_id = auth.uid()     -- scoped to current viewer
  AND ute.trust_weight   >= 0.10           -- any trust level included

-- Reviewer quality score for display
LEFT JOIN public.profiles p
  ON p.id = r.user_id

WHERE r.is_hidden   = FALSE
  AND r.afve_status NOT IN ('rejected', 'flagged');

GRANT SELECT ON public.v_trusted_reviews TO authenticated;

COMMENT ON VIEW public.v_trusted_reviews IS
  'Personalised view: reviews from users the authenticated viewer trusts, '
  'ordered by trust-adjusted score. Uses auth.uid() — always caller-scoped.';

-- ─── 4. v_my_trust_network ────────────────────────────────────────────────────
-- Outbound trust edges for the current user, with reviewer profile summary.

CREATE OR REPLACE VIEW public.v_my_trust_network AS
SELECT
  ute.id,
  ute.target_user_id,
  ute.trust_weight,
  ute.edge_type,
  ute.created_at,
  ute.updated_at,
  -- Reviewer display info (non-sensitive)
  p.display_name,
  p.avatar_url,
  p.trust_score             AS reviewer_trust_score,
  -- Their review stats
  rm.verified_review_count,
  rm.total_review_count,
  rm.total_likes_received,
  rm.disputes_lost
FROM public.user_trust_edges ute
LEFT JOIN public.profiles       p  ON p.id  = ute.target_user_id
LEFT JOIN public.reviewer_metrics rm ON rm.user_id = ute.target_user_id
WHERE ute.source_user_id = auth.uid();

GRANT SELECT ON public.v_my_trust_network TO authenticated;

-- ─── 5. fn_toggle_trust ──────────────────────────────────────────────────────
-- Add an explicit trust edge, update its weight, or remove it.
-- Idempotent: calling with action='trust' twice updates weight instead of erroring.
--
-- Returns:
--   action_taken TEXT: 'created' | 'updated' | 'deleted'
--   new_weight   NUMERIC

CREATE OR REPLACE FUNCTION public.fn_toggle_trust(
  p_source_user_id UUID,
  p_target_user_id UUID,
  p_action         TEXT           DEFAULT 'trust',    -- 'trust' | 'untrust'
  p_trust_weight   NUMERIC(4, 3)  DEFAULT 0.50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_weight   NUMERIC(4, 3);
  v_existing_type     TEXT;
  v_action_taken      TEXT;
BEGIN
  -- ── Validation ─────────────────────────────────────────────────────────────
  IF p_source_user_id = p_target_user_id THEN
    RETURN jsonb_build_object('error', 'self_trust_not_allowed');
  END IF;

  IF p_action NOT IN ('trust', 'untrust') THEN
    RETURN jsonb_build_object('error', 'invalid_action');
  END IF;

  IF p_trust_weight NOT BETWEEN 0.10 AND 1.00 THEN
    RETURN jsonb_build_object('error', 'trust_weight_out_of_range');
  END IF;

  -- Check target exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RETURN jsonb_build_object('error', 'target_user_not_found');
  END IF;

  -- ── Read current state ──────────────────────────────────────────────────────
  SELECT trust_weight, edge_type
  INTO   v_existing_weight, v_existing_type
  FROM   public.user_trust_edges
  WHERE  source_user_id = p_source_user_id
    AND  target_user_id = p_target_user_id;

  -- ── Untrust ─────────────────────────────────────────────────────────────────
  IF p_action = 'untrust' THEN
    IF NOT FOUND THEN
      RETURN jsonb_build_object('action_taken', 'noop', 'reason', 'no_edge_exists');
    END IF;

    DELETE FROM public.user_trust_edges
    WHERE source_user_id = p_source_user_id
      AND target_user_id = p_target_user_id;

    INSERT INTO public.trust_edge_log
      (source_user_id, target_user_id, action, old_weight, new_weight, old_edge_type, reason)
    VALUES
      (p_source_user_id, p_target_user_id, 'deleted',
       v_existing_weight, NULL, v_existing_type, 'user_untrusted');

    RETURN jsonb_build_object(
      'action_taken', 'deleted',
      'old_weight',   v_existing_weight
    );
  END IF;

  -- ── Trust (upsert) ──────────────────────────────────────────────────────────
  IF FOUND THEN
    -- Edge already exists — update weight
    UPDATE public.user_trust_edges
    SET trust_weight = p_trust_weight,
        edge_type    = 'explicit',      -- explicit overrides implicit
        updated_at   = NOW()
    WHERE source_user_id = p_source_user_id
      AND target_user_id = p_target_user_id;

    v_action_taken := 'updated';
  ELSE
    -- New edge
    INSERT INTO public.user_trust_edges
      (source_user_id, target_user_id, trust_weight, edge_type)
    VALUES
      (p_source_user_id, p_target_user_id, p_trust_weight, 'explicit');

    v_action_taken := 'created';
  END IF;

  -- Audit log
  INSERT INTO public.trust_edge_log
    (source_user_id, target_user_id, action,
     old_weight, new_weight, old_edge_type, new_edge_type, reason)
  VALUES
    (p_source_user_id, p_target_user_id, v_action_taken,
     v_existing_weight, p_trust_weight, v_existing_type, 'explicit',
     FORMAT('explicit trust %s (weight %.2f)', v_action_taken, p_trust_weight));

  RETURN jsonb_build_object(
    'action_taken', v_action_taken,
    'new_weight',   p_trust_weight
  );
END;
$$;

COMMENT ON FUNCTION public.fn_toggle_trust IS
  'Add, update or remove an explicit trust edge. Idempotent. '
  'Returns action_taken (created|updated|deleted) and weight.';

-- ─── 6. fn_auto_trust_from_likes ─────────────────────────────────────────────
-- Creates a weak implicit trust edge when a user has liked ≥ 3 reviews
-- from the same reviewer.  Called by trigger on review_likes.
-- If an explicit edge already exists, does NOT downgrade it.

CREATE OR REPLACE FUNCTION public.fn_auto_trust_from_likes(
  p_liker_id    UUID,
  p_reviewer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_like_count     INTEGER;
  v_existing_type  TEXT;
  v_new_weight     NUMERIC(4, 3);
BEGIN
  -- Self-loop guard
  IF p_liker_id = p_reviewer_id THEN RETURN; END IF;

  -- Count likes from liker toward this reviewer's reviews
  SELECT COUNT(*)
  INTO   v_like_count
  FROM   public.review_likes rl
  JOIN   public.reviews r ON r.id = rl.review_id
  WHERE  rl.user_id  = p_liker_id
    AND  r.user_id   = p_reviewer_id;

  -- Only act at ≥ 3 likes
  IF v_like_count < 3 THEN RETURN; END IF;

  -- Check existing edge type
  SELECT edge_type INTO v_existing_type
  FROM   public.user_trust_edges
  WHERE  source_user_id = p_liker_id
    AND  target_user_id = p_reviewer_id;

  -- Never downgrade an explicit edge
  IF v_existing_type = 'explicit' THEN
    -- But do increment weight slightly (cap at 1.0)
    UPDATE public.user_trust_edges
    SET trust_weight = LEAST(trust_weight + 0.05, 1.00),
        updated_at   = NOW()
    WHERE source_user_id = p_liker_id
      AND target_user_id = p_reviewer_id;
    RETURN;
  END IF;

  -- Implicit weight: scales with like count (0.40 at 3 likes → 0.70 at 9+ likes)
  v_new_weight := LEAST(0.40 + ((v_like_count - 3) * 0.05)::NUMERIC, 0.70);

  INSERT INTO public.user_trust_edges
    (source_user_id, target_user_id, trust_weight, edge_type)
  VALUES
    (p_liker_id, p_reviewer_id, v_new_weight, 'implicit_like')
  ON CONFLICT (source_user_id, target_user_id)
  DO UPDATE SET
    trust_weight = GREATEST(              -- never reduce existing implicit weight
      public.user_trust_edges.trust_weight,
      EXCLUDED.trust_weight
    ),
    updated_at   = NOW();

  -- Log only on creation (skip log spam on every like)
  IF NOT FOUND OR v_existing_type IS NULL THEN
    INSERT INTO public.trust_edge_log
      (source_user_id, target_user_id, action, new_weight, new_edge_type, reason)
    VALUES
      (p_liker_id, p_reviewer_id, 'created', v_new_weight, 'implicit_like',
       FORMAT('auto-trust from %s likes', v_like_count));
  END IF;
END;
$$;

-- ─── 7. Trigger: trg_auto_trust_on_like ──────────────────────────────────────
-- Fires after every INSERT on review_likes.
-- Calls fn_auto_trust_from_likes() to build implicit trust edges.

CREATE OR REPLACE FUNCTION public.trg_fn_auto_trust_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  -- Find the author of the liked review
  SELECT user_id INTO v_reviewer_id
  FROM   public.reviews
  WHERE  id = NEW.review_id;

  IF v_reviewer_id IS NOT NULL AND v_reviewer_id <> NEW.user_id THEN
    PERFORM public.fn_auto_trust_from_likes(NEW.user_id, v_reviewer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_trust_on_like ON public.review_likes;
CREATE TRIGGER trg_auto_trust_on_like
  AFTER INSERT ON public.review_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_trust_on_like();

-- ─── 8. fn_trust_rank_score ───────────────────────────────────────────────────
-- Pure scoring function. Takes a review row and viewer trust weight,
-- returns the personalised trust-adjusted integer score.
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │  RANKING ALGORITHM — full explanation                               │
-- │                                                                     │
-- │  PersonalisedScore(review R, viewer V) =                            │
-- │    base_points  (R.computed_points, already encodes:                │
-- │                  base × verification_multiplier × like_boost)       │
-- │                                                                     │
-- │  × trust_boost(R.author, V)                                         │
-- │      Direct edge V→author exists:                                   │
-- │        trust_boost = 0.50 + (trust_weight × 0.50)                  │
-- │        Range: 0.55 (weight=0.1) → 1.00 (weight=1.0)               │
-- │      No edge (fallback / cold start):                               │
-- │        trust_boost = reviewer_trust_score / 100                     │
-- │        Range: 0.00 → 1.00 (uses platform-wide quality signal)      │
-- │                                                                     │
-- │  × proof_boost                                                      │
-- │      = 1 + proof_count × 0.15                                       │
-- │        0 proofs → ×1.00                                             │
-- │        1 proof  → ×1.15                                             │
-- │        2 proofs → ×1.30                                             │
-- │        4 proofs → ×1.60 (max)                                       │
-- │                                                                     │
-- │  × verification_factor                                              │
-- │      purchase_verified → ×1.20                                      │
-- │      email_verified    → ×1.05                                      │
-- │      anonymous         → ×1.00 (no penalty — already lower base)   │
-- │                                                                     │
-- │  FUTURE EXTENSIONS:                                                 │
-- │  1. Friend-of-friend: if no direct edge, walk one hop through the  │
-- │     trust graph (avg of truster's trust_weight × their weight to V) │
-- │  2. Temporal decay: multiply by exp(-λ × age_in_days) so old       │
-- │     reviews fade unless freshly liked                               │
-- │  3. Category affinity: if V only trusts B's reviews in tech,       │
-- │     use a per-category trust_weight column                          │
-- │  4. PageRank variant: iteratively propagate trust through the       │
-- │     graph (trust_score of truster amplifies their vote)             │
-- └─────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.fn_trust_rank_score(
  p_computed_points       INTEGER,
  p_trust_weight          NUMERIC,   -- NULL if no edge exists
  p_reviewer_trust_score  SMALLINT,  -- fallback for cold-start
  p_proof_count           SMALLINT,
  p_verification_status   TEXT
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT ROUND(
    -- Base points (already encodes verification_multiplier and like_boost)
    COALESCE(p_computed_points, 100)::NUMERIC

    -- Trust boost: direct edge or cold-start fallback
    * CASE
        WHEN p_trust_weight IS NOT NULL
        THEN 0.50 + (p_trust_weight * 0.50)
        ELSE COALESCE(p_reviewer_trust_score, 10)::NUMERIC / 100.0
      END

    -- Proof of experience bonus
    * (1.0 + COALESCE(p_proof_count, 0) * 0.15)

    -- Verification tier multiplier
    * CASE p_verification_status
        WHEN 'purchase_verified' THEN 1.20
        WHEN 'email_verified'    THEN 1.05
        ELSE                          1.00
      END
  )::INTEGER
$$;

-- ─── 9. fn_get_trusted_feed ───────────────────────────────────────────────────
-- Returns a personalised, ranked list of reviews for a given viewer.
-- Optionally filter by business_id.
--
-- Uses a two-tier strategy:
--   Tier 1: reviews from directly trusted reviewers (trust edges)
--   Tier 2: reviews from high-trust-score reviewers (cold-start / new users)
--
-- Parameters:
--   p_viewer_id    — the viewer whose trust graph to use
--   p_business_id  — optional filter for a single business page
--   p_limit        — page size (default 20)
--   p_offset       — pagination offset (default 0)
--   p_min_weight   — minimum trust_weight to include in Tier 1 (default 0.30)
--
-- Returns:
--   review_id, reviewer_id, business_id, rating, text, verification_status,
--   proof_types, proof_count, computed_points, trust_adjusted_score,
--   trust_weight (NULL for Tier 2), tier, created_at

CREATE OR REPLACE FUNCTION public.fn_get_trusted_feed(
  p_viewer_id   UUID,
  p_business_id UUID          DEFAULT NULL,
  p_limit       INTEGER       DEFAULT 20,
  p_offset      INTEGER       DEFAULT 0,
  p_min_weight  NUMERIC(4, 3) DEFAULT 0.30
)
RETURNS TABLE (
  review_id             UUID,
  reviewer_id           UUID,
  business_id           UUID,
  rating                INTEGER,
  review_text           TEXT,
  anonymous             BOOLEAN,
  verification_status   TEXT,
  verification_multiplier NUMERIC,
  proof_types           TEXT[],
  proof_count           SMALLINT,
  computed_points       INTEGER,
  likes_count           INTEGER,
  trust_weight          NUMERIC,
  reviewer_trust_score  SMALLINT,
  trust_adjusted_score  INTEGER,
  tier                  SMALLINT,   -- 1 = trusted, 2 = cold-start
  created_at            TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- ── Tier 1: reviews from directly trusted reviewers ──────────────────────
  SELECT
    r.id,
    r.user_id,
    r.business_id,
    r.rating,
    r.text,
    r.anonymous,
    r.verification_status,
    r.verification_multiplier,
    r.proof_types,
    r.proof_count,
    r.computed_points,
    r.likes_count,
    ute.trust_weight,
    p.trust_score,
    public.fn_trust_rank_score(
      r.computed_points,
      ute.trust_weight,
      p.trust_score,
      r.proof_count,
      r.verification_status
    ),
    1::SMALLINT AS tier,
    r.created_at
  FROM public.reviews r
  JOIN public.user_trust_edges ute
    ON ute.target_user_id = r.user_id
    AND ute.source_user_id = p_viewer_id
    AND ute.trust_weight   >= p_min_weight
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.is_hidden   = FALSE
    AND r.afve_status NOT IN ('rejected', 'flagged')
    AND (p_business_id IS NULL OR r.business_id = p_business_id)

  UNION ALL

  -- ── Tier 2: cold-start — high-quality reviewers not yet in trust graph ───
  -- Only shown when the viewer has fewer than 5 trust edges, or when Tier 1
  -- returns fewer results than p_limit
  SELECT
    r.id,
    r.user_id,
    r.business_id,
    r.rating,
    r.text,
    r.anonymous,
    r.verification_status,
    r.verification_multiplier,
    r.proof_types,
    r.proof_count,
    r.computed_points,
    r.likes_count,
    NULL::NUMERIC,           -- no direct trust edge
    p.trust_score,
    public.fn_trust_rank_score(
      r.computed_points,
      NULL,                  -- cold start: use trust_score as fallback
      p.trust_score,
      r.proof_count,
      r.verification_status
    ),
    2::SMALLINT AS tier,
    r.created_at
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.is_hidden   = FALSE
    AND r.afve_status NOT IN ('rejected', 'flagged')
    AND (p_business_id IS NULL OR r.business_id = p_business_id)
    -- Exclude reviews already in Tier 1 (reviewer is trusted)
    AND r.user_id NOT IN (
      SELECT target_user_id
      FROM   public.user_trust_edges
      WHERE  source_user_id = p_viewer_id
        AND  trust_weight   >= p_min_weight
    )
    -- Only show Tier 2 reviewers with meaningful quality signal
    AND p.trust_score >= 40

  -- ── Merge, de-duplicate and rank ─────────────────────────────────────────
  ORDER BY tier ASC, trust_adjusted_score DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.fn_get_trusted_feed IS
  'Personalised ranked review feed for a viewer. '
  'Tier 1: direct trust edges. Tier 2: cold-start from high-quality reviewers. '
  'Ordered by trust_adjusted_score DESC.';

-- ─── 10. Canonical query examples ────────────────────────────────────────────
-- Saved as comments for documentation.  Each is a standalone runnable query.

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY A — "Reviews written by users I trust" (simplest form)
Suitable for: business profile page trusted review tab
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  r.*,
  ute.trust_weight,
  p.trust_score AS reviewer_trust_score
FROM   public.reviews r
JOIN   public.user_trust_edges ute
         ON ute.target_user_id = r.user_id
        AND ute.source_user_id = auth.uid()          -- current viewer
        AND ute.trust_weight   >= 0.30               -- filter weak signals
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE  r.business_id = '<business_uuid>'
  AND  r.is_hidden   = FALSE
ORDER BY ute.trust_weight DESC, r.created_at DESC;


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY B — "Ranked personalised feed" (full algorithm via view)
Suitable for: homepage / explore feed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT *
FROM   public.v_trusted_reviews
ORDER  BY trust_adjusted_score DESC
LIMIT  20;


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY C — "Full ranked feed with cold-start fallback" (via function)
Suitable for: any page requiring personalised reviews
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT *
FROM   public.fn_get_trusted_feed(
  p_viewer_id   => auth.uid(),
  p_business_id => '<business_uuid>',   -- NULL for global feed
  p_limit       => 20,
  p_offset      => 0,
  p_min_weight  => 0.30
);


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY D — "Who does user X trust, with their profile?" (my network)
Suitable for: "Following" / trust management page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT *
FROM   public.v_my_trust_network
ORDER  BY trust_weight DESC;


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY E — "Who trusts reviewer X?" (reverse graph — trust IN-degree)
Useful for: reviewer profile page "trusted by N people"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  COUNT(*)                              AS in_degree,
  AVG(trust_weight)::NUMERIC(4,2)      AS avg_trust_weight,
  COUNT(*) FILTER (WHERE edge_type = 'explicit') AS explicit_trusters
FROM   public.user_trust_edges
WHERE  target_user_id = '<reviewer_uuid>';


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY F — "Friend of friend" (one-hop trust walk)
Future: extend fn_get_trusted_feed with graph depth parameter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WITH my_trusted AS (
  SELECT target_user_id, trust_weight AS w1
  FROM   public.user_trust_edges
  WHERE  source_user_id = auth.uid()
),
friend_of_friend AS (
  SELECT
    ute2.target_user_id,
    AVG(mt.w1 * ute2.trust_weight) AS indirect_weight
  FROM   my_trusted mt
  JOIN   public.user_trust_edges ute2
           ON ute2.source_user_id = mt.target_user_id
          AND ute2.target_user_id <> auth.uid()   -- exclude self
  WHERE  ute2.target_user_id NOT IN (SELECT target_user_id FROM my_trusted)
  GROUP  BY ute2.target_user_id
)
SELECT r.*, fof.indirect_weight
FROM   public.reviews r
JOIN   friend_of_friend fof ON fof.target_user_id = r.user_id
WHERE  r.business_id = '<business_uuid>'
ORDER  BY fof.indirect_weight DESC, r.created_at DESC;
*/

-- ─── 11. Comments ─────────────────────────────────────────────────────────────

COMMENT ON FUNCTION public.fn_toggle_trust IS
  'Add (upsert) or remove an explicit trust edge. '
  'Validates no self-loop and weight range. Writes to trust_edge_log.';

COMMENT ON FUNCTION public.fn_auto_trust_from_likes IS
  'Upserts a weak implicit trust edge when liker has ≥3 liked reviews '
  'from the same reviewer. Never downgrades an explicit edge.';

COMMENT ON FUNCTION public.fn_get_trusted_feed IS
  'Two-tier personalised review feed: '
  'Tier 1 = direct trust edges ≥ min_weight, '
  'Tier 2 = cold-start from trust_score ≥ 40. '
  'Ranked by fn_trust_rank_score() DESC.';

COMMENT ON FUNCTION public.fn_trust_rank_score IS
  'Pure scoring function. Returns: computed_points '
  '× trust_boost (0.55-1.00) '
  '× proof_boost (1.00-1.60) '
  '× verification_factor (1.00-1.20). '
  'IMMUTABLE PARALLEL SAFE — safe in parallel query plans.';

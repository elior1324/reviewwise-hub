# CLAUDE.md — supabase/

## Scope

This directory contains the database layer: SQL migration history, Deno TypeScript Edge Functions, and shared utilities. Changes here can silently break production data, violate RLS security, invalidate frontend queries, or corrupt the trust/points architecture. Proceed with more caution here than anywhere else in the project.

---

## Migration Rules

- **Never edit existing migration files.** They represent already-applied schema history. Editing them will cause drift between local and production state.
- **All schema changes require a new migration file.** Format: `YYYYMMDDHHMMSS_description.sql`.
- **Every new table must have RLS enabled.** Default to deny all access; grant only the minimum required permissions.
- **Test migrations on a branch** (`supabase db push --linked` against a preview branch) before applying to production.
- After any migration that adds, removes, or renames columns, regenerate frontend types:
  ```
  supabase gen types typescript --linked > src/integrations/supabase/types.ts
  ```
  Do not hand-edit `src/integrations/supabase/types.ts`. It is auto-generated.
- Migrations must be applied in chronological order. Never reorder them.

---

## Edge Function Rules

### Configuration

- All functions set `verify_jwt = false` in their `config.toml`. This is intentional — CORS and auth are handled manually within each function. Do not change this setting without implementing an alternative auth check.
- Functions are Deno TypeScript. Do not use Node.js APIs or assume `require()` is available.

### Security Requirements

- **Never expose server-side secrets in response bodies, logs, or error messages.** Check all `Deno.env.get()` uses — never interpolate secret values into strings that leave the function.
- **Always validate the request method** before processing. Handle `OPTIONS` with CORS headers and return early. Only process expected methods (POST, GET).
- **Always use `_shared/cors.ts`** for CORS headers. Do not inline custom CORS headers — divergence between functions creates inconsistent behavior.
- **Always use `_shared/error.ts`** for error response formatting.

### API Gateway (`api-gateway/`)

- Validates business API keys by comparing SHA-256 hashes against the `api_keys` table. Never compare keys in plaintext.
- Do not add new routes that bypass the key hash verification.
- Routes: `/reviews`, `/stats`, `/leads`, `/reports` — scoped to the authenticated business's data only.

### Payment Functions (`create-checkout/`, `customer-portal/`)

- PayPlus webhook handlers verify HMAC signatures using `PAYPLUS_SECRET_KEY`. **Never remove this verification step.**
- Charge methods: test (0), charge (1), credit (4), token (5). Understand which you are using before changing.
- Trial mode charges ₪1 to tokenize the card. Do not change the amount or remove the trial flow without understanding the subscription activation logic that follows.

### Cron Functions

The following functions are cron-triggered and must verify the `CRON_SECRET` header before processing:
- `daily-category-scan/`
- `daily-ai-scan/`
- `generate-monthly-top5/`

Do not make these callable without the secret check. Do not remove the secret verification.

### Trust Score Functions

- Functions that compute or update `businesses.trust_score` must not read from `user_points` or `leaderboard_entries`.
- Functions in the fraud/anomaly detection layer (`detect-review-anomalies/`, `anti-spam-check/`) feed indirectly into Trust Score. Do not add point grants or redemptions inside these functions.
- Trust Score and the points systems are architecturally isolated. Any function that crosses this boundary is a bug.

### Creating New Edge Functions

1. Use `_shared/cors.ts` for CORS headers.
2. Use `_shared/error.ts` for error responses.
3. Verify the caller identity (JWT, API key, or cron secret) before any data operation.
4. Never read or write cross-business data — scope all queries to the authenticated entity.
5. Never embed secrets in the function code — use `Deno.env.get()`.

---

## RLS Policy Rules

- **Test every policy change** against all relevant roles: `anon`, `authenticated`, and service role.
- **Reviews:** Users can only insert/update their own reviews. Businesses can only respond to reviews on their own businesses. Moderators (via service role) can update any review.
- **Business data:** Businesses can only read and modify their own records. Never allow cross-business reads on sensitive columns (API keys, private analytics, contact details).
- **`api_keys` table:** Only the service role should read the `key_hash` column. The plaintext key is never stored.
- **`login_attempts` table:** Only the service role should write to this table. Users must not be able to clear their own lockout record.
- **`user_points` table:** Users can read their own points. Only the service role (via Edge Functions) should insert or update point records.
- **`leaderboard_entries` table:** Public read access is acceptable (it powers the public leaderboard). Write access is service role only.

---

## Database Architecture — Trust, Points, and Leaderboard

Understanding these systems is required before touching any of these tables or the functions that write to them.

### Trust Score (`businesses.trust_score`)

- A 0–100 score representing business credibility.
- Grade mapping: A+ (90+), A (80+), B (70+), C (60+), D (50+), F (<50).
- Inputs: verified review signals, consistency over time, anti-manipulation detection.
- **Not influenced by:** user point totals, leaderboard rank, subscription tier, or referral counts.
- Updated by dedicated scoring queries and fraud/anomaly detection outputs only.

### Activity Points (`user_points` table)

- Redeemable in-platform currency earned by users.
- Grant events: +50 (review written), +100 (verified review), +150 (confirmed affiliate referral).
- Tier progression: Starter (0) / Explorer (150) / Influencer (300) / Ambassador (600).
- Redemption: 600 points = 20% course discount code.
- **Not redeemable for cash.** Not visible on the public leaderboard.

### Community Points (`leaderboard_entries` table)

- Seasonal reputation metric. Non-redeemable. Zero cash value.
- Grant events: +100 (review written), +200 (verified review).
- Powers the public `/leaderboard` page.
- Resets per season (via `generate-monthly-top5/` function).
- **Has no connection to Activity Points.** Do not share grant logic between the two.

### AFVE — Automatic Fraud Verification Engine

- `purchase_verifications` table stores invoice and proof submissions.
- `verify-invoice/` Edge Function validates submitted proofs.
- A review can only receive "verified" status after the AFVE validation flow completes.
- Do not grant verified status by directly updating `reviews.verified` without going through the validation flow.

---

## Shared Utilities (`functions/_shared/`)

| File | Purpose |
|---|---|
| `cors.ts` | Standard CORS headers — use this in every function |
| `jwt.ts` | JWT verification helpers |
| `error.ts` | Consistent error response formatting |

Do not copy-paste inline implementations of these. Inconsistency between functions creates security and debugging problems.

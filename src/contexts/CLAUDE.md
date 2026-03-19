# CLAUDE.md — src/contexts/

## Scope

This directory contains the two global React contexts. `AuthContext.tsx` is the most security-sensitive file in the entire frontend codebase. `ModeContext.tsx` is simple. Treat them differently.

---

## AuthContext.tsx

### What It Implements

1. **Multi-method authentication** — email/password, Google OAuth, Apple OAuth
2. **TOTP MFA** — full lifecycle: enroll, verify enrollment, challenge at login, verify code, unenroll
3. **Two-layer rate limiting** — client-side (`ClientRateLimiter` from `lib/auth-security.ts`) + server-side (`check_login_rate_limit` RPC)
4. **Session timeout** — 30-minute idle auto-logout with a warning at 25 minutes
5. **Subscription state** — tier (free/pro/enterprise), Stripe product IDs, end dates, coupon discounts
6. **Account lockout** — 30-minute lockdown after 5 failed attempts in a 15-minute window

### Login Flow (Do Not Reorder or Shortcut)

```
signIn() called
  → clientRateLimiter.check()            [sessionStorage counter, 5 attempts / 15 min]
  → server RPC check_login_rate_limit    [DB-enforced lockout]
  → supabase.auth.signInWithPassword()
  → if MFA enrolled: return { mfaRequired: true, mfaFactorId }
  → if success: load user profile + subscription data
  → start session timeout timer
```

Each step exists for a specific reason. Do not make steps conditional, do not skip steps for "development convenience," and do not reorder them.

### Rules

- **Never remove either layer of rate limiting.** Both `ClientRateLimiter` (client-side) and `check_login_rate_limit` (server-side RPC) must be called on every login attempt. Removing either layer leaves the other as the sole protection.
- **Never change token storage from `sessionStorage`.** This is intentional — tokens are cleared when the tab closes. Do not change to `localStorage` without an explicit, documented security decision.
- **Never skip the MFA gate.** If `signIn()` returns `mfaRequired: true`, the UI must block access until the TOTP challenge is verified. Do not add a bypass path.
- **Never export the context object directly.** Auth state is only accessible via the `useAuth()` hook. This prevents accidental use of the context before the provider mounts.
- **Never call Supabase auth methods directly from page components.** `supabase.auth.signIn*`, `supabase.auth.signOut`, and `supabase.auth.mfa.*` must be called only through the functions exported from `AuthContext`. Direct calls bypass rate limiting and session management.
- **Subscription fields are server-authoritative.** `subscriptionTier`, `subscriptionEndDate`, and `stripeProductId` must come from the database or an Edge Function response. Never derive these from client-side logic or local storage.
- **Conditional dev logging is intentional.** The `if (import.meta.env.DEV)` guards on console logs ensure no auth state appears in production logs. Do not remove these guards or add logging outside them.

### When Changing AuthContext

Before any change to this file:
1. Identify every component and page that calls `useAuth()`.
2. Identify which exported values and functions are used by each caller.
3. Trace the change through all consumers.
4. After the change, test all of the following scenarios:
   - Successful login (email/password)
   - Wrong password (rate limiter increments)
   - Locked account (5 failures — lockout message shown)
   - MFA enrolled user (challenge screen appears, access gated)
   - Session timeout (warning at 25 min, auto-logout at 30 min)
   - OAuth login (Google and Apple)
   - Password reset flow
   - Account deletion

---

## ModeContext.tsx

- Manages the User/Business mode toggle, persisted in `localStorage`.
- Simple two-value context (`user` | `business`).
- Do not add auth logic, subscription checks, or role validation to this file. Its only responsibility is the mode toggle.
- Mode affects which navigation and dashboard view is shown after login. Changes here propagate to `BusinessNavbar`, `App.tsx` route guards, and any component that reads `useMode()`.

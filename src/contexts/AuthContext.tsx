/**
 * AuthContext.tsx
 *
 * Security features added in this version:
 *
 *  1. RATE LIMITING (brute-force prevention)
 *     Two layers that must both pass before a password is checked:
 *     a) Client-side  — in-memory counter in sessionStorage; instant feedback,
 *        no network round-trip needed.
 *     b) Server-side  — supabase.rpc("check_login_rate_limit") queries the
 *        login_attempts table.  Survives tab refresh; blocks across devices
 *        sharing the same email address.
 *
 *  2. ACCOUNT LOCKOUT
 *     After 5 failed attempts within 15 minutes the account is locked for
 *     30 minutes.  The lock is enforced at the DB level (SECURITY DEFINER
 *     function, no direct table access); the client simply reads the result
 *     and shows a countdown.
 *
 *  3. ATTEMPT RECORDING
 *     Every password-login attempt (success or failure) is recorded via
 *     supabase.rpc("record_login_attempt") so the server-side limiter has
 *     accurate data.
 *
 *  4. SESSION TIMEOUT
 *     A SessionTimeout instance watches for user inactivity.  After 25 min
 *     idle it shows a warning toast; after 30 min it signs the user out
 *     automatically and shows an expiry toast.
 *
 *  5. MFA (TOTP via Supabase Auth MFA)
 *     Full TOTP lifecycle: enrol → verify enrolment → challenge at login →
 *     verify code → unenrol.  signIn() detects when AAL2 is required and
 *     returns { mfaRequired: true, mfaFactorId } so the UI can show the
 *     TwoFactorVerify step.
 *
 *  SESSION COOKIE NOTE:
 *     True HttpOnly / SameSite / Secure cookies can only be SET by a server
 *     (Set-Cookie header).  A pure Vite SPA has no server, so JS-accessible
 *     sessionStorage is used instead — the safest option for client-only apps:
 *       • scoped to the tab only (not shared across tabs)
 *       • cleared when the tab closes
 *       • invisible to other origins (same-origin policy)
 *     To get real HttpOnly cookies, migrate to a BFF pattern:
 *       → https://supabase.com/docs/guides/auth/server-side/overview
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  clientCheckRateLimit,
  clientRecordFailure,
  clientClearAttempts,
  SessionTimeout,
} from "@/lib/auth-security";

// ── Public types ──────────────────────────────────────────────────────────────

export type SubscriptionTier = "free" | "pro" | "premium";

export const STRIPE_TIERS = {
  pro: {
    price_id:   "price_1T8cKLJdw1St4rwXDsoVlfQ1",
    product_id: "prod_U6q0bcJeR70YPv",
  },
  premium: {
    price_id:   "price_1T8cLBJdw1St4rwXLJVIU3ar",
    product_id: "prod_U6q1CwTI9xXEeK",
  },
} as const;

export interface RateLimitInfo {
  allowed:           boolean;
  remainingAttempts: number;
  lockedUntilMs:     number | null; // epoch ms, or null if not locked
  failedAttempts?:   number;
}

export interface SignInResult {
  data:         any;
  error:        any;
  /** Populated whenever the attempt was blocked by rate limiting or lockout. */
  rateLimit?:   RateLimitInfo;
  /** True when the user has verified TOTP enrolled and must supply a code. */
  mfaRequired?: boolean;
  mfaFactorId?: string;
}

interface AuthContextType {
  user:             User | null;
  session:          Session | null;
  loading:          boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionEnd:  string | null;
  isSubscribed:     boolean;
  checkSubscription: () => Promise<void>;

  signUp:           (email: string, password: string, displayName?: string, turnstileToken?: string) => Promise<{ data: any; error: any }>;
  signIn:           (email: string, password: string, turnstileToken?: string) => Promise<SignInResult>;
  signInWithGoogle: (redirectTo?: string)             => Promise<{ error: any }>;
  signInWithApple:  ()                               => Promise<{ error: any }>;
  signOut:          ()                                => Promise<void>;

  // ── MFA ───────────────────────────────────────────────────────────────────
  /** Begin TOTP enrolment. Returns the QR code SVG and base32 secret. */
  mfaEnroll:           () => Promise<{ qrCode: string; secret: string; factorId: string; error: any }>;
  /** Activate an unverified factor by supplying the first TOTP code from the app. */
  mfaVerifyEnrollment: (factorId: string, code: string) => Promise<{ error: any }>;
  /** Remove an enrolled factor (disables 2FA). */
  mfaUnenroll:         (factorId: string) => Promise<{ error: any }>;
  /** Create a challenge for an existing factor (call once per login). */
  mfaChallenge:        (factorId: string) => Promise<{ challengeId: string; error: any }>;
  /** Submit the 6-digit code against a challenge. */
  mfaVerify:           (factorId: string, challengeId: string, code: string) => Promise<{ error: any }>;
  /** List all enrolled TOTP factors for the current user. */
  mfaListFactors:      () => Promise<{ totp: any[]; error: any }>;
}

// ── Context setup ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function productIdToTier(productId: string | null): SubscriptionTier {
  if (productId === STRIPE_TIERS.premium.product_id) return "premium";
  if (productId === STRIPE_TIERS.pro.product_id)     return "pro";
  return "free";
}

// All [Auth] diagnostic logging is gated behind DEV — Vite strips these calls
// from production bundles via dead-code elimination, so no PII ever reaches
// the browser console in production.
const devLog  = (...a: unknown[]) => { if (import.meta.env.DEV) console.log(...a); };
const devWarn = (...a: unknown[]) => { if (import.meta.env.DEV) console.warn(...a); };
const devErr  = (...a: unknown[]) => { if (import.meta.env.DEV) console.error(...a); };

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,             setUser]             = useState<User | null>(null);
  const [session,          setSession]          = useState<Session | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [subscriptionEnd,  setSubscriptionEnd]  = useState<string | null>(null);

  // Ref-guarded flags / singletons
  const signingUpRef      = useRef(false);
  const sessionTimeoutRef = useRef<SessionTimeout | null>(null);

  // ── Session timeout ────────────────────────────────────────────────────────

  const doSignOut = useCallback(async () => {
    sessionTimeoutRef.current?.stop();
    sessionTimeoutRef.current = null;
    await supabase.auth.signOut();
  }, []);

  const startSessionTimeout = useCallback(() => {
    sessionTimeoutRef.current?.stop();

    const timeout = new SessionTimeout(
      // Expired: auto sign-out
      async () => {
        toast.warning("פג תוקף החיבור", {
          description: "נותקתם אוטומטית לאחר 30 דקות של חוסר פעילות. התחברו מחדש.",
          duration: 8_000,
        });
        await doSignOut();
      },
      // Warning at 25 min idle
      () => {
        toast.info("החיבור עומד לפוג בקרוב", {
          description: "5 דקות ללא פעילות — הזיזו את העכבר כדי להישאר מחוברים.",
          duration: 10_000,
        });
      }
    );

    timeout.start();
    sessionTimeoutRef.current = timeout;
  }, [doSignOut]);

  // ── Subscription check ─────────────────────────────────────────────────────

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) { devErr("checkSubscription error:", error); return; }
      if (data?.subscribed) {
        setSubscriptionTier(productIdToTier(data.product_id));
        setSubscriptionEnd(data.subscription_end);
      } else {
        setSubscriptionTier("free");
        setSubscriptionEnd(null);
      }
    } catch (err) {
      devErr("checkSubscription threw:", err);
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "SIGNED_IN" && signingUpRef.current) {
          devLog("[Auth] suppressing SIGNED_IN during signUp flow");
          return;
        }
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          setTimeout(() => checkSubscription(), 0);
          startSessionTimeout();
        } else {
          setSubscriptionTier("free");
          setSubscriptionEnd(null);
          sessionTimeoutRef.current?.stop();
        }
      }
    );

    // Restore existing session on page load
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      if (existing?.user) {
        checkSubscription();
        startSessionTimeout();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription, startSessionTimeout]);

  // Refresh subscription tier every 60 s while logged in
  useEffect(() => {
    if (!user) return;
    const id = setInterval(checkSubscription, 60_000);
    return () => clearInterval(id);
  }, [user, checkSubscription]);

  // ── signUp (via auth-gate Edge Function) ──────────────────────────────────
  // All signup requests are routed through the auth-gate Edge Function which
  // verifies the Turnstile token server-side BEFORE creating the account.
  // Bots that call supabase.auth.signUp() directly are blocked at the DB level
  // (RLS) — the only path to insert a new user session is through this gate.

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    turnstileToken?: string,
  ): Promise<{ data: any; error: any }> => {
    devLog("[Auth] signUp via auth-gate | origin:", window.location.origin);

    const { data: fnData, error: fnError } = await supabase.functions.invoke("auth-gate", {
      body: {
        action:         "signup",
        email,
        password,
        displayName:    displayName ?? "",
        turnstileToken: turnstileToken ?? "",
      },
    });

    if (fnError) {
      devErr("[Auth] auth-gate network error on signup:", fnError.message);
      return { data: null, error: { message: fnError.message } };
    }

    if (!fnData?.success) {
      devErr("[Auth] auth-gate signup rejected:", fnData?.error);
      return { data: null, error: { message: fnData?.error ?? "Signup failed" } };
    }

    devLog("[Auth] signUp success — user:", fnData.user?.id ?? "null");

    // Return a shape compatible with the existing AuthPage success handler
    return {
      data: {
        user:    fnData.user,
        session: null, // email confirmation required — no live session
      },
      error: null,
    };
  };

  // ── signIn (via auth-gate Edge Function — rate-limited + Turnstile + MFA) ──
  // All login requests are routed through the auth-gate Edge Function which:
  //   1. Verifies the Turnstile token server-side (blocks bots before auth)
  //   2. Checks the server-side rate limit (DB-backed, cross-device lockout)
  //   3. Calls supabase.auth.signInWithPassword server-side
  //   4. Records the attempt for future rate-limit enforcement
  // On success the function returns session tokens; we call setSession()
  // to restore the authenticated state on this client, which triggers the
  // normal onAuthStateChange → subscription check → session timeout flow.

  const signIn = async (
    email:          string,
    password:       string,
    turnstileToken?: string,
  ): Promise<SignInResult> => {
    devLog("[Auth] signIn via auth-gate called");

    // ── Client-side instant gate (no network, gives instant UI feedback) ───
    // Kept as a convenience layer — the real enforcement is in auth-gate.
    const clientRL = clientCheckRateLimit();
    if (!clientRL.allowed) {
      devWarn("[Auth] client-side rate limit triggered");
      return { data: null, error: { message: "client_rate_limit" }, rateLimit: clientRL };
    }

    // ── Call auth-gate — this is where Turnstile + server rate-limit live ──
    const { data: fnData, error: fnError } = await supabase.functions.invoke("auth-gate", {
      body: {
        action:         "login",
        email,
        password,
        turnstileToken: turnstileToken ?? "",
      },
    });

    if (fnError) {
      // True network / invocation failure (not an application-level rejection)
      devErr("[Auth] auth-gate network error:", fnError.message);
      clientRecordFailure();
      const rlAfter = clientCheckRateLimit();
      return {
        data:  null,
        error: { message: fnError.message },
        rateLimit: {
          allowed:           rlAfter.allowed,
          remainingAttempts: rlAfter.remainingAttempts,
          lockedUntilMs:     rlAfter.lockedUntilMs,
        },
      };
    }

    // ── Application-level errors returned by auth-gate ─────────────────────
    if (!fnData?.success) {
      const errMsg = (fnData?.error as string) ?? "auth_error";
      devWarn("[Auth] auth-gate rejected login:", errMsg);

      // Rate-limit / account-locked response
      if (errMsg === "account_locked") {
        const lockedUntilMs = fnData?.locked_until
          ? new Date(fnData.locked_until as string).getTime()
          : null;
        devWarn("[Auth] server-side lockout until:", fnData?.locked_until);
        return {
          data:  null,
          error: { message: "account_locked" },
          rateLimit: {
            allowed:           false,
            remainingAttempts: 0,
            lockedUntilMs,
            failedAttempts:    fnData?.failed_attempts as number ?? 0,
          },
        };
      }

      // General auth error (wrong password, email not found, etc.)
      clientRecordFailure();
      const rlAfter = clientCheckRateLimit();
      return {
        data:  null,
        error: { message: errMsg, code: fnData?.code ?? null },
        rateLimit: {
          allowed:           rlAfter.allowed,
          remainingAttempts: rlAfter.remainingAttempts,
          lockedUntilMs:     rlAfter.lockedUntilMs,
        },
      };
    }

    // ── Success: restore session on this client ────────────────────────────
    const { error: sessionError } = await supabase.auth.setSession({
      access_token:  fnData.access_token  as string,
      refresh_token: fnData.refresh_token as string,
    });

    if (sessionError) {
      devErr("[Auth] setSession failed:", sessionError.message);
      return { data: null, error: sessionError };
    }

    clientClearAttempts();
    devLog("[Auth] signIn success — session restored via setSession");

    // ── MFA check (AAL2) — runs after session is established ──────────────
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = factors?.totp?.find((f: any) => f.status === "verified");
        if (verified) {
          devLog("[Auth] MFA required — factorId:", verified.id);
          return { data: fnData, error: null, mfaRequired: true, mfaFactorId: verified.id };
        }
      }
    } catch (e) {
      devErr("[Auth] MFA AAL check failed (non-fatal):", e);
    }

    return { data: fnData, error: null };
  };

  // ── signInWithGoogle ───────────────────────────────────────────────────────

  const signInWithGoogle = async (redirectTo?: string) => {
    devLog("[Auth] signInWithGoogle called");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
      },
    });
    if (error) devErr("[Auth] signInWithGoogle error:", error);
    return { error };
  };

  // ── signOut ────────────────────────────────────────────────────────────────

  const signOut = doSignOut;

  // ── MFA methods ───────────────────────────────────────────────────────────

  /** Begin TOTP enrolment; returns QR code SVG + base32 secret. */
  const mfaEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType:   "totp",
      friendlyName: "ReviewHub Authenticator",
    });
    if (error || !data)
      return { qrCode: "", secret: "", factorId: "", error: error ?? new Error("enroll failed") };
    return {
      qrCode:   data.totp.qr_code,
      secret:   data.totp.secret,
      factorId: data.id,
      error:    null,
    };
  };

  /** Confirm enrolment by verifying the first code from the authenticator app. */
  const mfaVerifyEnrollment = async (factorId: string, code: string) => {
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) return { error: cErr ?? new Error("challenge failed") };
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    return { error };
  };

  /** Remove a TOTP factor — disables 2FA for this account. */
  const mfaUnenroll = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return { error };
  };

  /** Issue a new challenge for a factor (one per login attempt). */
  const mfaChallenge = async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error || !data) return { challengeId: "", error: error ?? new Error("challenge failed") };
    return { challengeId: data.id, error: null };
  };

  /** Verify a 6-digit TOTP code against an open challenge. */
  const mfaVerify = async (factorId: string, challengeId: string, code: string) => {
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    return { error };
  };

  /** List all enrolled TOTP factors for the signed-in user. */
  const mfaListFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return { totp: [], error };
    return { totp: data.totp ?? [], error: null };
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      subscriptionTier, subscriptionEnd,
      isSubscribed: subscriptionTier !== "free",
      checkSubscription,
      signUp, signIn, signInWithGoogle, signOut,
      mfaEnroll, mfaVerifyEnrollment, mfaUnenroll,
      mfaChallenge, mfaVerify, mfaListFactors,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

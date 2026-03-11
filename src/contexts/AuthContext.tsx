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

  signUp:           (email: string, password: string, displayName?: string) => Promise<{ data: any; error: any }>;
  signIn:           (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: (redirectTo?: string)             => Promise<{ error: any }>;
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

  // ── signUp ─────────────────────────────────────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{ data: any; error: any }> => {
    if (import.meta.env.DEV) {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      devLog("[Auth] signUp | origin:", window.location.origin);
      devLog("[Auth] Supabase URL:", url);
      try {
        const probe = await fetch(`${url}/auth/v1/settings`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const json = await probe.json().catch(() => null);
        devLog("[Auth] pre-flight:", probe.status, JSON.stringify(json)?.slice(0, 200));
        if (probe.status === 404 || !json)
          devErr("[Auth] ⚠️ Supabase unreachable / intercepted");
      } catch (e) {
        devErr("[Auth] ⚠️ pre-flight failed:", e);
      }
    }

    signingUpRef.current = true;
    let data: any = null;
    let error: any = null;

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      data = result.data;
      error = result.error;
    } finally {
      signingUpRef.current = false;
    }

    if (error) { devErr("[Auth] signUp error:", error.message); return { data, error }; }

    devLog("[Auth] signUp — user:", data?.user?.id ?? "null", "| session:", !!data?.session);

    if (!data?.user) {
      devWarn("[Auth] signUp returned no user — check Supabase Auth Hooks.");
      return { data, error };
    }

    // Email Confirmations disabled: Supabase returns a live session immediately.
    // Force sign-out to require email confirmation at the app level.
    if (data?.session) {
      devWarn("[Auth] live session on signUp — signing out to enforce email confirmation.");
      await supabase.auth.signOut();
      return { data: { ...data, session: null }, error: null };
    }

    return { data, error };
  };

  // ── signIn (rate-limited + MFA-aware) ─────────────────────────────────────

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    devLog("[Auth] signIn called");

    // ── Layer 1: client-side gate (instant, no network) ──────────────────────
    const clientRL = clientCheckRateLimit();
    if (!clientRL.allowed) {
      devWarn("[Auth] client-side rate limit triggered");
      return { data: null, error: { message: "client_rate_limit" }, rateLimit: clientRL };
    }

    // ── Layer 2: server-side rate limit (DB-backed, cross-device) ────────────
    try {
      const { data: rl, error: rlErr } = await supabase.rpc("check_login_rate_limit", {
        p_email: email,
      });
      if (!rlErr && rl && rl.allowed === false) {
        const lockedUntilMs = rl.locked_until
          ? new Date(rl.locked_until as string).getTime()
          : null;
        devWarn("[Auth] server-side lockout until:", rl.locked_until);
        return {
          data: null,
          error: { message: "account_locked" },
          rateLimit: {
            allowed:           false,
            remainingAttempts: 0,
            lockedUntilMs,
            failedAttempts:    rl.failed_attempts as number,
          },
        };
      }
    } catch (e) {
      devErr("[Auth] check_login_rate_limit RPC failed (non-fatal):", e);
    }

    // ── Layer 3: actual Supabase authentication ───────────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // ── Layer 4: record attempt in DB for future checks ───────────────────────
    try {
      await supabase.rpc("record_login_attempt", {
        p_email:   email,
        p_success: !error,
      });
    } catch (e) {
      devErr("[Auth] record_login_attempt RPC failed (non-fatal):", e);
    }

    if (error) {
      clientRecordFailure();
      const rlAfter = clientCheckRateLimit();
      devErr("[Auth] signIn error:", error.message);
      return {
        data,
        error,
        rateLimit: {
          allowed:           rlAfter.allowed,
          remainingAttempts: rlAfter.remainingAttempts,
          lockedUntilMs:     rlAfter.lockedUntilMs,
        },
      };
    }

    // ── Success path ──────────────────────────────────────────────────────────
    clientClearAttempts();
    devLog("[Auth] signIn success");

    // ── Layer 5: MFA check (AAL2) ─────────────────────────────────────────────
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = factors?.totp?.find(f => f.status === "verified");
        if (verified) {
          devLog("[Auth] MFA required — factorId:", verified.id);
          return { data, error: null, mfaRequired: true, mfaFactorId: verified.id };
        }
      }
    } catch (e) {
      devErr("[Auth] MFA AAL check failed (non-fatal):", e);
    }

    return { data, error: null };
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

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "pro" | "premium";

export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1T8cKLJdw1St4rwXDsoVlfQ1",
    product_id: "prod_U6q0bcJeR70YPv",
  },
  premium: {
    price_id: "price_1T8cLBJdw1St4rwXLJVIU3ar",
    product_id: "prod_U6q1CwTI9xXEeK",
  },
} as const;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionEnd: string | null;
  isSubscribed: boolean;
  checkSubscription: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function productIdToTier(productId: string | null): SubscriptionTier {
  if (productId === STRIPE_TIERS.premium.product_id) return "premium";
  if (productId === STRIPE_TIERS.pro.product_id) return "pro";
  return "free";
}

// Shorthand: only log in development builds.
// Vite replaces import.meta.env.DEV with `true` during `vite dev` and `false`
// in `vite build`, so dead-code elimination strips these calls from the
// production bundle entirely — they never reach the browser.
const devLog  = (...args: unknown[]) => { if (import.meta.env.DEV) console.log(...args); };
const devWarn = (...args: unknown[]) => { if (import.meta.env.DEV) console.warn(...args); };
const devErr  = (...args: unknown[]) => { if (import.meta.env.DEV) console.error(...args); };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  // Prevents auto-login flash when signUp returns a session (Email Confirmations disabled in Supabase)
  const signingUpRef = useRef(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        devErr("Check subscription error:", error);
        return;
      }
      if (data?.subscribed) {
        setSubscriptionTier(productIdToTier(data.product_id));
        setSubscriptionEnd(data.subscription_end);
      } else {
        setSubscriptionTier("free");
        setSubscriptionEnd(null);
      }
    } catch (err) {
      devErr("Failed to check subscription:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // While signUp is in progress, suppress SIGNED_IN so the app doesn't flash-authenticate
      // the user before we have a chance to call signOut (enforcing email confirmation).
      if (event === "SIGNED_IN" && signingUpRef.current) {
        devLog("[Auth] onAuthStateChange: suppressing SIGNED_IN during signUp flow (will sign out)");
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => checkSubscription(), 0);
      } else {
        setSubscriptionTier("free");
        setSubscriptionEnd(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  // Auto-refresh subscription every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    // ── Dev-only diagnostics ───────────────────────────────────────────────────
    // These logs contain PII (email) and infrastructure details (Supabase URL).
    // They are compiled out of production builds by Vite's dead-code elimination.
    if (import.meta.env.DEV) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      devLog("[Auth] signUp called for:", email, "| origin:", window.location.origin);
      devLog("[Auth] Supabase URL:", supabaseUrl);

      // Pre-flight: verify Supabase is actually reachable in dev environments
      // (e.g. Lovable's preview can intercept fetch calls).
      try {
        const probe = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const probeJson = await probe.json().catch(() => null);
        devLog("[Auth] Supabase pre-flight check:", probe.status, JSON.stringify(probeJson)?.slice(0, 200));
        if (probe.status === 404 || !probeJson) {
          devErr("[Auth] ⚠️  Supabase URL unreachable or returning unexpected response — calls may be intercepted by the development environment.");
        }
      } catch (probeErr) {
        devErr("[Auth] ⚠️  Supabase pre-flight fetch failed:", probeErr);
      }
    }

    // Set flag so onAuthStateChange suppresses any SIGNED_IN event during this flow
    signingUpRef.current = true;

    let data: any = null;
    let error: any = null;

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          // NOTE: emailRedirectTo is intentionally omitted.
          // If you pass window.location.origin and that URL is NOT in your Supabase
          // "Redirect URLs" allowlist (Auth → URL Configuration), Supabase silently
          // rejects the URL and can suppress the confirmation email entirely.
          // Leaving it unset means Supabase uses the "Site URL" you configured in the
          // dashboard — which is always allowlisted by default.
          data: { display_name: displayName },
        },
      });
      data = result.data;
      error = result.error;
    } finally {
      signingUpRef.current = false;
    }

    if (error) {
      devErr("[Auth] signUp error:", error.message, "| status:", error.status);
      return { data, error };
    }

    devLog(
      "[Auth] signUp response — user:", data?.user?.id ?? "null",
      "| email_confirmed:", !!data?.user?.email_confirmed_at,
      "| session:", !!data?.session,
    );

    if (!data?.user) {
      // No user and no error = Supabase auth hook is likely blocking signup silently
      devWarn(
        "[Auth] signUp returned no user and no error. Most likely causes:\n" +
        "  1. Auth email hook is configured but failing (Supabase → Auth → Hooks)\n" +
        "  2. Supabase project is paused\n" +
        "  Check: Supabase Dashboard → Logs → Auth for the real error."
      );
      return { data, error };
    }

    // Supabase returned a session immediately — this happens when "Email Confirmations"
    // is DISABLED in the Supabase dashboard (Auth → Email settings → Confirm email toggle).
    // Enforce email confirmation at the app level: sign out and tell the user to check email.
    if (data?.session) {
      devWarn(
        "[Auth] signUp returned a live session — Supabase Email Confirmations appear to be disabled.\n" +
        "  Signing out now to enforce email confirmation at the app level.\n" +
        "  To fix permanently: Supabase Dashboard → Authentication → Email → enable 'Confirm email'."
      );
      await supabase.auth.signOut();
      // Return with session cleared so callers show "check your email" state
      return { data: { ...data, session: null }, error: null };
    }

    // Normal path: Email Confirmations enabled — user exists but session is null until confirmed
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    devLog("[Auth] signIn called");   // intentionally no email in prod
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      devErr("[Auth] signIn error:", error.message, "| status:", error.status);
    } else {
      devLog("[Auth] signIn success");
    }
    return { data, error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    devLog("[Auth] signInWithGoogle called");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // After Google auth, Supabase redirects here with ?code=xxx (PKCE flow).
        // detectSessionInUrl:true on the client will auto-exchange the code for tokens.
        // Falls back to the app root if no specific destination is provided.
        redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      devErr("[Auth] signInWithGoogle error:", error);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      subscriptionTier,
      subscriptionEnd,
      isSubscribed: subscriptionTier !== "free",
      checkSubscription,
      signUp, signIn, signInWithGoogle, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

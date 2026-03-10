import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Check subscription error:", error);
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
      console.error("Failed to check subscription:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    console.log("[Auth] signUp called for:", email, "| origin:", window.location.origin);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    if (error) {
      // Log full error object — visible in DevTools Console for debugging
      console.error("[Auth] signUp error:", error.message, "| status:", error.status, "| full:", error);
    } else {
      // data.user is null when: (a) email confirmation is required, or (b) an auth hook blocked silently
      // data.session is null until email is confirmed
      console.log("[Auth] signUp response — user:", data?.user?.id ?? "null (check auth hooks in Supabase dashboard)", "| session:", !!data?.session);
      if (!data?.user) {
        console.warn("[Auth] signUp returned no user and no error. Most likely causes:\n" +
          "  1. Auth email hook is configured but failing (check Supabase → Auth → Hooks)\n" +
          "  2. Email confirmation is required — user exists but is unconfirmed\n" +
          "  3. Supabase project is paused\n" +
          "  Check: Supabase Dashboard → Logs → Auth for the real error."
        );
      }
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] signIn called for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[Auth] signIn error:", error.message, "| status:", error.status, "| full:", error);
    } else {
      console.log("[Auth] signIn success — user:", data?.user?.id);
    }
    return { data, error };
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
      signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

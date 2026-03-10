/**
 * AuthCallback.tsx
 *
 * Landing page for Supabase OAuth redirects (Google, etc.).
 *
 * Flow (PKCE):
 *   1. User clicks "Sign in with Google" on AuthPage / BusinessAuth.
 *   2. supabase.auth.signInWithOAuth redirects to Google.
 *   3. Google redirects back to this page with ?code=xxx&state=yyy in the URL.
 *   4. The Supabase client (detectSessionInUrl: true) automatically exchanges the
 *      code for tokens when this component mounts.
 *   5. onAuthStateChange fires SIGNED_IN → AuthContext sets user + session.
 *   6. This page reads the user's role from public.users and redirects:
 *        business  → /business/dashboard
 *        otherwise → /
 *
 * If the exchange fails, the user is sent back to /auth with an error message.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false); // prevent double-execution in React Strict Mode

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      // Give the Supabase client a moment to finish the code-exchange
      // (detectSessionInUrl triggers automatically, but we need to wait for it).
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("[AuthCallback] No session after OAuth callback:", error);
        toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
        navigate("/auth", { replace: true });
        return;
      }

      const userId = data.session.user.id;
      console.log("[AuthCallback] Session established for user:", userId);

      // Look up the user's role to decide where to redirect
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "business") {
        navigate("/business/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background gap-4"
      dir="rtl"
    >
      {/* Simple branded spinner — no extra dependencies */}
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">מאמת את החשבון שלכם…</p>
    </div>
  );
};

export default AuthCallback;

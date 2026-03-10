/**
 * AuthCallback.tsx
 *
 * Landing page for Supabase OAuth redirects (Google, etc.).
 *
 * Flow (PKCE):
 *   1. User clicks "Sign in with Google" on AuthPage / BusinessAuth.
 *   2. supabase.auth.signInWithOAuth redirects to Google.
 *   3. Google redirects back to this page with ?code=xxx&state=yyy in the URL.
 *   4. The Supabase client (detectSessionInUrl: true, flowType: "pkce") detects
 *      the code in the URL and begins the async token exchange.
 *   5. Once the exchange completes, onAuthStateChange fires SIGNED_IN.
 *   6. This page listens for that event, then reads the user's role from
 *      public.users and redirects:
 *        business  → /business/dashboard
 *        otherwise → /
 *
 * WHY onAuthStateChange instead of getSession():
 *   Calling getSession() immediately on mount creates a race condition —
 *   the PKCE code exchange is async and may not be complete yet, so
 *   getSession() returns null even when the URL contains a valid code.
 *   Listening for SIGNED_IN guarantees we only proceed after the SDK has
 *   successfully exchanged the code for tokens.
 *
 * If the exchange fails (error in URL, expired code, etc.),
 * the user is sent back to /auth with an error toast.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Maximum time (ms) to wait for the SIGNED_IN event before giving up.
const CALLBACK_TIMEOUT_MS = 10_000;

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false); // prevent double-execution in React Strict Mode

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // ── Failure path helper ────────────────────────────────────────────────
    const fail = (reason: string) => {
      console.error("[AuthCallback] OAuth callback failed:", reason);
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate("/auth", { replace: true });
    };

    // ── Check for an error param in the URL (e.g. user denied access) ─────
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      fail(`URL error param: ${urlError} — ${params.get("error_description") ?? ""}`);
      return;
    }

    // ── Redirect helper (role-based) ───────────────────────────────────────
    const redirectForUser = async (userId: string) => {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      console.log("[AuthCallback] Session established for user:", userId, "role:", profile?.role);
      if (profile?.role === "business") {
        navigate("/business/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    // ── Listen for the SIGNED_IN event triggered by the PKCE code exchange ─
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        clearTimeout(timer);
        subscription.unsubscribe();
        await redirectForUser(session.user.id);
      }
    });

    // ── Safety timeout — give up after CALLBACK_TIMEOUT_MS ────────────────
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      fail("Timed out waiting for SIGNED_IN event");
    }, CALLBACK_TIMEOUT_MS);

    // ── Also check if a session already exists (fast path: page refresh) ───
    // This handles the case where detectSessionInUrl already finished before
    // our listener was registered.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) return; // let the timeout handle it
      if (data.session) {
        clearTimeout(timer);
        subscription.unsubscribe();
        redirectForUser(data.session.user.id);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
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

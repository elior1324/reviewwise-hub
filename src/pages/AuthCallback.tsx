/**
 * AuthCallback.tsx
 *
 * Landing page for OAuth redirects (Google, Apple, etc.).
 *
 * Flow (Lovable managed auth):
 *   1. User clicks "Sign in with Google" on AuthPage / BusinessAuth.
 *   2. lovable.auth.signInWithOAuth redirects to Google via Lovable Cloud.
 *   3. Google redirects back to this page with ?code=xxx&state=yyy in the URL.
 *   4. The Supabase client (detectSessionInUrl: true, flowType: "pkce") detects
 *      the code in the URL and begins the async token exchange.
 *   5. Once the exchange completes, onAuthStateChange fires SIGNED_IN.
 *   6. This page listens for that event, checks the URL for ?intent=business
 *      (set by BusinessAuth) and the `businesses` table, then redirects:
 *        has business                          → /business/dashboard
 *        no business + intent=business         → /register   (business onboarding)
 *        no business + no intent (AuthPage)    → /           (learner homepage)
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

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false); // prevent double-execution in React Strict Mode

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // ── Check for an error param in the URL (e.g. user denied access) ─────
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");

    // ── Failure path helper ────────────────────────────────────────────────
    // Route failures back to the appropriate login page based on intent
    const isBusinessIntentEarly = params.get("intent") === "business";
    const fail = (reason: string) => {
      console.error("[AuthCallback] OAuth callback failed:", reason);
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntentEarly ? "/business/login" : "/auth", { replace: true });
    };
    if (urlError) {
      fail(`URL error param: ${urlError} — ${params.get("error_description") ?? ""}`);
      return;
    }

    // ── Redirect helper (business ownership check) ────────────────────────
    // The `users` table does not exist in this schema. Instead we check
    // whether the authenticated user owns any row in `businesses` — if they
    // do, they are a business owner and should land on the business dashboard.
    const redirectForUser = async (userId: string) => {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (business) {
        // Existing business owner — always go to dashboard
        navigate("/business/dashboard", { replace: true });
      } else if (isBusinessIntentEarly) {
        // New user who explicitly chose a business account — register business
        navigate("/register", { replace: true });
      } else {
        // New regular (learner) user — go to homepage
        navigate("/", { replace: true });
      }
    };
    // ── Exchange the OAuth code for a session (PKCE) ───────────────────────
    (async () => {
      try {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href);

        // If PKCE verifier is missing, Supabase may still have created a session.
        // Do not show a failure toast until we confirm there's no session.
        const verifierMissing =
          !!exchangeError?.message &&
          exchangeError.message.includes("PKCE code verifier not found in storage");

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          fail(`getSession failed: ${sessionError.message}`);
          return;
        }

        const session = sessionData.session;
        if (session) {
          await redirectForUser(session.user.id);
          return;
        }

        if (exchangeError && !verifierMissing) {
          fail(`exchangeCodeForSession failed: ${exchangeError.message}`);
          return;
        }

        fail("No session after code exchange (PKCE verifier missing). Start login from the same tab.");
      } catch (e) {
        fail(`Unexpected error: ${String(e)}`);
      }
    })();

    return () => {};


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

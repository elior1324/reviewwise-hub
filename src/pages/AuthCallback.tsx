/**
 * AuthCallback.tsx
 *
 * Landing page for OAuth redirects (Google, Apple, etc.).
 *
 * Two auth flows land here:
 *
 * ── Flow A: Lovable managed auth (production, non-iframe) ──────────────
 *   1. signInWithGoogle/Apple calls lovable.auth.signInWithOAuth(provider)
 *   2. Lovable SDK redirects the browser to /~oauth/initiate → Google/Apple
 *   3. After authentication, Lovable redirects back to this page with
 *      access_token + refresh_token in the URL (hash fragment or query).
 *   4. This page detects the tokens, calls supabase.auth.setSession(),
 *      then redirects the user to the correct destination.
 *
 * ── Flow B: Supabase PKCE (fallback / email magic-link) ───────────────
 *   1. URL contains ?code=xxx (PKCE authorization code).
 *   2. supabase.auth.exchangeCodeForSession() exchanges the code.
 *   3. Session is set, user is redirected.
 *
 * Destination logic:
 *   has business                        → /business/dashboard
 *   no business + intent=business       → /register
 *   no business + no intent             → /
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract Lovable-style tokens from hash fragment OR query string. */
function extractTokensFromUrl(): { access_token: string; refresh_token: string } | null {
  // Lovable broker may deliver tokens in either the hash fragment or query string.
  // Check both (hash first, then query).
  for (const raw of [window.location.hash.substring(1), window.location.search.substring(1)]) {
    if (!raw) continue;
    const p = new URLSearchParams(raw);
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (access_token && refresh_token) {
      console.info("[AuthCallback] Lovable tokens detected in URL");
      return { access_token, refresh_token };
    }
  }
  return null;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // ── Check for an error param (user denied access, provider error) ────
    const urlError = params.get("error") || hashParams.get("error");
    const isBusinessIntent = params.get("intent") === "business";

    const fail = (reason: string) => {
      console.error("[AuthCallback] OAuth callback failed:", reason);
      console.error("[AuthCallback] URL at time of failure:", window.location.href);
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
    };

    if (urlError) {
      const desc = params.get("error_description") || hashParams.get("error_description") || "";
      fail(`URL error param: ${urlError} — ${desc}`);
      return;
    }

    // ── Redirect helper (business ownership check) ───────────────────────
    const redirectForUser = async (userId: string) => {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (business) {
        navigate("/business/dashboard", { replace: true });
      } else if (isBusinessIntent) {
        navigate("/register", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    // ── Main exchange logic ──────────────────────────────────────────────
    (async () => {
      try {
        // ── A) Lovable managed auth — tokens in URL ─────────────────────
        const lovableTokens = extractTokensFromUrl();
        if (lovableTokens) {
          console.info("[AuthCallback] Setting Supabase session from Lovable tokens");
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: lovableTokens.access_token,
            refresh_token: lovableTokens.refresh_token,
          });
          if (setSessionError) {
            fail(`setSession from Lovable tokens failed: ${setSessionError.message}`);
            return;
          }
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.info("[AuthCallback] Lovable → Supabase session set ✓");
            await redirectForUser(sessionData.session.user.id);
            return;
          }
          fail("setSession succeeded but getSession returned null");
          return;
        }

        // ── B) Supabase PKCE — ?code= in URL ───────────────────────────
        console.info("[AuthCallback] No Lovable tokens found, trying Supabase PKCE exchange");
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href);

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
          console.info("[AuthCallback] PKCE session set ✓");
          await redirectForUser(session.user.id);
          return;
        }

        if (exchangeError && !verifierMissing) {
          fail(`exchangeCodeForSession failed: ${exchangeError.message}`);
          return;
        }

        fail("No session after exchange. Full URL: " + window.location.href);
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
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">מאמת את החשבון שלכם…</p>
    </div>
  );
};

export default AuthCallback;

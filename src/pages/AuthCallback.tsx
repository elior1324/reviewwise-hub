/**
 * AuthCallback.tsx
 *
 * Landing page for OAuth redirects (Google, Apple, etc.).
 *
 * Three token-delivery mechanisms are tried in order:
 *
 *   1. Supabase auto-detect  — detectSessionInUrl may have already
 *      processed hash-fragment tokens before React mounts. We check
 *      getSession() first.
 *
 *   2. Lovable tokens in URL — access_token + refresh_token in hash
 *      fragment or query string. We extract and call setSession().
 *
 *   3. Supabase PKCE         — ?code= param exchanged via
 *      exchangeCodeForSession (email magic-link, etc.)
 *
 *   4. Lovable SDK re-invoke — as a last resort, call signInWithOAuth
 *      on the callback page so the SDK can complete any pending flow.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Diagnostic logger (temporary — safe to remove after debugging) ───────────
function diagLog(label: string, data?: unknown) {
  console.log(`%c[AuthCallback] ${label}`, "color:#6366f1;font-weight:bold", data ?? "");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract Lovable tokens from EVERY possible URL location. */
function extractTokensFromUrl(): { access_token: string; refresh_token: string } | null {
  const sources = [
    { name: "hash",  raw: window.location.hash.substring(1) },
    { name: "search", raw: window.location.search.substring(1) },
  ];

  for (const { name, raw } of sources) {
    if (!raw) continue;
    const p = new URLSearchParams(raw);
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    diagLog(`Checking ${name} params`, {
      access_token: access_token ? `${access_token.substring(0, 20)}…` : null,
      refresh_token: refresh_token ? `${refresh_token.substring(0, 20)}…` : null,
      allKeys: [...p.keys()],
    });
    if (access_token && refresh_token) {
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

    // ── Full URL diagnostic dump ──────────────────────────────────────────
    diagLog("=== CALLBACK START ===");
    diagLog("Full URL", window.location.href);
    diagLog("Origin", window.location.origin);
    diagLog("Pathname", window.location.pathname);
    diagLog("Search", window.location.search);
    diagLog("Hash", window.location.hash);
    diagLog("Search params", Object.fromEntries(new URLSearchParams(window.location.search)));
    diagLog("Hash params", Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))));

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // ── Check for an error param ──────────────────────────────────────────
    const urlError = params.get("error") || hashParams.get("error");
    const isBusinessIntent =
      params.get("intent") === "business" || hashParams.get("intent") === "business";

    const fail = (reason: string) => {
      console.error("[AuthCallback] FAILED:", reason);
      console.error("[AuthCallback] URL at failure:", window.location.href);
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
    };

    if (urlError) {
      const desc = params.get("error_description") || hashParams.get("error_description") || "";
      fail(`URL error: ${urlError} — ${desc}`);
      return;
    }

    // ── Redirect helper ───────────────────────────────────────────────────
    const redirectForUser = async (userId: string) => {
      diagLog("redirectForUser", { userId, isBusinessIntent });
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

    // ── Main exchange logic ───────────────────────────────────────────────
    (async () => {
      try {
        // ── Step 0: Maybe Supabase already auto-detected tokens ─────────
        // (detectSessionInUrl: true may have processed the hash before React mounted)
        diagLog("Step 0: Checking if Supabase already has a session");
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession.session) {
          diagLog("Step 0: Session already exists ✓", existingSession.session.user.email);
          await redirectForUser(existingSession.session.user.id);
          return;
        }
        diagLog("Step 0: No existing session");

        // ── Step 1: Look for Lovable tokens in URL ──────────────────────
        diagLog("Step 1: Extracting tokens from URL");
        const lovableTokens = extractTokensFromUrl();
        if (lovableTokens) {
          diagLog("Step 1: Tokens found, calling setSession");
          const { data: setData, error: setError } = await supabase.auth.setSession({
            access_token: lovableTokens.access_token,
            refresh_token: lovableTokens.refresh_token,
          });
          diagLog("Step 1: setSession result", {
            hasSession: !!setData?.session,
            user: setData?.session?.user?.email ?? null,
            error: setError?.message ?? null,
          });
          if (setError) {
            fail(`setSession failed: ${setError.message}`);
            return;
          }
          if (setData?.session) {
            diagLog("Step 1: SUCCESS ✓");
            await redirectForUser(setData.session.user.id);
            return;
          }
          diagLog("Step 1: setSession returned no error but also no session");
        } else {
          diagLog("Step 1: No tokens in URL");
        }

        // ── Step 2: Supabase PKCE exchange ──────────────────────────────
        const hasCode = params.has("code");
        diagLog("Step 2: PKCE exchange", { hasCode });
        if (hasCode) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);
          diagLog("Step 2: exchangeCodeForSession result", {
            hasSession: !!exchangeData?.session,
            error: exchangeError?.message ?? null,
          });
          if (exchangeData?.session) {
            diagLog("Step 2: SUCCESS ✓");
            await redirectForUser(exchangeData.session.user.id);
            return;
          }
          if (exchangeError) {
            fail(`PKCE exchange failed: ${exchangeError.message}`);
            return;
          }
        }

        // ── Step 3: Try Lovable SDK re-invoke ───────────────────────────
        // The SDK may detect callback state and complete the flow
        diagLog("Step 3: Trying Lovable SDK signInWithOAuth on callback page");
        try {
          const { lovable } = await import("@/integrations/lovable/index");
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: `${window.location.origin}/auth/callback`,
          });
          diagLog("Step 3: Lovable SDK result", {
            redirected: result?.redirected,
            hasError: !!result?.error,
            errorMsg: result?.error?.message,
            hasTokens: !!result?.tokens,
          });
          // If it didn't redirect and didn't error, session should be set
          if (!result?.redirected && !result?.error) {
            const { data: finalSession } = await supabase.auth.getSession();
            if (finalSession.session) {
              diagLog("Step 3: SUCCESS ✓");
              await redirectForUser(finalSession.session.user.id);
              return;
            }
          }
          // If it says "redirected", the SDK is sending us to Google again — abort
          if (result?.redirected) {
            diagLog("Step 3: SDK tried to redirect again (loop), aborting");
            // The redirect is already happening, nothing to do
            return;
          }
        } catch (sdkErr) {
          diagLog("Step 3: Lovable SDK error", String(sdkErr));
        }

        // ── All steps failed ────────────────────────────────────────────
        fail("All auth methods failed. Check console logs above for [AuthCallback] diagnostics.");
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

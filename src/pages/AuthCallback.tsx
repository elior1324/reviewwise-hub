/**
 * AuthCallback.tsx
 *
 * Landing page for OAuth redirects.
 *
 * Production flow (Supabase native OAuth, PKCE):
 *   1. supabase.auth.signInWithOAuth redirects to Supabase → Google
 *   2. Google authenticates, redirects back to Supabase callback
 *   3. Supabase redirects to this page with ?code=xxx
 *   4. exchangeCodeForSession() exchanges the code (PKCE verifier in sessionStorage)
 *   5. Session is set → user is redirected to the correct page
 *
 * Preview flow (Lovable popup):
 *   Popup handles everything — this page is not used.
 *
 * Also handles:
 *   - Lovable tokens in hash/query (if Lovable redirect delivers them)
 *   - onAuthStateChange fallback (if Supabase auto-detects tokens)
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 10000;

function log(msg: string, data?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`%c[AuthCallback] ${msg}`, "color:#6366f1;font-weight:bold", data ?? "");
  }
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.substring(1));

    log("URL", window.location.href);
    log("search keys", [...search.keys()]);
    log("hash keys", [...hash.keys()]);

    const isBusinessIntent =
      search.get("intent") === "business" || hash.get("intent") === "business";

    // ── Error in URL ───────────────────────────────────────────────────────
    const urlError = search.get("error") || hash.get("error");
    if (urlError) {
      const desc = search.get("error_description") || hash.get("error_description") || "";
      log("URL error", { urlError, desc });
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
      return;
    }

    // ── Success handler ────────────────────────────────────────────────────
    let settled = false;
    const succeed = async (userId: string, via: string) => {
      if (settled) return;
      settled = true;
      log(`SUCCESS via ${via}`, { userId });
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (biz) {
        navigate("/business/dashboard", { replace: true });
      } else if (isBusinessIntent) {
        navigate("/register", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      if (import.meta.env.DEV) {
        console.error("[AuthCallback] FAILED:", reason);
        console.error("[AuthCallback] Full URL:", window.location.href);
      }
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
    };

    // ── Listen for Supabase auth state change (catches auto-detect) ──────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log("onAuthStateChange", { event, hasSession: !!session });
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          succeed(session.user.id, `onAuthStateChange/${event}`);
        }
      }
    );

    // ── Try all exchange methods ────────────────────────────────────────
    (async () => {
      try {
        // 1. Check if session already exists
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) {
          succeed(existing.user.id, "existing session");
          return;
        }

        // 2. PKCE exchange (?code= from Supabase OAuth)
        if (search.has("code")) {
          log("Trying PKCE exchange");
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          log("PKCE result", { hasSession: !!data?.session, error: error?.message });
          if (data?.session) {
            succeed(data.session.user.id, "PKCE exchange");
            return;
          }
          if (error) {
            log("PKCE failed, will wait for onAuthStateChange", error.message);
          }
        }

        // 3. Lovable tokens in URL (hash or query)
        const accessToken = hash.get("access_token") || search.get("access_token");
        const refreshToken = hash.get("refresh_token") || search.get("refresh_token");
        if (accessToken && refreshToken) {
          log("Found tokens in URL, calling setSession");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          log("setSession result", { hasSession: !!data?.session, error: error?.message });
          if (data?.session) {
            succeed(data.session.user.id, "URL token setSession");
            return;
          }
        }

        // 4. Wait for onAuthStateChange (timeout below will catch failure)
        log("Waiting for onAuthStateChange...");
      } catch (e) {
        fail(`Unexpected error: ${String(e)}`);
      }
    })();

    // ── Timeout ────────────────────────────────────────────────────────────
    const timeout = setTimeout(() => {
      fail("Timeout: no session after " + TIMEOUT_MS + "ms");
    }, TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

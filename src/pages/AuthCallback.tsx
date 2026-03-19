/**
 * AuthCallback.tsx
 *
 * Landing page for OAuth redirects (Google, Apple, email magic-link).
 *
 * Token delivery mechanisms (tried in parallel):
 *
 *   A) Supabase auto-detect — detectSessionInUrl processes hash-fragment
 *      tokens (#access_token=…) asynchronously during client init.
 *      We listen for the resulting SIGNED_IN event via onAuthStateChange.
 *
 *   B) Manual extraction — if tokens are in the URL (hash or query) and
 *      Supabase hasn't auto-detected them within 1s, we extract them
 *      manually and call setSession().
 *
 *   C) PKCE exchange — if ?code= is present, we call
 *      exchangeCodeForSession() (email magic-link, Supabase native OAuth).
 *
 * A 8-second timeout prevents the spinner from hanging forever.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 8000;
const MANUAL_EXTRACTION_DELAY_MS = 1200;

function log(msg: string, data?: unknown) {
  console.log(`%c[AuthCallback] ${msg}`, "color:#6366f1;font-weight:bold", data ?? "");
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // ── Parse URL ──────────────────────────────────────────────────────────
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
      log("URL contains error", { urlError, desc });
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
      return;
    }

    // ── Success handler — runs once we have a session ──────────────────────
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
      console.error("[AuthCallback] FAILED:", reason);
      console.error("[AuthCallback] URL:", window.location.href);
      toast.error("ההתחברות עם Google נכשלה. נסו שוב.");
      navigate(isBusinessIntent ? "/business/login" : "/auth", { replace: true });
    };

    // ── A) Listen for onAuthStateChange (catches Supabase auto-detect) ────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log("onAuthStateChange", { event, hasSession: !!session });
        if (event === "SIGNED_IN" && session) {
          succeed(session.user.id, "onAuthStateChange/SIGNED_IN");
        }
      }
    );

    // ── B) Manual token extraction + C) PKCE — with a small delay ─────────
    // Give Supabase's detectSessionInUrl a moment to process hash tokens
    // before we try manual extraction (avoids double-processing).
    const manualTimer = setTimeout(async () => {
      if (settled) return;

      // B-1: Check if a session appeared while we waited
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) {
        succeed(existing.user.id, "getSession (delayed)");
        return;
      }

      // B-2: Extract tokens from hash or query string
      const accessToken =
        hash.get("access_token") || search.get("access_token");
      const refreshToken =
        hash.get("refresh_token") || search.get("refresh_token");

      log("Manual extraction", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: search.has("code"),
      });

      if (accessToken && refreshToken) {
        log("Calling setSession with extracted tokens");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        log("setSession result", {
          hasSession: !!data?.session,
          error: error?.message ?? null,
        });
        if (data?.session) {
          succeed(data.session.user.id, "manual setSession");
          return;
        }
        if (error) {
          fail(`setSession failed: ${error.message}`);
          return;
        }
      }

      // C: PKCE code exchange (email magic-link, Supabase native flows)
      if (search.has("code")) {
        log("Trying PKCE exchangeCodeForSession");
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        log("PKCE result", {
          hasSession: !!data?.session,
          error: error?.message ?? null,
        });
        if (data?.session) {
          succeed(data.session.user.id, "PKCE exchange");
          return;
        }
        // Don't fail yet — the auth state listener might still fire
        log("PKCE exchange did not produce a session");
      }
    }, MANUAL_EXTRACTION_DELAY_MS);

    // ── Timeout — give up after TIMEOUT_MS ────────────────────────────────
    const timeoutTimer = setTimeout(() => {
      fail("Timeout: no session received within " + TIMEOUT_MS + "ms");
    }, TIMEOUT_MS);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      subscription.unsubscribe();
      clearTimeout(manualTimer);
      clearTimeout(timeoutTimer);
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

/**
 * TurnstileWidget.tsx
 * SECURITY FIX #3 — Turnstile Site Key must not be the Cloudflare test key.
 *
 * VULNERABILITY (before fix):
 *   The hardcoded key "0x4AAAAAACoTwc1DagD0pies" is Cloudflare's documented
 *   *always-passes* test key. It never validates anything — any bot passes it.
 *   Every form protected by this widget was completely unprotected.
 *
 * FIX:
 *   Read the key from VITE_TURNSTILE_SITE_KEY environment variable.
 *   Add to .env.local (git-ignored):
 *     VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...your_real_key
 *   Get your real key: https://dash.cloudflare.com → Turnstile → Add Site
 *
 * DEV MODE:
 *   When VITE_TURNSTILE_SITE_KEY is not set, CAPTCHA is bypassed automatically.
 *   This is intentional for MVP/local development — re-enable by adding the key.
 *   To re-enable: set VITE_TURNSTILE_SITE_KEY in .env.local and remove DEV_BYPASS_CAPTCHA.
 */
import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect } from "react";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  className?: string;
}

// Pull from env — never hardcode a Turnstile key here.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

// --- DEV BYPASS FLAG ---
// Set to true to skip CAPTCHA during development/MVP testing.
// Set to false (or add VITE_TURNSTILE_SITE_KEY) to enforce CAPTCHA in production.
const DEV_BYPASS_CAPTCHA = !TURNSTILE_SITE_KEY;

if (DEV_BYPASS_CAPTCHA) {
  console.warn(
    "[Dev] CAPTCHA bypassed — VITE_TURNSTILE_SITE_KEY is not set. " +
    "Forms are unprotected. Add the key to .env.local before going to production."
  );
}

const TurnstileWidget = ({ onSuccess, onError, className }: TurnstileWidgetProps) => {
  // --- DEV MODE: auto-pass CAPTCHA so forms are not blocked during development ---
  useEffect(() => {
    if (DEV_BYPASS_CAPTCHA) {
      onSuccess("dev-bypass-token");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (DEV_BYPASS_CAPTCHA) {
    // Show a subtle dev-only notice — does NOT block the form
    return (
      <div className={`${className ?? ""} px-3 py-1.5 rounded border border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 text-xs text-center`}>
        🛠️ מצב פיתוח — CAPTCHA מושבת זמנית
      </div>
    );
  }

  // --- PRODUCTION: render the real Turnstile widget ---
  return (
    <div className={className}>
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY!}
        onSuccess={onSuccess}
        onError={onError}
        options={{ theme: "auto", size: "flexible" }}
      />
    </div>
  );
};

export default TurnstileWidget;

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
 */
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  className?: string;
}

// Pull from env — never hardcode a Turnstile key here.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

if (!TURNSTILE_SITE_KEY) {
  console.error(
    "[Security] VITE_TURNSTILE_SITE_KEY is not set. " +
    "Add it to .env.local — CAPTCHA is NOT protecting your forms right now."
  );
}

const TurnstileWidget = ({ onSuccess, onError, className }: TurnstileWidgetProps) => {
  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className={`${className ?? ""} p-3 rounded border border-destructive/50 bg-destructive/10 text-destructive text-xs`}>
        ⚠️ CAPTCHA לא מוגדר — הוסיפו VITE_TURNSTILE_SITE_KEY ל-.env.local
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={onSuccess}
        onError={onError}
        options={{ theme: "auto", size: "flexible" }}
      />
    </div>
  );
};

export default TurnstileWidget;

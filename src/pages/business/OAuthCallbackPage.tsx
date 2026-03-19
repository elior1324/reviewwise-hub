/**
 * OAuthCallbackPage.tsx
 *
 * Handles the OAuth redirect from Google and Facebook after the user
 * approves the integration. This page:
 *   1. Reads the `code`, `state`, and `provider` from the URL
 *   2. Calls exchange-oauth-token Edge Function (server-side token exchange)
 *   3. Redirects to /business/dashboard with a success or error toast
 *
 * URL: /business/integrations/oauth/callback?code=XXX&state=YYY&provider=google|facebook
 *
 * State parameter format (base64-encoded JSON):
 *   { business_id, provider, account_id?, location_id?, page_id? }
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PROVIDER_LABELS: Record<string, string> = {
  google:   "Google Business",
  facebook: "Facebook",
};

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  // Prevent double-execution in React Strict Mode
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const code  = searchParams.get("code");
      const error = searchParams.get("error"); // OAuth error (e.g. user denied)

      // ── OAuth error from provider ──────────────────────────────────────────
      if (error) {
        const desc = searchParams.get("error_description") ?? "הגישה נדחתה";
        navigate("/business/dashboard?tab=integrations", { replace: true });
        toast.error(`חיבור בוטל: ${desc}`);
        return;
      }

      if (!code) {
        navigate("/business/dashboard?tab=integrations", { replace: true });
        toast.error("קוד אימות חסר — נסו שוב");
        return;
      }

      // ── Decode state parameter ─────────────────────────────────────────────
      const rawState = searchParams.get("state") ?? "";
      let state: Record<string, string> = {};
      try {
        state = JSON.parse(atob(rawState));
      } catch {
        navigate("/business/dashboard?tab=integrations", { replace: true });
        toast.error("State לא תקין — נסו שוב");
        return;
      }

      const { provider, business_id, account_id, location_id, page_id } = state;

      if (!provider || !business_id) {
        navigate("/business/dashboard?tab=integrations", { replace: true });
        toast.error("פרמטרים חסרים — נסו שוב");
        return;
      }

      // ── Get user session ───────────────────────────────────────────────────
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      // ── Call exchange-oauth-token Edge Function ────────────────────────────
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exchange-oauth-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({
              provider,
              code,
              business_id,
              ...(account_id  ? { account_id }  : {}),
              ...(location_id ? { location_id } : {}),
              ...(page_id     ? { page_id }     : {}),
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "שגיאת שרת");
        }

        const label = PROVIDER_LABELS[provider] ?? provider;
        toast.success(`${label} חובר בהצלחה ✓`);
        navigate("/business/dashboard?tab=integrations", { replace: true });

      } catch (err) {
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        setStatus("error");
        setErrorMsg(msg);
        // After 3 seconds redirect back
        setTimeout(() => navigate("/business/dashboard?tab=integrations", { replace: true }), 3000);
      }
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-3">
          <p className="text-destructive font-semibold">שגיאה בחיבור: {errorMsg}</p>
          <p className="text-muted-foreground text-sm">מועבר בחזרה לדשבורד...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-primary" size={32} />
        <p className="text-muted-foreground text-sm">מחבר את החשבון...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

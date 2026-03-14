/**
 * ModeContext — tracks whether the authenticated user is operating in
 * "user" mode (writing reviews, browsing) or "business" mode (dashboard).
 *
 * Mode is persisted to localStorage so it survives page refreshes.
 *
 * SECURITY: resetMode() must be called on signOut (done via AuthContext
 * integration) so a different user logging in doesn't inherit "business" mode.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppMode = "user" | "business";

interface ModeContextType {
  mode: AppMode;
  switchToUserMode: () => void;
  switchToBusinessMode: () => void;
}

const ModeContext = createContext<ModeContextType>({
  mode: "user",
  switchToUserMode: () => {},
  switchToBusinessMode: () => {},
});

const STORAGE_KEY = "reviewhub_app_mode";

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as AppMode) ?? "user";
    } catch {
      return "user";
    }
  });

  // ── Reset mode to "user" whenever the Supabase session ends (sign-out) ──────
  // This prevents a new user signing in from inheriting "business" mode that
  // was set by the previous user on the same browser.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          setMode("user");
          try { localStorage.removeItem(STORAGE_KEY); } catch {}
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  const switchToUserMode = useCallback(() => {
    setMode("user");
    try { localStorage.setItem(STORAGE_KEY, "user"); } catch {}
  }, []);

  const switchToBusinessMode = useCallback(() => {
    setMode("business");
    try { localStorage.setItem(STORAGE_KEY, "business"); } catch {}
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchToUserMode, switchToBusinessMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useAppMode = () => useContext(ModeContext);

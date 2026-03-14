/**
 * ModeContext — tracks whether the authenticated user is operating in
 * "user" mode (writing reviews, browsing) or "business" mode (dashboard).
 *
 * Mode is persisted to localStorage so it survives page refreshes.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      return (localStorage.getItem("reviewhub_app_mode") as AppMode) ?? "user";
    } catch {
      return "user";
    }
  });

  const switchToUserMode = useCallback(() => {
    setMode("user");
    try { localStorage.setItem("reviewhub_app_mode", "user"); } catch {}
  }, []);

  const switchToBusinessMode = useCallback(() => {
    setMode("business");
    try { localStorage.setItem("reviewhub_app_mode", "business"); } catch {}
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchToUserMode, switchToBusinessMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useAppMode = () => useContext(ModeContext);

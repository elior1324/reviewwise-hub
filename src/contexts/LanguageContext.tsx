/**
 * LanguageContext.tsx
 *
 * Manages the active UI language for ReviewHub.
 * - Hebrew ("he") is the default and always the fallback.
 * - Persists the choice in localStorage under STORAGE_KEY.
 * - Applies `dir` and `lang` attributes to <html> so the entire
 *   document adopts the correct reading direction without modifying
 *   individual page components.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { resolve, LANGUAGES, type Language } from "@/i18n/translations";

const STORAGE_KEY = "reviewhub-language";
const DEFAULT_LANG: Language = "he";

// ── Context value type ────────────────────────────────────────────────────────

type LanguageContextValue = {
  /** Active language code */
  language: Language;
  /** Switch to a new language */
  setLanguage: (lang: Language) => void;
  /** Immediately revert to Hebrew */
  resetLanguage: () => void;
  /**
   * Translate a flat dot-notation key.
   * Falls back to Hebrew then to the raw key — never returns undefined.
   *
   * @example t("nav.home")  // "Home" / "עמוד הבית" / "Главная"
   */
  t: (key: string) => string;
  /** "rtl" for Hebrew, "ltr" for all others */
  dir: "rtl" | "ltr";
  /** true when current language is Hebrew */
  isHebrew: boolean;
};

// ── Context ───────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in LANGUAGES) return stored as Language;
    } catch {
      // localStorage may be unavailable in restricted environments
    }
    return DEFAULT_LANG;
  });

  // Apply lang + dir to <html> whenever language changes.
  // Using document.documentElement so every nested element inherits the
  // correct text direction, including those with no explicit dir attribute.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
    const { dir, locale } = LANGUAGES[language];
    const root = document.documentElement;
    root.setAttribute("lang", language);
    root.setAttribute("dir", dir);
    // data-lang is used for scoped CSS overrides in index.css
    root.setAttribute("data-lang", language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => setLang(lang), []);
  const resetLanguage = useCallback(() => setLang(DEFAULT_LANG), []);

  const t = useCallback(
    (key: string) => resolve(language, key),
    [language],
  );

  const dir = LANGUAGES[language].dir;
  const isHebrew = language === DEFAULT_LANG;

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, resetLanguage, t, dir, isHebrew }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}

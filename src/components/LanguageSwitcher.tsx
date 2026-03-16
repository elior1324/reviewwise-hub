/**
 * LanguageSwitcher.tsx
 *
 * A compact globe-icon button that opens a dropdown with:
 *  - All three supported languages (Hebrew, English, Russian)
 *  - A "Reset Language" action that reverts to Hebrew
 *
 * Positioned next to the AccessibilityMenu in both the consumer
 * and business navigation bars.
 */

import { Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES, type Language } from "@/i18n/translations";

const LANG_ORDER: Language[] = ["he", "en", "ru"];

const LanguageSwitcher = () => {
  const { language, setLanguage, resetLanguage, t } = useLanguage();
  const isNonDefault = language !== "he";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full border border-border/50 relative ${
            isNonDefault ? "text-primary border-primary/50" : ""
          }`}
          aria-label={t("language.title")}
          title={t("language.title")}
        >
          <Globe size={18} />
          {/* Badge showing active non-default language */}
          {isNonDefault && (
            <span
              className="absolute -top-0.5 -right-0.5 text-[8px] font-bold
                         bg-primary text-primary-foreground rounded-full
                         w-3.5 h-3.5 flex items-center justify-center leading-none"
              aria-hidden="true"
            >
              {language.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      {/* Always render dropdown in LTR so flag+name layout is consistent */}
      <DropdownMenuContent align="end" className="w-44" dir="ltr">
        {/* Header label */}
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider select-none">
          {t("language.title")}
        </div>
        <DropdownMenuSeparator />

        {LANG_ORDER.map((lang) => {
          const meta = LANGUAGES[lang];
          const isActive = language === lang;
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex items-center gap-2.5 cursor-pointer ${
                isActive ? "text-primary font-semibold" : ""
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {meta.flag}
              </span>
              <span>{meta.nativeName}</span>
              {isActive && (
                <span className="ms-auto text-xs text-primary" aria-label="active">
                  ✓
                </span>
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Reset to Hebrew */}
        <DropdownMenuItem
          onClick={resetLanguage}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>{t("language.reset")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

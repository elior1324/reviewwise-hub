/**
 * LegalTranslationNotice.tsx
 *
 * Amber notice banner shown at the top of every translated legal page.
 * Rendered only when the active language is NOT Hebrew.
 *
 * Informs users that:
 *  - The Hebrew version is the legally binding version.
 *  - Translations are provided for convenience / accessibility only.
 */

import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LegalTranslationNotice = () => {
  const { isHebrew, t } = useLanguage();

  // Nothing to show when already on the binding language
  if (isHebrew) return null;

  return (
    <div
      role="note"
      aria-label={t("legal.noticeTitle")}
      className="mb-8 flex gap-3 rounded-xl border border-amber-300 bg-amber-50
                 px-5 py-4 dark:border-amber-700/60 dark:bg-amber-950/20"
      dir="ltr"
    >
      <AlertTriangle
        size={18}
        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
          {t("legal.noticeTitle")}
        </p>
        <p className="text-sm text-amber-700 leading-relaxed dark:text-amber-400/90">
          {t("legal.noticeText")}
        </p>
      </div>
    </div>
  );
};

export default LegalTranslationNotice;

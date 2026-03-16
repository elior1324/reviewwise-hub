/**
 * translations.ts
 * ReviewHub — Flat translation dictionary for he / en / ru.
 *
 * Hebrew is the default and legally binding language.
 * English and Russian are provided for user convenience only.
 *
 * Fallback chain: requested language → Hebrew → raw key
 */

export type Language = "he" | "en" | "ru";

export const LANGUAGES: Record<
  Language,
  { name: string; nativeName: string; dir: "rtl" | "ltr"; flag: string; locale: string }
> = {
  he: { name: "Hebrew",  nativeName: "עברית",   dir: "rtl", flag: "🇮🇱", locale: "he-IL" },
  en: { name: "English", nativeName: "English",  dir: "ltr", flag: "🇬🇧", locale: "en-US" },
  ru: { name: "Russian", nativeName: "Русский",  dir: "ltr", flag: "🇷🇺", locale: "ru-RU" },
};

// ── Translation dictionary ────────────────────────────────────────────────────
// Keys use dot-notation: "nav.home", "accessibility.title", etc.
// Values are plain strings. For UI labels keep them concise.

type Dict = Record<string, string>;

const he: Dict = {
  // ── Language switcher
  "language.title":   "שפה",
  "language.he":      "עברית",
  "language.en":      "English",
  "language.ru":      "Русский",
  "language.reset":   "איפוס שפה",
  "language.current": "שפה נוכחית",

  // ── Accessibility menu
  "accessibility.title":         "תפריט נגישות",
  "accessibility.fontSize":      "גודל טקסט",
  "accessibility.fontNormal":    "רגיל",
  "accessibility.fontLarge":     "גדול",
  "accessibility.fontXLarge":    "גדול מאוד",
  "accessibility.highContrast":  "ניגודיות גבוהה",
  "accessibility.reducedMotion": "הפחתת אנימציות",
  "accessibility.linkHighlight": "הדגשת קישורים",
  "accessibility.readableFont":  "פונט קריא",
  "accessibility.bigCursor":     "סמן מוגדל",
  "accessibility.grayscale":     "גווני אפור",
  "accessibility.textSpacing":   "ריווח טקסט",
  "accessibility.invertColors":  "הפיכת צבעים",
  "accessibility.reset":         "איפוס הגדרות",

  // ── Navigation — consumer mode
  "nav.home":           "עמוד הבית",
  "nav.search":         "ספריית האמון",
  "nav.community":      "קהילה",
  "nav.compare":        "השוואה",
  "nav.compareAlt":     "השוואה חכמה",
  "nav.about":          "אודות",
  "nav.forBusiness":    "לעסקים",

  // ── Navigation — business dropdown
  "nav.allSolutions":         "כל הפתרונות לעסקים",
  "nav.reviewVerification":   "אימות ביקורות",
  "nav.analyticsLabel":       "לוח בקרה ונתונים",
  "nav.businessPortalLogin":  "כניסה לפורטל העסקי",
  "nav.prices":               "מחירים",

  // ── Navigation — business mode
  "nav.businessHome":   "דף הבית",
  "nav.dashboard":      "לוח הבקרה",
  "nav.pricing":        "תמחור",

  // ── Navigation — user actions
  "nav.businessProfile":         "פרופיל עסקי",
  "nav.regularBrowsing":         "גלישה רגילה",
  "nav.consumerMode":            "מצב צרכן",
  "nav.businessModeActive":      "מצב עסקי פעיל",
  "nav.managingBusinessProfile": "אתם מנהלים פרופיל עסקי",
  "nav.inviteFriends":           "הזמינו חברים",
  "nav.loginRegister":           "התחברו / הרשמו",
  "nav.loginRegisterMobile":     "התחברו / צרו חשבון",
  "nav.logout":                  "התנתקו",
  "nav.userMenu":                "תפריט משתמש",
  "nav.openMenu":                "פתח תפריט",
  "nav.closeMenu":               "סגור תפריט",

  // ── Legal translation notice (appears on translated pages)
  "legal.noticeTitle": "הצהרת שפה",
  "legal.noticeText":
    "מסמך זה עשוי להיות זמין במספר שפות לנוחות המשתמשים שלנו. במקרה של כל אי-התאמה או חוסר עקביות בין הגרסאות המתורגמות לבין הגרסה העברית, הגרסה העברית תגבר ותיחשב כגרסה המחייבת מבחינה משפטית. התרגומים מסופקים למטרות נגישות ונוחות בלבד.",
};

const en: Dict = {
  // ── Language switcher
  "language.title":   "Language",
  "language.he":      "Hebrew",
  "language.en":      "English",
  "language.ru":      "Russian",
  "language.reset":   "Reset Language",
  "language.current": "Current language",

  // ── Accessibility menu
  "accessibility.title":         "Accessibility Menu",
  "accessibility.fontSize":      "Text Size",
  "accessibility.fontNormal":    "Normal",
  "accessibility.fontLarge":     "Large",
  "accessibility.fontXLarge":    "Extra Large",
  "accessibility.highContrast":  "High Contrast",
  "accessibility.reducedMotion": "Reduce Motion",
  "accessibility.linkHighlight": "Highlight Links",
  "accessibility.readableFont":  "Readable Font",
  "accessibility.bigCursor":     "Large Cursor",
  "accessibility.grayscale":     "Grayscale",
  "accessibility.textSpacing":   "Text Spacing",
  "accessibility.invertColors":  "Invert Colors",
  "accessibility.reset":         "Reset Settings",

  // ── Navigation — consumer mode
  "nav.home":        "Home",
  "nav.search":      "Trust Library",
  "nav.community":   "Community",
  "nav.compare":     "Compare",
  "nav.compareAlt":  "Smart Compare",
  "nav.about":       "About",
  "nav.forBusiness": "For Business",

  // ── Navigation — business dropdown
  "nav.allSolutions":         "All Business Solutions",
  "nav.reviewVerification":   "Review Verification",
  "nav.analyticsLabel":       "Dashboard & Analytics",
  "nav.businessPortalLogin":  "Business Portal Login",
  "nav.prices":               "Pricing",

  // ── Navigation — business mode
  "nav.businessHome":   "Home",
  "nav.dashboard":      "Dashboard",
  "nav.pricing":        "Pricing",

  // ── Navigation — user actions
  "nav.businessProfile":         "Business Profile",
  "nav.regularBrowsing":         "Regular Browsing",
  "nav.consumerMode":            "Consumer Mode",
  "nav.businessModeActive":      "Business Mode Active",
  "nav.managingBusinessProfile": "You are managing a business profile",
  "nav.inviteFriends":           "Invite Friends",
  "nav.loginRegister":           "Sign In / Register",
  "nav.loginRegisterMobile":     "Sign In / Create Account",
  "nav.logout":                  "Sign Out",
  "nav.userMenu":                "User Menu",
  "nav.openMenu":                "Open menu",
  "nav.closeMenu":               "Close menu",

  // ── Legal translation notice
  "legal.noticeTitle": "Language Notice",
  "legal.noticeText":
    "This document may be available in multiple languages for the convenience of our users. In the event of any discrepancy or inconsistency between the translated versions and the Hebrew version, the Hebrew version shall prevail and be considered the legally binding version. The translations are provided for accessibility and convenience purposes only.",
};

const ru: Dict = {
  // ── Language switcher
  "language.title":   "Язык",
  "language.he":      "Иврит",
  "language.en":      "Английский",
  "language.ru":      "Русский",
  "language.reset":   "Сбросить язык",
  "language.current": "Текущий язык",

  // ── Accessibility menu
  "accessibility.title":         "Меню доступности",
  "accessibility.fontSize":      "Размер текста",
  "accessibility.fontNormal":    "Обычный",
  "accessibility.fontLarge":     "Крупный",
  "accessibility.fontXLarge":    "Очень крупный",
  "accessibility.highContrast":  "Высокий контраст",
  "accessibility.reducedMotion": "Уменьшить анимацию",
  "accessibility.linkHighlight": "Выделить ссылки",
  "accessibility.readableFont":  "Читаемый шрифт",
  "accessibility.bigCursor":     "Крупный курсор",
  "accessibility.grayscale":     "Оттенки серого",
  "accessibility.textSpacing":   "Интервал текста",
  "accessibility.invertColors":  "Инвертировать цвета",
  "accessibility.reset":         "Сбросить настройки",

  // ── Navigation — consumer mode
  "nav.home":        "Главная",
  "nav.search":      "Библиотека доверия",
  "nav.community":   "Сообщество",
  "nav.compare":     "Сравнение",
  "nav.compareAlt":  "Умное сравнение",
  "nav.about":       "О нас",
  "nav.forBusiness": "Для бизнеса",

  // ── Navigation — business dropdown
  "nav.allSolutions":         "Все решения для бизнеса",
  "nav.reviewVerification":   "Верификация отзывов",
  "nav.analyticsLabel":       "Панель управления",
  "nav.businessPortalLogin":  "Вход в бизнес-портал",
  "nav.prices":               "Цены",

  // ── Navigation — business mode
  "nav.businessHome":   "Главная",
  "nav.dashboard":      "Панель управления",
  "nav.pricing":        "Цены",

  // ── Navigation — user actions
  "nav.businessProfile":         "Бизнес-профиль",
  "nav.regularBrowsing":         "Обычный просмотр",
  "nav.consumerMode":            "Режим покупателя",
  "nav.businessModeActive":      "Бизнес-режим активен",
  "nav.managingBusinessProfile": "Вы управляете бизнес-профилем",
  "nav.inviteFriends":           "Пригласить друзей",
  "nav.loginRegister":           "Войти / Зарегистрироваться",
  "nav.loginRegisterMobile":     "Войти / Создать аккаунт",
  "nav.logout":                  "Выйти",
  "nav.userMenu":                "Меню пользователя",
  "nav.openMenu":                "Открыть меню",
  "nav.closeMenu":               "Закрыть меню",

  // ── Legal translation notice
  "legal.noticeTitle": "Языковое уведомление",
  "legal.noticeText":
    "Этот документ может быть доступен на нескольких языках для удобства наших пользователей. В случае каких-либо расхождений или несоответствий между переведёнными версиями и версией на иврите, версия на иврите будет иметь приоритет и считаться юридически обязывающей. Переводы предоставляются исключительно в целях доступности и удобства.",
};

export const translations: Record<Language, Dict> = { he, en, ru };

/**
 * Resolve a flat dot-notation key in the given language dict.
 * Falls back to Hebrew, then returns the raw key if still not found.
 */
export function resolve(lang: Language, key: string): string {
  return translations[lang][key] ?? translations.he[key] ?? key;
}

/**
 * auth-errors.ts
 * Maps Supabase Auth error messages to Hebrew for user-facing display.
 * Import wherever auth errors are shown in the UI.
 */
export const translateAuthError = (msg: string): string => {
  if (!msg) return "אירעה שגיאה לא ידועה. נסו שוב.";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))   return "פרטי התחברות שגויים — בדקו אימייל וסיסמה.";
  if (m.includes("email not confirmed"))          return "האימייל טרם אומת. בדקו את תיבת הדואר.";
  if (m.includes("user already registered"))      return "כתובת האימייל כבר רשומה. נסו להתחבר.";
  if (m.includes("email address is invalid"))     return "כתובת האימייל אינה תקינה.";
  if (m.includes("password should be"))           return "הסיסמה חייבת להכיל לפחות 8 תווים.";
  if (m.includes("signup is disabled"))           return "ההרשמה מושבתת כרגע. פנו לתמיכה.";
  if (m.includes("email provider is disabled"))   return "כניסה באימייל מושבתת בהגדרות הפרויקט.";
  if (m.includes("hook"))                         return "שגיאת שרת פנימית (auth hook). בדקו את לוגי Supabase.";
  if (m.includes("rate limit") || m.includes("too many")) return "יותר מדי ניסיונות. המתינו מספר דקות ונסו שוב.";
  if (m.includes("network") || m.includes("fetch")) return "שגיאת רשת — בדקו חיבור לאינטרנט.";
  // Fallback: return the raw message so devs can see it
  return msg;
};

/**
 * auth-errors.ts
 * Maps Supabase Auth error messages (and internal sentinel strings) to
 * Hebrew for user-facing display.
 *
 * Internal sentinels emitted by AuthContext (not from Supabase):
 *   "client_rate_limit"  — client-side limiter blocked the attempt
 *   "account_locked"     — server-side DB lockout active
 *
 * Import wherever auth errors are shown in the UI.
 */
export const translateAuthError = (msg: string): string => {
  if (!msg) return "אירעה שגיאה לא ידועה. נסו שוב.";
  const m = msg.toLowerCase();

  // ── Internal rate-limit / lockout sentinels ──────────────────────────────
  if (m === "client_rate_limit")
    return "יותר מדי ניסיונות כושלים — החשבון נעול זמנית. נסו שוב בעוד מספר דקות.";
  if (m === "account_locked")
    return "החשבון נעול לאחר מספר ניסיונות כושלים. נסו שוב מאוחר יותר.";

  // ── MFA / TOTP errors ─────────────────────────────────────────────────────
  if (m.includes("mfa") || m.includes("totp") || m.includes("factor")) {
    if (m.includes("not found") || m.includes("no factor"))
      return "לא נמצא אמצעי אימות דו-שלבי. הגדירו 2FA בהגדרות החשבון.";
    if (m.includes("expired") || m.includes("challenge"))
      return "הקוד פג תוקף — פתחו אתגר חדש ונסו שנית.";
    if (m.includes("invalid") || m.includes("verification"))
      return "קוד האימות שגוי — בדקו את האפליקציה ונסו שנית.";
    return "שגיאת אימות דו-שלבי — נסו שנית.";
  }

  // ── Standard Supabase Auth errors ─────────────────────────────────────────
  if (m.includes("invalid login credentials"))
    return "פרטי התחברות שגויים — בדקו אימייל וסיסמה.";
  if (m.includes("email not confirmed"))
    return "האימייל טרם אומת. בדקו את תיבת הדואר.";
  if (m.includes("user already registered"))
    return "כתובת האימייל כבר רשומה. נסו להתחבר.";
  if (m.includes("email address is invalid"))
    return "כתובת האימייל אינה תקינה.";
  if (m.includes("password should be"))
    return "הסיסמה חייבת להכיל לפחות 8 תווים.";
  if (m.includes("signup is disabled"))
    return "ההרשמה מושבתת כרגע. פנו לתמיכה.";
  if (m.includes("email provider is disabled"))
    return "כניסה באימייל מושבתת בהגדרות הפרויקט.";
  if (m.includes("hook"))
    return "שגיאת שרת פנימית (auth hook). בדקו את לוגי Supabase.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "יותר מדי ניסיונות. המתינו מספר דקות ונסו שוב.";
  if (m.includes("network") || m.includes("fetch"))
    return "שגיאת רשת — בדקו חיבור לאינטרנט.";

  // Fallback: return the raw message so devs can see it
  return msg;
};

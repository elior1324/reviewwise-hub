

# ביטול חיבור SendPulse API

## מה נעשה

נסיר את כל הקוד הקשור ל-SendPulse ונחזיר את טופס בקשת הביקורת למצב UI בלבד (או נסיר אותו).

## שלבים

1. **מחיקת Edge Function** — מחיקת `supabase/functions/send-review-request/index.ts`
2. **הסרה מ-config.toml** — הסרת הבלוק `[functions.send-review-request]`
3. **עדכון הדשבורד** — הסרת `ReviewRequestForm` מ-`src/pages/Dashboard.tsx` והסרת הייבוא שלו
4. **מחיקת הקומפוננטה** — מחיקת `src/components/ReviewRequestForm.tsx`

ה-secrets של `SENDPULSE_CLIENT_ID` ו-`SENDPULSE_CLIENT_SECRET` יישארו שמורים אבל לא ישמשו לשום דבר. אפשר להסיר אותם בנפרד אם תרצה.


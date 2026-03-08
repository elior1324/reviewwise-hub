

# חיבור SendPulse לשליחת מיילים

## מה נעשה

SendPulse עובד עם **שני מפתחות** — `client_id` ו-`client_secret`. נשמור אותם כ-secrets ונבנה Edge Function שמשתמש בהם.

## שלבים

### 1. שמירת Secrets
נשמור שני secrets בפרויקט:
- `SENDPULSE_CLIENT_ID` — ה-ID מעמוד ה-API Settings בחשבון SendPulse
- `SENDPULSE_CLIENT_SECRET` — ה-Secret מאותו עמוד

### 2. Edge Function: `send-review-request`
פונקציה שמקבלת מייל לקוח, שם קורס, ו-business_id ו:
1. מאמתת מול SendPulse API (OAuth — `POST /oauth/access_token`)
2. שולחת מייל SMTP דרך SendPulse (`POST /smtp/emails`)
3. מעדכנת את טבלת `review_requests` הקיימת בסטטוס `sent`

המייל יכלול קישור ייחודי לכתיבת ביקורת עם token.

### 3. עדכון הדשבורד
בטאב "קישורי ביקורת" — חיבור הכפתור "יצירה ושליחה" לקריאה ל-Edge Function במקום להיות סתם UI.

### 4. תבנית מייל
תבנית HTML בעברית (RTL) עם:
- שם העסק ושם הקורס
- כפתור CTA לכתיבת ביקורת
- עיצוב מותגי של ReviewHub

## פרטים טכניים

- **SendPulse API**: `https://api.sendpulse.com`
- **אימות**: OAuth2 client_credentials → Bearer token (תוקף שעה)
- **שליחה**: `POST /smtp/emails` עם HTML body
- **טבלה קיימת**: `review_requests` כבר קיימת ב-DB עם שדות `email`, `status`, `token`, `business_id`, `course_id`


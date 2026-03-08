

# ניתוח פערים — מה חסר כדי לממש את כל הפיצ'רים שהובטחו

## סיכום מהיר

בדקתי את כל הפיצ'רים שמובטחים בחבילות **מקצועי** ו**פרימיום** מול מה שבאמת מיושם. הנה המצב:

---

## חבילת מקצועי (Pro) — ₪189/חודש

| פיצ'ר | מצב | מה חסר |
|--------|------|--------|
| ביקורות ללא הגבלה | ✅ עובד | DB + RLS קיימים |
| רשתות חברתיות בפרופיל | ✅ עובד | `social_links` בטבלת businesses |
| דאשבורד אנליטיקס | ⚠️ חלקי | UI קיים, אבל הנתונים הם **demo בלבד** — אין חישוב אמיתי של מגמות, אחוזי שינוי, או גרפים אמיתיים |
| וידג'טים להטמעה | ✅ עובד | Edge function `widget-data` + `EmbedWidgetGenerator` |
| בקשות ביקורת אוטומטיות | ⚠️ חלקי | טבלת `review_requests` קיימת, אבל **אין מנגנון שליחת מיילים** — אין Edge Function ששולח את הקישור ללקוח |
| מערכת אפיליאט | ✅ עובד | טבלת `affiliate_clicks` + מעקב + `AffiliateRedirect` |
| סיכומי AI שבועיים | ❌ Demo בלבד | ה-UI מציג נתונים קבועים (hardcoded). **חסר**: Edge Function שמריץ AI על ביקורות אמיתיות ומייצר דוח, + טבלה לשמירת דוחות, + Cron/Scheduled job |
| תמיכה בעדיפות | ✅ לא טכני | הבדל בSLA — לא דורש קוד |

## חבילת פרימיום (Premium) — ₪479/חודש

| פיצ'ר | מצב | מה חסר |
|--------|------|--------|
| חיבור CRM (HubSpot/Salesforce) | ❌ Demo בלבד | UI מציג נתוני דמו. **חסר**: אינטגרציה אמיתית. דורש **צד שלישי** — n8n/Zapier/Make לתיווך, או Webhook שנשלח לכתובת שהלקוח מגדיר |
| ניהול לידים והפניות | ❌ Demo בלבד | UI מציג לידים קבועים. **חסר**: טבלת `leads` בDB, לוגיקה שהופכת ביקורת חיובית לליד, ממשק ניהול אמיתי |
| Webhook למערכות חיצוניות | ❌ Demo בלבד | UI מציג webhooks קבועים. **חסר**: טבלת `webhooks` שבה עסקים רושמים URLs, Edge Function שמפעיל את ה-webhooks בכל אירוע (ביקורת חדשה, המרה וכו') |
| Google Ads Review Stars | ❌ לא מיושם | **חסר**: JSON-LD structured data (Schema.org AggregateRating) בעמוד הפרופיל העסקי. זה לא דורש צד שלישי — צריך להוסיף מטא-דאטה לדף |
| דוחות AI יומיים | ❌ Demo בלבד | כמו סיכומי AI שבועיים אבל בתדירות יומית. **חסר**: אותו Edge Function + Cron יומי |
| גישת API מלאה | ❌ Demo בלבד | UI מציג מפתח API מזויף. **חסר**: מנגנון API keys — טבלת `api_keys`, Edge Function שמאמת מפתחות, ו-API endpoints ציבוריים |
| מנהל הצלחה אישי | ✅ לא טכני | שירות אנושי |

---

## מה צריך לבנות — לפי סדר עדיפות

### שלב 1 — קריטי (בלי זה, הפיצ'רים "שבורים")

1. **Edge Function לשליחת בקשות ביקורת (Email)** — יצירת קישור ייחודי ושליחתו ללקוח. דורש שירות מיילים (Lovable AI לא רלוונטי כאן). **אפשרויות**:
   - **Resend** — שירות מיילים פשוט, ניתן לחבר כ-secret
   - **n8n** — אם כבר משתמשים בו, אפשר workflow שמקבל webhook ושולח מייל

2. **סיכומי AI שבועיים/יומיים אמיתיים** — Edge Function שקורא ביקורות מה-DB, שולח ל-Lovable AI Gateway, ושומר דוח. כבר יש LOVABLE_API_KEY. צריך:
   - טבלת `ai_reports` (business_id, report_type, content, created_at)
   - Edge Function `generate-ai-report`
   - Cron trigger (דרך n8n או Supabase pg_cron)

3. **מערכת Webhooks** — טבלת `business_webhooks` + trigger/Edge Function ששולח POST לכל URL רשום

4. **מערכת לידים** — טבלת `leads` + trigger שיוצר ליד מביקורת חיובית (4-5 כוכבים)

### שלב 2 — חשוב אבל לא דחוף

5. **Google Ads Review Stars** — הוספת JSON-LD `AggregateRating` בעמוד `BusinessProfile.tsx` (לא דורש צד שלישי)

6. **מנגנון API Keys** — טבלת `api_keys` + middleware Edge Function שמאמת מפתחות

7. **חיבור CRM** — הכי מורכב. אפשרויות:
   - **Webhooks בלבד** — כבר מכוסה בשלב 1. לקוח מגדיר webhook של HubSpot/Salesforce ומקבל אירועים
   - **אינטגרציה ישירה** — דורש API keys של כל CRM + Edge Functions ספציפיים. **מומלץ לא לבנות עכשיו** — להשתמש ב-Webhook כפתרון

---

## צדדים שלישיים נדרשים (חוץ מסליקה)

| שירות | למה | עלות |
|--------|-----|------|
| **שירות מיילים (Resend / SendGrid / Mailgun)** | שליחת בקשות ביקורת, דוחות AI במייל, התראות | Resend: חינם עד 3,000/חודש |
| **n8n** (אופציונלי) | Cron jobs לדוחות AI, תיווך CRM, אוטומציות | חינם (self-hosted) או מנוי |

**הערה**: Lovable AI Gateway כבר מחובר ו-LOVABLE_API_KEY קיים — אין צורך בשירות AI חיצוני.

---

## תוכנית יישום מומלצת

אם תרצה, אוכל לממש את הפיצ'רים בסדר הזה:

1. **טבלאות DB** — `ai_reports`, `leads`, `business_webhooks`, `api_keys`
2. **Edge Function: generate-ai-report** — דוח AI אמיתי מביקורות
3. **Edge Function: send-review-request** — שליחת מיילים (צריך Resend API key)
4. **Edge Function: fire-webhooks** — שליחת webhook על אירועים
5. **לוגיקת לידים** — trigger שהופך ביקורת חיובית לליד
6. **JSON-LD** — Google Review Stars
7. **API Keys** — מנגנון אימות ו-endpoints


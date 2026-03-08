

## פרומפט מקוצר — ללא כפילויות וללא פיצ'רים שכבר קיימים

הנה הגרסה המקוצרת. הסרתי:
- **כל מה שכבר מוטמע**: עיצוב כהה, RTL, עברית, דפי עסק/קורס/חיפוש/דאשבורד/רישום/אודות/לחברות, כרטיסי ביקורות עם זמן מאז רכישה, תגובות בעלים, דיווח, סיכום AI, צ'אטבוט, פעמון התראות, אפיליאט, פילטרים מתקדמים
- **כפילויות**: תיאורי UI/UX שחזרו 3-4 פעמים, תיאורי סטאק טכנולוגי כפולים, הסברי ביקורות מאומתות שחזרו במספר סעיפים

---

### הפרומפט המקוצר:

```text
You are a senior SaaS architect and full-stack engineer.

Continue building the ReviewHub platform — a verified review platform
for online courses and learning services in Israel.

The existing codebase already includes:
- Dark premium UI with RTL Hebrew support
- Business profiles, course pages, search with filters
- Verified review system with purchase time display, owner responses, report abuse
- Business dashboard with analytics, affiliate tracking, review management
- AI chatbot with course recommendations
- Notification bell, About page, For Business landing page
- Business registration form
- Affiliate redirect system

BUILD THE FOLLOWING MISSING FEATURES:

1. SOCIAL PROOF WIDGETS
   Embeddable widgets for business websites:
   - Rating badge (average rating + total reviews)
   - Review carousel (rotating verified reviews)
   - Review list (full feed)
   Embed via <script src="reviewhub-widget.js"></script>
   with <div class="reviewhub-widget" data-business="slug"></div>
   Widgets must be lightweight, fast, and styled consistently.

2. SUPABASE BACKEND & AUTH
   Connect to Supabase for real data persistence:
   - User authentication (signup/login/logout)
   - PostgreSQL schema: users, businesses, courses, reviews,
     purchases, affiliate_clicks, review_requests
   - Row Level Security policies
   - API routes for all CRUD operations
   - Replace all mock data with real database queries

3. PURCHASE VERIFICATION SYSTEM
   - CSV upload for bulk purchase verification
   - Unique review link generation per customer
   - Purchase record: course_id, customer_email, purchase_date,
     verification_method
   - Only verified purchases unlock review submission

4. REVIEW REQUEST SYSTEM
   - Businesses generate secure review request links
   - Track sent/opened/completed review requests
   - Dashboard stats for request conversion rate

5. AI ENHANCEMENTS (OpenAI API)
   - Fake review detection (duplicate text, spam, IP abuse)
   - Automated review summarization per course/business
   - Replace mock chatbot with real OpenAI-powered responses

6. ADMIN PANEL (future-ready)
   - Review moderation queue
   - Flagged review management
   - User/business management

7. MONETIZATION STRUCTURE
   - Freemium: free basic listing
   - Pro: widgets, review requests, analytics, API access
   - Enterprise: advanced integrations, Google Ads stars

8. MOBILE-READY API
   - All business logic via API routes (not coupled to frontend)
   - Architecture supports future React Native / Expo app

TECH STACK:
Frontend: React + Vite + TailwindCSS (existing)
Backend: Supabase (PostgreSQL + Auth)
AI: OpenAI API
Automations: n8n
Hosting: Vercel
Version Control: GitHub
```

---

**סיכום מה הוסר:**
- ~60% מהפרומפט המקורי היה כפילויות או פיצ'רים שכבר קיימים
- הפרומפט ירד מ-~850 מילים ל-~300 מילים
- כל מה שנשאר הוא פיצ'רים שבאמת חסרים ודורשים פיתוח


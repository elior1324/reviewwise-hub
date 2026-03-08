

# תוכנית: הסרת כל הנתונים המזויפים והחלפתם בשאילתות מהדאטאבייס

## מה צריך להשתנות

הקובץ `src/data/mockData.ts` מכיל עסקים, קורסים, ביקורות וקליקים מזויפים. הוא משמש **10 קבצים** שונים. התוכנית: לרוקן את המערכים המזויפים ולהחליף את כל השימושים בשאילתות אמיתיות מהדאטאבייס.

## שלבים

### 1. ניקוי mockData.ts
- לרוקן את המערכים `BUSINESSES`, `COURSES`, `REVIEWS`, `AFFILIATE_CLICKS` (להשאיר כמערכים ריקים)
- להשאיר את כל ה-**טיפוסים** (interfaces), **קטגוריות**, **תתי-קטגוריות**, **פונקציות עזר** ו-**קבועים** כמו `FREELANCER_CATEGORIES`, `COURSE_CATEGORIES`, `FREELANCER_SUBCATEGORIES`, `CATEGORY_PLURAL`, `COURSE_TYPES`
- להשאיר את הפונקציות `getTimeSincePurchase`, `generateReviewSummary`

### 2. דף הבית (Index.tsx)
- להחליף `BUSINESSES` ו-`REVIEWS` בשאילתות Supabase (`businesses`, `reviews` + join עם `courses` ו-`profiles`)
- טופ פרילנסרים וטופ מוכרי קורסים — שאילתה ל-`businesses` עם order by rating
- ביקורות אחרונות — שאילתה ל-`reviews` עם order by created_at

### 3. דף חיפוש (SearchPage.tsx)
- להחליף `BUSINESSES` ו-`COURSES` בשאילתות Supabase
- החיפוש כבר עושה חלק מזה — צריך לוודא שהכל מגיע מה-DB

### 4. דף עסק (BusinessProfile.tsx)
- להחליף `getBusinessBySlug`, `getCoursesByBusiness`, `getReviewsByBusiness` בשאילתות Supabase
- הביקורות צריכות לכלול גם תגובות בעלים (`business_responses`)

### 5. דף קורס (CoursePage.tsx)
- להחליף `getCourseById`, `getReviewsByCourse`, `getBusinessBySlug` בשאילתות Supabase

### 6. דשבורד עסקי (BusinessDashboard.tsx, Dashboard.tsx)
- להסיר את `REVIEWS`, `COURSES`, `AFFILIATE_CLICKS` מה-imports — הדשבורד כבר אמור להשתמש בנתונים מהדאטאבייס (לוודא)

### 7. דף ForBusinessPage.tsx
- להסיר את `BUSINESSES` ולהשאיר את `TRUSTED_COMPANIES` כקבוע סטטי (זה חלק מהעיצוב/שיווק, לא נתונים מזויפים) — או לשלוף מה-DB

### 8. ReviewCard.tsx
- `getTimeSincePurchase` נשאר כפונקציית עזר — לא צריך שינוי

### 9. BusinessCard.tsx, CourseCard.tsx, BusinessHero.tsx
- אלה רק מקבלים props — לא צריכים שינוי, רק שהטיפוסים ישארו זמינים

## מה נשמר
- כל התבניות (templates) והעיצוב
- טיפוסים (Business, Course, Review, etc.)
- קטגוריות, תתי-קטגוריות, סוגי קורסים
- פונקציות עזר
- מבנה הדפים והקומפוננטות

## מה נמחק
- כל העסקים המזויפים (BUSINESSES array)
- כל הקורסים המזויפים (COURSES array)
- כל הביקורות המזויפות (REVIEWS array)
- כל הקליקים המזויפים (AFFILIATE_CLICKS array)
- הלוגואים המזויפים (imports של תמונות לוגו) — אם לא משמשים במקום אחר

## פרטים טכניים
- כל דף שמשתמש ב-mock data יקבל hook או שאילתת Supabase עם `useEffect` + `useState` (או `useQuery` מ-TanStack)
- הטיפוסים ב-mockData.ts ישארו לשימוש חוזר, אבל הנתונים מהדאטאבייס יותאמו לממשק הקיים
- כשאין נתונים, הדפים יציגו מצב ריק (empty state) במקום נתונים מזויפים


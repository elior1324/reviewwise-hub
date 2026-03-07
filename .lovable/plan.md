

## Analysis: What's Missing from the Prompt vs Current Code

After reviewing all existing pages and components, here's what the advanced prompt requires that **does not exist** in the current codebase:

---

### 1. Course Management (Entire Feature Missing)
The current app treats businesses as the main entity. There is **no concept of individual courses** as separate entities.

**Missing:**
- Course data model / mock data with fields: `course_name`, `price`, `description`, `affiliate_url`, `course_category`
- Course listing on business profile pages
- Individual course pages showing course rating, verified purchases, time since purchase
- Course management UI in the dashboard (add/edit/delete courses)

---

### 2. "Time Since Purchase" Display
Reviews currently show a date but **not how long ago the reviewer purchased** the course (e.g., "רכש לפני 8 חודשים"). This is a key trust signal mentioned in the prompt.

**Missing:**
- `purchase_date` field displayed on each review
- Calculated "time since purchase" label on ReviewCard

---

### 3. Review Update Capability
The prompt specifies customers should be able to **update their reviews over time** to reflect long-term experience.

**Missing:**
- Any UI or flow for editing/updating an existing review
- `updated_at` field or "edited" indicator on reviews

---

### 4. Business Owner Review Responses
The dashboard mentions "response rate" as a stat, but there's **no UI to actually respond to reviews**, and responses aren't shown on review cards.

**Missing:**
- "Respond" button/form on reviews in the dashboard
- Business response display on ReviewCard (public-facing)

---

### 5. AI Fake Review Detection UI
The prompt requires flagging suspicious reviews using heuristics.

**Missing:**
- Any flagging/moderation indicators on reviews
- Dashboard section showing flagged/suspicious reviews
- Mock AI detection logic

---

### 6. AI Review Summarization
The prompt asks for AI-generated summaries like "Customers often praise practical lessons."

**Missing:**
- Review summary section on business profile page
- Summary generation (even mocked)

---

### 7. Affiliate Tracking System
The prompt requires tracked outbound links (`/go/course-id`), click recording, and an affiliate dashboard.

**Missing:**
- `/go/:courseId` redirect route
- Affiliate clicks tracking (even mocked)
- Affiliate dashboard/stats in the business dashboard

---

### 8. Search Filters: Experience Duration & Price
Current search filters include category and rating. The prompt also requires filtering by **experience duration** and **price**.

**Missing:**
- Price filter on search page
- Experience duration filter on search page

---

### 9. Report Abuse
The prompt requires users to be able to **report reviews for abuse**.

**Missing:**
- Report button on review cards
- Report dialog/flow

---

### 10. Business Registration Flow
Currently the dashboard is a static page. There's **no registration/signup flow** for businesses.

**Missing:**
- Business registration form/page
- Fields: business_name, website, email, phone, category, description

---

### 11. Chatbot Course Recommendations Based on Ratings
The current chatbot gives generic mock responses. The prompt specifies it should **suggest courses based on search query and highest verified ratings**.

**Missing:**
- Chatbot logic that references actual course data and ratings
- Contextual course recommendations in chat responses

---

## Implementation Plan

### Phase 1: Data Layer & Course System
- Add course mock data with all required fields (name, price, description, affiliate_url, category)
- Add `purchase_date` and `timeSincePurchase` to review mock data
- Create a `CoursePage.tsx` at `/course/:courseId`
- Add course listing to `BusinessProfile.tsx`
- Add course management tab to `Dashboard.tsx`

### Phase 2: Review Enhancements
- Add "time since purchase" display to `ReviewCard.tsx`
- Add business owner response display to `ReviewCard.tsx`
- Add "respond to review" UI in dashboard
- Add "report review" button + dialog on ReviewCard
- Add "update review" flow on WriteReview page (mock)
- Add AI review summary section on BusinessProfile (mocked)
- Add AI flagged reviews section in Dashboard (mocked)

### Phase 3: Affiliate System
- Create `/go/:courseId` redirect route in `App.tsx`
- Create `AffiliateRedirect.tsx` page that logs click + redirects
- Add affiliate stats tab to Dashboard

### Phase 4: Search & Registration
- Add price range filter and experience duration filter to `SearchPage.tsx`
- Create `BusinessRegister.tsx` page with full registration form
- Add route `/register` to `App.tsx`

### Phase 5: Chatbot Enhancement
- Update `AIChatbot.tsx` mock responses to reference course data and recommend by rating

### Files to Create
- `src/pages/CoursePage.tsx`
- `src/pages/AffiliateRedirect.tsx`
- `src/pages/BusinessRegister.tsx`
- `src/components/ReviewResponse.tsx`
- `src/components/ReportReviewDialog.tsx`
- `src/components/ReviewSummary.tsx`
- `src/components/CourseCard.tsx`
- `src/data/mockData.ts` (centralize all mock data)

### Files to Modify
- `src/App.tsx` — add new routes
- `src/components/ReviewCard.tsx` — time since purchase, response, report button
- `src/pages/BusinessProfile.tsx` — course list, AI summary
- `src/pages/Dashboard.tsx` — course management, respond to reviews, affiliate stats, flagged reviews
- `src/pages/SearchPage.tsx` — price & experience filters
- `src/components/AIChatbot.tsx` — smarter course recommendations
- `src/components/Navbar.tsx` — add registration link


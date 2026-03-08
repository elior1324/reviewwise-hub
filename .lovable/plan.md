

## Plan: Add Demo Access to Business Dashboard

The business login page currently requires real authentication. Since the dashboard already has mock data and a simulated "logged in" banner, I'll add a "Demo Access" button on the business login page that lets you skip login and go directly to the dashboard preview.

### Changes

**`src/pages/business/BusinessAuth.tsx`** — Add a "כניסה לדמו" (Demo Access) button below the login form that navigates directly to `/business/dashboard` without requiring credentials.

This way you can click one button from the login page and immediately see the full business dashboard experience.


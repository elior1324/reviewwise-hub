

## Plan: Show All Features with Tier-Based Locking in Business Dashboard

Currently the business dashboard shows all features without any tier awareness. The goal is to:
1. Show **all** features (Pro + Premium) to every business that opened an account
2. Premium-only features should appear **locked with a clear visual indicator** when the user is on the Pro plan
3. Everything unlocked for Premium subscribers

### Tier-to-Feature Mapping

Based on the pricing page, these dashboard tabs map to tiers:
- **All tiers**: סקירה כללית (Overview), התראות (Notifications)
- **Pro tier**: קבלות ואימות (Invoices), קליקים והמרות (Clicks), דוח AI שבועי (AI Report), סרטוני לקוחות (Testimonials)
- **Premium tier** (locked for Pro users): CRM & Leads tab (new), Webhook/API tab (new), דוחות AI יומיים (Daily AI — new)

### Changes

**`src/pages/business/BusinessDashboard.tsx`**:

1. **Import `useAuth`** and read `subscriptionTier` from context (or use a `demoTier` state for the demo flow since users aren't logged in).

2. **Add a demo tier selector** at the top of the dashboard — a small toggle (e.g., "סימולציה: מקצועי / פרימיום") so the demo user can switch between tiers and see the locking behavior.

3. **Add 3 new Premium-only tabs** with mock content:
   - **CRM ולידים** — mock CRM integration panel
   - **Webhooks & API** — mock API access panel  
   - **דוחות AI יומיים** — mock daily AI reports

4. **Create a `LockedOverlay` component** inline — a visually clear overlay that:
   - Blurs/dims the tab content slightly
   - Shows a centered lock icon with "פיצ׳ר פרימיום" badge
   - Has a "שדרגו לפרימיום" CTA button
   - Looks polished with glass styling

5. **Wrap Premium tabs** in `LockedOverlay` when `currentTier === "pro"` — the content is visible underneath (blurred) so users can see what they're missing, but interaction is blocked.

6. **Add tier badge** next to Premium tab labels (small Crown icon or "פרימיום" chip) so it's clear even before clicking.

### Visual Design

The locked overlay will use:
- `backdrop-blur-sm` + semi-transparent background
- Centered `Lock` icon with "פרימיום בלבד" text
- A gradient border card in the center with the upgrade CTA
- Content underneath remains partially visible but non-interactive (`pointer-events-none` on children)

This keeps the dashboard looking rich and full-featured while making the tier distinction crystal clear.


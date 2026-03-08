

## Plan: Show Business Dashboard in Demo/Preview Mode

The dashboard currently already renders with mock data and has no auth gating — it shows the full dashboard regardless of login state. So right now, navigating to `/business/dashboard` already shows the dashboard as if you're logged in.

**The issue:** The dashboard doesn't have any auth check, so it always shows. But if auth is eventually added, you'd be blocked. The user wants to see how the page looks "as a business."

### What I'll Do

1. **Remove auth gating from BusinessDashboard** — Currently there's no auth redirect, so the dashboard already renders freely. No change needed here.

2. **Add a demo banner** — Add a subtle banner at the top of the dashboard showing a simulated logged-in state (business name, email) so it feels like a real business session, without requiring actual authentication.

3. **Keep all mock data as-is** — The dashboard already displays realistic mock stats, reviews, AI reports, notifications, and affiliate clicks. This is exactly what a business owner would see.

### Technical Details

- In `BusinessDashboard.tsx`, add a small "logged in as" indicator at the top (e.g., "מחובר כ: Digital Marketing Academy · admin@dma.co.il") to simulate the logged-in experience
- No database or auth changes needed — this is purely a UI preview enhancement
- All existing mock data (stats, reviews, AI report, notifications, clicks) will continue to display

### Result
Navigating to `/business/dashboard` will show the full business dashboard with a simulated business identity, giving you a complete preview of the business owner experience.


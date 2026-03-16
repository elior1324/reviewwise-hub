# ReviewHub — System Coherence Map
> Product Architecture Reference | Three-Layer Trust Ecosystem

---

## The Three Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — TRUST                                                 │
│  Trust Score (0–100) · Business-facing · Credibility indicator   │
│  Signals: verified activity, commercial health, consistency       │
│  Output: Grade A+/A/B/C/D/F on business profile                 │
│  Protected by: anti-manipulation auto-detection                  │
│  Cannot be purchased or manually influenced                       │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 2 — ACTIVITY                                              │
│  Activity Points · User-facing · Participation metric            │
│  Sources: verified reviews, community activity, referrals         │
│  Stored in: user_points table                                    │
│  Tiers: Starter → Explorer (150) → Influencer (300) → Ambassador (600)│
│  Can be redeemed for platform benefits                           │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 3 — REWARDS & COMMUNITY STANDING                          │
│  3A — Platform Benefits: redeemed via Activity Points (Layer 2)  │
│       600 points = eligible for 20% course discount              │
│  3B — Community Ranking: Community Points (נקודות קהילה)         │
│       Separate reputation metric · Zero cash value               │
│       Stored in: leaderboard_entries table (per season)          │
│       Earned: 100 pts (review) / 200 pts (verified review)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Points Systems — Side-by-Side Comparison

| Dimension            | Activity Points                        | Community Points (נקודות קהילה)         |
|----------------------|----------------------------------------|------------------------------------------|
| **Hebrew label**     | נקודות / נקודות פעילות                 | נקודות קהילה                             |
| **DB table**         | `user_points`                          | `leaderboard_entries`                    |
| **Earned by**        | Reviews, referrals, community activity | Writing reviews (x1), verified (x2)      |
| **Per referral**     | 150 points                             | N/A (referrals don't earn these)         |
| **Redeemable?**      | ✅ Yes — platform benefits              | ❌ No — reputation only                  |
| **Tier progression** | Starter / Explorer / Influencer / Ambassador | N/A (no tier system)              |
| **Shown on**         | UserSettingsPage · UserReferralDashboard | LeaderboardPage · SeasonLeaderboard    |
| **CTA from Settings**| Primary: /user/referrals               | Secondary: /leaderboard                  |
| **Cash value**       | Zero (discount is a platform benefit, not cash) | Zero                            |
| **Affects TrustScore?** | ❌ Never                            | ❌ Never                                 |

---

## Trust Score — Isolation Rules

The Trust Score is a **business-level credibility indicator**. It operates in complete isolation from both points systems:

- Activity Points (Layer 2) do **not** affect any business's Trust Score.
- Community Points do **not** affect any business's Trust Score.
- Commercial transactions (subscriptions, affiliate fees) do **not** affect any business's Trust Score.
- The only inputs to Trust Score are: verified review signals, commercial health indicators, and consistency-over-time signals — all computed automatically.

This is enforced structurally and disclosed as the "Trust Firewall" in the platform's public documentation.

---

## Referral System — Layer Placement

The Invite / Referral system is a **Layer 2 mechanism** (Activity):

- Each confirmed referral: +150 Activity Points to the inviting user.
- Referrals do **not** generate Community Points.
- Referrals do **not** influence any business's Trust Score.
- Referrals are visible in: `UserReferralDashboard` (/user/referrals).

---

## Page-by-Page Responsibility Matrix

| Page / Component           | Layer(s) Shown | Points Type        | Notes                                        |
|----------------------------|----------------|--------------------|----------------------------------------------|
| `AboutPage.tsx`            | 1, 2, 3A, 3B   | Conceptual only    | No raw numbers; ecosystem section covers all 4 outputs |
| `UserReferralDashboard.tsx`| 2, 3A          | Activity Points    | Tier progress + reward redemption            |
| `UserSettingsPage.tsx`     | 2, 3A, 3B ref  | Activity Points    | PointsSection shows activity points; links to /user/referrals (primary) and /leaderboard (secondary) |
| `LeaderboardPage.tsx`      | 3B             | Community Points   | Clearly labeled נקודות קהילה; info strip cross-references /user/referrals for rewards |
| `SeasonLeaderboard.tsx`    | 3B             | Community Points   | Footer disclaimer explicitly separates from redeemable points |
| `GamificationNotifications`| —              | Deprecated no-op   | Retained to prevent stale import reintroduction |
| `FloatingEarnCTA`          | —              | Deprecated no-op   | Same reason                                  |

---

## Canonical Term Glossary

| Concept                  | Canonical Hebrew Label        | Canonical English Label       |
|--------------------------|-------------------------------|-------------------------------|
| Business credibility score | ציון האמון                  | Trust Score                   |
| User participation metric | נקודות / נקודות פעילות       | Activity Points               |
| Community reputation metric | נקודות קהילה              | Community Points              |
| Tier system              | Starter / Explorer / Influencer / Ambassador | (same in Hebrew UI) |
| Course discount benefit  | הטבת פלטפורמה               | Platform Benefit              |
| Public ranking           | לוח המובילים                  | Leaderboard / Community Ranking |
| Referral program         | תוכנית הזמנת חברים            | Referral / Invite Program     |

---

## QA Checklist — What Must Always Be True

- [ ] Trust Score never appears as a points counter or a metric users can "earn toward."
- [ ] Activity Points are never described as influencing a business's Trust Score.
- [ ] Community Points (נקודות קהילה) are always labeled distinctly from Activity Points.
- [ ] Community Points always carry the disclaimer: no cash value, non-transferable, non-redeemable.
- [ ] UserSettings "Points & Rewards" CTA links to /user/referrals as primary destination.
- [ ] The Leaderboard info strip cross-references /user/referrals for reward redemption.
- [ ] No page uses the term "נקודות אמון" — this term was deprecated to avoid collision with Trust Score.
- [ ] Platform Benefits (course discount) are framed as participation rewards, not as Trust Score outcomes.
- [ ] Referral activity is correctly categorized as Activity Layer (Layer 2), not Trust Layer (Layer 1).
- [ ] Tier thresholds remain: 150 (Explorer) / 300 (Influencer) / 600 (Ambassador). Do not modify.

---

## Changes Made in This Session

| File                          | Change                                                                        |
|-------------------------------|-------------------------------------------------------------------------------|
| `SeasonLeaderboard.tsx`       | Renamed all "נקודות אמון" labels → "נקודות קהילה"; updated footer disclaimer to explicitly separate from redeemable points |
| `LeaderboardPage.tsx`         | Renamed "נקודות אמון" → "נקודות קהילה" in hero, info strip, and How-It-Works heading; added cross-reference to /user/referrals in info strip |
| `UserSettingsPage.tsx`        | PointsSection: added clarifying subtitle explaining redeemable nature of activity points; added inline tier badge (Starter/Explorer/Influencer/Ambassador); changed primary CTA from /leaderboard to /user/referrals; retained /leaderboard as secondary CTA with explicit "separate system" label |
| `AboutPage.tsx`               | Added `BarChart3` import; expanded ecosystem grid from 3 to 4 cards, adding "דירוג קהילה" (Community Ranking) as the fourth output of participation; updated Trophy card description to clarify Activity Points ≠ Trust Score |

**No mechanics changed.** Thresholds, point values, reward values, tier labels, and algorithms are all unchanged.

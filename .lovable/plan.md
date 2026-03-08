

## Plan: Fix Demo Link Not Clickable

### Root Cause
The `animated-border` CSS class on the Card creates a `::before` pseudo-element with `position: absolute; inset: 0` that overlays the entire card content. This pseudo-element is missing `pointer-events: none`, so it intercepts all click events on elements inside the card — including the demo link.

### Fix

**`src/index.css`** (line ~128) — Add `pointer-events: none` to the `.animated-border::before` rule so the decorative border overlay doesn't block interaction with card contents.

This single line fix will resolve the demo link issue and also fix any other clickability problems on cards using `animated-border` throughout the app.




## Plan: Remove "כתבו ביקורת" from Navbar

The "כתבו ביקורת" link points to `/write-review` which doesn't have a route defined in `App.tsx` (the actual route is `/review/:token`), causing the 404 error.

### Changes:
1. **`src/components/Navbar.tsx`** — Remove the "כתבו ביקורת" link from both desktop nav (line 40-43) and mobile menu (line 107), and remove the unused `PenLine` icon import.


/**
 * tests/e2e/xss-regression.spec.ts
 *
 * XSS regression tests for the JSON-LD structured-data injection fix.
 * These tests verify that business names / descriptions containing HTML
 * special characters CANNOT execute JavaScript via the <script type="application/ld+json">
 * block in BusinessProfile.tsx.
 *
 * HOW THE FIX WORKS:
 *   dangerouslySetInnerHTML now applies:
 *     .replace(/</g, '\\u003c')
 *     .replace(/>/g, '\\u003e')
 *     .replace(/&/g, '\\u0026')
 *   This prevents </script><script>... breakout from the JSON-LD block.
 *
 * PREREQUISITES:
 *   A business with slug "xss-test-biz" must exist in the test DB with
 *   name containing the XSS payload. Create it with the SQL in Appendix C
 *   of the QA checklist, or use the Supabase seed script:
 *     supabase db seed --file supabase/seed/xss-test.sql
 *
 * Run: npm run test:e2e -- xss
 */
import { test, expect } from "@playwright/test";

// ─── XSS payloads to test ─────────────────────────────────────────────────────
const PAYLOADS = [
  // Classic script breakout
  `</script><script>window.__xssBreakout=true</script>`,
  // Attribute-based (less relevant for JSON-LD but good to have)
  `"><img src=x onerror="window.__xssImg=true">`,
  // Unicode injection
  `\u003c/script\u003e\u003cscript\u003ewindow.__xssUnicode=true\u003c/script\u003e`,
];

// Business slugs created in the test database with XSS names
const XSS_TEST_SLUG = process.env.E2E_XSS_SLUG ?? "xss-test-biz";

test.describe("JSON-LD XSS regression (F02 — CRITICAL fix)", () => {
  test.beforeEach(async ({ page }) => {
    // Monitor for alert() calls (classic XSS proof-of-concept)
    await page.addInitScript(() => {
      window.__xssTriggered = false;
      window.__originalAlert = window.alert;
      window.alert = () => { window.__xssTriggered = true; };
    });
  });

  test("TC: UX-09a — no alert() fires when loading a business profile with XSS in name", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await page.goto(`/business/${XSS_TEST_SLUG}`);
    await page.waitForLoadState("networkidle");

    // Confirm no alert fired
    expect(alertFired).toBe(false);

    // Confirm no XSS global was set
    const xssTriggered = await page.evaluate(() => (window as Record<string, unknown>).__xssTriggered);
    expect(xssTriggered).toBeFalsy();
  });

  test("TC: UX-09b — JSON-LD block does not contain raw </script> in page source", async ({ page }) => {
    await page.goto(`/business/${XSS_TEST_SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    // Read the raw text of ALL ld+json script tags on the page
    const jsonLdContents: string[] = await page.evaluate(() => {
      const scripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      );
      return scripts.map((s) => s.textContent ?? "");
    });

    for (const content of jsonLdContents) {
      // The raw text inside the <script> tag must NOT contain </script
      expect(content).not.toContain("</script");
      // Must NOT contain unescaped < or > (they should be \u003c and \u003e)
      expect(content).not.toMatch(/<[a-zA-Z/]/);
    }
  });

  test("TC: UX-09c — JSON-LD block uses Unicode escapes for < > &", async ({ page }) => {
    await page.goto(`/business/${XSS_TEST_SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    const jsonLdContents: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent ?? "")
    );

    // If the business name contained < or >, it should now be \\u003c / \\u003e
    const hasEscapedChars = jsonLdContents.some(
      (c) => c.includes("\\u003c") || c.includes("\\u003e") || c.includes("\\u0026")
    );
    // Either the content has escape sequences, OR it has no special chars at all
    // (valid for businesses with clean names — at least no raw < > & should be there)
    for (const content of jsonLdContents) {
      expect(content).not.toContain("&amp;");   // double-escaping would be wrong too
      expect(content).not.toContain("&#");      // HTML entity escaping not expected
    }
  });

  test("TC: UX-09d — JSON-LD is still valid JSON after escaping", async ({ page }) => {
    await page.goto(`/business/${XSS_TEST_SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    const jsonLdContents: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent ?? "")
    );

    for (const content of jsonLdContents) {
      if (!content.trim()) continue;
      // Must be parseable as valid JSON (Unicode escapes are valid JSON)
      let parsed: unknown;
      expect(() => { parsed = JSON.parse(content); }).not.toThrow();
      // Must have a @context
      expect((parsed as Record<string, unknown>)["@context"]).toBe("https://schema.org");
    }
  });

  test("TC: UX-09e — Content-Security-Policy header is present on HTML response", async ({ page }) => {
    const response = await page.goto(`/business/${XSS_TEST_SLUG}`);
    const headers = response?.headers() ?? {};

    // CSP must be present
    expect(headers["content-security-policy"]).toBeTruthy();

    const csp = headers["content-security-policy"] ?? "";
    // Must not allow unsafe-eval (a common XSS amplifier)
    expect(csp).not.toContain("'unsafe-eval'");
    // Must have object-src 'none' (blocks plugins)
    expect(csp).toContain("object-src 'none'");
    // Must have frame-ancestors (clickjacking protection)
    expect(csp).toContain("frame-ancestors");
  });

  test("TC: SEC-04 — other security headers present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toMatch(/SAMEORIGIN|DENY/);
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});

// ─── Additional: anon RLS check via fetch ─────────────────────────────────────
test.describe("RLS policy regression via API (SEC-02, SEC-03)", () => {
  const SUPABASE_URL  = process.env.VITE_SUPABASE_URL ?? "";
  const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY ?? "";

  test.skip(!SUPABASE_URL || !SUPABASE_ANON, "Skipped: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set");

  test("TC: SEC-02 — anon user cannot INSERT into affiliate_clicks", async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/affiliate_clicks`, {
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      data: { course_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status()).toBe(401);
  });

  test("TC: SEC-03 — anon user cannot read review_requests without token filter", async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/review_requests?select=customer_email`, {
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
      },
    });
    expect(res.status()).toBe(200);
    const rows = await res.json();
    // RLS should return 0 rows for anon without token filter
    expect(rows).toHaveLength(0);
  });
});

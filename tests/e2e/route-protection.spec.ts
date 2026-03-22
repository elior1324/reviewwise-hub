/**
 * route-protection.spec.ts
 *
 * Verifies that all AuthProtectedRoute-wrapped pages redirect unauthenticated
 * visitors to /auth, and that publicly accessible pages remain accessible.
 * Written as part of the QA audit (March 2026).
 */
import { test, expect } from "@playwright/test";

const PROTECTED_ROUTES = [
  "/business/dashboard",
  "/business/settings",
  "/business/solutions/reviews",
  "/business/solutions/analytics",
  "/settings",
  "/user/referrals",
];

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/search",
  "/business",
  "/business/login",
  "/business/signup",
  "/business/pricing",
  // /auth is excluded from this list — it IS the auth page and stays at /auth.
  // Testing it here would produce a false-positive failure.
  "/privacy",
  "/terms",
];

test.describe("Route protection — unauthenticated visitors", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} → redirects to /auth when not logged in`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      // Allow a moment for client-side redirect
      await page.waitForURL(/\/auth/, { timeout: 8_000 });
      expect(page.url()).toContain("/auth");
    });
  }
});

test.describe("Public routes — accessible without login", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads without redirect to /auth`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      // Should NOT be redirected to /auth
      expect(page.url()).not.toMatch(/\/auth$/);
      // A heading or input should be present
      const hasContent = await page.locator("h1, h2, input").first().isVisible({ timeout: 5_000 });
      expect(hasContent).toBe(true);
    });
  }
});

test.describe("Legacy redirects — work correctly", () => {
  test("/dashboard → /business/dashboard (then /auth for unauth)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Should redirect through /business/dashboard then to /auth
    await page.waitForURL(/\/(auth|business\/dashboard)/, { timeout: 8_000 });
    // Unauthenticated: must end at /auth
    expect(page.url()).toContain("/auth");
  });

  test("/for-business → /business", async ({ page }) => {
    await page.goto("/for-business", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/business/, { timeout: 5_000 });
    expect(page.url()).toMatch(/\/business($|\?|#)/);
  });

  test("/pricing → /business/pricing", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/business\/pricing/, { timeout: 5_000 });
    expect(page.url()).toContain("/business/pricing");
  });
});

test.describe("Business Landing — Demo CTA link behaviour", () => {
  test("Demo CTA on /business leads to /business/dashboard (protected)", async ({ page }) => {
    await page.goto("/business", { waitUntil: "domcontentloaded" });
    // Click the demo CTA banner
    await page.click("text=ראו איך הדאשבורד נראה");
    // Since user is not logged in it should redirect to /auth
    await page.waitForURL(/\/auth/, { timeout: 8_000 });
    expect(page.url()).toContain("/auth");
  });
});

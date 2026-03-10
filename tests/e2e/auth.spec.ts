/**
 * tests/e2e/auth.spec.ts
 *
 * Playwright end-to-end tests for the ReviewHub authentication flows.
 *
 * PREREQUISITES:
 *   1. A Supabase project with a test user (E2E_TEST_EMAIL / E2E_TEST_PASSWORD)
 *   2. A Cloudflare Turnstile test site key (auto-passes in test mode)
 *   3. The dev server running: npm run dev (or set BASE_URL)
 *
 * Set in .env.test:
 *   E2E_TEST_EMAIL=qa-test@reviewhub-test.co.il
 *   E2E_TEST_PASSWORD=QAtest77!
 *   E2E_SIGNUP_EMAIL=qa-new@reviewhub-test.co.il  (fresh email for signup test)
 *
 * Run: npm run test:e2e -- auth
 */
import { test, expect } from "@playwright/test";
import { AuthPagePO, DashboardPO, TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from "./helpers/auth";

// ═════════════════════════════════════════════════════════════════════════════
// Suite 1: Login flow (email + password)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Email login flow", () => {
  test("TC: AUTH-03 — valid credentials → redirect to dashboard", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    await auth.fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await auth.completeTurnstile();
    await auth.submitBtn.click();

    // Should navigate away from /auth
    await expect(page).not.toHaveURL(/\/auth$/);
    // Confirm session cookie is set (supabase-auth-token or similar)
    const cookies = await page.context().cookies();
    const hasSession = cookies.some(c =>
      c.name.includes("sb-") || c.name.includes("supabase")
    );
    expect(hasSession || page.url().includes("/dashboard") || page.url() === new URL("/", page.url()).toString())
      .toBe(true);
  });

  test("TC: AUTH-04 — wrong password → error toast, no redirect", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    await auth.fillLoginForm(TEST_EMAIL, "WrongPassword999!");
    await auth.completeTurnstile();
    await auth.submitBtn.click();

    // Should stay on /auth
    await expect(page).toHaveURL(/\/auth/);
    // Sonner toast with error text (appears as [data-sonner-toast] or role="status")
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /שגויים|נכשל/ })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("TC: AUTH-12 — submit button is disabled before Turnstile resolves", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    await auth.fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    // Do NOT complete Turnstile
    await expect(auth.submitBtn).toBeDisabled();
  });

  test("TC: AUTH-03b — loading spinner appears on submit button while signing in", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    await auth.fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await auth.completeTurnstile();

    // Intercept the Supabase auth call to add a delay so we can see the spinner
    await page.route("**/auth/v1/token**", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });

    await auth.submitBtn.click();
    // Spinner text should appear immediately
    await expect(page.getByText("טוען...")).toBeVisible({ timeout: 2_000 });
    // Wait for navigation
    await page.waitForURL(/\/(?!auth)/, { timeout: 10_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 2: Signup flow (email + password)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Email signup flow", () => {
  // Use a dynamic email to avoid "already registered" errors between test runs
  const SIGNUP_EMAIL = process.env.E2E_SIGNUP_EMAIL
    ?? `qa-new+${Date.now()}@reviewhub-test.co.il`;

  test("TC: AUTH-01 — happy path: form submits and shows success toast", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();
    await auth.switchToSignup();

    await auth.nameInput.fill(TEST_NAME);
    await auth.fillLoginForm(SIGNUP_EMAIL, "Secure77!");
    await auth.completeTurnstile();

    // Check privacy consent checkbox
    await auth.privacyChk.check();
    await expect(auth.privacyChk).toBeChecked();

    await auth.submitBtn.click();

    // Should show success toast about checking email
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /נרשמתם|מייל|אימות/ })
    ).toBeVisible({ timeout: 8_000 });
  });

  test("TC: AUTH-02 — password strength bar appears in signup mode", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();
    await auth.switchToSignup();

    // Strength bar hidden initially
    await expect(auth.strengthLabel).not.toBeVisible();

    // Level 1 — weak
    await auth.passwordInput.fill("abc");
    await expect(page.getByText("חוזק הסיסמה: חלשה")).toBeVisible();

    // Level 2 — medium
    await auth.passwordInput.fill("Secure77");
    await expect(page.getByText("חוזק הסיסמה: בינונית")).toBeVisible();

    // Level 3 — strong
    await auth.passwordInput.fill("Correct77Horse");
    await expect(page.getByText("חוזק הסיסמה: חזקה")).toBeVisible();
  });

  test("TC: AUTH-02b — password strength bar does NOT appear in login mode", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();
    // Login mode by default
    await auth.passwordInput.fill("Secure77!");
    await expect(auth.strengthLabel).not.toBeVisible();
  });

  test("TC: AUTH-11 — submit stays disabled until privacy consent checked", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();
    await auth.switchToSignup();

    await auth.nameInput.fill(TEST_NAME);
    await auth.fillLoginForm(SIGNUP_EMAIL, "Secure77!");
    await auth.completeTurnstile();
    // Privacy NOT checked
    await expect(auth.submitBtn).toBeDisabled();

    await auth.privacyChk.check();
    await expect(auth.submitBtn).not.toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 3: Password show/hide toggle — accessibility
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Password show/hide accessibility", () => {
  test("TC: AUTH-08 — toggle button has correct aria-label in both states", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    const showBtn = page.getByRole("button", { name: "הצג סיסמה" });
    await expect(showBtn).toBeVisible();

    await showBtn.click();
    await expect(page.getByRole("button", { name: "הסתר סיסמה" })).toBeVisible();

    await page.getByRole("button", { name: "הסתר סיסמה" }).click();
    await expect(page.getByRole("button", { name: "הצג סיסמה" })).toBeVisible();
  });

  test("TC: AUTH-08b — email input renders left-to-right (dir=ltr)", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    const emailDir = await auth.emailInput.getAttribute("dir");
    expect(emailDir).toBe("ltr");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 4: Session persistence
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Session persistence", () => {
  test("TC: AUTH-12 — session survives page reload", async ({ page }) => {
    const auth = new AuthPagePO(page);
    await auth.goto();

    await auth.fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await auth.completeTurnstile();
    await auth.submitBtn.click();

    await page.waitForURL(/\/(?!auth)/, { timeout: 10_000 });
    const urlAfterLogin = page.url();

    // Hard reload
    await page.reload({ waitUntil: "networkidle" });

    // Should still be on the authenticated URL (not redirected back to /auth)
    await expect(page).not.toHaveURL(/\/auth/);
    expect(page.url()).not.toContain("/auth");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 5: Mobile layout @mobile
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Mobile auth layout @mobile", () => {
  test("TC: AUTH-07m — form fits within 375px without horizontal scroll @mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const auth = new AuthPagePO(page);
    await auth.goto();

    const scrollWidth  = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth  = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

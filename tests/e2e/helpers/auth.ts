/**
 * tests/e2e/helpers/auth.ts
 *
 * Shared helpers for Playwright auth tests.
 * Provides page objects and reusable actions so individual specs stay concise.
 */
import { type Page, expect } from "@playwright/test";

// ── Environment variables ─────────────────────────────────────────────────────
// Set these in .env.test or pass via CI environment
export const TEST_EMAIL    = process.env.E2E_TEST_EMAIL    ?? "qa-test@reviewhub-test.co.il";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "QAtest77!";
export const TEST_NAME     = "QA Tester";

// ── Page Object: AuthPage ─────────────────────────────────────────────────────
export class AuthPagePO {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/auth");
    await this.page.waitForLoadState("networkidle");
  }

  get submitBtn()     { return this.page.getByRole("button", { name: /התחברו$|הרשמו$/ }); }
  get emailInput()    { return this.page.getByLabel("אימייל"); }
  get passwordInput() { return this.page.getByLabel("סיסמה"); }
  get googleBtn()     { return this.page.getByRole("button", { name: /Google/i }); }
  get showPassBtn()   { return this.page.getByRole("button", { name: /הצג סיסמה|הסתר סיסמה/i }); }
  get toggleMode()    { return this.page.getByRole("button", { name: /הרשמו כאן|התחברו/i }); }
  get strengthBar()   { return this.page.locator(".h-1\\.5.w-full"); }
  get strengthLabel() { return this.page.locator("text=/חוזק הסיסמה/"); }
  get turnstile()     { return this.page.locator("[data-testid='cf-turnstile'], iframe[src*='challenges.cloudflare']"); }
  get nameInput()     { return this.page.getByLabel("שם תצוגה"); }
  get privacyChk()    { return this.page.getByRole("checkbox"); }

  async switchToSignup() {
    await this.page.getByRole("button", { name: /הרשמו כאן/i }).click();
    await expect(this.nameInput).toBeVisible();
  }

  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async completeTurnstile() {
    // In test environments Turnstile may be in demo mode — just wait for it
    // If using a test site key (1x0000000000000000000000000000000AA), it auto-passes
    try {
      const frame = this.page.frameLocator("iframe[src*='challenges.cloudflare']").first();
      await frame.locator("input[type='checkbox']").click({ timeout: 5_000 });
    } catch {
      // Turnstile not present (test env / headless) — skip
    }
  }
}

// ── Page Object: Dashboard ────────────────────────────────────────────────────
export class DashboardPO {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForURL(/\/dashboard|\/$/);
    await this.page.waitForLoadState("networkidle");
  }

  get userAvatar() { return this.page.locator("[data-testid='user-avatar'], [aria-label*='avatar'], .avatar"); }
  get logoutBtn()  { return this.page.getByRole("button", { name: /יציאה|התנתקות/i }); }
}

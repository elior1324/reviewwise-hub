/**
 * diagnostics.spec.ts
 *
 * Full-site diagnostic: visits every major page, measures load time,
 * captures console errors, and verifies that key UI elements appear.
 * Run: npm run test:e2e -- diagnostics
 */
import { test, expect, Page } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Collect console errors / warnings on a page */
function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

/** Collect failed network requests */
function collectFailedRequests(page: Page) {
  const failed: string[] = [];
  page.on("response", (resp) => {
    if (resp.status() >= 400) {
      failed.push(`HTTP ${resp.status()} — ${resp.url()}`);
    }
  });
  return failed;
}

/**
 * Navigate to a URL, wait for DOM content (not networkidle — Supabase WS
 * connections prevent networkidle from ever firing), measure elapsed time,
 * and return { durationMs, errors }.
 */
async function loadPage(page: Page, url: string, timeout = 15_000) {
  const errors = collectConsoleErrors(page);
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  const durationMs = Date.now() - t0;
  return { durationMs, errors };
}

// ── public pages ──────────────────────────────────────────────────────────────

test.describe("Public pages load", () => {

  test("Homepage /", async ({ page }) => {
    const failed = collectFailedRequests(page);
    const { durationMs, errors } = await loadPage(page, "/");
    console.log(`  ⏱  Homepage: ${durationMs}ms`);
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (failed.length) console.warn("  Failed requests:", failed);
    if (errors.length) console.warn("  Console errors:", errors);
    // Only fail on JS errors, not on Supabase API 400/404 (expected for anon users)
    const jsErrors = errors.filter(e => e.includes("[pageerror]"));
    expect(jsErrors).toHaveLength(0);
  });

  test("Search / מאגר האמון /search", async ({ page }) => {
    const failed = collectFailedRequests(page);
    const { durationMs, errors } = await loadPage(page, "/search");
    console.log(`  ⏱  Search: ${durationMs}ms`);
    // spinner should disappear
    await expect(page.locator("text=טוען נתונים")).toBeHidden({ timeout: 10_000 });
    // heading must appear
    await expect(page.locator("h1")).toContainText("מאגר האמון");
    // tabs should be visible
    await expect(page.locator("[role=tablist]")).toBeVisible();
    if (failed.length) console.warn("  Failed requests:", failed);
    if (errors.length) console.warn("  Console errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]"));
    expect(jsErrors).toHaveLength(0);
  });

  test("Business landing /business", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/business");
    console.log(`  ⏱  Business landing: ${durationMs}ms`);
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Business pricing /business/pricing", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/business/pricing");
    console.log(`  ⏱  Pricing: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Resources /business/resources", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/business/resources");
    console.log(`  ⏱  Resources: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("About /about", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/about");
    console.log(`  ⏱  About: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Compare /compare", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/compare");
    console.log(`  ⏱  Compare: ${durationMs}ms`);
    await expect(page.locator("nav")).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Leaderboard /leaderboard", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/leaderboard");
    console.log(`  ⏱  Leaderboard: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Auth /auth", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/auth");
    console.log(`  ⏱  Auth: ${durationMs}ms`);
    await expect(page.locator("input[type=email]")).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Business login /business/login", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/business/login");
    console.log(`  ⏱  Business login: ${durationMs}ms`);
    await expect(page.locator("input[type=email]")).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Business profile /biz/mitav-digital", async ({ page }) => {
    const failed = collectFailedRequests(page);
    const { durationMs, errors } = await loadPage(page, "/biz/mitav-digital");
    console.log(`  ⏱  Business profile: ${durationMs}ms`);
    // Business name should appear in heading (loaded from DB)
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 12_000 });
    if (failed.length) console.warn("  Failed requests:", failed);
    if (errors.length) console.warn("  Console errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]"));
    expect(jsErrors).toHaveLength(0);
  });

  test("Privacy /privacy", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/privacy");
    console.log(`  ⏱  Privacy: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Terms /terms", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/terms");
    console.log(`  ⏱  Terms: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

  test("Widgets /partners/prestige-badges", async ({ page }) => {
    const { durationMs, errors } = await loadPage(page, "/partners/prestige-badges");
    console.log(`  ⏱  Widgets: ${durationMs}ms`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (errors.length) console.warn("  Errors:", errors);
    const jsErrors = errors.filter(e => e.includes("[pageerror]")); expect(jsErrors).toHaveLength(0);
  });

});

// ── navigation flow ───────────────────────────────────────────────────────────

test.describe("Navigation flows", () => {

  test("Navbar: click מאגר האמון from homepage", async ({ page }) => {
    await page.goto("/");
    await page.click("text=מאגר האמון");
    await expect(page).toHaveURL(/\/search/);
    await expect(page.locator("text=טוען נתונים")).toBeHidden({ timeout: 10_000 });
  });

  test("Navbar: switch to business mode and back", async ({ page }) => {
    await page.goto("/");
    await page.click("text=פרופיל עסקי");
    await expect(page).toHaveURL(/\/business/);
    await page.click("text=גלישה רגילה");
    await expect(page).toHaveURL("/");
  });

  test("Footer FAQ link goes to homepage #faq (not /business#faq)", async ({ page }) => {
    await page.goto("/business");
    const faqLink = page.locator("footer a[href='/#faq']");
    await expect(faqLink).toBeVisible();
    // Make sure the old broken link is gone
    const brokenLink = page.locator("footer a[href='/business#faq']");
    await expect(brokenLink).toHaveCount(0);
  });

  test("Search page: freelancers tab is active by default", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("text=טוען נתונים")).toBeHidden({ timeout: 10_000 });
    // The freelancers tab trigger should have aria-selected=true
    const freelancersTab = page.locator("[role=tab]", { hasText: "מומחים דיגיטליים" });
    await expect(freelancersTab).toHaveAttribute("data-state", "active");
  });

  test("404 unknown route shows not-found page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    await expect(page.locator("text=הדף לא נמצא").first()).toBeVisible({ timeout: 5_000 });
  });

});

// ── performance summary ───────────────────────────────────────────────────────

test.describe("Performance — pages must load within 8 seconds", () => {

  const PAGES = [
    { name: "Homepage",          url: "/" },
    { name: "Search",            url: "/search" },
    { name: "Business landing",  url: "/business" },
    { name: "Business profile",  url: "/biz/mitav-digital" },
    { name: "Pricing",           url: "/business/pricing" },
  ];

  for (const { name, url } of PAGES) {
    test(`${name} loads in < 8s`, async ({ page }) => {
      const t0 = Date.now();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
      // Wait for first meaningful content
      await page.locator("h1, h2, nav").first().waitFor({ timeout: 8_000 });
      const elapsed = Date.now() - t0;
      console.log(`  ⏱  ${name}: ${elapsed}ms`);
      expect(elapsed, `${name} took ${elapsed}ms — over 8000ms budget`).toBeLessThan(8_000);
    });
  }

});

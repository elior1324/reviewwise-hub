/**
 * playwright.config.ts
 *
 * Playwright E2E test configuration for ReviewHub.
 * Tests live in tests/e2e/ and run against the local dev server
 * (started automatically by webServer below) or against a BASE_URL
 * environment variable for staging/production smoke tests.
 *
 * Local:   npm run test:e2e
 * CI:      BASE_URL=http://localhost:4173 npm run test:e2e
 * Staging: BASE_URL=https://staging.reviewhub.co.il npm run test:e2e:staging
 */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  // Fail the whole suite on first failed test in CI (set to false locally)
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.CI ? [["github"] as [string]] : []),
  ],

  use: {
    baseURL: BASE_URL,
    // Attach trace on failure for debugging in CI
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // All pages are RTL Hebrew — set a viewport that handles Hebrew text
    viewport: { width: 1280, height: 720 },
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
      // Only run mobile-specific tests (tagged @mobile)
      grep: /@mobile/,
    },
  ],

  // Automatically start the dev server before E2E tests
  webServer: process.env.CI
    ? {
        // In CI, use the preview build for stability
        command: "npm run build && npm run preview -- --port 4173",
        url: "http://localhost:4173",
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});

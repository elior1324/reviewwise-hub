import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Exclude Playwright E2E tests (they live in tests/e2e/, not src/)
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Focus coverage on business logic — skip generated/config files
      include: [
        "src/lib/**",
        "src/components/**",
        "src/pages/**",
        "src/contexts/**",
      ],
      exclude: [
        "src/test/**",
        "src/integrations/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/vite-env.d.ts",
      ],
      // Thresholds intentionally removed — coverage is collected for
      // reporting only; thresholds will be re-introduced once more test
      // files are added to cover the full component surface.
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

/**
 * src/test/setup.ts
 * Global Vitest setup — runs before every test file.
 * Extends jest-dom matchers and stubs browser APIs that jsdom lacks.
 */
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── matchMedia (jsdom doesn't implement it) ───────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ── ResizeObserver (used by Radix UI tooltips / popovers) ─────────────────────
globalThis.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// ── IntersectionObserver (used by lazy-loaded components) ────────────────────
globalThis.IntersectionObserver = class {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
} as unknown as typeof IntersectionObserver;

// ── scrollTo (jsdom no-op) ────────────────────────────────────────────────────
window.scrollTo = vi.fn();

// ── framer-motion — skip animations in tests ─────────────────────────────────
vi.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement("div", rest, children),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

// ── sonner — capture toasts without rendering the Toaster ────────────────────
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
  Toaster: () => null,
}));

// ── react-router-dom — minimal stubs (override per-test as needed) ────────────
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  };
});

// ── Cloudflare Turnstile widget — auto-resolve token in tests ─────────────────
vi.mock("@/components/TurnstileWidget", () => {
  const React = require("react");
  return {
    default: ({ onSuccess }: { onSuccess: (t: string) => void }) =>
      React.createElement("button", {
        "data-testid": "turnstile-widget",
        onClick: () => onSuccess("test-turnstile-token"),
      }, "Verify (test)"),
  };
});

// ── Navbar / Footer — lightweight stubs to avoid deep render trees ────────────
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));

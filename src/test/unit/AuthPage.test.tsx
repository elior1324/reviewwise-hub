/**
 * src/test/unit/AuthPage.test.tsx
 *
 * Component tests for AuthPage covering:
 *   1. Password strength bar — three levels (חלשה / בינונית / חזקה)
 *   2. Password show/hide aria-labels
 *   3. Loading spinner on submit
 *   4. Loader on Google OAuth button
 *   5. Privacy consent gate — submit disabled until checked
 *   6. Turnstile gate — submit disabled until token present
 *   7. Mode toggle (login ↔ signup)
 *   8. Error toast on wrong credentials
 *
 * Run: npm test -- AuthPage
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import AuthPage from "@/pages/AuthPage";
import { mockAuthContext, MOCK_USER } from "@/test/mocks/auth-context";

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Lazy-import useAuth so we can override it per test
import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

async function switchToSignup() {
  const toggle = screen.getByRole("button", { name: /הרשמו כאן/i });
  await userEvent.click(toggle);
}

async function fillAndActivateTurnstile() {
  const widget = screen.getByTestId("turnstile-widget");
  await userEvent.click(widget); // triggers onSuccess("test-turnstile-token")
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue(mockAuthContext());
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. Password strength bar
// ═════════════════════════════════════════════════════════════════════════════
describe("Password strength bar", () => {
  it("is hidden on the login form", async () => {
    renderAuth();
    // Default mode is login — no strength bar
    expect(screen.queryByText(/חוזק הסיסמה/)).not.toBeInTheDocument();
  });

  it("is hidden until the user starts typing in signup mode", async () => {
    renderAuth();
    await switchToSignup();
    expect(screen.queryByText(/חוזק הסיסמה/)).not.toBeInTheDocument();
  });

  it("shows 'חלשה' (level 1) for a short/simple password", async () => {
    renderAuth();
    await switchToSignup();
    const pwInput = screen.getByLabelText(/^סיסמה\s*$/i);
    await userEvent.type(pwInput, "abc");
    expect(screen.getByText(/חוזק הסיסמה: חלשה/)).toBeInTheDocument();
  });

  it("shows 'בינונית' (level 2) for an 8-char password with letters and digits", async () => {
    renderAuth();
    await switchToSignup();
    const pwInput = screen.getByLabelText(/^סיסמה\s*$/i);
    await userEvent.type(pwInput, "Secure77");
    expect(screen.getByText(/חוזק הסיסמה: בינונית/)).toBeInTheDocument();
  });

  it("shows 'חזקה' (level 3) for a 12+ char password", async () => {
    renderAuth();
    await switchToSignup();
    const pwInput = screen.getByLabelText(/^סיסמה\s*$/i);
    await userEvent.type(pwInput, "Correct77Horse");
    expect(screen.getByText(/חוזק הסיסמה: חזקה/)).toBeInTheDocument();
  });

  it("shows 'חזקה' (level 3) for an 8+ char password with a special character", async () => {
    renderAuth();
    await switchToSignup();
    const pwInput = screen.getByLabelText(/^סיסמה\s*$/i);
    await userEvent.type(pwInput, "Secure1!");
    expect(screen.getByText(/חוזק הסיסמה: חזקה/)).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Password show/hide toggle — aria-label accessibility
// ═════════════════════════════════════════════════════════════════════════════
describe("Password show/hide toggle (aria-label)", () => {
  it("starts with aria-label 'הצג סיסמה' (password is hidden)", () => {
    renderAuth();
    const toggle = screen.getByRole("button", { name: "הצג סיסמה" });
    expect(toggle).toBeInTheDocument();
  });

  it("changes aria-label to 'הסתר סיסמה' after clicking show", async () => {
    renderAuth();
    const toggle = screen.getByRole("button", { name: "הצג סיסמה" });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "הסתר סיסמה" })).toBeInTheDocument();
  });

  it("toggles the password input type between 'password' and 'text'", async () => {
    renderAuth();
    const pwInput = screen.getByLabelText(/^סיסמה\s*$/i) as HTMLInputElement;
    expect(pwInput.type).toBe("password");
    await userEvent.click(screen.getByRole("button", { name: "הצג סיסמה" }));
    expect(pwInput.type).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "הסתר סיסמה" }));
    expect(pwInput.type).toBe("password");
  });

  it("toggle button is accessible — no aria violations on the password field", () => {
    renderAuth();
    const toggle = screen.getByRole("button", { name: /סיסמה/i });
    // Must have an accessible name (aria-label)
    expect(toggle).toHaveAttribute("aria-label");
    expect(toggle.getAttribute("aria-label")).not.toBe("");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Loading spinner on form submit
// ═════════════════════════════════════════════════════════════════════════════
describe("Loading state on submit", () => {
  it("shows 'טוען...' and disables the submit button while signing in", async () => {
    // signIn resolves after a short delay to allow observing loading state
    let resolveSignIn!: (v: unknown) => void;
    const pendingSignIn = new Promise((res) => { resolveSignIn = res; });
    mockUseAuth.mockReturnValue(
      mockAuthContext({ signIn: vi.fn().mockReturnValue(pendingSignIn) })
    );

    renderAuth();
    await fillAndActivateTurnstile();

    const emailInput = screen.getByLabelText(/אימייל/i);
    const pwInput    = screen.getByLabelText(/^סיסמה\s*$/i);
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(pwInput, "Secure1!");

    const submitBtn = screen.getByRole("button", { name: /התחברו$/ });
    await userEvent.click(submitBtn);

    // During loading: button should show spinner text
    expect(screen.getByText("טוען...")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Resolve the signin
    resolveSignIn({ data: {}, error: null });
    await waitFor(() => expect(screen.queryByText("טוען...")).not.toBeInTheDocument());
  });

  it("re-enables submit button after a failed login attempt", async () => {
    mockUseAuth.mockReturnValue(
      mockAuthContext({
        signIn: vi.fn().mockResolvedValue({ error: { message: "Invalid login credentials" } }),
      })
    );

    renderAuth();
    await fillAndActivateTurnstile();

    await userEvent.type(screen.getByLabelText(/אימייל/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^סיסמה\s*$/i), "wrongpassword1");
    await userEvent.click(screen.getByRole("button", { name: /התחברו$/ }));

    await waitFor(() => {
      expect(screen.queryByText("טוען...")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /התחברו$/ })).not.toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Google OAuth button loading state
// ═════════════════════════════════════════════════════════════════════════════
describe("Google OAuth button", () => {
  it("shows 'מתחבר...' while Google sign-in is pending", async () => {
    let resolveOAuth!: (v: unknown) => void;
    const pendingOAuth = new Promise((res) => { resolveOAuth = res; });
    mockUseAuth.mockReturnValue(
      mockAuthContext({ signInWithGoogle: vi.fn().mockReturnValue(pendingOAuth) })
    );

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /התחברו עם Google/i }));

    expect(screen.getByText("מתחבר...")).toBeInTheDocument();
    // The Google button should now be disabled
    expect(screen.getByRole("button", { name: /מתחבר/i })).toBeDisabled();

    resolveOAuth({ error: null });
    // (After redirect, component unmounts — just confirm no crash)
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Turnstile gate
// ═════════════════════════════════════════════════════════════════════════════
describe("Turnstile bot-protection gate", () => {
  it("submit button is disabled before Turnstile token is received", () => {
    renderAuth();
    // In login mode, button is disabled until turnstile resolves
    const submitBtn = screen.getByRole("button", { name: /התחברו$/ });
    expect(submitBtn).toBeDisabled();
  });

  it("submit button becomes enabled after Turnstile resolves", async () => {
    renderAuth();
    await fillAndActivateTurnstile();
    const submitBtn = screen.getByRole("button", { name: /התחברו$/ });
    expect(submitBtn).not.toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Privacy consent gate (signup mode only)
// ═════════════════════════════════════════════════════════════════════════════
describe("Privacy consent checkbox (signup mode)", () => {
  it("submit is disabled until privacy consent is checked (in signup mode)", async () => {
    renderAuth();
    await switchToSignup();
    await fillAndActivateTurnstile();
    const submitBtn = screen.getByRole("button", { name: /הרשמו$/ });
    expect(submitBtn).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Mode toggle
// ═════════════════════════════════════════════════════════════════════════════
describe("Login / signup mode toggle", () => {
  it("starts in login mode", () => {
    renderAuth();
    expect(screen.getByRole("button", { name: /התחברו$/ })).toBeInTheDocument();
  });

  it("switches to signup mode when the toggle link is clicked", async () => {
    renderAuth();
    await switchToSignup();
    expect(screen.getByRole("button", { name: /הרשמו$/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/שם תצוגה/i)).toBeInTheDocument();
  });

  it("switches back to login mode", async () => {
    renderAuth();
    await switchToSignup();
    await userEvent.click(screen.getByRole("button", { name: /התחברו/i }));
    expect(screen.getByRole("button", { name: /התחברו$/ })).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. Error toast on wrong credentials
// ═════════════════════════════════════════════════════════════════════════════
describe("Error handling", () => {
  it("calls toast.error with a Hebrew message on bad login", async () => {
    mockUseAuth.mockReturnValue(
      mockAuthContext({
        signIn: vi.fn().mockResolvedValue({
          error: { message: "Invalid login credentials" },
        }),
      })
    );

    renderAuth();
    await fillAndActivateTurnstile();
    await userEvent.type(screen.getByLabelText(/אימייל/i), "bad@example.com");
    await userEvent.type(screen.getByLabelText(/^סיסמה\s*$/i), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: /התחברו$/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/פרטי התחברות שגויים/)
      );
    });
  });
});

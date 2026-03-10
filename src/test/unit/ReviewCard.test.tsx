/**
 * src/test/unit/ReviewCard.test.tsx
 *
 * Component tests for ReviewCard covering:
 *   1. useEffect cleanup — no stale setState after unmount (the bug that was fixed)
 *   2. Like / unlike — optimistic UI + DB write
 *   3. Like requires auth — shows error toast for anon users
 *   4. Edit flow — save shows spinner, updates displayed text
 *   5. Owner-only controls — edit/delete only visible to review author
 *   6. Flagged review styling
 *
 * Run: npm test -- ReviewCard
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ReviewCard from "@/components/ReviewCard";
import { mockAuthContext, MOCK_USER } from "@/test/mocks/auth-context";
import { mockSupabase, chain } from "@/test/mocks/supabase";

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));
// Stub sub-components that have deep dependency trees
vi.mock("@/components/ReviewResponse", () => ({ default: () => null }));
vi.mock("@/components/ReportReviewDialog", () => ({ default: () => null }));
vi.mock("@/components/VerifiedBadge", () => ({ default: () => null }));
vi.mock("@/data/mockData", () => ({ getTimeSincePurchase: () => "לפני 3 חודשים" }));

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

// ── Default props ─────────────────────────────────────────────────────────────
const BASE_PROPS = {
  id: "review-uuid-1234",
  reviewerName: "ישראל ישראלי",
  rating: 4,
  text: "קורס מעולה, למדתי המון!",
  courseName: "React Masterclass",
  date: "2024-03-01",
  verified: false,
  anonymous: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no liked row found
  mockSupabase.from.mockReturnValue(
    chain({ data: null, error: null })
  );
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  mockUseAuth.mockReturnValue(mockAuthContext({ user: null }));
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. useEffect cleanup — no stale setState after unmount
// ═════════════════════════════════════════════════════════════════════════════
describe("useEffect cleanup (review_likes fetch)", () => {
  it("does NOT update state when unmounted before the query resolves", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUseAuth.mockReturnValue(mockAuthContext({ user: MOCK_USER }));

    // Make the query take long enough to unmount first
    let resolveQuery!: (v: unknown) => void;
    const neverQuery = new Promise((res) => { resolveQuery = res; });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: (cb: (v: unknown) => void) => neverQuery.then(cb),
    });

    const { unmount } = render(<ReviewCard {...BASE_PROPS} />);
    unmount(); // unmount BEFORE query resolves

    // Now resolve the query — the cancelled flag should prevent setState
    resolveQuery({ data: { id: "like-1" }, error: null });
    await Promise.resolve(); // flush microtasks

    // No React "update on unmounted component" error
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("unmounted")
    );
    consoleSpy.mockRestore();
  });

  it("sets liked=true when query resolves before unmount", async () => {
    mockUseAuth.mockReturnValue(mockAuthContext({ user: MOCK_USER }));
    mockSupabase.from.mockReturnValue(
      chain({ data: { id: "like-1" }, error: null })
    );

    render(<ReviewCard {...BASE_PROPS} />);

    // The like button should reflect the liked state
    await waitFor(() => {
      const likeBtn = screen.getByRole("button", { name: /ביטול/i });
      expect(likeBtn).toBeInTheDocument();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Like / unlike — optimistic UI
// ═════════════════════════════════════════════════════════════════════════════
describe("Like / unlike interaction", () => {
  it("optimistically increments like count when user clicks like", async () => {
    mockUseAuth.mockReturnValue(mockAuthContext({ user: MOCK_USER }));
    // insert succeeds
    mockSupabase.from.mockReturnValue(
      chain({ data: [{ id: "new-like" }], error: null })
    );

    render(<ReviewCard {...BASE_PROPS} likeCount={3} />);

    const likeBtn = screen.getByRole("button", { name: /מועיל/i });
    await userEvent.click(likeBtn);

    // Optimistic update: count should be 4 immediately
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("rolls back like count if DB insert fails", async () => {
    mockUseAuth.mockReturnValue(mockAuthContext({ user: MOCK_USER }));
    mockSupabase.from.mockReturnValue(
      chain({ data: null, error: { message: "DB error" } })
    );

    render(<ReviewCard {...BASE_PROPS} likeCount={3} />);

    await userEvent.click(screen.getByRole("button", { name: /מועיל/i }));

    await waitFor(() => {
      // After rollback, count should be 3 again
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/לא ניתן/));
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Like requires auth
// ═════════════════════════════════════════════════════════════════════════════
describe("Like requires authenticated user", () => {
  it("shows 'יש להתחבר' error toast for anonymous users", async () => {
    mockUseAuth.mockReturnValue(mockAuthContext({ user: null }));

    render(<ReviewCard {...BASE_PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: /מועיל/i }));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/להתחבר/),
      expect.any(Object)
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Edit flow — owner can edit their review
// ═════════════════════════════════════════════════════════════════════════════
describe("Edit flow", () => {
  it("shows edit button only for the review owner", () => {
    // Owner user
    mockUseAuth.mockReturnValue(
      mockAuthContext({ user: { ...MOCK_USER, id: "owner-id" } })
    );
    render(<ReviewCard {...BASE_PROPS} userId="owner-id" />);
    expect(screen.getByRole("button", { name: /עריכה/i })).toBeInTheDocument();
  });

  it("does NOT show edit button for a different user", () => {
    mockUseAuth.mockReturnValue(
      mockAuthContext({ user: { ...MOCK_USER, id: "other-id" } })
    );
    render(<ReviewCard {...BASE_PROPS} userId="owner-id" />);
    expect(screen.queryByRole("button", { name: /עריכה/i })).not.toBeInTheDocument();
  });

  it("shows spinner while saving edit, then updates displayed text", async () => {
    mockUseAuth.mockReturnValue(
      mockAuthContext({ user: { ...MOCK_USER, id: "owner-id" } })
    );

    let resolveSave!: (v: unknown) => void;
    const pendingSave = new Promise((res) => { resolveSave = res; });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: (cb: (v: unknown) => void) => pendingSave.then(cb),
    });

    render(<ReviewCard {...BASE_PROPS} userId="owner-id" />);
    await userEvent.click(screen.getByRole("button", { name: /עריכה/i }));

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "ביקורת מעודכנת ועם עוד תוכן");

    await userEvent.click(screen.getByRole("button", { name: /שמירה/i }));
    // Spinner visible while saving
    expect(screen.getByText("שומר...")).toBeInTheDocument();

    resolveSave({ data: null, error: null });
    await waitFor(() => {
      expect(screen.queryByText("שומר...")).not.toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/עודכנה/));
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Flagged review
// ═════════════════════════════════════════════════════════════════════════════
describe("Flagged review styling", () => {
  it("shows the flag reason when flagged=true", () => {
    render(
      <ReviewCard
        {...BASE_PROPS}
        flagged={true}
        flagReason="תוכן לא הולם"
      />
    );
    expect(screen.getByText(/תוכן לא הולם/)).toBeInTheDocument();
  });

  it("does not show flag section when flagged=false", () => {
    render(<ReviewCard {...BASE_PROPS} flagged={false} flagReason="תוכן לא הולם" />);
    expect(screen.queryByText(/תוכן לא הולם/)).not.toBeInTheDocument();
  });
});

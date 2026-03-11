/**
 * GmailProtectedRoute
 *
 * A route wrapper that enforces Gmail-only access.
 * Three failure modes, each with a distinct redirect:
 *   1. Auth loading   → render a centred spinner (avoids flash-of-redirect)
 *   2. Not logged in  → /auth  (preserves intended destination for post-login redirect)
 *   3. Logged in but not Gmail → / (home, with a toast queued via search-params)
 *
 * Usage in App.tsx:
 *   <Route element={<GmailProtectedRoute />}>
 *     <Route path="/business/pricing" element={<PricingPage />} />
 *   </Route>
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const isGmailAddress = (email: string | null | undefined): boolean =>
  !!email?.toLowerCase().endsWith("@gmail.com");

const GmailProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── 1. Still resolving session — show a minimal spinner ──────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        aria-label="טוען..."
        role="status"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── 2. Not authenticated at all ──────────────────────────────────────────
  if (!user) {
    // Pass the originally requested URL so AuthPage can redirect back after login
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // ── 3. Authenticated but not a Gmail account ─────────────────────────────
  if (!isGmailAddress(user.email)) {
    // Redirect home; the query-param lets Index.tsx surface a toast if desired
    return (
      <Navigate
        to="/?access=gmail-required"
        replace
      />
    );
  }

  // ── 4. Fully authorised — render the child route ─────────────────────────
  return <Outlet />;
};

export { isGmailAddress };
export default GmailProtectedRoute;

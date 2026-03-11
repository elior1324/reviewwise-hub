/**
 * AuthProtectedRoute
 *
 * A route wrapper that enforces authentication for any logged-in user.
 * Non-authenticated visitors are redirected to /auth with the intended
 * destination preserved for post-login redirect.
 *
 * Use this for pages that require any account (not Gmail-specific).
 * For Gmail-only pages (e.g. /business/pricing) use GmailProtectedRoute instead.
 *
 * Usage in App.tsx:
 *   <Route element={<AuthProtectedRoute />}>
 *     <Route path="/business/solutions/reviews" element={<ReviewsSolution />} />
 *     <Route path="/business/solutions/widgets"   element={<WidgetsSolution />} />
 *     <Route path="/business/solutions/analytics" element={<AnalyticsSolution />} />
 *   </Route>
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthProtectedRoute = () => {
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

  // ── 2. Not authenticated — redirect to /auth, preserving the intended URL ─
  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // ── 3. Authenticated — render the child route ─────────────────────────────
  return <Outlet />;
};

export default AuthProtectedRoute;

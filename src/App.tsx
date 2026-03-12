import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthProtectedRoute from "./components/AuthProtectedRoute";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ScrollToTopButton from "@/components/ui/scroll-to-top";
import ScrollToTop from "./components/ScrollToTop";

// Public pages
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import SearchPage from "./pages/SearchPage";
import ComparePage from "./pages/ComparePage";
import BusinessProfile from "./pages/BusinessProfile";
import CoursePage from "./pages/CoursePage";
import AffiliateRedirect from "./pages/AffiliateRedirect";

// Auth + legal
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CompanyGuidelines from "./pages/CompanyGuidelines";
import TrademarkGuidelines from "./pages/TrademarkGuidelines";
import ModernSlaveryStatement from "./pages/ModernSlaveryStatement";
import AccessibilityStatement from "./pages/AccessibilityStatement";
import RefundPolicy from "./pages/RefundPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";
import DPA from "./pages/legal/DPA";

// Reviewer
import WriteReview from "./pages/WriteReview";
import LeaderboardPage from "./pages/LeaderboardPage";

// Business
import BusinessRegister from "./pages/BusinessRegister";
import MerchantVerificationDashboard from "./pages/business/MerchantVerificationDashboard";
import BusinessLanding from "./pages/business/BusinessLanding";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessAuth from "./pages/business/BusinessAuth";
import PricingPage from "./pages/business/PricingPage";

// Partners / widgets
import TrustBadgePage from "./pages/partners/TrustBadgePage";

// Business solutions
import ReviewsSolution from "./pages/business/solutions/ReviewsSolution";
import WidgetsSolution from "./pages/business/solutions/WidgetsSolution";
import AnalyticsSolution from "./pages/business/solutions/AnalyticsSolution";

// Business resources
import DocsPage from "./pages/business/resources/DocsPage";
import BlogPage from "./pages/business/resources/BlogPage";

// Evidence submission — token-based, no login required
import EvidenceUploadPanel from "./components/EvidenceUploadPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <CookieConsentBanner />
          <ScrollToTopButton />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/biz/:slug" element={<BusinessProfile />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/go/:courseId" element={<AffiliateRedirect />} />

            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legal */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/guidelines" element={<CompanyGuidelines />} />
            <Route path="/trademark" element={<TrademarkGuidelines />} />
            <Route path="/modern-slavery" element={<ModernSlaveryStatement />} />
            <Route path="/accessibility" element={<AccessibilityStatement />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/legal/dpa" element={<DPA />} />

            {/* Reviewer */}
            <Route path="/review/:token" element={<WriteReview />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Evidence submission */}
            <Route path="/evidence/:token" element={<EvidenceUploadPanel />} />

            {/* AFVE — Merchant Verification Loop (token link — no auth required) */}
            <Route path="/business/verify-invoice" element={<MerchantVerificationDashboard />} />

            {/* Business portal */}
            <Route path="/business" element={<BusinessLanding />} />
            <Route path="/business/login" element={<BusinessAuth mode="login" />} />
            <Route path="/business/signup" element={<BusinessAuth mode="signup" />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/business/pricing" element={<PricingPage />} />

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/business/dashboard" replace />} />
            <Route path="/register" element={<BusinessRegister />} />
            <Route path="/for-business" element={<Navigate to="/business" replace />} />
            <Route path="/partner" element={<Navigate to="/leaderboard" replace />} />
            <Route path="/earnings" element={<Navigate to="/leaderboard" replace />} />
            <Route path="/course-finder" element={<Navigate to="/search" replace />} />

            {/* Partner / widget pages */}
            <Route path="/partners/trust-badge" element={<TrustBadgePage />} />

            {/* Business solution pages — any authenticated user required */}
            <Route element={<AuthProtectedRoute />}>
              <Route path="/business/solutions/reviews" element={<ReviewsSolution />} />
              <Route path="/business/solutions/widgets" element={<WidgetsSolution />} />
              <Route path="/business/solutions/analytics" element={<AnalyticsSolution />} />
            </Route>

            {/* Business resource pages */}
            <Route path="/business/resources/docs" element={<DocsPage />} />
            <Route path="/business/resources/blog" element={<BlogPage />} />

            {/* /pricing → canonical URL */}
            <Route path="/pricing" element={<Navigate to="/business/pricing" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

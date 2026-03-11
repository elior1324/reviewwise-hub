import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthProtectedRoute from "./components/AuthProtectedRoute";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ScrollToTopButton from "@/components/ui/scroll-to-top";
import Index from "./pages/Index";
import BusinessProfile from "./pages/BusinessProfile";
import SearchPage from "./pages/SearchPage";
import Dashboard from "./pages/Dashboard";
import WriteReview from "./pages/WriteReview";
import CoursePage from "./pages/CoursePage";
import AffiliateRedirect from "./pages/AffiliateRedirect";
import BusinessRegister from "./pages/BusinessRegister";
import AboutPage from "./pages/AboutPage";
import ForBusinessPage from "./pages/ForBusinessPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CompanyGuidelines from "./pages/CompanyGuidelines";
import TrademarkGuidelines from "./pages/TrademarkGuidelines";
import ModernSlaveryStatement from "./pages/ModernSlaveryStatement";
import AccessibilityStatement from "./pages/AccessibilityStatement";
import ComparePage from "./pages/ComparePage";
import RefundPolicy from "./pages/RefundPolicy";
import PartnerDashboard from "./pages/PartnerDashboard";
import EvidenceUploadPanel from "./components/EvidenceUploadPanel";
import CookiePolicy from "./pages/legal/CookiePolicy";
import DPA from "./pages/legal/DPA";
import EarningsDashboard from "./pages/EarningsDashboard";
import LeaderboardPage from "./pages/LeaderboardPage";
import CourseFinder from "./pages/CourseFinder";

// Business portal pages
import BusinessLanding from "./pages/business/BusinessLanding";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessAuth from "./pages/business/BusinessAuth";
import PricingPage from "./pages/business/PricingPage";

// Partner pages
import TrustBadgePage from "./pages/partners/TrustBadgePage";

// Business solution pages
import ReviewsSolution from "./pages/business/solutions/ReviewsSolution";
import WidgetsSolution from "./pages/business/solutions/WidgetsSolution";
import AnalyticsSolution from "./pages/business/solutions/AnalyticsSolution";

// Business resource pages
import DocsPage from "./pages/business/resources/DocsPage";
import BlogPage from "./pages/business/resources/BlogPage";

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
          {/* Floating scroll-to-top button — visible on all pages */}
          <ScrollToTopButton />
          <Routes>
            {/* Consumer routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/for-business" element={<ForBusinessPage />} />
            <Route path="/biz/:slug" element={<BusinessProfile />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<BusinessDashboard />} />
            <Route path="/register" element={<BusinessRegister />} />
            <Route path="/review/:token" element={<WriteReview />} />
            <Route path="/go/:courseId" element={<AffiliateRedirect />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/guidelines" element={<CompanyGuidelines />} />
            <Route path="/trademark" element={<TrademarkGuidelines />} />
            <Route path="/modern-slavery" element={<ModernSlaveryStatement />} />
            <Route path="/accessibility" element={<AccessibilityStatement />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/partner" element={<PartnerDashboard />} />
            {/* Evidence submission — token-based, no login required */}
            <Route path="/evidence/:token" element={<EvidenceUploadPanel />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/legal/dpa" element={<DPA />} />

            {/* Earnings, Leaderboard & Course Finder */}
            <Route path="/earnings" element={<EarningsDashboard />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/course-finder" element={<CourseFinder />} />

            {/* Business portal routes */}
            <Route path="/business" element={<BusinessLanding />} />
            <Route path="/business/login" element={<BusinessAuth mode="login" />} />
            <Route path="/business/signup" element={<BusinessAuth mode="signup" />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />

            {/* Pricing page — accessible to all authenticated users */}
            <Route path="/business/pricing" element={<PricingPage />} />

            {/* Partner / widget pages */}
            <Route path="/partners/trust-badge" element={<TrustBadgePage />} />

            {/* Business solution pages — any authenticated user required */}
            <Route element={<AuthProtectedRoute />}>
              <Route path="/business/solutions/reviews"   element={<ReviewsSolution />} />
              <Route path="/business/solutions/widgets"   element={<WidgetsSolution />} />
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

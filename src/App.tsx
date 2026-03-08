import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Business portal pages
import BusinessLanding from "./pages/business/BusinessLanding";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessAuth from "./pages/business/BusinessAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Consumer routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/for-business" element={<ForBusinessPage />} />
            <Route path="/biz/:slug" element={<BusinessProfile />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<BusinessRegister />} />
            <Route path="/review/:token" element={<WriteReview />} />
            <Route path="/go/:courseId" element={<AffiliateRedirect />} />

            {/* Business portal routes */}
            <Route path="/business" element={<BusinessLanding />} />
            <Route path="/business/login" element={<BusinessAuth mode="login" />} />
            <Route path="/business/signup" element={<BusinessAuth mode="signup" />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/business/pricing" element={<BusinessLanding />} />
            {/* Placeholder routes - redirect to landing for now */}
            <Route path="/business/solutions/*" element={<BusinessLanding />} />
            <Route path="/business/features/*" element={<BusinessLanding />} />
            <Route path="/business/resources/*" element={<BusinessLanding />} />
            <Route path="/business/contact" element={<BusinessLanding />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

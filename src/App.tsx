import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/for-business" element={<ForBusinessPage />} />
          <Route path="/business/:slug" element={<BusinessProfile />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<BusinessRegister />} />
          <Route path="/review/:token" element={<WriteReview />} />
          <Route path="/go/:courseId" element={<AffiliateRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

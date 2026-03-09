import ReactMarkdown from "react-markdown";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import AIChatbot from "@/components/AIChatbot";
import InvoiceTemplateUploader from "@/components/InvoiceTemplateUploader";
import TestimonialMediaUploader from "@/components/TestimonialMediaUploader";
import LockedOverlay from "@/components/LockedOverlay";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import DevControlPanel from "@/components/DevControlPanel";
import UpgradeModal from "@/components/UpgradeModal";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import GamificationNotifications from "@/components/GamificationNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, TrendingUp, Users, MousePointerClick, DollarSign,
  Bell, Brain, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, FileText, Video, HelpCircle,
  Crown, Lock, Webhook, Contact, CalendarClock, Sparkles, Eye, Code2
} from "lucide-react";
import EmbedWidgetGenerator from "@/components/EmbedWidgetGenerator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Review, type Course } from "@/data/mockData";
import { useState, useEffect } from "react";
import { useAuth, SubscriptionTier } from "@/contexts/AuthContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─── Demo sample data (shown to visitors) ────────────────
const DEMO_BUSINESS = { name: "העסק שלכם", email: "you@example.com" };

const DEMO_STATS = [
  { icon: Star, label: "דירוג ממוצע", value: "4.8", change: "+0.2", up: true, tooltip: "הציון הממוצע שלקוחות נתנו לכל הקורסים שלכם." },
  { icon: MessageSquare, label: "סה״כ ביקורות", value: "124", change: "+12", up: true, tooltip: "מספר הביקורות שנכתבו על הקורסים שלכם." },
  { icon: MousePointerClick, label: "קליקים לאתר", value: "94", change: "+23%", up: true, tooltip: "כמה אנשים לחצו על הקישור לאתר שלכם." },
  { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: "₪48,850", change: "+18%", up: true, tooltip: "סך ההכנסות מרכישות שהגיעו דרך קישורי האפיליאט." },
];

const DEMO_REVIEWS: Review[] = [
  { id: "d1", reviewerName: "שרה ל.", rating: 5, text: "קורס מעולה! למדתי המון דברים חדשים שיישמתי מיד בעבודה.", courseName: "שיווק דיגיטלי מאסטרקלאס", courseId: "dc1", businessSlug: "demo", date: "היום", purchaseDate: "2026-01-01", verified: true, anonymous: false },
  { id: "d2", reviewerName: "דני א.", rating: 4, text: "תוכן מצוין, היה נהדר אם היו יותר תרגולים מעשיים.", courseName: "יסודות SEO", courseId: "dc2", businessSlug: "demo", date: "אתמול", purchaseDate: "2026-02-01", verified: true, anonymous: false },
  { id: "d3", reviewerName: "מיכל כ.", rating: 5, text: "המרצה מעולה, הסברים ברורים ודוגמאות מהעולם האמיתי.", courseName: "הסמכת Google Ads", courseId: "dc3", businessSlug: "demo", date: "לפני 3 ימים", purchaseDate: "2026-01-15", verified: true, anonymous: false },
  { id: "d4", reviewerName: "יוסי מ.", rating: 3, text: "הקורס טוב אבל הקצב מהיר מדי למתחילים.", courseName: "אנליטיקס מתקדם", courseId: "dc4", businessSlug: "demo", date: "לפני שבוע", purchaseDate: "2025-12-01", verified: false, anonymous: false },
];

const DEMO_COURSES: Course[] = [
  { id: "dc1", businessSlug: "demo", name: "שיווק דיגיטלי מאסטרקלאס", price: 2490, description: "", affiliateUrl: "", category: "", rating: 4.9, reviewCount: 67, verifiedPurchases: 234 },
  { id: "dc2", businessSlug: "demo", name: "יסודות SEO", price: 990, description: "", affiliateUrl: "", category: "", rating: 4.6, reviewCount: 34, verifiedPurchases: 156 },
  { id: "dc3", businessSlug: "demo", name: "הסמכת Google Ads", price: 1790, description: "", affiliateUrl: "", category: "", rating: 4.8, reviewCount: 23, verifiedPurchases: 89 },
];

const DEMO_CLICKS = [
  { course: "שיווק דיגיטלי מאסטרקלאס", clicks: 45, conversions: 12, revenue: 29880 },
  { course: "יסודות SEO", clicks: 23, conversions: 5, revenue: 4950 },
  { course: "הסמכת Google Ads", clicks: 18, conversions: 7, revenue: 12530 },
  { course: "אנליטיקס מתקדם", clicks: 8, conversions: 1, revenue: 1490 },
];

const DEMO_NOTIFICATIONS = [
  { id: 1, type: "review", text: "שרה ל. השאירה ביקורת של 5 כוכבים על שיווק דיגיטלי מאסטרקלאס", time: "לפני שעתיים" },
  { id: 2, type: "review", text: "ביקורת חדשה של 3 כוכבים על אנליטיקס מתקדם מחכה לתגובתכם", time: "לפני 5 שעות" },
  { id: 3, type: "conversion", text: "רכישה חדשה דרך קישור אפיליאט — הכנסה של ₪2,490", time: "אתמול" },
  { id: 4, type: "alert", text: "מערכת ה-AI זיהתה ביקורת חשודה על יסודות SEO", time: "אתמול" },
  { id: 5, type: "report", text: "דוח ה-AI השבועי מוכן לצפייה", time: "לפני יומיים" },
];

const DEMO_AI_REPORT = {
  date: "1-7 במרץ 2026",
  strengths: [
    "שביעות רצון הלקוחות עלתה ב-12% השבוע",
    "זמן התגובה לביקורות השתפר — ממוצע 4 שעות",
    "הקורס ״שיווק דיגיטלי מאסטרקלאס״ קיבל 5 ביקורות חדשות של 5 כוכבים",
  ],
  weaknesses: [
    "הקורס ״אנליטיקס מתקדם״ ראה ירידה של 15% בהרשמות",
    "2 ביקורות שליליות מציינות שהקצב מהיר מדי למתחילים",
    "אחוז הקליקים באפיליאט ירד ב-8% לעומת השבוע הקודם",
  ],
  recommendations: [
    "שקלו להוסיף מסלול למתחילים בקורס האנליטיקס",
    "הגיבו ל-2 הביקורות השליליות הממתינות תוך 24 שעות",
    "עדכנו את דף הנחיתה של האפיליאט — אחוז הנטישה הנוכחי הוא 45%",
  ],
};

type DemoTier = "free" | "pro" | "premium";

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();

  // Demo tier selector
  const [demoTier, setDemoTier] = useState<DemoTier>("pro");

  // Real data state
  const [isDemo, setIsDemo] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string>("");
  const [businessInfo, setBusinessInfo] = useState<{ name: string; email: string } | null>(null);
  const [realReviews, setRealReviews] = useState<Review[]>([]);
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [realStats, setRealStats] = useState<typeof DEMO_STATS | null>(null);
  const [realClicks, setRealClicks] = useState<typeof DEMO_CLICKS>([]);
  const [realNotifications, setRealNotifications] = useState<typeof DEMO_NOTIFICATIONS>([]);
  const [realLeads, setRealLeads] = useState<any[]>([]);
  const [realWebhooks, setRealWebhooks] = useState<any[]>([]);
  const [realApiKeys, setRealApiKeys] = useState<any[]>([]);
  const [realAiReports, setRealAiReports] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbTier, setDbTier] = useState<SubscriptionTier>("free");
  const [monthlyReviewCount, setMonthlyReviewCount] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalTier, setUpgradeModalTier] = useState<"pro" | "premium">("pro");
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | undefined>();

  // Determine tier — use DB tier for real users, demo tier for demo mode
  const currentTier: SubscriptionTier = !isDemo ? dbTier : demoTier;
  const isPremium = currentTier === "premium";
  const isPro = currentTier === "pro" || currentTier === "premium";
  const isFree = currentTier === "free";

  const handleUpgradeWithModal = (tier: "pro" | "premium" = "pro", featureName?: string) => {
    setUpgradeModalTier(tier);
    setUpgradeModalFeature(featureName);
    setUpgradeModalOpen(true);
  };

  // Fetch real data if user is logged in and owns a business
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user) {
        setIsDemo(true);
        setLoadingData(false);
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (roleData?.some((r: any) => r.role === "admin")) {
        setIsAdmin(true);
      }

      // Check if user owns a business
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!biz) {
        setIsDemo(true);
        setLoadingData(false);
        return;
      }

      // User has a business — switch to real mode
      setIsDemo(false);
      setBusinessId(biz.id);
      setBusinessSlug(biz.slug);
      setBusinessInfo({ name: biz.name, email: biz.email || user.email || "" });
      setDbTier((biz.subscription_tier || "free") as SubscriptionTier);

      // Fetch monthly review count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: reviewCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("created_at", startOfMonth.toISOString());
      setMonthlyReviewCount(reviewCount || 0);

      // Fetch reviews
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, courses(name)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (reviewData) {
        setRealReviews(reviewData.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : "משתמש",
          rating: r.rating,
          text: r.text,
          courseName: r.courses?.name || "",
          courseId: r.course_id,
          businessSlug: biz.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified || false,
          anonymous: r.anonymous || false,
        })));
      }

      // Fetch courses
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("business_id", biz.id);

      if (courseData) {
        setRealCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: biz.slug,
          name: c.name,
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
          category: c.category || "",
          rating: Number(c.rating) || 0,
          reviewCount: c.review_count || 0,
          verifiedPurchases: c.verified_purchases || 0,
        })));
      }

      // Fetch affiliate clicks
      const { data: clickData } = await supabase
        .from("affiliate_clicks")
        .select("*, courses(name)")
        .eq("courses.business_id", biz.id);

      // Aggregate clicks by course
      if (clickData && clickData.length > 0) {
        const clickMap: Record<string, { course: string; clicks: number; conversions: number; revenue: number }> = {};
        clickData.forEach((c: any) => {
          const name = c.courses?.name || "קורס";
          if (!clickMap[name]) clickMap[name] = { course: name, clicks: 0, conversions: 0, revenue: 0 };
          clickMap[name].clicks++;
          if (c.converted) {
            clickMap[name].conversions++;
            clickMap[name].revenue += Number(c.revenue) || 0;
          }
        });
        setRealClicks(Object.values(clickMap));
      }

      // Build real stats
      const totalClicks = clickData?.length || 0;
      const totalConversions = clickData?.filter((c: any) => c.converted).length || 0;
      const totalRevenue = clickData?.filter((c: any) => c.converted).reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0) || 0;

      setRealStats([
        { icon: Star, label: "דירוג ממוצע", value: (Number(biz.rating) || 0).toFixed(1), change: "", up: true, tooltip: "הציון הממוצע שלקוחות נתנו לכל הקורסים שלכם." },
        { icon: MessageSquare, label: "סה״כ ביקורות", value: String(biz.review_count || 0), change: "", up: true, tooltip: "מספר הביקורות שנכתבו על הקורסים שלכם." },
        { icon: MousePointerClick, label: "קליקים לאתר", value: String(totalClicks), change: "", up: true, tooltip: "כמה אנשים לחצו על הקישור לאתר שלכם." },
        { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: `₪${totalRevenue.toLocaleString()}`, change: "", up: true, tooltip: "סך ההכנסות מרכישות שהגיעו דרך קישורי האפיליאט." },
      ]);

      // Fetch leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (leadsData) setRealLeads(leadsData);

      // Fetch webhooks
      const { data: webhooksData } = await supabase
        .from("business_webhooks")
        .select("*")
        .eq("business_id", biz.id);
      if (webhooksData) setRealWebhooks(webhooksData);

      // Fetch API keys
      const { data: apiKeysData } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, active, last_used_at, created_at")
        .eq("business_id", biz.id);
      if (apiKeysData) setRealApiKeys(apiKeysData);

      // Fetch AI reports
      const { data: aiReportsData } = await supabase
        .from("ai_reports")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (aiReportsData) setRealAiReports(aiReportsData);

      setLoadingData(false);
    };

    fetchBusinessData();
  }, [user]);

  // Choose data source
  const displayBusiness = isDemo ? DEMO_BUSINESS : (businessInfo || DEMO_BUSINESS);
  const displayReviews = isDemo ? DEMO_REVIEWS : realReviews;
  const displayCourses = isDemo ? DEMO_COURSES : realCourses;
  const displayStats = isDemo ? DEMO_STATS : (realStats || DEMO_STATS);
  const displayClicks = isDemo ? DEMO_CLICKS : realClicks;
  const displayNotifications = isDemo ? DEMO_NOTIFICATIONS : realNotifications;
  const aiReport = DEMO_AI_REPORT;

  // Generate real AI report
  const handleGenerateReport = async (type: "weekly" | "daily") => {
    if (!businessId || generatingReport) return;
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-report", {
        body: { business_id: businessId, report_type: type },
      });
      if (error) throw error;
      if (data?.skipped) {
        alert("אין ביקורות חדשות בתקופה הנבחרת.");
      } else {
        // Refresh reports
        const { data: updated } = await supabase
          .from("ai_reports")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (updated) setRealAiReports(updated);
      }
    } catch (e: any) {
      console.error("Report generation error:", e);
      alert("שגיאה ביצירת הדוח. נסו שוב מאוחר יותר.");
    }
    setGeneratingReport(false);
  };

  // Generate API key
  const handleGenerateApiKey = async () => {
    if (!businessId || generatingApiKey) return;
    setGeneratingApiKey(true);
    try {
      // Generate random key
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const rawKey = "rh_live_" + Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
      const prefix = rawKey.substring(0, 8);

      // Hash it
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase.from("api_keys").insert({
        business_id: businessId,
        key_hash: keyHash,
        key_prefix: prefix,
        name: `מפתח ${(realApiKeys.length || 0) + 1}`,
      });
      if (error) throw error;

      // Show key to user (only time they see full key)
      navigator.clipboard.writeText(rawKey);
      alert(`מפתח ה-API שלכם הועתק ללוח:\n${rawKey}\n\nשימרו אותו — לא ניתן יהיה לראות אותו שוב!`);

      // Refresh
      const { data: updated } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, active, last_used_at, created_at")
        .eq("business_id", businessId);
      if (updated) setRealApiKeys(updated);
    } catch (e: any) {
      console.error("API key generation error:", e);
      alert("שגיאה ביצירת מפתח API.");
    }
    setGeneratingApiKey(false);
  };

  const totalClicks = isDemo ? 94 : displayClicks.reduce((s, c) => s + c.clicks, 0);
  const conversions = isDemo ? 25 : displayClicks.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue = isDemo ? 48850 : displayClicks.reduce((s, c) => s + c.revenue, 0);

  const handleUpgrade = () => {
    setUpgradeModalOpen(true);
  };

  const PremiumBadge = () => (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold mr-1">
      <Crown size={10} /> פרימיום
    </span>
  );

  const ProBadge = () => (
    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-bold mr-1">
      <Sparkles size={10} /> מקצועי
    </span>
  );

  if (loadingData && user) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <BusinessNavbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />
      <div className="container py-10">

        {/* Demo Banner */}
        {isDemo && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye size={20} className="text-primary" />
              <p className="font-display font-semibold text-foreground">🎯 מצב דמו — כך ייראה לוח הבקרה שלכם אחרי ההרשמה</p>
            </div>
            <p className="text-sm text-muted-foreground mb-3">כל הנתונים כאן הם לדוגמה בלבד. הירשמו כדי לראות את הנתונים האמיתיים שלכם.</p>
            <Button onClick={() => navigate("/business/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              הירשמו עכשיו — חינם
            </Button>
          </div>
        )}

        {/* Real mode: logged-in banner */}
        {!isDemo && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {displayBusiness.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">מחובר כ: {displayBusiness.name}</p>
              <p className="text-xs text-muted-foreground">{displayBusiness.email}</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">מנהל</span>
            <DeleteAccountButton />
          </div>
        )}

        {/* Admin Plan Switcher — only for admin users with a real business */}
        {!isDemo && isAdmin && businessId && (
          <div className="mb-6">
            <AdminPlanSwitcher
              businessId={businessId}
              currentTier={currentTier}
              onTierChanged={(newTier) => setDbTier(newTier as SubscriptionTier)}
            />
          </div>
        )}

        {/* Review Limit Warning for Free tier */}
        {isFree && monthlyReviewCount >= 8 && (
          <div className={`mb-6 rounded-lg border px-5 py-4 ${
            monthlyReviewCount >= 10
              ? "border-destructive/30 bg-destructive/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className={monthlyReviewCount >= 10 ? "text-destructive" : "text-yellow-500"} />
              <div className="flex-1">
                {monthlyReviewCount >= 10 ? (
                  <>
                    <p className="font-display font-semibold text-destructive text-sm">הגעתם למגבלת הביקורות החודשית (10/10)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      העסק שלכם הגיע למגבלת 10 ביקורות בחודש בחבילת הסטארטר. שדרגו למקצועי כדי לקבל ביקורות ללא הגבלה!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-semibold text-yellow-600 text-sm">קרובים למגבלה ({monthlyReviewCount}/10 ביקורות החודש)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      נותרו {10 - monthlyReviewCount} ביקורות בחבילת הסטארטר. שדרגו למקצועי כדי לקבל ביקורות ללא הגבלה.
                    </p>
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgradeWithModal("pro", "ביקורות ללא הגבלה")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Sparkles size={14} className="ml-1" /> שדרגו עכשיו
              </Button>
            </div>
          </div>
        )}

        {/* Demo Tier Selector */}
        {isDemo && (
          <div className="mb-6 rounded-xl border border-border/50 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground font-medium mb-3 text-center">🎯 סימולציית חבילה — בחרו חבילה לצפייה בפיצ׳רים</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "free", label: "סטארטר", sublabel: "חינם", icon: null, desc: "פיצ׳רים בסיסיים" },
                { id: "pro", label: "מקצועי", sublabel: "Pro", icon: Sparkles, desc: "כלים מתקדמים" },
                { id: "premium", label: "פרימיום", sublabel: "Premium", icon: Crown, desc: "גישה מלאה" },
              ] as { id: DemoTier; label: string; sublabel: string; icon: any; desc: string }[]).map(({ id, label, sublabel, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setDemoTier(id)}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center transition-all ${
                    demoTier === id
                      ? id === "premium"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : id === "pro"
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-border bg-secondary shadow-sm"
                      : "border-border/30 hover:border-border hover:bg-muted/50"
                  }`}
                >
                  {Icon && <Icon size={14} className={demoTier === id ? (id === "premium" ? "text-primary" : "text-accent") : "text-muted-foreground"} />}
                  <span className={`text-xs font-bold ${demoTier === id ? (id === "premium" ? "text-primary" : id === "pro" ? "text-accent" : "text-foreground") : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] ${demoTier === id ? "text-muted-foreground" : "text-muted-foreground/60"}`}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl">לוח בקרה עסקי</h1>
            <p className="text-muted-foreground">עקבו אחר ביקורות, קליקים, המרות ותובנות AI.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
            <BarChart3 size={16} className="ml-2" /> ייצוא דוח
          </Button>
        </div>

        {/* Stats Grid */}
        <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {displayStats.map(({ icon: Icon, label, value, change, up, tooltip }) => (
            <Card key={label} className="shadow-card animated-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                    {change && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
                        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {change}
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-display font-bold text-2xl">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </TooltipProvider>

        <Tabs defaultValue="overview" className="space-y-6">
          {/* Grouped Tab Navigation */}
          <div className="rounded-xl border border-border/40 bg-card/50 p-3 space-y-3">
            {/* Free tier tabs */}
            <div>
              <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider px-1 mb-1.5">כלים בסיסיים</p>
              <div className="flex flex-wrap gap-1">
                <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                  <TabsTrigger value="overview" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BarChart3 size={13} className="ml-1" /> סקירה כללית
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Bell size={13} className="ml-1" /> התראות
                    {displayNotifications.length > 0 && (
                      <span className="mr-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full leading-none">{displayNotifications.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Pro tier tabs */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={10} className="text-accent" />
                <span className="text-accent/80">מקצועי ומעלה</span>
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="invoices" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1">
                  <FileText size={13} className="ml-1" /> קבלות ואימות
                  {isFree && <ProBadge />}
                </TabsTrigger>
                <TabsTrigger value="clicks" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1">
                  <MousePointerClick size={13} className="ml-1" /> קליקים והמרות
                  {isFree && <ProBadge />}
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1">
                  <Video size={13} className="ml-1" /> סרטוני לקוחות
                  {isFree && <ProBadge />}
                </TabsTrigger>
                <TabsTrigger value="widget" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1">
                  <Code2 size={13} className="ml-1" /> ווידג׳ט להטמעה
                  {isFree && <ProBadge />}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Premium tier tabs */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <Crown size={10} className="text-primary" />
                <span className="text-primary/80">פרימיום בלבד</span>
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="ai-report" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Brain size={13} className="ml-1" /> דוח AI שבועי
                  {!isPremium && <PremiumBadge />}
                </TabsTrigger>
                <TabsTrigger value="daily-ai" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <CalendarClock size={13} className="ml-1" /> דוחות AI יומיים
                  {!isPremium && <PremiumBadge />}
                </TabsTrigger>
                <TabsTrigger value="crm" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Contact size={13} className="ml-1" /> CRM ולידים
                  {!isPremium && <PremiumBadge />}
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Webhook size={13} className="ml-1" /> Webhooks & API
                  {!isPremium && <PremiumBadge />}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare size={18} /> ביקורות אחרונות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {displayReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין ביקורות. שתפו את הפרופיל שלכם כדי להתחיל לקבל ביקורות!</p>
                  ) : (
                    displayReviews.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                        <div className="flex gap-0.5 shrink-0 mt-0.5">
                          {Array.from({ length: r.rating }, (_, i) => (
                            <Star key={i} size={10} className="fill-star text-star" />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{r.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.reviewerName} · {r.courseName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp size={18} /> ביצועי קורסים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {displayCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין קורסים. הוסיפו קורס ראשון בהגדרות הפרופיל.</p>
                  ) : (
                    displayCourses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.reviewCount} ביקורות · {c.verifiedPurchases} רכישות</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-star text-star" />
                          <span className="text-sm font-display font-bold">{c.rating}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices & Verification */}
          <TabsContent value="invoices">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceTemplateUploader businessId={businessId || "demo"} />
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain size={18} className="text-primary" /> איך זה עובד?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {[
                      "העלו דוגמאות של חשבוניות/קבלות שלכם (PDF, תמונה או CSV)",
                      "ה-AI ינתח את המבנה ויזהה פרטים מזהים (לוגו, שם העסק, מספרי מסמך)",
                      "כשלקוח מעלה קבלה בטופס הביקורת, ה-AI ישווה אותה מול התבניות שלכם",
                      "רוב הקבלות יאומתו אוטומטית. מקרים חריגים יועברו לבדיקה ידנית",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</div>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            </LockedOverlay>
          </TabsContent>

          {/* Clicks & Conversions */}
          <TabsContent value="clicks">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: MousePointerClick, value: totalClicks, label: "סה״כ קליקים", tip: "מספר הפעמים שמשתמשים לחצו על קישור האפיליאט שלכם." },
                { icon: TrendingUp, value: conversions, label: `המרות (${totalClicks > 0 ? Math.round(conversions / totalClicks * 100) : 0}%)`, tip: "כמה מהקליקים הפכו לרכישה בפועל." },
                { icon: DollarSign, value: `₪${totalRevenue.toLocaleString()}`, label: "סה״כ הכנסות", tip: "סך ההכנסות שנוצרו מרכישות דרך ReviewHub." },
              ].map(({ icon: Icon, value, label, tip }, i) => (
                <Card key={i} className="shadow-card bg-card">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-bold text-xl">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">{tip}</TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              ))}
            </div>
            </TooltipProvider>

            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-base">קליקים לפי קורס</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium py-2 border-b border-border/30">
                    <span>קורס</span>
                    <span className="text-center">קליקים</span>
                    <span className="text-center">המרות</span>
                    <span className="text-left">הכנסות</span>
                  </div>
                  {displayClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין קליקים. שתפו קישורי אפיליאט כדי להתחיל.</p>
                  ) : (
                    displayClicks.map((row, i) => (
                      <div key={i} className="grid grid-cols-4 text-sm py-3 border-b border-border/20 last:border-0 items-center">
                        <span className="truncate">{row.course}</span>
                        <span className="text-center font-display font-bold">{row.clicks}</span>
                        <span className="text-center">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                            {row.conversions} ({row.clicks > 0 ? Math.round(row.conversions / row.clicks * 100) : 0}%)
                          </span>
                        </span>
                        <span className="text-left font-display font-bold">₪{row.revenue.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell size={18} /> התראות אחרונות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {displayNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">אין התראות חדשות.</p>
                ) : (
                  displayNotifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.type === "review" ? "bg-primary/10" :
                        n.type === "conversion" ? "bg-accent/10" :
                        n.type === "alert" ? "bg-destructive/10" :
                        "bg-secondary"
                      }`}>
                        {n.type === "review" && <MessageSquare size={14} className="text-primary" />}
                        {n.type === "conversion" && <DollarSign size={14} className="text-accent" />}
                        {n.type === "alert" && <AlertTriangle size={14} className="text-destructive" />}
                        {n.type === "report" && <Brain size={14} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-report">
            <LockedOverlay isLocked={!isPremium} onUpgrade={handleUpgrade}>
            <Card className="shadow-card bg-card mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain size={18} className="text-primary" /> דוח AI שבועי
                  {!isDemo && businessId && (
                    <Button size="sm" variant="outline" className="mr-auto text-xs" onClick={() => handleGenerateReport("weekly")} disabled={generatingReport}>
                      {generatingReport ? "מייצר..." : "צור דוח חדש"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isDemo && realAiReports.filter(r => r.report_type === "weekly").length > 0 ? (
                  <div className="space-y-4">
                    {realAiReports.filter(r => r.report_type === "weekly").map((report: any) => (
                      <div key={report.id} className="border border-border/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString("he-IL")} | {report.period_start} — {report.period_end}</span>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none text-foreground/80" dir="rtl">
                          <ReactMarkdown>{report.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isDemo ? (
                  <>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-primary flex items-center gap-2 mb-3">
                        <ArrowUpRight size={16} /> חוזקות
                      </h3>
                      <ul className="space-y-2">
                        {aiReport.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-destructive flex items-center gap-2 mb-3">
                        <ArrowDownRight size={16} /> נקודות לשיפור
                      </h3>
                      <ul className="space-y-2">
                        {aiReport.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-accent flex items-center gap-2 mb-3">
                        <Brain size={16} /> המלצות AI
                      </h3>
                      <ul className="space-y-2">
                        {aiReport.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין דוחות. לחצו "צור דוח חדש" כדי לייצר את הדוח הראשון.</p>
                )}
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    דוח זה נוצר על ידי AI על בסיס נתוני הביקורות, אנליטיקת הקליקים ומגמות ההמרה שלכם.
                  </p>
                </div>
              </CardContent>
            </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm mb-4">
                העלו עד 5 סרטונים או תמונות של לקוחות מרוצים. ניתן להעלות קבצים ישירות או להוסיף קישורי YouTube / TikTok.
                <br />
                <span className="text-xs text-primary">זמין למנויי Professional ו-Premium בלבד.</span>
              </p>
              <TestimonialMediaUploader businessId={businessId || "demo"} maxItems={5} />
            </div>
            </LockedOverlay>
          </TabsContent>

          {/* ===== PREMIUM-ONLY TABS ===== */}

          {/* CRM & Leads */}
          <TabsContent value="crm">
            <LockedOverlay isLocked={!isPremium} onUpgrade={handleUpgrade}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card bg-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Contact size={18} className="text-primary" /> ניהול לידים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const leadsToShow = isDemo ? [
                        { id: "d1", customer_name: "יוסי כהן", customer_email: "yossi@gmail.com", source: "positive_review", status: "new", created_at: new Date().toISOString() },
                        { id: "d2", customer_name: "מיכל לוי", customer_email: "michal@company.co.il", source: "positive_review", status: "new", created_at: new Date(Date.now() - 86400000).toISOString() },
                        { id: "d3", customer_name: "דני אברהם", customer_email: "dani@startup.io", source: "positive_review", status: "contacted", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
                      ] : realLeads;

                      if (leadsToShow.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין לידים. לידים נוצרים אוטומטית מביקורות חיוביות (4-5 כוכבים).</p>;

                      const statusMap: Record<string, { label: string; cls: string }> = {
                        new: { label: "חדש", cls: "bg-accent/10 text-accent" },
                        contacted: { label: "בטיפול", cls: "bg-secondary text-muted-foreground" },
                        converted: { label: "הומר", cls: "bg-primary/10 text-primary" },
                      };

                      return leadsToShow.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{lead.customer_name || "אנונימי"}</p>
                            <p className="text-xs text-muted-foreground">{lead.customer_email || lead.source}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusMap[lead.status]?.cls || "bg-secondary text-muted-foreground"}`}>
                              {statusMap[lead.status]?.label || lead.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users size={18} className="text-primary" /> סטטיסטיקת לידים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-primary/5">
                        <p className="font-display font-bold text-2xl text-primary">{isDemo ? "47" : realLeads.filter(l => l.status === "new").length}</p>
                        <p className="text-xs text-muted-foreground">לידים חדשים</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-accent/5">
                        <p className="font-display font-bold text-2xl text-accent">{isDemo ? "23%" : (realLeads.length > 0 ? Math.round(realLeads.filter(l => l.status === "converted").length / realLeads.length * 100) : 0) + "%"}</p>
                        <p className="text-xs text-muted-foreground">אחוז המרה</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      מעקב אחר כל הלידים שמגיעים דרך הביקורות, דפי קורסים וקישורי אפיליאט.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </LockedOverlay>
          </TabsContent>

          {/* Webhooks & API */}
          <TabsContent value="webhooks">
            <LockedOverlay isLocked={!isPremium} onUpgrade={handleUpgrade}>
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Webhook size={18} className="text-primary" /> Webhooks & API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-display font-semibold">מפתחות API</h3>
                      {!isDemo && businessId && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={handleGenerateApiKey} disabled={generatingApiKey}>
                          {generatingApiKey ? "מייצר..." : "צור מפתח חדש"}
                        </Button>
                      )}
                    </div>
                    {!isDemo && realApiKeys.length > 0 ? (
                      <div className="space-y-2">
                        {realApiKeys.map((k: any) => (
                          <div key={k.id} className="bg-secondary rounded-lg p-3 flex items-center justify-between" dir="ltr">
                            <code className="text-xs text-foreground/70">{k.key_prefix}••••••••••••</code>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${k.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                              {k.active ? "פעיל" : "מושבת"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-secondary rounded-lg p-4" dir="ltr">
                        <code className="text-xs text-foreground/70">{isDemo ? "rh_live_sk_••••••••••••••••••••3f8a" : "אין מפתחות עדיין"}</code>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-semibold mb-3">Webhooks פעילים</h3>
                    <div className="space-y-2">
                      {(() => {
                        const whList = isDemo ? [
                          { id: "d1", url: "https://your-crm.com/webhooks/review", events: ["new_review"], active: true },
                          { id: "d2", url: "https://zapier.com/hooks/catch/123", events: ["affiliate_conversion"], active: true },
                        ] : realWebhooks;
                        if (whList.length === 0) return <p className="text-sm text-muted-foreground py-2 text-center">אין webhooks מוגדרים.</p>;
                        return whList.map((wh: any) => (
                          <div key={wh.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                            <div>
                              <p className="text-xs font-mono text-foreground/70" dir="ltr">{wh.url}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{(wh.events || []).join(", ")}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${wh.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                              {wh.active ? "פעיל" : "מושבת"}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-semibold mb-2">אינטגרציות זמינות</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Zapier", "Make", "HubSpot", "Salesforce", "Slack", "Google Sheets"].map(name => (
                        <span key={name} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground">{name}</span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Daily AI Reports */}
          <TabsContent value="daily-ai">
            <LockedOverlay isLocked={!isPremium} onUpgrade={handleUpgrade}>
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock size={18} className="text-primary" /> דוחות AI יומיים
                    {!isDemo && businessId && (
                      <Button size="sm" variant="outline" className="mr-auto text-xs" onClick={() => handleGenerateReport("daily")} disabled={generatingReport}>
                        {generatingReport ? "מייצר..." : "צור דוח יומי"}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    קבלו כל בוקר דוח AI מפורט עם ניתוח הביצועים של אתמול, שינויים במגמות, וצעדים מומלצים.
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const dailyReports = isDemo ? [
                        { id: "d1", created_at: "2026-03-08", content: "3 ביקורות חדשות, 2 המרות, עלייה של 5% בדירוג" },
                        { id: "d2", created_at: "2026-03-07", content: "ביקורת שלילית זוהתה, 4 קליקים חדשים" },
                        { id: "d3", created_at: "2026-03-06", content: "יום שיא — 8 המרות, הכנסות של ₪19,920" },
                      ] : realAiReports.filter(r => r.report_type === "daily");
                      if (dailyReports.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין דוחות יומיים. לחצו "צור דוח יומי" כדי להתחיל.</p>;
                      return dailyReports.map((report: any) => (
                        <div key={report.id} className="border border-border/20 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-2">{new Date(report.created_at).toLocaleDateString("he-IL")}</p>
                          {isDemo ? (
                            <p className="text-sm text-foreground/80">{report.content}</p>
                          ) : (
                            <div className="prose prose-sm prose-invert max-w-none text-foreground/80">
                              <ReactMarkdown>{report.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      הדוחות נשלחים גם במייל כל בוקר בשעה 08:00. ניתן לשנות את שעת השליחה בהגדרות.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Embed Widget */}
          <TabsContent value="widget">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
              <EmbedWidgetGenerator
                businessSlug={isDemo ? "demo-business" : (businessId ? businessSlug : "demo-business")}
                businessName={isDemo ? "העסק שלכם" : displayBusiness.name}
                rating={isDemo ? 4.8 : (Number(displayStats[0]?.value) || 0)}
                reviewCount={isDemo ? 124 : (Number(displayStats[1]?.value) || 0)}
              />
            </LockedOverlay>
          </TabsContent>
        </Tabs>
      </div>
      <BusinessFooter />
      <AIChatbot context="business" />
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        requiredTier={upgradeModalTier}
        featureName={upgradeModalFeature}
      />
    </div>
  );
};

export default BusinessDashboard;

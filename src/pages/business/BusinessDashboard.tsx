import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import AIChatbot from "@/components/AIChatbot";
import InvoiceTemplateUploader from "@/components/InvoiceTemplateUploader";
import TestimonialMediaUploader from "@/components/TestimonialMediaUploader";
import LockedOverlay from "@/components/LockedOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, TrendingUp, Users, MousePointerClick, DollarSign,
  Bell, Brain, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, FileText, Video, HelpCircle,
  Crown, Lock, Webhook, Contact, CalendarClock, Sparkles
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { REVIEWS, COURSES, AFFILIATE_CLICKS } from "@/data/mockData";
import { useState } from "react";
import { useAuth, SubscriptionTier } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const BUSINESS_SLUG = "digital-marketing-academy";

type DemoTier = "free" | "pro" | "premium";

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { subscriptionTier } = useAuth();

  // Demo tier selector — allows switching between tiers in demo mode
  const [demoTier, setDemoTier] = useState<DemoTier>("pro");
  const currentTier: SubscriptionTier = subscriptionTier !== "free" ? subscriptionTier : demoTier;
  const isPremium = currentTier === "premium";
  const isPro = currentTier === "pro";
  const isFree = currentTier === "free";

  const demoBusiness = {
    name: "Digital Marketing Academy",
    email: "admin@dma.co.il",
  };

  const businessReviews = REVIEWS.filter(r => r.businessSlug === BUSINESS_SLUG);
  const businessCourses = COURSES.filter(c => c.businessSlug === BUSINESS_SLUG);
  const totalClicks = AFFILIATE_CLICKS.length;
  const conversions = AFFILIATE_CLICKS.filter(c => c.converted).length;
  const totalRevenue = AFFILIATE_CLICKS.filter(c => c.converted).reduce((s, c) => s + (c.revenue || 0), 0);

  const STATS = [
    { icon: Star, label: "דירוג ממוצע", value: "4.8", change: "+0.2", up: true, tooltip: "הציון הממוצע שלקוחות נתנו לכל הקורסים שלכם. דירוג גבוה מגביר אמון ומושך לקוחות חדשים." },
    { icon: MessageSquare, label: "סה״כ ביקורות", value: "124", change: "+12", up: true, tooltip: "מספר הביקורות שנכתבו על הקורסים שלכם. יותר ביקורות = יותר הוכחה חברתית ונראות בפלטפורמה." },
    { icon: MousePointerClick, label: "קליקים לאתר", value: totalClicks.toString(), change: "+23%", up: true, tooltip: "כמה אנשים לחצו על הקישור לאתר שלכם מתוך דף הביקורות. מדד ישיר לתנועה שמגיעה אליכם מ-ReviewHub." },
    { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: `₪${totalRevenue.toLocaleString()}`, change: "+18%", up: true, tooltip: "סך ההכנסות מרכישות שהגיעו דרך קישורי האפיליאט שלכם. כסף אמיתי שנכנס הודות לביקורות." },
  ];

  const aiReport = {
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

  const notifications = [
    { id: 1, type: "review", text: "שרה ל. השאירה ביקורת של 5 כוכבים על שיווק דיגיטלי מאסטרקלאס", time: "לפני שעתיים" },
    { id: 2, type: "review", text: "ביקורת חדשה של 3 כוכבים על אנליטיקס מתקדם מחכה לתגובתכם", time: "לפני 5 שעות" },
    { id: 3, type: "conversion", text: "רכישה חדשה דרך קישור אפיליאט — הכנסה של ₪2,490", time: "אתמול" },
    { id: 4, type: "alert", text: "מערכת ה-AI זיהתה ביקורת חשודה על יסודות SEO", time: "אתמול" },
    { id: 5, type: "report", text: "דוח ה-AI השבועי מוכן לצפייה", time: "לפני יומיים" },
  ];

  const recentClicks = [
    { course: "שיווק דיגיטלי מאסטרקלאס", clicks: 45, conversions: 12, revenue: 29880 },
    { course: "יסודות SEO", clicks: 23, conversions: 5, revenue: 4950 },
    { course: "הסמכת Google Ads", clicks: 18, conversions: 7, revenue: 12530 },
    { course: "אנליטיקס מתקדם", clicks: 8, conversions: 1, revenue: 1490 },
  ];

  const handleUpgrade = () => {
    navigate("/business/pricing");
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

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />
      <div className="container py-10">
        {/* Demo logged-in banner */}
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            DM
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">מחובר כ: {demoBusiness.name}</p>
            <p className="text-xs text-muted-foreground">{demoBusiness.email}</p>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">מנהל</span>
        </div>

        {/* Demo Tier Selector */}
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/50 px-4 py-3">
          <span className="text-xs text-muted-foreground font-medium">סימולציית חבילה:</span>
          <div className="flex gap-1 rounded-lg bg-background p-1 border border-border/30">
            <button
              onClick={() => setDemoTier("free")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                demoTier === "free"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              סטארטר (חינם)
            </button>
            <button
              onClick={() => setDemoTier("pro")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                demoTier === "pro"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              מקצועי (Pro)
            </button>
            <button
              onClick={() => setDemoTier("premium")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                demoTier === "premium"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              פרימיום (Premium)
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground/70">
            {demoTier === "free" ? "רוב הפיצ׳רים חסומים" : demoTier === "pro" ? "פיצ׳רים פרימיום חסומים" : "כל הפיצ׳רים זמינים"}
          </span>
        </div>

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
          {STATS.map(({ icon: Icon, label, value, change, up, tooltip }) => (
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
                    <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
                      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {change}
                    </div>
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
          <TabsList className="glass flex-wrap">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1">
              <FileText size={14} className="ml-1" /> קבלות ואימות
              {isFree && <ProBadge />}
            </TabsTrigger>
            <TabsTrigger value="clicks" className="gap-1">
              קליקים והמרות
              {isFree && <ProBadge />}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell size={14} className="ml-1" /> התראות
              <span className="mr-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ai-report" className="gap-1">
              <Brain size={14} className="ml-1" /> דוח AI שבועי
              {!isPremium && <PremiumBadge />}
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-1">
              <Video size={14} className="ml-1" /> סרטוני לקוחות
              {isFree && <ProBadge />}
            </TabsTrigger>
            {/* Premium-only tabs */}
            <TabsTrigger value="crm" className="gap-1">
              <Contact size={14} className="ml-1" /> CRM ולידים
              {!isPremium && <PremiumBadge />}
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-1">
              <Webhook size={14} className="ml-1" /> Webhooks & API
              {!isPremium && <PremiumBadge />}
            </TabsTrigger>
            <TabsTrigger value="daily-ai" className="gap-1">
              <CalendarClock size={14} className="ml-1" /> דוחות AI יומיים
              {!isPremium && <PremiumBadge />}
            </TabsTrigger>
          </TabsList>

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
                  {businessReviews.slice(0, 4).map((r) => (
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
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp size={18} /> ביצועי קורסים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {businessCourses.map((c) => (
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
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices & Verification */}
          <TabsContent value="invoices">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceTemplateUploader businessId="mock-business-id" />
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain size={18} className="text-primary" /> איך זה עובד?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</div>
                      <p>העלו דוגמאות של חשבוניות/קבלות שלכם (PDF, תמונה או CSV)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</div>
                      <p>ה-AI ינתח את המבנה ויזהה פרטים מזהים (לוגו, שם העסק, מספרי מסמך)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</div>
                      <p>כשלקוח מעלה קבלה בטופס הביקורת, ה-AI ישווה אותה מול התבניות שלכם</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">4</div>
                      <p>רוב הקבלות יאומתו אוטומטית. מקרים חריגים יועברו לבדיקה ידנית</p>
                    </div>
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
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MousePointerClick size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-xl">{totalClicks}</p>
                    <p className="text-xs text-muted-foreground">סה״כ קליקים</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                      מספר הפעמים שמשתמשים לחצו על קישור האפיליאט שלכם. כל קליק מייצג לקוח פוטנציאלי שהגיע מ-ReviewHub.
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-xl">{conversions}</p>
                    <p className="text-xs text-muted-foreground">המרות ({totalClicks > 0 ? Math.round(conversions / totalClicks * 100) : 0}%)</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                      כמה מהקליקים הפכו לרכישה בפועל. אחוז המרה גבוה מעיד על ביקורות אמינות שמשכנעות לקוחות לקנות.
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-xl">₪{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">סה״כ הכנסות</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                      סך ההכנסות שנוצרו מרכישות דרך ReviewHub. זה הכסף שהביקורות המאומתות שלכם הניבו ישירות.
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
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
                  {recentClicks.map((row, i) => (
                    <div key={i} className="grid grid-cols-4 text-sm py-3 border-b border-border/20 last:border-0 items-center">
                      <span className="truncate">{row.course}</span>
                      <span className="text-center font-display font-bold">{row.clicks}</span>
                      <span className="text-center">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                          {row.conversions} ({Math.round(row.conversions / row.clicks * 100)}%)
                        </span>
                      </span>
                      <span className="text-left font-display font-bold">₪{row.revenue.toLocaleString()}</span>
                    </div>
                  ))}
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
                {notifications.map((n) => (
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
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-report">
            <LockedOverlay isLocked={!isPremium} onUpgrade={handleUpgrade}>
            <Card className="shadow-card bg-card mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain size={18} className="text-primary" /> דוח AI שבועי
                  <span className="text-xs text-muted-foreground font-normal mr-2">{aiReport.date}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    דוח זה נוצר על ידי AI על בסיס נתוני הביקורות, אנליטיקת הקליקים ומגמות ההמרה שלכם.
                    ניתוח AI בזמן אמת — בקרוב.
                  </p>
                </div>
              </CardContent>
            </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm mb-4">
                העלו עד 5 סרטונים או תמונות של לקוחות מרוצים. ניתן להעלות קבצים ישירות או להוסיף קישורי YouTube / TikTok.
                <br />
                <span className="text-xs text-primary">זמין למנויי Professional ו-Premium בלבד.</span>
              </p>
              <TestimonialMediaUploader businessId="PLACEHOLDER_ID" maxItems={5} />
            </div>
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
                    {[
                      { name: "יוסי כהן", email: "yossi@gmail.com", course: "שיווק דיגיטלי", status: "חם", date: "היום" },
                      { name: "מיכל לוי", email: "michal@company.co.il", course: "הסמכת Google Ads", status: "חדש", date: "אתמול" },
                      { name: "דני אברהם", email: "dani@startup.io", course: "אנליטיקס מתקדם", status: "בטיפול", date: "לפני 3 ימים" },
                      { name: "שירה גולן", email: "shira@agency.com", course: "יסודות SEO", status: "חם", date: "לפני שבוע" },
                    ].map((lead, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email} · {lead.course}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            lead.status === "חם" ? "bg-primary/10 text-primary" :
                            lead.status === "חדש" ? "bg-accent/10 text-accent" :
                            "bg-secondary text-muted-foreground"
                          }`}>{lead.status}</span>
                          <span className="text-[10px] text-muted-foreground">{lead.date}</span>
                        </div>
                      </div>
                    ))}
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
                        <p className="font-display font-bold text-2xl text-primary">47</p>
                        <p className="text-xs text-muted-foreground">לידים חדשים החודש</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-accent/5">
                        <p className="font-display font-bold text-2xl text-accent">23%</p>
                        <p className="text-xs text-muted-foreground">אחוז המרה</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      מעקב אחר כל הלידים שמגיעים דרך הביקורות, דפי קורסים וקישורי אפיליאט. 
                      סנכרנו עם ה-CRM שלכם או ייצאו ל-CSV.
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
                    <h3 className="text-sm font-display font-semibold mb-3">מפתח API</h3>
                    <div className="bg-secondary rounded-lg p-4 flex items-center justify-between" dir="ltr">
                      <code className="text-xs text-foreground/70">rh_live_sk_••••••••••••••••••••3f8a</code>
                      <Button size="sm" variant="outline" className="text-xs">העתק</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-display font-semibold mb-3">Webhooks פעילים</h3>
                    <div className="space-y-2">
                      {[
                        { url: "https://your-crm.com/webhooks/review", event: "review.created", status: "פעיל" },
                        { url: "https://zapier.com/hooks/catch/123", event: "conversion.completed", status: "פעיל" },
                      ].map((wh, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                          <div>
                            <p className="text-xs font-mono text-foreground/70" dir="ltr">{wh.url}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{wh.event}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{wh.status}</span>
                        </div>
                      ))}
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    קבלו כל בוקר דוח AI מפורט עם ניתוח הביצועים של אתמול, שינויים במגמות, וצעדים מומלצים.
                  </p>

                  <div className="space-y-3">
                    {[
                      { date: "8 במרץ 2026", summary: "3 ביקורות חדשות, 2 המרות, עלייה של 5% בדירוג", read: false },
                      { date: "7 במרץ 2026", summary: "ביקורת שלילית זוהתה, 4 קליקים חדשים, המלצה לעדכן תיאור קורס", read: true },
                      { date: "6 במרץ 2026", summary: "יום שיא — 8 המרות, הכנסות של ₪19,920", read: true },
                      { date: "5 במרץ 2026", summary: "2 ביקורות חשודות נחסמו, שיפור של 12% באמון", read: true },
                    ].map((report, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                        <div className="flex items-center gap-3">
                          {!report.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <div>
                            <p className="text-sm font-medium">{report.date}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{report.summary}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">צפה בדוח</Button>
                      </div>
                    ))}
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
        </Tabs>
      </div>
      <BusinessFooter />
      <AIChatbot context="business" />
    </div>
  );
};

export default BusinessDashboard;

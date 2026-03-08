import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import AIChatbot from "@/components/AIChatbot";
import InvoiceTemplateUploader from "@/components/InvoiceTemplateUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, TrendingUp, Users, MousePointerClick, DollarSign,
  Bell, Brain, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3
} from "lucide-react";
import { REVIEWS, COURSES, AFFILIATE_CLICKS } from "@/data/mockData";

const BUSINESS_SLUG = "digital-marketing-academy";

const BusinessDashboard = () => {
  const businessReviews = REVIEWS.filter(r => r.businessSlug === BUSINESS_SLUG);
  const businessCourses = COURSES.filter(c => c.businessSlug === BUSINESS_SLUG);
  const totalClicks = AFFILIATE_CLICKS.length;
  const conversions = AFFILIATE_CLICKS.filter(c => c.converted).length;
  const totalRevenue = AFFILIATE_CLICKS.filter(c => c.converted).reduce((s, c) => s + (c.revenue || 0), 0);

  const STATS = [
    { icon: Star, label: "דירוג ממוצע", value: "4.8", change: "+0.2", up: true },
    { icon: MessageSquare, label: "סה״כ ביקורות", value: "124", change: "+12", up: true },
    { icon: MousePointerClick, label: "קליקים לאתר", value: totalClicks.toString(), change: "+23%", up: true },
    { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: `₪${totalRevenue.toLocaleString()}`, change: "+18%", up: true },
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

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />
      <div className="container py-10">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ icon: Icon, label, value, change, up }) => (
            <Card key={label} className="shadow-card animated-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {change}
                  </div>
                </div>
                <p className="font-display font-bold text-2xl">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass flex-wrap">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="clicks">קליקים והמרות</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell size={14} className="ml-1" /> התראות
              <span className="mr-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ai-report">
              <Brain size={14} className="ml-1" /> דוח AI שבועי
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

          {/* Clicks & Conversions */}
          <TabsContent value="clicks">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MousePointerClick size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">{totalClicks}</p>
                    <p className="text-xs text-muted-foreground">סה״כ קליקים</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">{conversions}</p>
                    <p className="text-xs text-muted-foreground">המרות ({totalClicks > 0 ? Math.round(conversions / totalClicks * 100) : 0}%)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">₪{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">סה״כ הכנסות</p>
                  </div>
                </CardContent>
              </Card>
            </div>

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

          {/* AI Weekly Report */}
          <TabsContent value="ai-report">
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
          </TabsContent>
        </Tabs>
      </div>
      <BusinessFooter />
      <AIChatbot context="business" />
    </div>
  );
};

export default BusinessDashboard;

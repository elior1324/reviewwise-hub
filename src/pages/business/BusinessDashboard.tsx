import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
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
    { icon: Star, label: "Avg. Rating", value: "4.8", change: "+0.2", up: true },
    { icon: MessageSquare, label: "Total Reviews", value: "124", change: "+12", up: true },
    { icon: MousePointerClick, label: "Site Clicks", value: totalClicks.toString(), change: "+23%", up: true },
    { icon: DollarSign, label: "Revenue via ReviewHub", value: `₪${totalRevenue.toLocaleString()}`, change: "+18%", up: true },
  ];

  // Mock AI weekly report
  const aiReport = {
    date: "March 1-7, 2026",
    strengths: [
      "Customer satisfaction increased by 12% this week",
      "Response time to reviews improved — avg 4 hours",
      "\"שיווק דיגיטלי מאסטרקלאס\" received 5 new 5-star reviews",
    ],
    weaknesses: [
      "\"אנליטיקס מתקדם\" course saw a 15% drop in enrollments",
      "2 negative reviews mention pace being too fast for beginners",
      "Affiliate click-through rate dropped 8% vs last week",
    ],
    recommendations: [
      "Consider adding a beginner-friendly track for Analytics course",
      "Respond to the 2 pending negative reviews within 24 hours",
      "Update affiliate landing page — current bounce rate is 45%",
    ],
  };

  // Mock notifications
  const notifications = [
    { id: 1, type: "review", text: "שרה ל. left a 5-star review on שיווק דיגיטלי מאסטרקלאס", time: "2 hours ago" },
    { id: 2, type: "review", text: "New 3-star review on אנליטיקס מתקדם needs your response", time: "5 hours ago" },
    { id: 3, type: "conversion", text: "New purchase via affiliate link — ₪2,490 revenue", time: "Yesterday" },
    { id: 4, type: "alert", text: "AI flagged a suspicious review on יסודות SEO", time: "Yesterday" },
    { id: 5, type: "report", text: "Weekly AI report is ready for review", time: "2 days ago" },
  ];

  // Mock recent clicks data
  const recentClicks = [
    { course: "שיווק דיגיטלי מאסטרקלאס", clicks: 45, conversions: 12, revenue: 29880 },
    { course: "יסודות SEO", clicks: 23, conversions: 5, revenue: 4950 },
    { course: "הסמכת Google Ads", clicks: 18, conversions: 7, revenue: 12530 },
    { course: "אנליטיקס מתקדם", clicks: 8, conversions: 1, revenue: 1490 },
  ];

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="ltr">
      <BusinessNavbar />
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl">Business Dashboard</h1>
            <p className="text-muted-foreground">Track your reviews, clicks, conversions, and AI insights.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
            <BarChart3 size={16} className="mr-2" /> Export Report
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clicks">Clicks & Conversions</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell size={14} className="mr-1" /> Notifications
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ai-report">
              <Brain size={14} className="mr-1" /> AI Weekly Report
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent reviews */}
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare size={18} /> Recent Reviews
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

              {/* Course performance */}
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp size={18} /> Course Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {businessCourses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.reviewCount} reviews · {c.verifiedPurchases} purchases</p>
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
                    <p className="text-xs text-muted-foreground">Total Clicks</p>
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
                    <p className="text-xs text-muted-foreground">Conversions ({totalClicks > 0 ? Math.round(conversions / totalClicks * 100) : 0}%)</p>
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
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-base">Clicks by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium py-2 border-b border-border/30">
                    <span>Course</span>
                    <span className="text-center">Clicks</span>
                    <span className="text-center">Conversions</span>
                    <span className="text-right">Revenue</span>
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
                      <span className="text-right font-display font-bold">₪{row.revenue.toLocaleString()}</span>
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
                  <Bell size={18} /> Recent Notifications
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
                  <Brain size={18} className="text-primary" /> AI Weekly Report
                  <span className="text-xs text-muted-foreground font-normal ml-2">{aiReport.date}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strengths */}
                <div>
                  <h3 className="text-sm font-display font-semibold text-primary flex items-center gap-2 mb-3">
                    <ArrowUpRight size={16} /> Strengths
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

                {/* Weaknesses */}
                <div>
                  <h3 className="text-sm font-display font-semibold text-destructive flex items-center gap-2 mb-3">
                    <ArrowDownRight size={16} /> Areas for Improvement
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

                {/* Recommendations */}
                <div>
                  <h3 className="text-sm font-display font-semibold text-accent flex items-center gap-2 mb-3">
                    <Brain size={16} /> AI Recommendations
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
                    This report is generated by AI based on your review data, click analytics, and conversion trends. 
                    AI-powered real-time analysis coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BusinessFooter />
    </div>
  );
};

export default BusinessDashboard;

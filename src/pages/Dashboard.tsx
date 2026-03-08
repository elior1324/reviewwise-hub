import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReviewCard from "@/components/ReviewCard";
import CourseCard from "@/components/CourseCard";
import ReviewRequestForm from "@/components/ReviewRequestForm";
import { Star, MessageSquare, Link2, Upload, TrendingUp, Users, BarChart3, Send, AlertTriangle, DollarSign, MousePointerClick, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Review, type Course, FREELANCER_CATEGORIES } from "@/data/mockData";

const Dashboard = () => {
  const { toast } = useToast();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [businessReviews, setBusinessReviews] = useState<Review[]>([]);
  const [businessCourses, setBusinessCourses] = useState<Course[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<Review[]>([]);
  const [affiliateStats, setAffiliateStats] = useState({ clicks: 0, conversions: 0, revenue: 0 });
  const [recentClicks, setRecentClicks] = useState<any[]>([]);
  const [stats, setStats] = useState({ rating: "0", reviews: "0", responseRate: "0%", requests: "0" });

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's business
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!biz) return;

      // Stats
      setStats({
        rating: (Number(biz.rating) || 0).toFixed(1),
        reviews: (biz.review_count || 0).toString(),
        responseRate: "—",
        requests: "—",
      });

      // Courses
      const { data: courses } = await supabase
        .from("courses")
        .select("*")
        .eq("business_id", biz.id);

      if (courses) {
        setBusinessCourses(courses.map((c: any) => ({
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

      // Reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*, courses(name), business_responses(text, created_at)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false });

      if (reviews) {
        const mapped: Review[] = reviews.map((r: any) => ({
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
          flagged: r.flagged || false,
          flagReason: r.flag_reason || undefined,
          ownerResponse: r.business_responses?.[0] ? {
            text: r.business_responses[0].text,
            date: new Date(r.business_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        }));
        setBusinessReviews(mapped);
        setFlaggedReviews(mapped.filter(r => r.flagged));
      }

      // Affiliate clicks
      const { data: clicks } = await supabase
        .from("affiliate_clicks")
        .select("*, courses(name)")
        .order("clicked_at", { ascending: false })
        .limit(10);

      if (clicks) {
        const totalClicks = clicks.length;
        const conversions = clicks.filter((c: any) => c.converted).length;
        const revenue = clicks.filter((c: any) => c.converted).reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0);
        setAffiliateStats({ clicks: totalClicks, conversions, revenue });
        setRecentClicks(clicks.slice(0, 5).map((c: any) => ({
          name: c.courses?.name || c.course_id,
          date: new Date(c.clicked_at).toLocaleDateString("he-IL"),
          converted: c.converted,
          revenue: Number(c.revenue) || 0,
        })));
      }
    };

    fetchDashboard();
  }, []);

  const STATS = [
    { icon: Star, label: "דירוג ממוצע", value: stats.rating },
    { icon: MessageSquare, label: "סה״כ ביקורות", value: stats.reviews },
    { icon: TrendingUp, label: "אחוז מענה", value: stats.responseRate },
    { icon: Users, label: "בקשות שנשלחו", value: stats.requests },
  ];

  const handleRespond = (reviewId: string) => {
    if (!responseText.trim()) return;
    toast({ title: "התגובה נשלחה!", description: "התגובה תופיע בביקורת." });
    setRespondingTo(null);
    setResponseText("");
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-2">לוח בקרה עסקי</h1>
        <p className="text-muted-foreground mb-8">נהלו את הביקורות, עקבו אחר הנתונים והגדילו את המוניטין של העסק שלכם.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="shadow-card animated-border bg-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="glass flex-wrap">
            <TabsTrigger value="reviews">ביקורות</TabsTrigger>
            <TabsTrigger value="courses">קורסים</TabsTrigger>
            <TabsTrigger value="flagged">חשודות</TabsTrigger>
            <TabsTrigger value="affiliate">אפיליאט</TabsTrigger>
            <TabsTrigger value="upload">העלאת רכישות</TabsTrigger>
            <TabsTrigger value="links">קישורי ביקורת</TabsTrigger>
            <TabsTrigger value="widgets">וידג׳טים</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            {businessReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">עדיין אין ביקורות.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessReviews.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ReviewCard {...r} />
                    {!r.ownerResponse && (
                      <div className="mt-2">
                        {respondingTo === r.id ? (
                          <div className="space-y-2">
                            <Textarea placeholder="כתבו תגובה..." value={responseText} onChange={e => setResponseText(e.target.value)} className="glass border-border/50" rows={2} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleRespond(r.id)} className="bg-primary text-primary-foreground">שלח תגובה</Button>
                              <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>ביטול</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setRespondingTo(r.id)} className="gap-1">
                            <MessageSquare size={14} /> הגב לביקורת
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-semibold text-lg">הקורסים שלכם ({businessCourses.length} קורסים)</h2>
              <Button size="sm" className="gap-1 bg-primary text-primary-foreground">
                <Plus size={14} /> הוסף קורס
              </Button>
            </div>
            {businessCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">עדיין לא הוספתם קורסים.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessCourses.map((course, i) => (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CourseCard {...course} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flagged">
            <Card className="shadow-card animated-border bg-card mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle size={20} /> ביקורות חשודות ({flaggedReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">ביקורות שזוהו על ידי מערכת ה-AI כחשודות בזיוף או בספאם.</p>
              </CardContent>
            </Card>
            {flaggedReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">אין ביקורות חשודות כרגע 🎉</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flaggedReviews.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ReviewCard {...r} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="affiliate">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MousePointerClick size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">{affiliateStats.clicks}</p>
                    <p className="text-xs text-muted-foreground">קליקים</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">{affiliateStats.conversions}</p>
                    <p className="text-xs text-muted-foreground">המרות ({affiliateStats.clicks > 0 ? Math.round(affiliateStats.conversions / affiliateStats.clicks * 100) : 0}%)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">₪{affiliateStats.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">הכנסות</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-base">קליקים אחרונים</CardTitle>
              </CardHeader>
              <CardContent>
                {recentClicks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">עדיין אין קליקים.</p>
                ) : (
                  <div className="space-y-2">
                    {recentClicks.map((click, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                        <span>{click.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{click.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${click.converted ? "bg-trust-green-light text-trust-green" : "bg-secondary text-muted-foreground"}`}>
                            {click.converted ? `המרה ₪${click.revenue}` : "ללא המרה"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="shadow-card animated-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload size={20} /> העלאת קובץ CSV רכישות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  העלו קובץ CSV הכולל את העמודות הבאות: email, course_name, purchase_date, receipt_id, amount
                </p>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-10 text-center">
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">גררו ושחררו קובץ לכאן</p>
                  <Button variant="outline" size="sm">עיון בקבצים</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <ReviewRequestForm courses={businessCourses} />
          </TabsContent>

          <TabsContent value="widgets">
            <Card className="shadow-card animated-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 size={20} /> הטמעת וידג׳טים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: "תג דירוג", type: "badge" },
                  { title: "קרוסלת ביקורות", type: "carousel" },
                  { title: "רשימת ביקורות", type: "list" },
                ].map(({ title, type }) => (
                  <div key={type}>
                    <h3 className="font-display font-semibold mb-2">{title}</h3>
                    <div className="bg-secondary p-4 rounded-lg" dir="ltr">
                      <code className="text-xs text-foreground break-all">
                        {`<script src="https://reviewhub.co.il/widget.js" data-business="your-slug" data-type="${type}"></script>`}
                      </code>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Dashboard;

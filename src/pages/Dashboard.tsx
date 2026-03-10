import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReviewCard from "@/components/ReviewCard";
import CourseCard from "@/components/CourseCard";
import { Star, MessageSquare, Link2, Upload, TrendingUp, Users, BarChart3, Send, AlertTriangle, DollarSign, MousePointerClick, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Review, type Course, FREELANCER_CATEGORIES } from "@/data/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA REFERENCE (all column names verified against live Supabase DB)
//
//  businesses:      id, owner_id, business_name, website, email, phone,
//                   category, description, slug, verified, created_at
//                   ⚠️  NO: name, rating, review_count, logo_url, social_links
//
//  courses:         id, business_id, course_name, description, price,
//                   affiliate_url, course_category, created_at
//                   ⚠️  NO: name, rating, review_count, verified_purchases, category
//
//  reviews:         id, user_id, course_id, rating, review_text, purchase_date,
//                   verified_purchase, anonymous, reviewer_name, created_at, updated_at
//                   ⚠️  NO: text, verified, flagged, flag_reason, like_count, business_id
//
//  review_responses: id, review_id, business_id, response_text, created_at
//                   ⚠️  NO table named business_responses; column is response_text not text
//
//  affiliate_clicks: id, course_id, ip_address, user_agent, referrer, created_at
//                   ⚠️  NO: converted, revenue (not in this table)
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { toast } = useToast();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [businessReviews, setBusinessReviews] = useState<Review[]>([]);
  const [businessCourses, setBusinessCourses] = useState<Course[]>([]);
  const [affiliateStats, setAffiliateStats] = useState({ clicks: 0 });
  const [recentClicks, setRecentClicks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    rating: "0",
    reviews: "0",
    responseRate: "—",
    requests: "—",
  });
  const [bizId, setBizId] = useState<string | null>(null);
  const [bizSlug, setBizSlug] = useState<string>("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── 1. Fetch business ──────────────────────────────────────────────────
      // ✅ Select only columns that exist in the businesses table
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, slug, name, website, email, phone, category, description")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!biz) return;

      setBizId(biz.id);
      setBizSlug(biz.slug || "");

      // ── 2. Fetch courses ───────────────────────────────────────────────────
      // ✅ course_name (NOT name); course_category (NOT category)
      // ✅ rating/review_count/verified_purchases do NOT exist — computed below
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name, description, price, affiliate_url, category")
        .eq("business_id", biz.id);

      const courseIds = (courses || []).map((c: any) => c.id);

      if (courses) {
        setBusinessCourses(courses.map((c: any) => ({
          id: c.id,
          businessSlug: biz.slug || "",
          name: c.course_name || "",               // ✅ course_name → frontend .name
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
          category: c.course_category || "",       // ✅ course_category → frontend .category
          rating: 0,                               // computed below from reviews
          reviewCount: 0,                          // computed below from reviews
          verifiedPurchases: 0,                    // computed below from reviews
        })));
      }

      // ── 3. Fetch reviews (by course_ids — reviews has no business_id column) ─
      // ✅ review_text (NOT text), verified_purchase (NOT verified)
      // ✅ review_responses join (NOT business_responses), response_text (NOT text)
      // ✅ courses join uses course_name (NOT name)
      const { data: reviews } = courseIds.length > 0
        ? await supabase
            .from("reviews")
            .select("*, courses(course_name), review_responses(response_text, created_at)")
            .in("course_id", courseIds)
            .order("created_at", { ascending: false })
        : { data: [] as any[] };

      if (reviews && reviews.length > 0) {
        // Compute business-level rating from all reviews
        const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length;
        const verifiedCount = reviews.filter((r: any) => r.verified_purchase).length;

        setStats({
          rating: avgRating.toFixed(1),
          reviews: String(reviews.length),
          responseRate: "—",
          requests: "—",
        });

        // Update course-level stats
        const reviewsByCourse: Record<string, { count: number; ratingSum: number; verified: number }> = {};
        reviews.forEach((r: any) => {
          if (!r.course_id) return;
          if (!reviewsByCourse[r.course_id]) reviewsByCourse[r.course_id] = { count: 0, ratingSum: 0, verified: 0 };
          reviewsByCourse[r.course_id].count++;
          reviewsByCourse[r.course_id].ratingSum += (r.rating || 0);
          if (r.verified_purchase) reviewsByCourse[r.course_id].verified++;
        });

        setBusinessCourses(prev => prev.map(c => {
          const stats = reviewsByCourse[c.id];
          if (!stats) return c;
          return {
            ...c,
            rating: stats.count > 0 ? Math.round((stats.ratingSum / stats.count) * 10) / 10 : 0,
            reviewCount: stats.count,
            verifiedPurchases: stats.verified,
          };
        }));

        setBusinessReviews(reviews.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : (r.reviewer_name || "משתמש"),
          rating: r.rating || 0,
          text: r.review_text || "",               // ✅ review_text (NOT r.text)
          courseName: r.courses?.course_name || "", // ✅ course_name (NOT courses.name)
          courseId: r.course_id || "",
          businessSlug: biz.slug || "",
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified_purchase || false,  // ✅ verified_purchase (NOT r.verified)
          anonymous: r.anonymous || false,
          flagged: false,                           // flagged doesn't exist in reviews table
          flagReason: undefined,                    // flag_reason doesn't exist
          likeCount: 0,                             // like_count doesn't exist
          // ✅ review_responses (NOT business_responses), response_text (NOT .text)
          ownerResponse: r.review_responses?.[0] ? {
            text: r.review_responses[0].response_text || "",
            date: new Date(r.review_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        })));
      } else {
        setStats({ rating: "0", reviews: "0", responseRate: "—", requests: "—" });
      }

      // ── 4. Fetch affiliate clicks ──────────────────────────────────────────
      // affiliate_clicks columns: id, course_id, ip_address, user_agent, referrer, created_at
      // ⚠️  converted and revenue do NOT exist in this table
      if (courseIds.length > 0) {
        const { data: clickData } = await supabase
          .from("affiliate_clicks")
          .select("id, course_id, created_at")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (clickData) {
          setAffiliateStats({ clicks: clickData.length });
          setRecentClicks(clickData.map((c: any) => ({
            id: c.id,
            courseId: c.course_id,
            date: new Date(c.created_at).toLocaleDateString("he-IL"),
          })));
        }
      }
    };

    fetchDashboard();
  }, []);

  // ── Respond to review ──────────────────────────────────────────────────────
  // Inserts into review_responses (NOT business_responses)
  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim() || !bizId) return;

    const { error } = await supabase
      .from("review_responses")
      .insert({
        review_id: reviewId,
        business_id: bizId,
        response_text: responseText.trim(),        // ✅ response_text (NOT text)
      });

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן לשמור את התגובה.", variant: "destructive" });
      return;
    }

    toast({ title: "התגובה נשמרה!", description: "תגובתך לביקורת פורסמה." });
    setRespondingTo(null);
    setResponseText("");

    // Update local state to reflect the new response
    setBusinessReviews(prev => prev.map(r =>
      r.id === reviewId
        ? {
            ...r,
            ownerResponse: {
              text: responseText.trim(),
              date: new Date().toLocaleDateString("he-IL"),
            },
          }
        : r
    ));
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">לוח הבקרה שלי</h1>
          <p className="text-muted-foreground text-sm">ניהול הביקורות, הקורסים והאנליטיקס שלך</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Star, label: "דירוג ממוצע", value: stats.rating },
            { icon: MessageSquare, label: "סה״כ ביקורות", value: stats.reviews },
            { icon: MousePointerClick, label: "קליקים (אפיליאט)", value: String(affiliateStats.clicks) },
            { icon: TrendingUp, label: "שיעור תגובה", value: stats.responseRate },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="shadow-card bg-card">
              <CardContent className="pt-5 text-center">
                <Icon size={22} className="mx-auto mb-2 text-primary" />
                <p className="font-display font-bold text-xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reviews">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="reviews">ביקורות ({businessReviews.length})</TabsTrigger>
            <TabsTrigger value="courses">קורסים ({businessCourses.length})</TabsTrigger>
            <TabsTrigger value="affiliate">אפיליאט</TabsTrigger>
            <TabsTrigger value="requests">בקשות ביקורת</TabsTrigger>
          </TabsList>

          {/* Reviews tab */}
          <TabsContent value="reviews">
            <div className="space-y-4">
              {businessReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">עדיין אין ביקורות.</p>
              ) : (
                businessReviews.map((review, i) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ReviewCard {...review} />
                    {/* Respond panel */}
                    {!review.ownerResponse && (
                      <div className="mt-2 mr-4">
                        {respondingTo === review.id ? (
                          <div className="flex gap-2">
                            <Textarea
                              value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              placeholder="כתבו תגובה לביקורת..."
                              className="text-sm min-h-[70px]"
                            />
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => handleRespond(review.id!)} disabled={!responseText.trim()}>
                                <Send size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                                ×
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setRespondingTo(review.id!)}>
                            הגיבו לביקורת
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Courses tab */}
          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessCourses.length === 0 ? (
                <p className="text-muted-foreground py-10">עדיין אין קורסים רשומים.</p>
              ) : (
                businessCourses.map((course, i) => (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CourseCard {...course} />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Affiliate tab */}
          <TabsContent value="affiliate">
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 size={20} /> קישורי אפיליאט</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="font-display font-bold text-2xl text-foreground">{affiliateStats.clicks}</p>
                    <p className="text-sm text-muted-foreground">סה״כ קליקים</p>
                  </div>
                </div>
                {recentClicks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">קליקים אחרונים</h3>
                    <div className="space-y-2">
                      {recentClicks.slice(0, 10).map((click: any) => (
                        <div key={click.id} className="flex justify-between text-sm py-1 border-b border-border/30">
                          <span className="text-muted-foreground">{click.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Requests tab */}
          <TabsContent value="requests">
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send size={20} /> שליחת בקשות ביקורת</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  שלחו ללקוחות קישור ייעודי לכתיבת ביקורת על הקורס שרכשו.
                </p>
                <div className="flex gap-2 max-w-md">
                  <Input placeholder="כתובת אימייל של לקוח" type="email" />
                  <Button size="sm" className="gap-1">
                    <Send size={14} /> שלח
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;

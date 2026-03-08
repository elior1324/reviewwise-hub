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
import AIChatbot from "@/components/AIChatbot";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { REVIEWS, COURSES, AFFILIATE_CLICKS } from "@/data/mockData";

const BUSINESS_SLUG = "digital-marketing-academy";

const STATS = [
  { icon: Star, label: "דירוג ממוצע", value: "4.8" },
  { icon: MessageSquare, label: "סה״כ ביקורות", value: "124" },
  { icon: TrendingUp, label: "אחוז מענה", value: "92%" },
  { icon: Users, label: "בקשות שנשלחו", value: "180" },
];

const Dashboard = () => {
  const { toast } = useToast();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const businessReviews = REVIEWS.filter(r => r.businessSlug === BUSINESS_SLUG);
  const businessCourses = COURSES.filter(c => c.businessSlug === BUSINESS_SLUG);
  const flaggedReviews = REVIEWS.filter(r => r.flagged);

  const totalClicks = AFFILIATE_CLICKS.length;
  const conversions = AFFILIATE_CLICKS.filter(c => c.converted).length;
  const totalRevenue = AFFILIATE_CLICKS.filter(c => c.converted).reduce((s, c) => s + (c.revenue || 0), 0);

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

          {/* Reviews with respond */}
          <TabsContent value="reviews">
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
          </TabsContent>

          {/* Course Management */}
          <TabsContent value="courses">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-semibold text-lg">הקורסים שלכם ({businessCourses.length} קורסים)</h2>
              <Button size="sm" className="gap-1 bg-primary text-primary-foreground">
                <Plus size={14} /> הוסף קורס
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessCourses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Flagged Reviews */}
          <TabsContent value="flagged">
            <Card className="shadow-card animated-border bg-card mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle size={20} /> ביקורות חשודות ({flaggedReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">ביקורות שזוהו על ידי מערכת ה-AI כחשודות בזיוף או בספאם. בדקו אותן ופעלו בהתאם.</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedReviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ReviewCard {...r} />
                </motion.div>
              ))}
            </div>
            {flaggedReviews.length === 0 && (
              <p className="text-center text-muted-foreground py-10">אין ביקורות חשודות כרגע 🎉</p>
            )}
          </TabsContent>

          {/* Affiliate Stats */}
          <TabsContent value="affiliate">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MousePointerClick size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">{totalClicks}</p>
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
                <div className="space-y-2">
                  {AFFILIATE_CLICKS.slice(0, 5).map((click, i) => {
                    const course = COURSES.find(c => c.id === click.courseId);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                        <span>{course?.name || click.courseId}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{click.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${click.converted ? "bg-trust-green-light text-trust-green" : "bg-secondary text-muted-foreground"}`}>
                            {click.converted ? `המרה ₪${click.revenue}` : "ללא המרה"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
            <Card className="shadow-card animated-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 size={20} /> יצירת קישורי ביקורת</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">אימייל לקוח</label>
                  <Input placeholder="customer@example.com" className="glass border-border/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">שם הקורס</label>
                  <Input placeholder="לדוגמה: שיווק דיגיטלי מאסטרקלאס" className="glass border-border/50" />
                </div>
                <Button className="bg-primary text-primary-foreground gap-2 glow-primary"><Send size={16} /> יצירה ושליחה</Button>
                <div className="mt-4 p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">קישור שנוצר:</p>
                  <code className="text-sm text-foreground" dir="ltr">reviewhub.co.il/review/abc123-token</code>
                </div>
              </CardContent>
            </Card>
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

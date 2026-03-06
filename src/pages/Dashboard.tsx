import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReviewCard from "@/components/ReviewCard";
import { Star, MessageSquare, Link2, Upload, TrendingUp, Users, BarChart3, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";

const STATS = [
  { icon: Star, label: "דירוג ממוצע", value: "4.8" },
  { icon: MessageSquare, label: "סה״כ ביקורות", value: "124" },
  { icon: TrendingUp, label: "אחוז מענה", value: "92%" },
  { icon: Users, label: "בקשות שנשלחו", value: "180" },
];

const RECENT_REVIEWS = [
  { reviewerName: "שרה ל.", rating: 5, text: "קורס מדהים!", courseName: "בוטקמפ Full-Stack", date: "28 פבר׳ 2026", verified: true, anonymous: false },
  { reviewerName: "אנונימי", rating: 4, text: "תוכן מעולה.", courseName: "יסודות SEO", date: "25 פבר׳ 2026", verified: true, anonymous: true },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-2">לוח בקרה עסקי</h1>
        <p className="text-muted-foreground mb-8">נהלו את הביקורות והגדילו את המוניטין שלכם.</p>

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
          <TabsList className="glass">
            <TabsTrigger value="reviews">ביקורות אחרונות</TabsTrigger>
            <TabsTrigger value="upload">העלאת רכישות</TabsTrigger>
            <TabsTrigger value="links">קישורי ביקורת</TabsTrigger>
            <TabsTrigger value="widgets">וידג׳טים</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECENT_REVIEWS.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ReviewCard {...r} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="shadow-card animated-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload size={20} /> העלאת קובץ CSV רכישות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  העלו קובץ CSV עם העמודות: email, course_name, purchase_date, receipt_id, amount
                </p>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-10 text-center">
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">גררו ושחררו את הקובץ כאן</p>
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

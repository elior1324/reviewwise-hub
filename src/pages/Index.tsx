import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { useState } from "react";

const MOCK_BUSINESSES = [
  { slug: "digital-marketing-academy", name: "אקדמיית שיווק דיגיטלי", category: "שיווק", rating: 4.8, reviewCount: 124, description: "קורסים מקיפים בשיווק דיגיטלי למתחילים ולמתקדמים." },
  { slug: "code-masters-il", name: "Code Masters IL", category: "תכנות", rating: 4.6, reviewCount: 89, description: "בוטקמפ פיתוח Full-Stack עם פרויקטים מעשיים." },
  { slug: "design-school-tlv", name: "בית הספר לעיצוב ת״א", category: "עיצוב", rating: 4.9, reviewCount: 67, description: "קורסי UI/UX מאנשי מקצוע מהתעשייה." },
  { slug: "data-science-hub", name: "מרכז מדעי הנתונים", category: "מדעי נתונים", rating: 4.7, reviewCount: 156, description: "מיסודות Python ועד למידת מכונה מתקדמת." },
];

const MOCK_REVIEWS = [
  { reviewerName: "שרה ל.", rating: 5, text: "קורס מדהים! החניכה האישית הייתה יוצאת מן הכלל ומצאתי עבודה תוך חודשיים.", courseName: "בוטקמפ Full-Stack", date: "28 פבר׳ 2026", verified: true, anonymous: false },
  { reviewerName: "אנונימי", rating: 4, text: "תוכן מעולה ותרגילים מעשיים. הקהילה תומכת מאוד.", courseName: "שיווק דיגיטלי מאסטרקלאס", date: "25 פבר׳ 2026", verified: true, anonymous: true },
  { reviewerName: "דוד כ.", rating: 5, text: "ההשקעה הטובה ביותר שעשיתי בקריירה שלי. תוכנית הלימודים מובנית ועדכנית.", courseName: "יסודות עיצוב UI/UX", date: "20 פבר׳ 2026", verified: true, anonymous: false },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> רק ביקורות מאומתות
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              מצאו את הקורסים{" "}
              <span className="gradient-text glow-text">הטובים ביותר</span>
              <br />בישראל
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              ביקורות אמיתיות ומאומתות מסטודנטים אמיתיים. קבלו החלטות חכמות על הלימודים שלכם.
            </motion.p>
            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חפשו קורסים, מנטורים או קטגוריות..."
                  className="pr-10 h-12 glass border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 glow-primary">
                חיפוש
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 glass">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Star, label: "ביקורות", value: "12,400+" },
              { icon: Users, label: "עסקים", value: "850+" },
              { icon: ShieldCheck, label: "מאומתות", value: "98%" },
              { icon: TrendingUp, label: "מבקרים חודשיים", value: "45K+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <Icon size={24} className="mx-auto mb-2 text-primary" />
                <p className="font-display font-bold text-2xl text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Businesses */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">עסקים מובילים</h2>
            <p className="text-muted-foreground mt-1">אלפי סטודנטים סומכים עליהם</p>
          </div>
          <Link to="/search">
            <Button variant="outline" size="sm" className="border-border/50">הצג הכל</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_BUSINESSES.map((biz, i) => (
            <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">ביקורות אחרונות</h2>
          <p className="text-muted-foreground mb-10">משוב אמיתי מסטודנטים מאומתים</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_REVIEWS.map((review, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 100% 40% / 0.15), hsl(200 100% 50% / 0.08))" }}>
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              יוצר קורסים? הצטרף עכשיו
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              בנו אמון עם ביקורות מאומתות והגדילו את העסק שלכם.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                צרו פרופיל עסקי
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ShieldCheck, Star, TrendingUp, Users,
  GraduationCap, Briefcase, Palette, Code2, BarChart3, Brain, Megaphone, Wrench,
  UserCheck, BookOpen
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useState, useRef } from "react";
import { BUSINESSES, REVIEWS, FREELANCER_CATEGORIES, COURSE_CATEGORIES } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const AUDIENCE_TYPES = [
  { icon: GraduationCap, label: "סטודנטים", desc: "מחפשים קורסים איכותיים" },
  { icon: Briefcase, label: "מחליפי קריירה", desc: "מעבר לתחום חדש" },
  { icon: Code2, label: "מפתחים", desc: "שדרוג מיומנויות טכניות" },
  { icon: Palette, label: "מעצבים", desc: "UI/UX, גרפיקה ועיצוב" },
  { icon: Megaphone, label: "משווקים", desc: "שיווק דיגיטלי ו-SEO" },
  { icon: Brain, label: "דאטה סיינטיסטים", desc: "Python, ML ו-AI" },
  { icon: Wrench, label: "פרילנסרים", desc: "בניית עסק עצמאי" },
  { icon: BarChart3, label: "יזמים", desc: "Growth וניהול סטארטאפ" },
];

const FREELANCER_CATS_DISPLAY = FREELANCER_CATEGORIES.slice(0, 6).map(cat => ({
  label: cat,
  query: cat,
  count: BUSINESSES.filter(b => b.type === "freelancer" && b.category === cat).reduce((s, b) => s + b.reviewCount, 0),
}));

const COURSE_CATS_DISPLAY = COURSE_CATEGORIES.map(cat => ({
  label: cat,
  query: cat,
  count: BUSINESSES.filter(b => b.type === "course-provider" && b.category === cat).reduce((s, b) => s + b.reviewCount, 0),
}));

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const topFreelancers = BUSINESSES.filter(b => b.type === "freelancer").sort((a, b) => b.rating - a.rating).slice(0, 4);
  const topCourseProviders = BUSINESSES.filter(b => b.type === "course-provider").sort((a, b) => b.rating - a.rating).slice(0, 4);
  const recentReviews = REVIEWS.slice(0, 3);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* Hero — Audience-First */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <motion.div className="container py-16 md:py-24 relative" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> רק ביקורות מאומתות
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-4">
              מצאו את{" "}
              <span className="gradient-text glow-text">בעל המקצוע</span>
              {" "}או{" "}
              <span className="gradient-text glow-text">הקורס</span>
              {" "}המושלם
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              פרילנסרים, קורסים, סדנאות, הרצאות ומנטורינג — עם ביקורות מאומתות מלקוחות שבאמת רכשו.
            </motion.p>
            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto mb-12">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חפשו פרילנסרים, קורסים או קטגוריות..."
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

          {/* Audience Tiles */}
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} custom={4} className="text-center text-sm text-muted-foreground mb-6 font-medium">
              מי אתם? מצאו מה שמתאים לכם
            </motion.p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AUDIENCE_TYPES.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  custom={5 + i * 0.5}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  className="group cursor-pointer rounded-xl p-4 bg-card/60 border border-border/40 hover:border-primary/40 hover:bg-card transition-colors duration-300"
                  onClick={() => navigate(`/search?audience=${encodeURIComponent(label)}`)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <p className="font-display font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Two Category Sections */}
      <section className="border-y border-border/50 glass">
        <div className="container py-12">
          {/* Freelancers */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={20} className="text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">בעלי מקצוע עצמאים</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">מנהלי סושיאל, מעצבי אתרים, עורכי וידאו, כותבים שיווקיים ועוד</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {FREELANCER_CATS_DISPLAY.map(({ label, query, count }) => (
                <Link
                  key={label}
                  to={`/search?q=${encodeURIComponent(query)}&tab=freelancers`}
                  className="rounded-xl p-4 bg-card/50 border border-border/40 hover:border-primary/40 transition-all duration-300 text-center group"
                >
                  <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{count} ביקורות</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Course Providers */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">קורסים, סדנאות והכשרות</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">קורסים, סדנאות, הרצאות, לימודים, תעודות הכשרה ועוד</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {COURSE_CATS_DISPLAY.map(({ label, query, count }) => (
                <Link
                  key={label}
                  to={`/search?q=${encodeURIComponent(query)}&tab=courses`}
                  className="rounded-xl p-4 bg-card/50 border border-border/40 hover:border-primary/40 transition-all duration-300 text-center group"
                >
                  <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{count} ביקורות</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/50">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Star, label: "ביקורות", value: "12,400+" },
              { icon: Users, label: "עסקים ופרילנסרים", value: "850+" },
              { icon: ShieldCheck, label: "מאומתות", value: "98%" },
              { icon: TrendingUp, label: "מבקרים בחודש", value: "45K+" },
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

      {/* Top Freelancers */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">בעלי מקצוע מובילים</h2>
            </div>
            <p className="text-muted-foreground mt-1">פרילנסרים מוערכים עם ביקורות מאומתות</p>
          </div>
          <Link to="/search?tab=freelancers">
            <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topFreelancers.map((biz, i) => (
            <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Course Providers */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={22} className="text-primary" />
                <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">מוכרי קורסים מובילים</h2>
              </div>
              <p className="text-muted-foreground mt-1">קורסים, סדנאות והכשרות מאומתים</p>
            </div>
            <Link to="/search?tab=courses">
              <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCourseProviders.map((biz, i) => (
              <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <BusinessCard {...biz} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="container py-20">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">ביקורות אחרונות</h2>
        <p className="text-muted-foreground mb-10">משוב אמיתי מלקוחות מאומתים</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentReviews.map((review, i) => (
            <motion.div key={review.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <ReviewCard {...review} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* About CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              בעלי מקצוע ויוצרי קורסים? הצטרפו עכשיו
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              בנו אמון אמיתי עם ביקורות מאומתות והגדילו את העסק שלכם.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/business">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  גלו את הפלטפורמה לעסקים
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  קראו עוד על ReviewHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;

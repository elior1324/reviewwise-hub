import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ShieldCheck, Star, TrendingUp, Users,
  GraduationCap, Briefcase, Palette, Code2, BarChart3, Brain, Megaphone, Wrench,
  UserCheck, BookOpen, DollarSign, HelpCircle, ChevronDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import FloatingEarnCTA from "@/components/FloatingEarnCTA";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useState, useRef } from "react";
import { BUSINESSES, REVIEWS, FREELANCER_CATEGORIES, COURSE_CATEGORIES } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
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
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
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

const FREELANCER_CATS_DISPLAY = FREELANCER_CATEGORIES.slice(0, 8).map(cat => ({
  label: cat,
  query: cat,
  count: BUSINESSES.filter(b => b.type === "freelancer" && b.category === cat).reduce((s, b) => s + b.reviewCount, 0),
})).filter(c => c.count > 0);

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

      <FloatingEarnCTA />

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
          <motion.div
            className="mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-2">
              <UserCheck size={20} className="text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">בעלי מקצוע עצמאים</h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-5">מנהלי סושיאל, מעצבי אתרים, עורכי וידאו, כותבים שיווקיים ועוד</motion.p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {FREELANCER_CATS_DISPLAY.map(({ label, query, count }, i) => (
                <motion.div key={label} variants={fadeUp} custom={2 + i * 0.3}>
                  <Link
                    to={`/search?q=${encodeURIComponent(query)}&tab=freelancers`}
                    className="block rounded-xl p-4 bg-card/50 border border-border/40 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 text-center group"
                  >
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} ביקורות</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Course Providers */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">קורסים, סדנאות והכשרות</h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-5">קורסים, סדנאות, הרצאות, לימודים, תעודות הכשרה ועוד</motion.p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {COURSE_CATS_DISPLAY.map(({ label, query, count }, i) => (
                <motion.div key={label} variants={fadeUp} custom={2 + i * 0.3}>
                  <Link
                    to={`/search?q=${encodeURIComponent(query)}&tab=courses`}
                    className="block rounded-xl p-4 bg-card/50 border border-border/40 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 text-center group"
                  >
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} ביקורות</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/50">
        <div className="container py-10">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            {[
              { icon: Star, label: "ביקורות", value: "12,400+" },
              { icon: Users, label: "עסקים ופרילנסרים", value: "850+" },
              { icon: ShieldCheck, label: "מאומתות", value: "98%" },
              { icon: TrendingUp, label: "מבקרים בחודש", value: "45K+" },
            ].map(({ icon: Icon, label, value }) => (
              <motion.div key={label} variants={scaleIn}>
                <motion.div
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Icon size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-display font-bold text-2xl text-foreground">
                    <AnimatedCounter value={value} />
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">ביקורות אחרונות</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10">משוב אמיתי מלקוחות מאומתים</motion.p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentReviews.map((review, i) => (
            <motion.div key={review.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUp} custom={i}>
              <ReviewCard {...review} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Earn Money CTA */}
      <section id="earn-money" className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(45 100% 51% / 0.12), hsl(35 100% 50% / 0.06), hsl(160 84% 39% / 0.08))" }}
        >
          <div className="absolute inset-0 noise-overlay opacity-30" />
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          
          <div className="relative p-10 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <DollarSign size={16} />
              תוכנית שותפים
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display font-bold text-3xl md:text-5xl text-foreground mb-4"
            >
              הדעה שלכם שווה כסף 💰
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-muted-foreground mb-3 max-w-2xl mx-auto"
            >
              כתבו ביקורת מאומתת על קורס, הכשרה או בעל מקצוע — 
              <span className="text-foreground font-semibold"> והתחילו להרוויח מכל מכירה שתגיע בעקבותיכם.</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              כל ביקורת מאומתת הופכת אתכם לשותפים — אתם מרוויחים חלק מההכנסות, בלי שתצטרכו לעשות כלום אחרי.
              <span className="text-primary font-medium"> הכנסה פאסיבית, פשוט ככה.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10"
            >
              {[
                { step: "01", title: "כתבו ביקורת", desc: "שתפו חוויה אמיתית על מוצר שרכשתם" },
                { step: "02", title: "אנחנו מאמתים", desc: "הביקורת עוברת אימות רכישה" },
                { step: "03", title: "מרוויחים", desc: "כשמישהו רוכש בזכותכם — אתם מרוויחים" },
              ].map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 text-center"
                >
                  <span className="text-primary/40 font-display font-bold text-3xl">{step}</span>
                  <h3 className="font-display font-bold text-foreground mt-1">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base glow-primary px-10">
                  הירשמו והתחילו להרוויח
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* About CTA */}
      <section className="container pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border"
          style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}
        >
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4"
            >
              בעלי מקצוע ויוצרי קורסים? הצטרפו עכשיו
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-muted-foreground mb-8 max-w-lg mx-auto"
            >
              בנו אמון אמיתי עם ביקורות מאומתות והגדילו את העסק שלכם.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="flex gap-3 justify-center flex-wrap"
            >
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
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border/50" id="faq">
        <div className="container py-20">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <HelpCircle size={14} /> שאלות נפוצות
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">שאלות ותשובות</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">כל מה שצריך לדעת על ReviewHub</motion.p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { q: "מה זה ReviewHub?", a: "ReviewHub היא פלטפורמת ביקורות מאומתות מובילה בישראל. רק מי שרכש בפועל קורס או שירות יכול לכתוב ביקורת — כך אנחנו מבטיחים אמינות של 98%." },
              { q: "איך אני יודע שהביקורות אמיתיות?", a: "כל ביקורת עוברת תהליך אימות — אנחנו מוודאים שהכותב אכן רכש את הקורס או השירות. ביקורות מאומתות מסומנות בתג ✅ \"רכישה מאומתת\"." },
              { q: "האם השימוש באתר עולה כסף?", a: "לא! השימוש באתר לצרכנים הוא חינמי לחלוטין — קריאת ביקורות, חיפוש, השוואות וכתיבת ביקורות. ללא עלויות נסתרות." },
              { q: "איך כותבים ביקורת?", a: "הירשמו לאתר (חינם), ואז תוכלו לכתוב ביקורת על קורס או שירות שרכשתם — דרך קישור ייעודי שתקבלו מהספק, או דרך עמוד הקורס/הפרילנסר באתר." },
              { q: "אפשר לכתוב ביקורת בעילום שם?", a: "כן! בעת כתיבת ביקורת תוכלו לסמן \"ביקורת אנונימית\". שמכם לא יוצג, אך האימות שרכשתם את המוצר עדיין נשמר כדי לשמור על אמינות." },
              { q: "מה ההבדל בין פרילנסר לקורס?", a: "פרילנסר מספק שירות אישי (למשל עיצוב אתר, ניהול סושיאל), בעוד קורס הוא תוכנית לימודים שאפשר ללמוד ממנה בעצמכם. שניהם מופיעים באתר עם ביקורות מאומתות." },
              { q: "איך מוצאים קורס טוב בשיווק דיגיטלי?", a: "גשו לעמוד החיפוש וסננו לפי \"שיווק דיגיטלי\". אקדמיית שיווק דיגיטלי היא הפופולרית ביותר עם ⭐4.8 ו-124 ביקורות מאומתות, עם קורסים מ-₪990 ועד ₪2,490." },
              { q: "מי הפרילנסר הכי מומלץ?", a: "זה תלוי בתחום! למשל: מאיה כהן מובילה בניהול סושיאל (⭐4.9), דנה רוזנברג בעיצוב גרפי (⭐4.9), וטל ברק בקידום אורגני (⭐4.8). גשו לחיפוש ובחרו קטגוריה." },
              { q: "איך משווים בין שני קורסים?", a: "גשו לעמודי הקורסים וקראו את הביקורות. שימו לב לדירוג הכולל, מספר הביקורות, ותוכן הביקורות עצמן. גם הצ'אטבוט שלנו (למטה) יכול לעזור לכם להשוות!" },
              { q: "כמה עולים הקורסים?", a: "המחירים משתנים: קורסים קצרים מ-₪990, קורסים מלאים ₪2,000-₪5,000, ובוטקמפים מקיפים עד ₪14,900. המחיר מופיע בעמוד כל קורס." },
              { q: "איך נרשמים לאתר?", a: "לחצו על \"התחברו / הרשמו\" בתפריט העליון. תוכלו להירשם עם אימייל וסיסמה, או להתחבר מהר עם חשבון Google." },
              { q: "שכחתי את הסיסמה, מה עושים?", a: "בעמוד ההתחברות יש אפשרות \"שכחתי סיסמה\". תזינו את כתובת המייל ותקבלו קישור לאיפוס." },
              { q: "מה זה ביקורת \"מאומתת\"?", a: "ביקורת מאומתת (✅) מסמנת שהמערכת שלנו אימתה שהכותב אכן רכש את הקורס או השירות — דרך חשבונית, אישור רכישה, או אימות ישיר מול הספק." },
              { q: "אפשר לדווח על ביקורת בעייתית?", a: "בהחלט! ליד כל ביקורת יש כפתור דיווח (🚩). תוכלו לדווח על ביקורות לא רלוונטיות, פוגעניות, או חשודות כמזויפות. הצוות שלנו בודק כל דיווח." },
              { q: "אפשר לערוך ביקורת אחרי שפרסמתי?", a: "כן, תוכלו לערוך את הביקורת מלוח הבקרה שלכם. שימו לב שעריכות עשויות לדרוש אימות מחדש." },
              { q: "מה עושים אם עסק מגיב לביקורת שלי?", a: "זה דבר חיובי! הספק קורא את המשוב שלכם ומגיב. תוכלו לראות את התגובה מתחת לביקורת. אם יש בעיה עם התגובה, תוכלו לדווח עליה." },
              { q: "איך בוחרים בין כמה פרילנסרים באותו תחום?", a: "שימו לב ל: (1) דירוג כולל וכמות ביקורות, (2) תוכן הביקורות — מה אומרים הלקוחות, (3) ההתמחות הספציפית. גם הצ'אטבוט שלנו יכול לעזור להשוות!" },
              { q: "מה זה תוכנית השותפים (אפיליאט)?", a: "כשתכתבו ביקורת מאומתת, אתם הופכים לשותפים! אם מישהו רוכש קורס או שירות בזכות הביקורת שלכם, אתם מרוויחים עמלה מכל מכירה — הכנסה פאסיבית." },
              { q: "איך מרוויחים כסף מביקורות?", a: "שלושה שלבים: (1) כתבו ביקורת אמיתית על מוצר שרכשתם, (2) אנחנו מאמתים את הרכישה, (3) כשמישהו רוכש בזכותכם — אתם מקבלים עמלה. ככה פשוט!" },
              { q: "איזה קורס תכנות מומלץ למתחילים?", a: "Code Masters IL מציעים בוטקמפ Full-Stack (⭐4.6, 89 ביקורות) שמתאים גם למתחילים. עלות: ₪14,900. יש להם גם קורס React מתקדם למי שכבר מכיר תכנות." },
              { q: "האתר זמין גם במובייל?", a: "כן! האתר מותאם לחלוטין לטלפון נייד, טאבלט ומחשב. תוכלו לגלוש, לחפש ולכתוב ביקורות מכל מכשיר." },
              { q: "איך מוצאים קורס UI/UX טוב?", a: "בית הספר לעיצוב ת\"א מוביל עם ⭐4.9 ו-67 ביקורות. הקורס \"יסודות עיצוב UI/UX\" עולה ₪3,990. גשו לחיפוש וסננו לפי \"עיצוב UI/UX\"." },
              { q: "יש קורסים במדעי נתונים?", a: "כן! מרכז מדעי הנתונים מוביל עם ⭐4.7 ו-156 ביקורות. הם מציעים קורס Python (₪2,990) וקורס למידת מכונה מתקדמת (₪4,990)." },
              { q: "איך אני יודע איזה קורס שווה את המחיר?", a: "קראו את הביקורות המאומתות — לקוחות אמיתיים כותבים על החוויה שלהם, כולל יחס מחיר-ערך. שימו לב לדירוג, כמות הביקורות, והמלצות ספציפיות." },
              { q: "מה קורה אם לא מרוצה מקורס שרכשתי?", a: "מדיניות ההחזרים תלויה בספק הספציפי. מומלץ לבדוק את תנאי ההחזר לפני הרכישה. כתיבת ביקורת כנה תעזור ללקוחות עתידיים לקבל החלטה מושכלת." },
              { q: "אפשר לראות ביקורות רק של אנשים ספציפיים?", a: "כרגע אפשר לסנן ביקורות לפי דירוג, תאריך וסטטוס אימות. בעתיד נוסיף אפשרויות סינון נוספות." },
              { q: "האם ReviewHub שייכת לחברה ישראלית?", a: "כן! ReviewHub היא פלטפורמה ישראלית עם ממשק מלא בעברית, שמתמקדת בשוק החינוך הדיגיטלי ובעלי המקצוע בישראל." },
              { q: "איך יוצרים קשר עם הצוות?", a: "תוכלו לפנות דרך עמוד אודות, דרך הצ'אטבוט (הכפתור למטה), או דרך עמוד יצירת קשר. אנחנו כאן לכל שאלה! 😊" },
              { q: "יש אפליקציה לטלפון?", a: "כרגע אין אפליקציה ייעודית, אך האתר מותאם לחלוטין למובייל ועובד מצוין מהדפדפן בטלפון. אפשר גם להוסיף אותו למסך הבית." },
              { q: "מה מבטיח שהביקורות לא נכתבות על ידי העסק עצמו?", a: "תהליך האימות שלנו מוודא שרק לקוחות שרכשו בפועל כותבים ביקורות. בנוסף, מערכת AI שלנו סורקת ומזהה ביקורות חשודות. שיטה זו מבטיחה אמינות של 98%." },
            ].map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={Math.floor(i / 3)}
              >
                <details className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-display font-semibold text-foreground list-none">
                    <span>{q}</span>
                    <ChevronDown size={16} className="text-muted-foreground transition-transform duration-300 group-open:rotate-180 shrink-0 mr-3" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;

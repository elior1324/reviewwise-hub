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
import { useState, useRef, useEffect } from "react";
import { FREELANCER_CATEGORIES, COURSE_CATEGORIES, type Business, type Review } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [topFreelancers, setTopFreelancers] = useState<Business[]>([]);
  const [topCourseProviders, setTopCourseProviders] = useState<Business[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [freelancerCatCounts, setFreelancerCatCounts] = useState<Record<string, number>>({});
  const [courseCatCounts, setCourseCatCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ reviews: 0, businesses: 0 });

  useEffect(() => {
    // Fetch top freelancers
    supabase
      .from("businesses")
      .select("*")
      .eq("category", "freelancer")
      .order("rating", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        // Try matching by category field being a freelancer category
      });

    // Fetch all businesses and map to Business type
    const fetchBusinesses = async () => {
      const { data: allBiz } = await supabase
        .from("businesses")
        .select("*")
        .order("rating", { ascending: false });

      if (!allBiz) return;

      const mapped: Business[] = allBiz.map((b: any) => ({
        slug: b.slug,
        name: b.name,
        type: FREELANCER_CATEGORIES.includes(b.category) ? "freelancer" as const : "course-provider" as const,
        category: b.category,
        rating: Number(b.rating) || 0,
        reviewCount: b.review_count || 0,
        description: b.description || "",
        logo: b.logo_url || undefined,
        website: b.website || undefined,
        email: b.email || undefined,
        phone: b.phone || undefined,
        socialLinks: b.social_links as any || undefined,
      }));

      const freelancers = mapped.filter(b => b.type === "freelancer").slice(0, 4);
      const courseProvs = mapped.filter(b => b.type === "course-provider").slice(0, 4);
      setTopFreelancers(freelancers);
      setTopCourseProviders(courseProvs);

      // Category counts
      const fCounts: Record<string, number> = {};
      const cCounts: Record<string, number> = {};
      mapped.forEach(b => {
        if (b.type === "freelancer") {
          fCounts[b.category] = (fCounts[b.category] || 0) + b.reviewCount;
        } else {
          cCounts[b.category] = (cCounts[b.category] || 0) + b.reviewCount;
        }
      });
      setFreelancerCatCounts(fCounts);
      setCourseCatCounts(cCounts);

      setStats(prev => ({ ...prev, businesses: allBiz.length }));
    };

    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, courses(name)")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) {
        const mapped: Review[] = data.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : "משתמש",
          rating: r.rating,
          text: r.text,
          courseName: r.courses?.name || "",
          courseId: r.course_id,
          businessSlug: "",
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified || false,
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at !== r.created_at ? new Date(r.updated_at).toLocaleDateString("he-IL") : undefined,
          flagged: r.flagged || false,
          flagReason: r.flag_reason || undefined,
        }));
        setRecentReviews(mapped);
        setStats(prev => ({ ...prev, reviews: data.length }));
      }
    };

    // Fetch total review count
    const fetchTotalReviews = async () => {
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });
      if (count !== null) setStats(prev => ({ ...prev, reviews: count }));
    };

    fetchBusinesses();
    fetchReviews();
    fetchTotalReviews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const FREELANCER_CATS_DISPLAY = FREELANCER_CATEGORIES.slice(0, 8).map(cat => ({
    label: cat,
    query: cat,
    count: freelancerCatCounts[cat] || 0,
  })).filter(c => c.count > 0);

  const COURSE_CATS_DISPLAY = COURSE_CATEGORIES.map(cat => ({
    label: cat,
    query: cat,
    count: courseCatCounts[cat] || 0,
  }));

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
        {topFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topFreelancers.map((biz, i) => (
              <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <BusinessCard {...biz} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">עדיין אין בעלי מקצוע רשומים. היו הראשונים!</p>
        )}
      </section>

      {/* Top Course Providers */}
      <section className="container py-10">
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
        {topCourseProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCourseProviders.map((biz, i) => (
              <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <BusinessCard {...biz} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">עדיין אין ספקי קורסים רשומים. היו הראשונים!</p>
        )}
      </section>

      {/* Freelancer Categories */}
      {FREELANCER_CATS_DISPLAY.length > 0 && (
        <section className="border-y border-border/50 glass">
          <div className="container py-12">
            <motion.div
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
          </div>
        </section>
      )}

      {/* Course Categories */}
      {COURSE_CATS_DISPLAY.some(c => c.count > 0) && (
        <section className="border-y border-border/50 glass">
          <div className="container py-12">
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
                {COURSE_CATS_DISPLAY.filter(c => c.count > 0).map(({ label, query, count }, i) => (
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
      )}

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
              { icon: Star, label: "ביקורות", value: stats.reviews > 0 ? stats.reviews.toLocaleString() : "0" },
              { icon: Users, label: "עסקים ופרילנסרים", value: stats.businesses > 0 ? stats.businesses.toLocaleString() : "0" },
              { icon: ShieldCheck, label: "מאומתות", value: "100%" },
              { icon: TrendingUp, label: "פלטפורמה חדשה", value: "🚀" },
            ].map(({ icon: Icon, label, value }) => (
              <motion.div key={label} variants={scaleIn}>
                <motion.div
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Icon size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-display font-bold text-2xl text-foreground">
                    {value}
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">ביקורות אחרונות</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10">משוב אמיתי מלקוחות מאומתים</motion.p>
        </motion.div>
        {recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map((review, i) => (
              <motion.div key={review.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUp} custom={i}>
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">עדיין אין ביקורות. היו הראשונים לכתוב!</p>
        )}
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
              { q: "מה זה ReviewHub?", a: "ReviewHub היא פלטפורמת ביקורות מאומתות מובילה בישראל. רק מי שרכש בפועל קורס או שירות יכול לכתוב ביקורת — כך אנחנו מבטיחים אמינות מוחלטת." },
              { q: "איך אני יודע שהביקורות אמיתיות?", a: "כל משתמש רשום יכול לכתוב ביקורת על קורס או שירות. עם זאת, רק מי שמעלה קבלה או חשבונית ומאמת שהוא אכן רכש את הקורס — מקבל את התג \"רכישה מאומתת\". כך תוכלו להבדיל בין ביקורת רגילה לביקורת של מי שבאמת רכש ולמד." },
              { q: "מה זה תוכנית השותפים (אפיליאט)?", a: "כשתכתבו ביקורת מאומתת, אתם הופכים לשותפים! אם מישהו רוכש קורס או שירות בזכות הביקורת שלכם, אתם מרוויחים עמלה מכל מכירה — הכנסה פאסיבית." },
              { q: "האם השימוש באתר עולה כסף?", a: "לא! השימוש באתר לצרכנים הוא חינמי לחלוטין — קריאת ביקורות, חיפוש, השוואות וכתיבת ביקורות. ללא עלויות נסתרות." },
              { q: "איך כותבים ביקורת?", a: "הירשמו לאתר (חינם), ואז תוכלו לכתוב ביקורת על קורס או שירות שרכשתם — דרך קישור ייעודי שתקבלו מהספק, או דרך עמוד הקורס/הפרילנסר באתר." },
              { q: "אפשר לכתוב ביקורת בעילום שם?", a: "כן! בעת כתיבת ביקורת תוכלו לסמן \"ביקורת אנונימית\" — גם אם אימתתם רכישה עם קבלה או חשבונית. שמכם לא יוצג, אבל תג \"רכישה מאומתת\" עדיין יופיע כדי לשמור על אמינות הביקורת." },
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

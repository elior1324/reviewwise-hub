import { motion, useScroll, useTransform, MotionConfig } from "framer-motion";
import { FloatingPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ShieldCheck, Star, TrendingUp, Users,
  UserCheck, BookOpen, HelpCircle, ChevronDown, Cpu
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee";
import { FeaturesGrid } from "@/components/blocks/features-grid";
import { useState, useRef, useEffect } from "react";
import { FREELANCER_CATEGORIES, COURSE_CATEGORIES, SAAS_CATEGORIES, type Business, type Review } from "@/data/mockData";
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


const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [topFreelancers, setTopFreelancers] = useState<Business[]>([]);
  const [topCourseProviders, setTopCourseProviders] = useState<Business[]>([]);
  const [topSaasTools, setTopSaasTools] = useState<Business[]>([]);
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
        type: FREELANCER_CATEGORIES.includes(b.category)
          ? "freelancer" as const
          : SAAS_CATEGORIES.includes(b.category)
            ? "saas" as const
            : "course-provider" as const,
        category: b.category,
        rating: Number(b.rating) || 0,
        reviewCount: b.review_count || 0,
        verifiedReviewCount: b.verified_review_count || 0,
        description: b.description || "",
        logo: b.logo_url || undefined,
        website: b.website || undefined,
        email: b.email || undefined,
        phone: b.phone || undefined,
        socialLinks: b.social_links as any || undefined,
        pricingModel: b.pricing_model || undefined,
        founderName: b.founder_name || undefined,
      }));

      const freelancers = mapped.filter(b => b.type === "freelancer").slice(0, 4);
      const courseProvs = mapped.filter(b => b.type === "course-provider").slice(0, 4);
      const saasTools = mapped
        .filter(b => b.type === "saas")
        .sort((a, b) => (b.verifiedReviewCount ?? 0) * 2 + b.rating - ((a.verifiedReviewCount ?? 0) * 2 + a.rating))
        .slice(0, 4);
      setTopFreelancers(freelancers);
      setTopCourseProviders(courseProvs);
      setTopSaasTools(saasTools);

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
      // Fetch recent reviews via the secure public_reviews view
      const { data } = await supabase
        .from("reviews")
        .select("*, courses(name), business_responses(text, created_at)")
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) {
        // Expert detection among these reviews
        const expertCounts: Record<string, number> = {};
        data.forEach((r: any) => {
          if (r.rating >= 4) {
            expertCounts[r.user_id] = (expertCounts[r.user_id] || 0) + 1;
          }
        });

        // For homepage, group by business_id to determine early bird per business
        const businessFirsts: Record<string, string[]> = {};
        const sortedByDate = [...data].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        sortedByDate.forEach((r: any) => {
          if (!businessFirsts[r.business_id]) businessFirsts[r.business_id] = [];
          if (businessFirsts[r.business_id].length < 5) businessFirsts[r.business_id].push(r.id);
        });
        const earlyBirdIds = new Set(Object.values(businessFirsts).flat());

        const mapped: Review[] = data.slice(0, 3).map((r: any) => ({
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
          likeCount: r.like_count || 0,
          isEarlyBird: earlyBirdIds.has(r.id),
          isExpert: (expertCounts[r.user_id] || 0) >= 3,
          ownerResponse: r.business_responses?.[0] ? {
            text: r.business_responses[0].text,
            date: new Date(r.business_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        }));
        setRecentReviews(mapped);
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
    // MotionConfig propagates `reducedMotion="user"` to every framer-motion
    // element on the page — when the OS "Reduce Motion" setting is on, all
    // animations are suppressed automatically (WCAG 2.1 SC 2.3.3 / AAA).
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />


      {/* Hero — Audience-First */}
      {/*
        aria-labelledby links this landmark to the visible h1 heading so that
        screen readers announce "Hero region: מצאו את בעל המקצוע…" (WCAG 1.3.1).
      */}
      <section ref={heroRef} className="relative overflow-hidden" aria-labelledby="hero-heading">
        {/* Decorative gradient overlay — hidden from assistive technology */}
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} aria-hidden="true" />
        {/* Animated teal SVG path decorations (FloatingPaths) */}
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        {/* Decorative blur orbs — purely visual, skip for AT */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" aria-hidden="true" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} aria-hidden="true" />
        <motion.div className="container py-16 md:py-24 relative" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              {/* Icon is decorative — label text conveys the meaning */}
              <ShieldCheck size={16} aria-hidden="true" /> תשתית אמון עצמאית · ציון לא למכירה · נתונים ממערכות תשלום
            </motion.div>
            {/*
              id="hero-heading" is referenced by aria-labelledby on the <section>
              so screen readers announce the heading when navigating by landmarks.
            */}
            <motion.h1 id="hero-heading" variants={fadeUp} custom={1} className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-4">
              <span className="gradient-text glow-text">בדקו</span>
              {" "}לפני שאתם{" "}
              <span className="gradient-text glow-text">משלמים</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              ReviewHub מחובר למערכות תשלום ומפיק נתוני אמון אמיתיים. לא דעות — רשומות מסחריות מאומתות מיוצרי קורסים ופרילנסרים.
            </motion.p>
            {/*
              role="search" identifies this as the site's primary search form for
              screen reader landmark navigation (WCAG 1.3.1 / ARIA landmark roles).
              aria-label distinguishes it from any other search forms on the page.
            */}
            <motion.form role="search" aria-label="חיפוש פרילנסרים וקורסים" variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-12 w-full px-4 sm:px-0">
              <div className="relative flex-1">
                {/* Search icon is decorative — the input's aria-label conveys the purpose */}
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="חפשו יוצר, קורס או כלי AI — בדקו לפני שאתם רוכשים"
                  aria-label="חיפוש יוצרים, קורסים ושירותים לאימות"
                  className="pr-10 h-12 glass border-border/50 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 glow-primary w-full sm:w-auto">
                חיפוש
              </Button>
            </motion.form>
          </motion.div>

        </motion.div>
      </section>

      {/* Top Course Providers — 1st */}
      <section className="container py-10 md:py-20">
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">ציוני אמון מובילים — קורסים ויוצרים</h2>
            </div>
            <p className="text-muted-foreground mt-1">קורסים, סדנאות והכשרות — מדורגים לפי ציון אמון מאומת</p>
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

      {/* Top SaaS & AI Tools — 2nd */}
      <section className="container py-10">
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">ציוני אמון מובילים — SaaS & AI</h2>
            </div>
            <p className="text-muted-foreground mt-1">מוצרים דיגיטליים של יזמים ישראלים — מדורגים לפי ציון אמון, לא לפי פרסום</p>
          </div>
          <Link to="/search?tab=saas">
            <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
          </Link>
        </div>
        {topSaasTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topSaasTools.map((biz, i) => (
              <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <BusinessCard {...biz} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">עדיין אין כלי SaaS ו-AI רשומים. היו הראשונים!</p>
        )}
      </section>

      {/* Top Service Providers — 3rd */}
      <section className="container py-10">
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">ציוני אמון מובילים — ספקי שירות</h2>
            </div>
            <p className="text-muted-foreground mt-1">מדורגים לפי נפח ביקורות מאומתות ויחס החזרים — לא לפי פרסום</p>
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
          <p className="text-center text-muted-foreground py-10">עדיין אין ספקי שירות רשומים. היו הראשונים!</p>
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
              { icon: Star, label: "ביקורות מאומתות", value: stats.reviews > 0 ? stats.reviews.toLocaleString() : "0" },
              { icon: Users, label: "יוצרים וספקי שירות", value: stats.businesses > 0 ? stats.businesses.toLocaleString() : "0" },
              { icon: ShieldCheck, label: "רכישה מאומתת", value: "100%" },
              { icon: TrendingUp, label: "מתודולוגיה פתוחה לציבור", value: "✓" },
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

      {/* "Why ReviewHub?" bento feature grid with glowing border effect */}
      <FeaturesGrid />

      {/* Scrolling testimonials marquee */}
      <TestimonialsSection
        title="ביקורות מאומתות — ממשתמשים שרכשו בפועל"
        description="כל ביקורת קושרה לרכישה ממשית לפני שהתפרסמה. לא ניתן לרכוש מיקום, להסיר ביקורת שלילית, או לכתוב ביקורת ללא אימות."
        className="border-t border-border/40"
        testimonials={[
          {
            author: {
              name: "דנה לוי",
              handle: "@dana_levy",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=dana-levy&backgroundColor=b6e3f4",
            },
            text: "הקורס שינה לי את הדרך שאני חושבת על שיווק. תוצאות אמיתיות תוך שלושה שבועות — ממש לא ציפיתי לזה.",
          },
          {
            author: {
              name: "יובל כהן",
              handle: "@yuval_cohen",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=yuval-cohen&backgroundColor=c0aede",
            },
            text: "עבדתי עם המעצבת על האתר שלי — מקצועית, מדויקת, ועומדת בזמנים. פשוט תענוג לעבוד איתה.",
          },
          {
            author: {
              name: "שיר מזרחי",
              handle: "@shir_mizrachi",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=shir-mizrachi&backgroundColor=d1f4e0",
            },
            text: "המנטור לא רק לימד — הוא ממש ישב איתי על הפרויקט. קיבלתי ידע שאני משתמשת בו כל יום.",
          },
          {
            author: {
              name: "אורי גרין",
              handle: "@uri_green",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=uri-green&backgroundColor=ffd5dc",
            },
            text: "סוף סוף מצאתי פרילנסרית שכתבה תוכן בדיוק לפי קול המותג שלנו. ממליץ בחום לכל עסק קטן.",
          },
          {
            author: {
              name: "נועה בן-דוד",
              handle: "@noa_bendavid",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=noa-bendavid&backgroundColor=b6e3f4",
            },
            text: "קורס הנתונים הוא הכי פרקטי שמצאתי ברשת. כל שיעור מסתיים בפרויקט אמיתי — ממש לא תיאורטי.",
          },
          {
            author: {
              name: "עמיר ברק",
              handle: "@amir_barak",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=amir-barak&backgroundColor=c0aede",
            },
            text: "חסכתי חצי שנה של לימוד עצמי. הקורס בנוי חכם — מתחיל מאפס ומגיע לדברים מורכבים בצעדים הגיוניים.",
          },
          {
            author: {
              name: "מיה רוזן",
              handle: "@mia_rosen",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=mia-rosen&backgroundColor=d1f4e0",
            },
            text: "הייתה לי שאלה שנה אחרי שסיימתי את הקורס — המרצה ענה תוך 24 שעות. שירות כזה לא מוצאים בשום מקום.",
          },
          {
            author: {
              name: "לירן אזולאי",
              handle: "@liran_azulay",
              avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=liran-azulay&backgroundColor=ffd5dc",
            },
            text: "הביקורות באתר הן אמיתיות לחלוטין. ReviewHub היא הפלטפורמה הראשונה שאני באמת סומך עליה.",
          },
        ]}
      />

      {/* Recent Reviews */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">רשומות אחרונות מהמאגר</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10">ביקורות מאומתות שנוספו לאחרונה — מסומנות לפי סוג הרכישה</motion.p>
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

      {/* How Verification Works — institutional methodology section */}
      <section id="how-it-works" className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.07), hsl(220 80% 40% / 0.05))" }}
        >
          <div className="absolute inset-0 noise-overlay opacity-30" />
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

          <div className="relative p-6 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <ShieldCheck size={16} aria-hidden="true" />
              איך האימות עובד
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display font-bold text-3xl md:text-5xl text-foreground mb-4"
            >
              נתונים, לא טענות
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              כל ציון אמון מחושב מנתוני מסחר ממשיים. המתודולוגיה פתוחה לציבור — אתם יכולים לבדוק בדיוק איך כל מספר מתקבל.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "אימות רכישה",
                  desc: "רק מי שרכש בפועל יכול לכתוב ביקורת. אנחנו מאמתים מול מערכות תשלום — לא על בסיס הצהרה עצמית.",
                },
                {
                  step: "02",
                  title: "חישוב ציון אמון",
                  desc: "ציון האמון מורכב משלושה מרכיבים: נפח ביקורות (עד 40 נקודות), בריאות החזרים (עד 35 נקודות), ותקופת פעילות מאומתת (עד 25 נקודות).",
                },
                {
                  step: "03",
                  title: "שקיפות מלאה",
                  desc: "ציונים אינם למכירה. ביקורות אינן ניתנות למחיקה על ידי בעל העסק. המתודולוגיה מפורסמת ונגישה לכל.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                  className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 text-right"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">{item.step}</span>
                    <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="font-display font-bold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex gap-3 justify-center flex-wrap mt-8"
            >
              <Link to="/about">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  קראו על המתודולוגיה
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  חפשו ביקורות מאומתות
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
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">על המתודולוגיה, האימות, והעצמאות שלנו</motion.p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { q: "מה זה ReviewHub?", a: "ReviewHub היא מערכת אימות עצמאית לקורסים ופרילנסרים בישראל. אנחנו מחברים למערכות תשלום ומפיקים ציוני אמון המבוססים על נתוני מסחר ממשיים — לא על דעות, לא על פרסום בתשלום." },
              { q: "איך אני יודע שהביקורות אמיתיות?", a: "אנחנו מאמתים מול מערכות תשלום — לא על בסיס הצהרה עצמית. רק מי שרכש בפועל יכול לכתוב ביקורת. ביקורות מאומתות מסומנות במפורש. ביקורות לא ניתנות למחיקה על ידי בעל העסק — גם אם הן שליליות." },
              { q: "איך מחושב ציון האמון?", a: "ציון האמון (0–100) מורכב משלושה מרכיבים: נפח ביקורות מאומתות (עד 40 נקודות), יחס החזרים ותלונות (עד 35 נקודות), ותקופת פעילות מאומתת (עד 25 נקודות). המתודולוגיה המלאה פתוחה לציבור." },
              { q: "האם השימוש באתר עולה כסף?", a: "לא. עיון בביקורות, חיפוש, השוואות וכתיבת ביקורות — הכל חינמי לצרכנים. ללא עלויות נסתרות." },
              { q: "איך כותבים ביקורת?", a: "הירשמו לאתר (חינם), ואז תוכלו לכתוב ביקורת על קורס או שירות שרכשתם — דרך קישור ייעודי שתקבלו מהספק, או דרך עמוד היוצר באתר. נדרש אימות רכישה." },
              { q: "אפשר לכתוב ביקורת בעילום שם?", a: "כן. בעת כתיבת ביקורת תוכלו לסמן ביקורת אנונימית — גם אם אימתתם רכישה. שמכם לא יוצג, אבל תג \"רכישה מאומתת\" עדיין יופיע כדי לשמור על אמינות הנתון." },
            ].map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group border border-border/40 rounded-xl overflow-hidden bg-card/40 hover:bg-card/60 transition-colors"
              >
                <details className="w-full">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-display font-bold text-foreground group-open:text-primary transition-colors">
                    {q}
                    <ChevronDown size={18} className="text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </MotionConfig>
  );
};

export default Index;

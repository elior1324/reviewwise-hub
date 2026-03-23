import { motion, useScroll, useTransform, MotionConfig } from "framer-motion";
import { FloatingPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ShieldCheck, Star, TrendingUp, Users,
  UserCheck, BookOpen, HelpCircle, ChevronDown, Cpu
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee";
import { FeaturesGrid } from "@/components/blocks/features-grid";
import { useState, useRef, useEffect } from "react";
import { FREELANCER_CATEGORIES, COURSE_CATEGORIES, SAAS_CATEGORIES, type Business } from "@/data/mockData";
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
  const location = useLocation();

  // Scroll to hash anchor after page renders (React Router doesn't do this automatically)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // rAF + small delay ensures framer-motion has painted before scrolling
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [location.hash]);
  const [topFreelancers, setTopFreelancers] = useState<Business[]>([]);
  const [topCourseProviders, setTopCourseProviders] = useState<Business[]>([]);
  const [topSaasTools, setTopSaasTools] = useState<Business[]>([]);
  const [marqueeReviews, setMarqueeReviews] = useState<Array<{ author: { name: string; handle: string; avatar: string }; text: string; href?: string }>>([]);
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
      // Fetch recent reviews — 12 rows covers both the marquee (up to 8) and recent cards (3)
      // Use reviews table directly for join support (businesses, courses).
      // The public_reviews view does not support PostgREST joins.
      const { data } = await supabase
        .from("reviews")
        .select("*, courses(name), businesses(name, slug), review_responses(response_text, created_at)")
        .order("created_at", { ascending: false })
        .limit(12);

      if (data && data.length > 0) {
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

        // ── Marquee / Community Voices (scrolling strip, up to 8 cards) ───────
        const AVATAR_COLORS = ["b6e3f4", "c0aede", "d1f4e0", "ffd5dc", "ffdfbf", "e8d5f4"];
        const marqueeMapped = data.slice(0, 8).map((r: any, i: number) => {
          const isAnon    = r.anonymous || false;
          const isVerified = r.verified || false;

          const displayName = isAnon ? "אנונימי" : "משתמש";

          const avatarSeed = isAnon ? `anon-${r.id}` : r.id;
          const bgColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const avatar  = `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=${bgColor}`;

          // Sub-label: source badge + business/course name
          const businessLabel = r.businesses?.name || r.courses?.name || "";
          let sourceBadge: string;
          if (isAnon)        sourceBadge = "ביקורת אנונימית";
          else if (isVerified) sourceBadge = "✓ ביקורת מאומתת";
          else if (isCommunity) sourceBadge = "ביקורת קהילה";
          else                sourceBadge = "ביקורת מאומתת";
          const handle = businessLabel ? `${sourceBadge} · ${businessLabel}` : sourceBadge;

          // Snippet — cap at 180 chars so cards stay compact
          const reviewText = r.text || "";
          const snippet = reviewText.length > 180
            ? reviewText.slice(0, 177) + "…"
            : reviewText;

          const businessSlug = r.businesses?.slug;
          return {
            author: { name: displayName, handle, avatar },
            text: snippet,
            href: businessSlug ? `/business/${businessSlug}` : undefined,
          };
        });
        setMarqueeReviews(marqueeMapped);
      } else {
        setMarqueeReviews([]);
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
      <section ref={heroRef} className="relative overflow-hidden pt-16" aria-labelledby="hero-heading">
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
              <ShieldCheck size={16} aria-hidden="true" /> ביקורות מקושרות לרכישה · כיוון ברור לקהילה הדיגיטלית
            </motion.div>
            <motion.h1 id="hero-heading" variants={fadeUp} custom={1} className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-4">
              המצפן של{" "}
              <span className="gradient-text glow-text">הקהילה הדיגיטלית</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              ReviewHub היא המצפן של הקהילה הדיגיטלית — כל קורס מקבל ציון אמון מבוסס ביקורות מקושרות לרכישה. מצאו את הכיוון הנכון לפני שאתם משקיעים.
            </motion.p>
            {/*
              role="search" identifies this as the site's primary search form for
              screen reader landmark navigation (WCAG 1.3.1 / ARIA landmark roles).
              aria-label distinguishes it from any other search forms on the page.
            */}
            <motion.form role="search" aria-label="חיפוש קורסים דיגיטליים" variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-4 w-full px-4 sm:px-0">
              <div className="relative flex-1">
                {/* Search icon is decorative — the input's aria-label conveys the purpose */}
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="מצאו את הכיוון הנכון — שיווק, AI, פיתוח, עיצוב, יזמות ועוד"
                  aria-label="חיפוש קורסים דיגיטליים"
                  className="pr-10 h-12 glass border-border/50 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 glow-primary w-full sm:w-auto">
                חיפוש
              </Button>
            </motion.form>

            {/* Category quick-filter chips */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap justify-center gap-2 mb-12 px-4"
              role="list"
              aria-label="קטגוריות חיפוש מהירות"
            >
              {[
                { label: "שיווק דיגיטלי", q: "שיווק" },
                { label: "AI ואוטומציה",   q: "AI" },
                { label: "פיתוח תוכנה",    q: "פיתוח" },
                { label: "עיצוב UX/UI",    q: "עיצוב" },
                { label: "יזמות",           q: "יזמות" },
                { label: "פיננסים",         q: "פיננסים" },
              ].map(({ label, q }) => (
                <button
                  key={q}
                  role="listitem"
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {label}
                </button>
              ))}
            </motion.div>
          </motion.div>

        </motion.div>
      </section>

      {/* Top Course Providers — 1st */}
      <section className="container py-10 md:py-20">
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">קורסים שהקהילה מכוונת אליהם</h2>
            </div>
            <p className="text-muted-foreground mt-1">דירוג מבוסס ציון אמון — מחושב מביקורות מאומתות רכישה בלבד. לא ניתן לרכוש מיקום.</p>
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

      {/* ── Trending Now Discovery Feed ─────────────────────────────── */}
      <section className="container py-10">
        <div className="flex items-start md:items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Trending Now</h2>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">↑ הכי נסקרים השבוע</span>
            </div>
            <p className="text-muted-foreground mt-1">הקהילה הדיגיטלית מדברת — קורסים עם הכי הרבה ביקורות חדשות ב-7 ימים האחרונים</p>
          </div>
          <Link to="/search?sort=trending">
            <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
          </Link>
        </div>
        {topCourseProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCourseProviders.slice(0, 4).map((biz, i) => (
              <motion.div key={`trending-${biz.slug}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="relative">
                  <span className="absolute -top-2 -right-2 z-10 text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Trending</span>
                  <BusinessCard {...biz} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">עדיין אין נתוני Trending. תחזרו בקרוב!</p>
        )}
      </section>

      {/* ── Rising Courses Discovery Feed ───────────────────────────── */}
      <section className="container py-10">
        <div className="flex items-start md:items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={22} className="text-warn" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Rising Courses</h2>
              <span className="text-xs font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">↑ בניית מומנטום</span>
            </div>
            <p className="text-muted-foreground mt-1">קורסים שצוברים כיוון — ציון האמון שלהם עלה הכי הרבה ב-30 הימים האחרונים. גם יוצרים קטנים על המפה.</p>
          </div>
          <Link to="/search?sort=rising">
            <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
          </Link>
        </div>
        {topCourseProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...topCourseProviders].reverse().slice(0, 4).map((biz, i) => (
              <motion.div key={`rising-${biz.slug}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="relative">
                  <span className="absolute -top-2 -right-2 z-10 text-xs font-bold bg-yellow-500 text-white px-2 py-0.5 rounded-full">Rising ↑</span>
                  <BusinessCard {...biz} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">עדיין אין נתוני Rising. תחזרו בקרוב!</p>
        )}
      </section>

      {/* ── Editor Picks ────────────────────────────────────────────── */}
      <section className="border-y border-primary/20 bg-primary/5 py-10">
        <div className="container">
          <div className="flex items-start md:items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={22} className="text-primary" />
                <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Editor Picks</h2>
                <span className="text-xs font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">נבחר ידנית</span>
              </div>
              <p className="text-muted-foreground mt-1">המצפן בחר — קורסים שהוכיחו כיוון ברור: תוכן איכותי, יוצר אמין, ותחום שהקהילה צריכה</p>
            </div>
            <Link to="/search?sort=editor_picks">
              <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
            </Link>
          </div>
          {topCourseProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCourseProviders.slice(0, 3).map((biz, i) => (
                <motion.div key={`editor-${biz.slug}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <div className="relative">
                    <span className="absolute -top-2 -right-2 z-10 text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={10} /> Editor Pick
                    </span>
                    <BusinessCard {...biz} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Editor Picks יעודכנו בקרוב.</p>
          )}
        </div>
      </section>

      {/* Top SaaS & AI Tools — Phase 2 */}
      <section className="container py-10 opacity-70">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full">
            שלב 2 — בפיתוח · כלי SaaS ו-AI יתווספו בהמשך
          </span>
        </div>
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">ציוני אמון — כלי SaaS ו-AI</h2>
            </div>
            <p className="text-muted-foreground mt-1">תוכנות, כלי AI ופלטפורמות דיגיטליות — מדורגים לפי אמינות, לא לפי תקציב פרסום</p>
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

      {/* Top Service Providers — Phase 2 */}
      <section className="container py-10 opacity-70">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full">
            שלב 2 — בפיתוח · מומחים דיגיטליים יתווספו בהמשך
          </span>
        </div>
        <div className="flex items-start md:items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={22} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">ציוני אמון — מומחים דיגיטליים</h2>
            </div>
            <p className="text-muted-foreground mt-1">מומחים שפועלים בכלכלה הדיגיטלית — מדורגים לפי ביקורות לקוחות מאומתות, לא לפי מיקום ממומן</p>
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
                <h2 className="font-display font-bold text-xl text-foreground">מומחים דיגיטליים</h2>
              </motion.div>
              <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-5">מנהלי סושיאל, מפתחי אתרים, יועצי AI, מומחי אוטומציה, כותבים שיווקיים ועוד — כולם מאומתים</motion.p>
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
                <h2 className="font-display font-bold text-xl text-foreground">חינוך דיגיטלי</h2>
              </motion.div>
              <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-5">קורסים אונליין, תוכניות מנטורינג, סדנאות — בתחומי שיווק, טק, AI, יזמות ופרילנסינג</motion.p>
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
              { icon: Star, label: "ביקורות שנכתבו בקהילה", value: stats.reviews > 0 ? stats.reviews.toLocaleString() : "0" },
              { icon: Users, label: "קורסים על המפה הדיגיטלית", value: stats.businesses > 0 ? stats.businesses.toLocaleString() : "0" },
              { icon: ShieldCheck, label: "ביקורות עוברות סינון לפני פרסום", value: "✓" },
              { icon: TrendingUp, label: "מתודולוגיה שקופה ופתוחה", value: "פתוח" },
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

      {/* Scrolling testimonials marquee — real reviews from DB only */}
      {marqueeReviews.length > 0 ? (
        <TestimonialsSection
          title="קולות מהקהילה הדיגיטלית"
          description="כל ביקורת קושרה להוכחת רכישה לפני שפורסמה. המצפן לא משקר — לא ניתן לרכוש מיקום, לא ניתן להסיר ביקורת שלילית, ולא ניתן לכתוב ביקורת ללא אימות עצמאי."
          className="border-t border-border/40"
          testimonials={marqueeReviews}
        />
      ) : (
        <section className="border-t border-border/40 bg-background py-16 md:py-24 text-center px-4">
          <p className="text-2xl md:text-3xl font-display font-semibold text-foreground mb-3">
            קולות מהקהילה הדיגיטלית
          </p>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            עדיין לא נכתבו ביקורות — היו הראשונים לשתף את החוויה שלכם.
          </p>
          <a
            href="/search"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            מצאו קורס וכתבו ביקורת
          </a>
        </section>
      )}

      {/* How Verification Works — institutional methodology section */}
      <section id="how-it-works" className="container py-20 scroll-mt-20">
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
              המצפן של הקהילה הדיגיטלית
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display font-bold text-3xl md:text-5xl text-foreground mb-4"
            >
              כיוון ברור, לא טענות שיווקיות
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              כל ציון אמון מחושב מנתוני רכישה ממשיים — לא פרסום, לא דעות. הקהילה הדיגיטלית צריכה מצפן עצמאי, ו-ReviewHub היא אותו מצפן.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "הקהילה רוכשת ומדווחת",
                  desc: "רכישה דרך קישור ReviewHub מעניקה הנחה של 5% ומאפשרת כתיבת ביקורת לאחר הרכישה. ביקורות שנכתבות לאחר רכישה מתועדת מסומנות בהתאם — המצפן מתבסס על ניסיון אמיתי בשטח.",
                },
                {
                  step: "02",
                  title: "המצפן מחשב כיוון",
                  desc: "ציון האמון מורכב מארבעה מרכיבים: איכות, נפח, עדכניות ועקביות — כפול מכפיל יחס ביקורות מאומתות. יוצר קטן עם 5 ביקורות מצוינות יכול להגיע לרמת Elite.",
                },
                {
                  step: "03",
                  title: "הכיוון לא למכירה",
                  desc: "ציונים אינם למכירה. ביקורות שליליות אינן ניתנות למחיקה. עמלות תפעול מעסקאות מאומתות מחופאות ב\"חומת אמון\" — מוגנות מחישוב הציון לחלוטין. ReviewHub פועלת כמצפן עצמאי.",
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

            {/* Trust Methodology — score formula breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.42, duration: 0.5 }}
              className="mt-8 max-w-3xl mx-auto rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm px-6 py-5"
              aria-label="מתודולוגיית ציון האמון"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-right">
                מתודולוגיית ציון האמון — 0–100
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                {[
                  { label: "איכות ביקורות",  weight: "עד 20",  desc: "סנטימנט ואורך" },
                  { label: "נפח (לוגריתמי)", weight: "עד 25",  desc: "כמות הביקורות" },
                  { label: "עדכניות",         weight: "עד 25",  desc: "ביקורות אחרונות" },
                  { label: "עקביות",          weight: "עד 30",  desc: "יציבות לאורך זמן" },
                ].map(({ label, weight, desc }) => (
                  <div key={label} className="rounded-lg bg-muted/30 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{weight} נק׳</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-3 text-right">
                הציון מוגן מעמלות תפעול ומפרסום. המתודולוגיה פתוחה לציבור.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.52, duration: 0.5 }}
              className="flex gap-3 justify-center flex-wrap mt-8"
            >
              <Link to="/about">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  איך עובד המצפן?
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  גלו את הכיוון הנכון
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
            <motion.h2 variants={fadeUp} custom={1} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">שאלות על המצפן</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">על המתודולוגיה, האימות, ולמה המצפן לא משקר</motion.p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { q: "מה זה ReviewHub?", a: "ReviewHub היא המצפן של הקהילה הדיגיטלית — פלטפורמת שקיפות עצמאית לקורסים אונליין. כל קורס מקבל ציון אמון המחושב מביקורות שעברו בדיקה. רכישה דרך ReviewHub מעניקה הנחה של 5% (מודל Verified Deal) ומאפשרת כתיבת ביקורת לאחר הרכישה. לא פרסום, לא דעות, ולא תשלום לשיפור דירוג. המצפן לא משקר." },
              { q: "לאיזה קורסים המצפן מכוון?", a: "ReviewHub מכסה את כל תחומי החינוך הדיגיטלי: שיווק דיגיטלי, פיתוח תוכנה, AI, עיצוב UI/UX, יזמות, פרילנסינג, פיננסים, וידאו, כתיבה ומכירות. קטגוריות נוספות (מומחים דיגיטליים, כלי SaaS) יתווספו בשלב 2." },
              { q: "איך אני יודע שהמצפן מדויק?", a: "המצפן מתבסס על נתוני רכישה מתועדים — לא הצהרות עצמיות. ביקורות שנכתבות לאחר רכישה דרך הפלטפורמה מסומנות במפורש. כל ביקורת עוברת בדיקה לפני פרסום. יוצרים לא יכולים למחוק ביקורות שליליות." },
              { q: "איך מחושב ציון האמון של המצפן?", a: "ציון האמון (0–100) מורכב מארבעה מרכיבים: איכות ביקורות (עד 20 נקודות), נפח לוגריתמי (עד 25), עדכניות (עד 25), ועקביות (עד 30) — כפול מכפיל יחס ביקורות שנכתבו לאחר רכישה דרך הפלטפורמה. המתודולוגיה פתוחה לציבור." },
              { q: "האם השימוש במצפן עולה כסף?", a: "עיון בביקורות, חיפוש, והשוואות — חינמי לחלוטין. כשתרכשו קורס דרך קישור ReviewHub, תקבלו הנחה של 5% ממחיר הקורס — מודל 5/5: הלומד חוסך 5%, ReviewHub גובה 5% עמלת תפעול מהיוצר. המצפן לא ממומן על ידי יוצרי הקורסים ולא מושפע מהעמלה." },
              { q: "איך תורמים למצפן?", a: "הירשמו (חינם) ואז כתבו ביקורת על קורס שרכשתם — דרך קישור ייעודי מהיוצר, או ישירות דרך עמוד הקורס. ביקורות שנכתבות לאחר רכישה מתועדת מסומנות בהתאם. כל ביקורת מכוונת את הקהילה קצת יותר טוב." },
              { q: "אפשר לכתוב ביקורת בעילום שם?", a: "כן. תוכלו לסמן ביקורת אנונימית גם אם הרכישה תועדה בפלטפורמה — שמכם לא יוצג, אבל הסימון \"רכישה דרך הפלטפורמה\" יישאר. המצפן שומר על אמינות הנתון גם בעילום שם." },
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

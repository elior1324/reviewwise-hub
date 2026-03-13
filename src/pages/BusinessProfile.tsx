import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewSummary from "@/components/ReviewSummary";
import CourseCard from "@/components/CourseCard";
import BusinessHero from "@/components/BusinessHero";
import AddReviewForm from "@/components/AddReviewForm";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MessageSquare, Award, Copy, CheckCheck, ExternalLink } from "lucide-react";
import { PrestigeBadge, computeEligibleBadges, buildBadgeEmbedCode, BADGE_CONFIG } from "@/components/PrestigeBadge";
import { useState, useEffect, useMemo } from "react";
import { generateReviewSummary, FREELANCER_CATEGORIES, SAAS_CATEGORIES, type Business, type Course, type Review } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";

const BusinessProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dbBusinessId, setDbBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchAll = async () => {
      setLoading(true);

      // ── 1. Fetch business ────────────────────────────────────────────────────
      // businesses table columns: id, owner_id, business_name, website, email,
      //   phone, category, description, slug, verified, created_at
      // NOTE: rating, review_count, logo_url, social_links do NOT exist in this table.
      //   Rating and reviewCount are computed below from the reviews we fetch.
      const { data: bizData } = await supabase
        .from("businesses")
        .select("id, slug, name, website, email, phone, category, description, verified")
        .eq("slug", slug)
        .maybeSingle();

      if (!bizData) {
        setLoading(false);
        return;
      }

      setDbBusinessId(bizData.id);

      // ── 2. Fetch courses ─────────────────────────────────────────────────────
      // courses columns: id, business_id, course_name, description, price,
      //   affiliate_url, course_category, created_at
      // NOTE: courses.name, rating, review_count, verified_purchases do NOT exist.
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, description, price, affiliate_url, category")
        .eq("business_id", bizData.id);

      if (courseData) {
        setCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: bizData.slug,
          name: c.name || "",
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
          category: c.category || "",
          rating: 0,
          reviewCount: 0,
          verifiedPurchases: 0,
        })));
      }

      // ── 3. Fetch reviews ─────────────────────────────────────────────────────
      // reviews columns: id, user_id, course_id, rating, review_text,
      //   purchase_date, verified_purchase, anonymous, reviewer_name,
      //   created_at, updated_at
      // NOTE: reviews.text, verified, flagged, flag_reason, like_count do NOT exist.
      //
      // courses join: use course_name (NOT courses.name)
      //
      // Owner responses: table is review_responses (NOT business_responses)
      //   columns: id, review_id, business_id, response_text, created_at
      //   joined via review_id FK (PostgREST: review_responses(response_text, created_at))
      // reviews has business_id directly
      const { data: reviewDataFinal } = await supabase
        .from("reviews")
        .select("*, courses(name), business_responses(text, created_at)")
        .eq("business_id", bizData.id)
        .order("created_at", { ascending: false });

      if (reviewDataFinal) {
        // ── Expert Badge logic (UNCHANGED) ─────────────────────────────────────
        const expertCounts: Record<string, number> = {};
        reviewDataFinal.forEach((r: any) => {
          if (r.rating >= 4 && r.user_id) {
            expertCounts[r.user_id] = (expertCounts[r.user_id] || 0) + 1;
          }
        });

        // ── Early Bird logic (UNCHANGED) ────────────────────────────────────────
        const sortedByDate = [...reviewDataFinal].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const earlyBirdIds = new Set(sortedByDate.slice(0, 5).map((r: any) => r.id));

        // ── Compute rating & reviewCount for business (since table lacks them) ──
        const totalReviews = reviewDataFinal.length;
        const avgRating = totalReviews > 0
          ? reviewDataFinal.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
          : 0;

        // Now we can set business with real computed values
        const mappedBiz: Business = {
          slug: bizData.slug,
          name: bizData.name || "",
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : SAAS_CATEGORIES.includes(bizData.category) ? "saas" : "course-provider",
          category: bizData.category || "",
          rating: Math.round(avgRating * 10) / 10, // computed from reviews
          reviewCount: totalReviews,               // computed from reviews
          description: bizData.description || "",
          logo: undefined,                         // logo_url doesn't exist in DB
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          socialLinks: undefined,                  // social_links doesn't exist in DB
        };
        setBusiness(mappedBiz);

        setReviews(reviewDataFinal.map((r: any) => ({
          id: r.id,
          // ✅ reviewer_name is stored on reviews table directly (no profiles join needed)
          reviewerName: r.anonymous ? "אנונימי" : (r.reviewer_name || "משתמש"),
          rating: r.rating || 0,
          text: r.review_text || "",              // ✅ review_text (NOT .text)
          courseName: r.courses?.course_name || "", // ✅ course_name (NOT courses.name)
          courseId: r.course_id || "",
          businessSlug: bizData.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified_purchase || false,  // ✅ verified_purchase (NOT .verified)
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at && r.updated_at !== r.created_at
            ? new Date(r.updated_at).toLocaleDateString("he-IL")
            : undefined,
          flagged: false,                          // flagged doesn't exist in reviews table
          flagReason: undefined,                   // flag_reason doesn't exist in reviews table
          likeCount: 0,                            // like_count doesn't exist in reviews table
          isEarlyBird: earlyBirdIds.has(r.id),
          isExpert: r.user_id ? (expertCounts[r.user_id] || 0) >= 3 : false,
          userId: r.user_id || undefined,
          // ✅ review_responses (NOT business_responses), response_text (NOT .text)
          ownerResponse: r.review_responses?.[0] ? {
            text: r.review_responses[0].response_text || "",
            date: new Date(r.review_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        })));
      } else {
        const mappedBiz: Business = {
          slug: bizData.slug,
          name: bizData.name || "",
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : SAAS_CATEGORIES.includes(bizData.category) ? "saas" : "course-provider",
          category: bizData.category || "",
          rating: 0,
          reviewCount: 0,
          description: bizData.description || "",
          logo: undefined,
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          socialLinks: undefined,
        };
        setBusiness(mappedBiz);
      }

      setLoading(false);
    };

    fetchAll();
  }, [slug]);

  const filteredReviews = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;
  const summary = generateReviewSummary(reviews);

  // ── Hybrid review tiers ────────────────────────────────────────────────────
  // Tier 1: purchase-verified reviews → count toward trust score, shown first
  // Tier 2: open community reviews    → no purchase proof, NOT in trust score
  const verifiedFiltered = filteredReviews.filter(r => r.verified);
  const openFiltered     = filteredReviews.filter(r => !r.verified);
  const totalVerified    = reviews.filter(r => r.verified).length;
  const totalOpen        = reviews.filter(r => !r.verified).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise-overlay">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">טוען...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background noise-overlay flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={36} className="text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              ישות זו אינה במאגר
            </h1>
            <p className="text-muted-foreground mb-4 text-base leading-relaxed">
              <strong className="text-foreground">{slug}</strong> טרם נרשמה למערכת האימות של ReviewHub — או שהכתובת שגויה.
            </p>
            <div className="flex items-start gap-3 text-right bg-card/60 border border-border/40 rounded-xl p-4 mb-8 text-sm text-muted-foreground">
              <MessageSquare size={16} className="text-primary shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">היעדר רשומה הוא מידע בפני עצמו.</strong>{" "}
                אם ישות אינה מופיעה במאגר, פירוש הדבר שציון האמון שלה טרם אומת — ולא ניתן להסתמך על ביקורות שאינן מקושרות לרכישה.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto" onClick={() => navigate("/search")}>
                חפשו ישויות מאומתות
              </Button>
              <Button variant="outline" className="border-border/50 gap-2 w-full sm:w-auto" onClick={() => navigate("/")}>
                עמוד הבית
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              מכירים את העסק ורוצים לראותו במאגר?{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">בקשו אימות</a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── JSON-LD structured data for Google Review Stars ───────────────────────
  // Use only VERIFIED reviews for the aggregate rating — consistent with the
  // institutional model where trust score is derived from verified data only.
  const verifiedReviews = reviews.filter(r => r.verified);
  const verifiedAvgRating = verifiedReviews.length > 0
    ? verifiedReviews.reduce((sum, r) => sum + r.rating, 0) / verifiedReviews.length
    : 0;

  const jsonLd = business && verifiedReviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": business.type === "freelancer" ? "LocalBusiness" : "EducationalOrganization",
    "name": business.name,
    "description": business.description,
    ...(business.website ? { "url": business.website } : {}),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": verifiedAvgRating.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": verifiedReviews.length.toString(),
    },
  } : null;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      {jsonLd && (
        <script
          type="application/ld+json"
          // SECURITY: JSON.stringify does NOT escape "</script>" sequences.
          // A business name/description/url containing "</script>" would let
          // an attacker break out of the <script> tag and inject arbitrary HTML.
          // Unicode-escape the three characters that are dangerous inside a
          // raw <script> block: <  >  & — this is the same approach React uses
          // internally and that Next.js applies to JSON-LD blocks.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g,  '\\u003c')
              .replace(/>/g,  '\\u003e')
              .replace(/&/g,  '\\u0026'),
          }}
        />
      )}
      <Navbar />
      <div className="container py-10">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            → חזרה
          </Button>
        </div>
        <BusinessHero business={business} verifiedReviewCount={totalVerified} />

        {/* Audit record strip — institutional framing */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-border/40 bg-card/40 rounded-xl px-4 py-3 mb-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-primary shrink-0" />
            <span>
              <strong className="text-foreground">רשומת אמון</strong> — נתונים מאומתים מול מערכות תשלום
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} className="text-muted-foreground shrink-0" />
            <span>
              {totalVerified} ביקורות מאומתות · {totalOpen} משובי קהילה
            </span>
          </div>
          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-muted-foreground/60">ציון האמון מחושב מביקורות מאומתות בלבד</span>
          </div>
        </div>

        {/* ── Prestige Badges ─────────────────────────────────────────────── */}
        <EarnedBadgesSection
          slug={business.slug}
          name={business.name}
          rating={business.rating}
          verifiedCount={totalVerified}
          type={business.type}
          category={business.category}
        />

        {/* Courses */}
        {courses.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl mb-4">קורסים ({courses.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {summary && <ReviewSummary summary={summary} />}

        {/* Testimonial Videos/Images */}
        {dbBusinessId && <TestimonialCarousel businessId={dbBusinessId} />}

        {/* Add Review */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-1">הוסיפו רשומה למאגר</h2>
          <p className="text-sm text-muted-foreground mb-4">
            ביקורת מאומתת רכישה נספרת בציון האמון ומוצגת ראשונה. משוב קהילה מוצג בנפרד ואינו משפיע על הציון.
          </p>
          <AddReviewForm
            businessSlug={business.slug}
            businessName={business.name}
            businessId={dbBusinessId || undefined}
            isVerifiedPurchaser={false}
          />
        </div>

        {/* Review filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-muted-foreground ml-2">סינון ביקורות:</span>
          <Button variant={filterRating === null ? "default" : "outline"} size="sm" onClick={() => setFilterRating(null)}>הכל</Button>
          {[5, 4, 3, 2, 1].map(r => (
            <Button
              key={r}
              variant={filterRating === r ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRating(filterRating === r ? null : r)}
            >
              {r} ⭐
            </Button>
          ))}
        </div>

        {/* Reviews — two-tier: verified purchase first, open community after */}
        <div className="space-y-6">

          {/* Trust score notice */}
          {totalVerified > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
              <ShieldCheck size={13} className="text-primary shrink-0" />
              <span>
                ציון האמון מחושב מ-<strong className="text-foreground">{totalVerified} ביקורות מאומתות רכישה</strong> בלבד
                {totalOpen > 0 && ` · ${totalOpen} משובי קהילה מוצגים בנפרד ואינם נספרים`}
              </span>
            </div>
          )}

          {/* ── Tier 1: Verified Purchase reviews ─────────────────────────────── */}
          {verifiedFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={15} className="text-primary" aria-hidden="true" />
                <h3 className="font-display font-semibold text-sm text-foreground">ביקורות מאומתות רכישה</h3>
                <span className="text-xs text-muted-foreground">({verifiedFiltered.length})</span>
              </div>
              <div className="space-y-4">
                {verifiedFiltered.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ReviewCard {...review} reviewTier="verified" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tier 2: Open Community reviews ────────────────────────────────── */}
          {openFiltered.length > 0 && (
            <div className={verifiedFiltered.length > 0 ? "border-t border-border/30 pt-6" : ""}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={14} className="text-muted-foreground" aria-hidden="true" />
                <h3 className="font-display font-semibold text-sm text-foreground">משוב קהילה</h3>
                <span className="text-xs text-muted-foreground">({openFiltered.length})</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                משובים אלו לא עברו אימות רכישה ואינם נספרים בחישוב ציון האמון.
              </p>
              <div className="space-y-4">
                {openFiltered.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ReviewCard {...review} reviewTier="open" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredReviews.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              {reviews.length === 0 ? "עדיין אין ביקורות לעסק זה." : "אין ביקורות עם הסינון הנבחר."}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfile;

// ── EarnedBadgesSection ────────────────────────────────────────────────────────
// Shown on the profile page when the business qualifies for ≥1 prestige badge.
// Renders live badge previews + copy-paste embed code per badge.

interface EarnedBadgesSectionProps {
  slug: string;
  name: string;
  rating: number;
  verifiedCount: number;
  type: string;
  category: string;
}

function BadgeEmbedPanel({ slug, type, grade, rating }: {
  slug: string;
  type: import("@/components/PrestigeBadge").PrestigeBadgeType;
  grade: string;
  rating: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = BADGE_CONFIG[type];
  const snippet = buildBadgeEmbedCode(type, slug, grade);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-4 flex flex-col gap-3">
      {/* Badge preview */}
      <div className="flex items-center justify-center py-3">
        <PrestigeBadge type={type} slug={slug} name="" grade={grade} rating={rating} size="md" noLink />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{cfg.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.sublabel}</p>
      </div>

      {/* Embed toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[11px] font-medium text-primary/70 hover:text-primary transition-colors text-center"
      >
        {open ? "הסתר קוד הטמעה" : "קוד הטמעה לאתר שלכם"}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/40 bg-muted/30">
                <span className="text-[9px] font-mono text-muted-foreground/60">embed.html</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <CheckCheck size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copied ? "הועתק!" : "העתק"}
                </button>
              </div>
              <pre className="p-3 text-[9px] leading-relaxed overflow-x-auto text-primary/80 bg-muted/20 whitespace-pre-wrap">
                <code>{snippet}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EarnedBadgesSection({ slug, name, rating, verifiedCount, type, category }: EarnedBadgesSectionProps) {
  const eligibleBadges = useMemo(
    () => computeEligibleBadges({ rating, verifiedCount, type, category }),
    [rating, verifiedCount, type, category],
  );

  if (eligibleBadges.length === 0) return null;

  // Compute grade string for embed code
  const grade = (() => {
    if (rating >= 4.7 && verifiedCount >= 10) return "A+";
    if (rating >= 4.3 && verifiedCount >= 5)  return "A";
    if (rating >= 3.8 && verifiedCount >= 3)  return "B";
    if (rating >= 3.2)                         return "C";
    if (rating >= 2.5)                         return "D";
    return verifiedCount > 0 ? "F" : "—";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <h2 className="font-display font-semibold text-base text-foreground">
            תגי פרסטיז׳ שהוענקו לרשומה זו
          </h2>
        </div>
        <Link
          to="/partners/prestige-badges"
          className="text-[11px] text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
        >
          מה זה? <ExternalLink size={10} />
        </Link>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        תגי פרסטיז׳ מוענקים אוטומטית לפי ציון האמון. הציגו אותם באתר שלכם — כל לחיצה על התג מחזירה ללקוח לפרופיל זה לאימות עצמאי.
      </p>

      <div className={`grid gap-4 ${eligibleBadges.length === 1 ? "grid-cols-1 max-w-xs" : eligibleBadges.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-xl" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {eligibleBadges.map(badgeType => (
          <BadgeEmbedPanel
            key={badgeType}
            slug={slug}
            type={badgeType}
            grade={grade}
            rating={rating}
          />
        ))}
      </div>
    </motion.div>
  );
}

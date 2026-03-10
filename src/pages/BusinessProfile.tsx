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
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { generateReviewSummary, FREELANCER_CATEGORIES, type Business, type Course, type Review } from "@/data/mockData";
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
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : "course-provider",
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
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : "course-provider",
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
      <div className="min-h-screen bg-background noise-overlay">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="font-display font-bold text-2xl mb-4">העסק לא נמצא</h1>
          <p className="text-muted-foreground mb-6">ייתכן שהכתובת שגויה או שהעסק עדיין לא רשום.</p>
          <Button onClick={() => navigate("/search")}>חזרו לחיפוש</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // ── JSON-LD structured data for Google Review Stars ───────────────────────
  // rating and reviewCount are now computed from real reviews above (not from
  // non-existent DB columns), so these values will never be "0" incorrectly.
  const jsonLd = business && business.reviewCount > 0 ? {
    "@context": "https://schema.org",
    "@type": business.type === "freelancer" ? "LocalBusiness" : "EducationalOrganization",
    "name": business.name,
    "description": business.description,
    ...(business.website ? { "url": business.website } : {}),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": business.rating.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": business.reviewCount.toString(),
    },
  } : null;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <BusinessHero business={business} />

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
          <h2 className="font-display font-bold text-xl mb-4">הוסיפו תגובה</h2>
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

        {/* Reviews */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ReviewCard {...review} />
              </motion.div>
            ))
          ) : (
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

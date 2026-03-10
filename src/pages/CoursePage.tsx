import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewSummary from "@/components/ReviewSummary";
import AddReviewForm from "@/components/AddReviewForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Users } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { generateReviewSummary, type Review } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";

interface CourseData {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;           // computed from reviews
  reviewCount: number;      // computed from reviews
  verifiedPurchases: number; // computed from reviews
  affiliateUrl: string;
  businessSlug: string;
  businessName: string;
  businessId: string;
}

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);

      // ── 1. Fetch course + business ───────────────────────────────────────────
      // courses columns: id, business_id, course_name, description, price,
      //   affiliate_url, course_category, created_at
      // businesses columns: id, slug, business_name (NOT .name, .rating, etc.)
      // NOTE: courses.name, rating, review_count, verified_purchases do NOT exist.
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, business_id, name, description, price, affiliate_url, businesses(slug, name)")
        .eq("id", courseId)
        .maybeSingle();

      if (!courseData) {
        setLoading(false);
        return;
      }

      // ── 2. Fetch reviews for this course ─────────────────────────────────────
      // reviews columns: id, user_id, course_id, rating, review_text,
      //   purchase_date, verified_purchase, anonymous, reviewer_name,
      //   created_at, updated_at
      // NOTE: .text, .verified, flagged, flag_reason, like_count do NOT exist.
      //
      // Owner responses: review_responses(response_text, created_at) via review_id FK
      // NOTE: business_responses does NOT exist.
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, business_responses(text, created_at)")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      // ── 3. Compute rating/reviewCount/verifiedPurchases from actual data ──────
      const totalReviews = reviewData?.length || 0;
      const avgRating = totalReviews > 0
        ? (reviewData || []).reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
        : 0;
      const verifiedCount = (reviewData || []).filter((r: any) => r.verified).length;

      setCourse({
        id: courseData.id,
        name: courseData.name || "",
        description: courseData.description || "",
        price: Number(courseData.price) || 0,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: totalReviews,
        verifiedPurchases: verifiedCount,
        affiliateUrl: courseData.affiliate_url || "",
        businessSlug: (courseData.businesses as any)?.slug || "",
        businessName: (courseData.businesses as any)?.name || "",
        businessId: courseData.business_id,
      });

      if (reviewData) {
        // ── Expert Badge logic (UNCHANGED) ─────────────────────────────────────
        const expertCounts: Record<string, number> = {};
        reviewData.forEach((r: any) => {
          if (r.rating >= 4 && r.user_id) {
            expertCounts[r.user_id] = (expertCounts[r.user_id] || 0) + 1;
          }
        });

        // ── Early Bird logic (UNCHANGED) ────────────────────────────────────────
        const sortedByDate = [...reviewData].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const earlyBirdIds = new Set(sortedByDate.slice(0, 5).map((r: any) => r.id));

        setReviews(reviewData.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : "משתמש",
          rating: r.rating || 0,
          text: r.text || "",
          courseName: courseData.name || "",
          courseId: r.course_id || "",
          businessSlug: (courseData.businesses as any)?.slug || "",
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified || false,
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at && r.updated_at !== r.created_at
            ? new Date(r.updated_at).toLocaleDateString("he-IL")
            : undefined,
          flagged: r.flagged || false,
          flagReason: r.flag_reason || undefined,
          likeCount: r.like_count || 0,
          isEarlyBird: earlyBirdIds.has(r.id),
          isExpert: r.user_id ? (expertCounts[r.user_id] || 0) >= 3 : false,
          userId: r.user_id || undefined,
          ownerResponse: r.business_responses?.[0] ? {
            text: r.business_responses[0].text || "",
            date: new Date(r.business_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        })));
      }

      setLoading(false);
    };

    fetchCourse();
  }, [courseId]);

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

  if (!course) {
    return (
      <div className="min-h-screen bg-background noise-overlay">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="font-display font-bold text-2xl">הקורס לא נמצא</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  const summary = generateReviewSummary(reviews);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            → חזרה
          </Button>
        </div>

        {/* Course header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">{course.name}</h1>
              {course.businessName && (
                <Link to={`/biz/${course.businessSlug}`} className="text-sm text-primary hover:underline mb-3 inline-block">
                  {course.businessName}
                </Link>
              )}
              {course.description && (
                <p className="text-muted-foreground text-sm mt-2 max-w-2xl">{course.description}</p>
              )}
            </div>
            <div className="text-right">
              {course.price > 0 && (
                <p className="font-display font-bold text-2xl text-foreground mb-2">₪{course.price.toLocaleString()}</p>
              )}
              {course.affiliateUrl && (
                <a href={course.affiliateUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    לדף הקורס <ExternalLink size={16} />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Course stats */}
          <div className="flex items-center gap-6 mt-4 flex-wrap">
            {course.rating > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={Number(course.rating)} size="sm" />
                <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span>
              </div>
            )}
            {course.reviewCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users size={14} />
                {course.reviewCount} ביקורות
              </div>
            )}
            {course.verifiedPurchases > 0 && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck size={12} />
                {course.verifiedPurchases} רכישות מאומתות
              </Badge>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {summary && <ReviewSummary summary={summary} />}

        {/* Add Review */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-4">כתבו ביקורת</h2>
          <AddReviewForm
            businessSlug={course.businessSlug}
            businessName={course.businessName}
            businessId={course.businessId}
            courseId={course.id}
            courseName={course.name}
            isVerifiedPurchaser={false}
          />
        </div>

        {/* Review filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-muted-foreground ml-2">סינון:</span>
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
              {reviews.length === 0 ? "עדיין אין ביקורות לקורס זה." : "אין ביקורות עם הסינון הנבחר."}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CoursePage;

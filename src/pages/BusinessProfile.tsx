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
import AIChatbot from "@/components/AIChatbot";
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

      // Fetch business
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!bizData) {
        setLoading(false);
        return;
      }

      setDbBusinessId(bizData.id);

      const mappedBiz: Business = {
        slug: bizData.slug,
        name: bizData.name,
        type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : "course-provider",
        category: bizData.category,
        rating: Number(bizData.rating) || 0,
        reviewCount: bizData.review_count || 0,
        description: bizData.description || "",
        logo: bizData.logo_url || undefined,
        website: bizData.website || undefined,
        email: bizData.email || undefined,
        phone: bizData.phone || undefined,
        socialLinks: bizData.social_links as any || undefined,
      };
      setBusiness(mappedBiz);

      // Fetch courses
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("business_id", bizData.id);

      if (courseData) {
        setCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: bizData.slug,
          name: c.name,
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
          category: c.category || "",
          rating: Number(c.rating) || 0,
          reviewCount: c.review_count || 0,
          verifiedPurchases: c.verified_purchases || 0,
        })));
      }

      // Fetch reviews with responses and profile names
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, courses(name), business_responses(text, created_at)")
        .eq("business_id", bizData.id)
        .order("created_at", { ascending: false });

      if (reviewData) {
        setReviews(reviewData.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : (r.profiles?.display_name || "משתמש"),
          rating: r.rating,
          text: r.text,
          courseName: r.courses?.name || "",
          courseId: r.course_id,
          businessSlug: bizData.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified || false,
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at !== r.created_at ? new Date(r.updated_at).toLocaleDateString("he-IL") : undefined,
          flagged: r.flagged || false,
          flagReason: r.flag_reason || undefined,
          ownerResponse: r.business_responses?.[0] ? {
            text: r.business_responses[0].text,
            date: new Date(r.business_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
        })));
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

  return (
    <div className="min-h-screen bg-background noise-overlay">
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
          <h2 className="font-display font-bold text-xl mb-4">הוסיפו ביקורת</h2>
          <AddReviewForm
            businessSlug={business.slug}
            businessName={business.name}
            isVerifiedPurchaser={false}
          />
        </div>

        {/* Review filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-muted-foreground ml-2">סינון ביקורות:</span>
          <Button variant={filterRating === null ? "default" : "outline"} size="sm" onClick={() => setFilterRating(null)}>הכל</Button>
          {[5, 4, 3, 2, 1].map(r => (
            <Button key={r} variant={filterRating === r ? "default" : "outline"} size="sm" onClick={() => setFilterRating(r)}>
              {r} ★
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard {...review} />
            </motion.div>
          ))}
        </div>
        {filteredReviews.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            {reviews.length === 0 ? "עדיין אין ביקורות לעסק זה." : "אין ביקורות התואמות לסינון שבחרתם. נסו לשנות את הפילטר."}
          </p>
        )}
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default BusinessProfile;

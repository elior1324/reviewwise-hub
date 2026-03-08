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
import { getBusinessBySlug, getCoursesByBusiness, getReviewsByBusiness, generateReviewSummary } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_KEY = "digital-marketing-academy";

const BusinessProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [dbBusinessId, setDbBusinessId] = useState<string | null>(null);

  const business = getBusinessBySlug(slug || "") || getBusinessBySlug(DEFAULT_KEY)!;
  const courses = getCoursesByBusiness(business.slug);
  const reviews = getReviewsByBusiness(business.slug);
  const filteredReviews = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;
  const summary = generateReviewSummary(reviews);

  // Fetch DB business ID by slug for testimonial media
  useEffect(() => {
    const fetchBusinessId = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", slug || business.slug)
        .maybeSingle();
      if (data) setDbBusinessId(data.id);
    };
    fetchBusinessId();
  }, [slug, business.slug]);

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
          <p className="text-center text-muted-foreground py-10">אין ביקורות התואמות לסינון שבחרתם. נסו לשנות את הפילטר.</p>
        )}
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default BusinessProfile;

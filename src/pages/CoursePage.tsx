import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewSummary from "@/components/ReviewSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Users } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import AIChatbot from "@/components/AIChatbot";
import { getCourseById, getReviewsByCourse, getBusinessBySlug, generateReviewSummary } from "@/data/mockData";

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const course = getCourseById(courseId || "");
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

  const business = getBusinessBySlug(course.businessSlug);
  const reviews = getReviewsByCourse(course.id);
  const filteredReviews = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;
  const summary = generateReviewSummary(reviews);

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 shadow-card mb-8 animated-border bg-card">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-3xl shrink-0">
              {course.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl md:text-3xl">{course.name}</h1>
                <Badge className="bg-trust-green-light text-trust-green border-0 gap-1">
                  <ShieldCheck size={14} /> מאומת
                </Badge>
              </div>
              {business && (
                <Link to={`/biz/${business.slug}`} className="text-sm text-primary hover:underline mb-2 inline-block">
                  {business.name}
                </Link>
              )}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={course.rating} size={20} showValue />
                <span className="text-muted-foreground text-sm">({course.reviewCount} ביקורות)</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-2xl">{course.description}</p>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="font-display font-bold text-2xl text-primary">₪{course.price.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users size={14} />
                  <span>{course.verifiedPurchases} רכישות מאומתות</span>
                </div>
                <Link to={`/go/${course.id}`} target="_blank">
                  <Button size="sm" className="bg-primary text-primary-foreground gap-2 glow-primary">
                    <ExternalLink size={14} /> לאתר הקורס
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {summary && <ReviewSummary summary={summary} />}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-muted-foreground ml-2">סינון:</span>
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
          <p className="text-center text-muted-foreground py-10">אין ביקורות התואמות לסינון זה.</p>
        )}
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default CoursePage;

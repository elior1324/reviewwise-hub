import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const MOCK_DATA: Record<string, { name: string; category: string; description: string; website: string; email: string; phone: string; rating: number; reviewCount: number }> = {
  "digital-marketing-academy": {
    name: "Digital Marketing Academy",
    category: "Marketing",
    description: "Israel's leading digital marketing education platform. We offer comprehensive courses on SEO, social media marketing, Google Ads, and content strategy. Our graduates work at top companies across Israel.",
    website: "https://dma.co.il",
    email: "info@dma.co.il",
    phone: "+972-3-1234567",
    rating: 4.8,
    reviewCount: 124,
  },
};

const REVIEWS = [
  { reviewerName: "Sarah L.", rating: 5, text: "Absolutely transformative course! The mentorship was outstanding and I landed a job within 2 months of completing the program.", courseName: "Digital Marketing Masterclass", date: "Feb 28, 2026", verified: true, anonymous: false },
  { reviewerName: "Anonymous", rating: 4, text: "Great content and practical exercises. Could use more advanced topics but overall a very solid course.", courseName: "SEO Fundamentals", date: "Feb 25, 2026", verified: true, anonymous: true },
  { reviewerName: "Moshe R.", rating: 5, text: "Best investment I've made in my career. The instructor is incredibly knowledgeable.", courseName: "Google Ads Certification", date: "Feb 20, 2026", verified: true, anonymous: false },
  { reviewerName: "Yael D.", rating: 3, text: "Good content but the pace was a bit too fast for beginners. Would recommend some prior knowledge.", courseName: "Advanced Analytics", date: "Feb 15, 2026", verified: true, anonymous: false },
];

const BusinessProfile = () => {
  const { slug } = useParams();
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const business = MOCK_DATA[slug || ""] || MOCK_DATA["digital-marketing-academy"];
  const filteredReviews = filterRating ? REVIEWS.filter(r => r.rating === filterRating) : REVIEWS;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 shadow-card mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-3xl shrink-0">
              {business.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display font-bold text-2xl md:text-3xl">{business.name}</h1>
                <Badge className="bg-trust-green-light text-trust-green border-0 gap-1">
                  <ShieldCheck size={14} /> Verified
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={business.rating} size={20} showValue />
                <span className="text-muted-foreground text-sm">Based on {business.reviewCount} reviews</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-2xl">{business.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Globe size={14} /> {business.website}</span>
                <span className="flex items-center gap-1"><Mail size={14} /> {business.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {business.phone}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rating filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-2">Filter:</span>
          <Button variant={filterRating === null ? "default" : "outline"} size="sm" onClick={() => setFilterRating(null)}>All</Button>
          {[5, 4, 3, 2, 1].map(r => (
            <Button key={r} variant={filterRating === r ? "default" : "outline"} size="sm" onClick={() => setFilterRating(r)}>
              {r} ★
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard {...review} />
            </motion.div>
          ))}
        </div>
        {filteredReviews.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No reviews matching this filter.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfile;

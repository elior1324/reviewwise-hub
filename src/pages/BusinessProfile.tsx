import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Globe, Mail, Phone } from "lucide-react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import AIChatbot from "@/components/AIChatbot";

const MOCK_DATA: Record<string, { name: string; category: string; description: string; website: string; email: string; phone: string; rating: number; reviewCount: number }> = {
  "digital-marketing-academy": {
    name: "אקדמיית שיווק דיגיטלי",
    category: "שיווק",
    description: "הפלטפורמה המובילה בישראל לחינוך שיווק דיגיטלי. אנו מציעים קורסים מקיפים ב-SEO, שיווק ברשתות חברתיות, Google Ads ואסטרטגיית תוכן. הבוגרים שלנו עובדים בחברות מובילות.",
    website: "https://dma.co.il",
    email: "info@dma.co.il",
    phone: "03-1234567",
    rating: 4.8,
    reviewCount: 124,
  },
};

const REVIEWS = [
  { reviewerName: "שרה ל.", rating: 5, text: "קורס מדהים! החניכה הייתה יוצאת מן הכלל ומצאתי עבודה תוך חודשיים.", courseName: "שיווק דיגיטלי מאסטרקלאס", date: "28 פבר׳ 2026", verified: true, anonymous: false },
  { reviewerName: "אנונימי", rating: 4, text: "תוכן מעולה ותרגילים מעשיים. יכול היה להיות יותר תוכן מתקדם.", courseName: "יסודות SEO", date: "25 פבר׳ 2026", verified: true, anonymous: true },
  { reviewerName: "משה ר.", rating: 5, text: "ההשקעה הטובה ביותר שעשיתי. המרצה מקצועי ברמה גבוהה.", courseName: "הסמכת Google Ads", date: "20 פבר׳ 2026", verified: true, anonymous: false },
  { reviewerName: "יעל ד.", rating: 3, text: "תוכן טוב אבל הקצב מהיר מדי למתחילים. מומלץ עם ידע מקדים.", courseName: "אנליטיקס מתקדם", date: "15 פבר׳ 2026", verified: true, anonymous: false },
];

const DEFAULT_KEY = "digital-marketing-academy";

const BusinessProfile = () => {
  const { slug } = useParams();
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const business = MOCK_DATA[slug || ""] || MOCK_DATA[DEFAULT_KEY];
  const filteredReviews = filterRating ? REVIEWS.filter(r => r.rating === filterRating) : REVIEWS;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 shadow-card mb-8 animated-border bg-card">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-3xl shrink-0">
              {business.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl md:text-3xl">{business.name}</h1>
                <Badge className="bg-trust-green-light text-trust-green border-0 gap-1">
                  <ShieldCheck size={14} /> מאומת
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={business.rating} size={20} showValue />
                <span className="text-muted-foreground text-sm">מבוסס על {business.reviewCount} ביקורות</span>
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
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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

export default BusinessProfile;

import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import ReviewResponse from "./ReviewResponse";
import ReportReviewDialog from "./ReportReviewDialog";
import { User, Clock, Pencil, ThumbsUp } from "lucide-react";
import { getTimeSincePurchase } from "@/data/mockData";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewCardProps {
  id?: string;
  reviewerName: string;
  rating: number;
  text: string;
  courseName: string;
  date: string;
  purchaseDate?: string;
  verified: boolean;
  anonymous: boolean;
  updatedAt?: string;
  likeCount?: number;
  ownerResponse?: {
    text: string;
    date: string;
  };
  flagged?: boolean;
  flagReason?: string;
}

const ReviewCard = ({ id, reviewerName, rating, text, courseName, date, purchaseDate, verified, anonymous, updatedAt, likeCount: initialLikeCount = 0, ownerResponse, flagged, flagReason }: ReviewCardProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(prev => prev + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    if (id) {
      const { error } = await supabase
        .rpc("increment_review_likes", { review_id: id });
      if (error) {
        setLiked(false);
        setLikeCount(prev => prev - 1);
        toast({ title: "שגיאה", description: "לא ניתן לעדכן לייק", variant: "destructive" });
      }
    }
  };

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className={`shadow-card hover:shadow-card-hover transition-all duration-500 animated-border bg-card ${flagged ? "border-destructive/30" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-foreground">
                  {anonymous ? "אנונימי" : reviewerName}
                </p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {verified && <VerifiedBadge />}
            </div>
          </div>
          <StarRating rating={rating} size={16} />

          {purchaseDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{getTimeSincePurchase(purchaseDate)}</span>
            </div>
          )}

          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{text}</p>
          <p className="mt-3 text-xs text-muted-foreground">קורס: {courseName}</p>

          {updatedAt && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Pencil size={10} />
              <span>עודכן: {updatedAt}</span>
            </div>
          )}

          {flagged && flagReason && (
            <div className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1 inline-block">
              ⚠️ {flagReason}
            </div>
          )}

          {ownerResponse && (
            <ReviewResponse text={ownerResponse.text} date={ownerResponse.date} />
          )}

          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={liked}
              className={`gap-1.5 text-xs transition-all ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <motion.div animate={animating ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.4 }}>
                <ThumbsUp size={14} className={liked ? "fill-primary" : ""} />
              </motion.div>
              <span>{likeCount > 0 ? likeCount : ""}</span>
              {!liked && likeCount === 0 && <span>מועיל</span>}
            </Button>
            <ReportReviewDialog reviewId={id || ""} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReviewCard;

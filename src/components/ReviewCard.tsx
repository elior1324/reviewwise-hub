import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import ReviewResponse from "./ReviewResponse";
import ReportReviewDialog from "./ReportReviewDialog";
import { User, Clock, Pencil, ThumbsUp, Zap, Shield } from "lucide-react";
import { getTimeSincePurchase } from "@/data/mockData";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  isEarlyBird?: boolean;
  isExpert?: boolean;
  ownerResponse?: {
    text: string;
    date: string;
  };
  flagged?: boolean;
  flagReason?: string;
  onLikeUpdate?: (newLikeCount: number) => void;
  onHelpfulReply?: () => void;
}

const ReviewCard = ({
  id,
  reviewerName,
  rating,
  text,
  courseName,
  date,
  purchaseDate,
  verified,
  anonymous,
  updatedAt,
  likeCount: initialLikeCount = 0,
  isEarlyBird = false,
  isExpert = false,
  ownerResponse,
  flagged,
  flagReason,
  onLikeUpdate,
  onHelpfulReply,
}: ReviewCardProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [helpfulMarked, setHelpfulMarked] = useState(false);
  const { toast } = useToast();

  const currentMultiplier = Math.max(1, Math.min(Math.floor(likeCount / 10) * 2, 10));
  const nextMultiplierAt = (Math.floor(likeCount / 10) + 1) * 10;
  const likesToNext = nextMultiplierAt - likeCount;

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    const newCount = likeCount + 1;
    setLikeCount(newCount);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    onLikeUpdate?.(newCount);

    if (id) {
      const { error } = await supabase.rpc("increment_review_likes", { review_id: id });
      if (error) {
        setLiked(false);
        setLikeCount(prev => prev - 1);
        toast({ title: "שגיאה", description: "לא ניתן לעדכן לייק", variant: "destructive" });
      }
    }
  };

  const handleHelpfulReply = () => {
    if (helpfulMarked) return;
    setHelpfulMarked(true);
    onHelpfulReply?.();
    toast({ title: "+20 נקודות!", description: "הביקורת שלכם זכתה בבונוס על תגובה מועילה." });
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
                <p className="font-display font-semibold text-sm text-foreground flex items-center gap-1.5">
                  {anonymous ? "אנונימי" : reviewerName}
                  {isExpert && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-accent/15 text-accent border-0 text-[10px] gap-0.5 px-1.5 py-0">
                          <Shield size={10} /> מומחה
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                        משתמש עם 3+ ביקורות מדורגות גבוה בקטגוריה זו. לייקים ממומחה שווים x2!
                      </TooltipContent>
                    </Tooltip>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEarlyBird && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="bg-accent/15 text-accent border-0 text-[10px] gap-0.5">
                      <Zap size={10} /> Early Bird
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    אחד מ-5 הביקורות הראשונות על העסק! בונוס 1.5x אוטומטי לנקודות.
                  </TooltipContent>
                </Tooltip>
              )}
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

          {/* Multiplier tooltip */}
          {likeCount > 0 && (
            <div className="mt-2">
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-[10px] text-primary/70 cursor-help border-b border-dashed border-primary/30">
                    מכפיל: {currentMultiplier}x {currentMultiplier < 10 && `• עוד ${likesToNext} לייקים ל-${Math.min(currentMultiplier + 2, 10)}x`}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[240px]">
                  <p className="font-semibold mb-1">איך המכפיל עובד?</p>
                  <p>כל 10 לייקים מכפילים את הנקודות ב-2x נוספים.</p>
                  <p className="mt-1">10 לייקים = 2x • 20 = 4x • 30 = 6x • עד 10x מקסימום</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {ownerResponse && (
            <div className="mt-3">
              <ReviewResponse text={ownerResponse.text} date={ownerResponse.date} />
              {!helpfulMarked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHelpfulReply}
                  className="mt-1.5 text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <ThumbsUp size={12} />
                  תגובה מועילה (+20 נק׳ לכותב)
                </Button>
              ) : (
                <span className="text-xs text-primary mt-1.5 inline-block">✓ סומן כמועיל</span>
              )}
            </div>
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

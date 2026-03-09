import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import ReviewResponse from "./ReviewResponse";
import ReportReviewDialog from "./ReportReviewDialog";
import { User, Clock, Pencil, ThumbsUp, Zap, Shield, Trash2, X, Check } from "lucide-react";
import { getTimeSincePurchase } from "@/data/mockData";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  userId?: string;
  ownerResponse?: {
    text: string;
    date: string;
  };
  flagged?: boolean;
  flagReason?: string;
  onLikeUpdate?: (newLikeCount: number) => void;
  onHelpfulReply?: () => void;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string, newText: string) => void;
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
  userId,
  ownerResponse,
  flagged,
  flagReason,
  onLikeUpdate,
  onHelpfulReply,
  onDelete,
  onEdit,
}: ReviewCardProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [helpfulMarked, setHelpfulMarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [displayText, setDisplayText] = useState(text);
  const [wasEdited, setWasEdited] = useState(!!updatedAt);
  const [editSaving, setEditSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isOwner = user && userId && user.id === userId;

  // Check if user already liked this review on mount
  useState(() => {
    if (user && id) {
      supabase
        .from("review_likes")
        .select("id")
        .eq("review_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setLiked(true);
        });
    }
  });

  const currentMultiplier = Math.max(1, Math.min(Math.floor(likeCount / 10) * 2, 10));
  const nextMultiplierAt = (Math.floor(likeCount / 10) + 1) * 10;
  const likesToNext = nextMultiplierAt - likeCount;

  const handleLike = async () => {
    if (!user) {
      toast({ title: "יש להתחבר", description: "התחברו כדי לסמן ביקורות כמועילות", variant: "destructive" });
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);

    if (liked) {
      // Unlike
      setLiked(false);
      const newCount = Math.max(likeCount - 1, 0);
      setLikeCount(newCount);
      onLikeUpdate?.(newCount);

      if (id) {
        const { error: deleteError } = await supabase
          .from("review_likes")
          .delete()
          .eq("review_id", id)
          .eq("user_id", user.id);

        if (deleteError) {
          setLiked(true);
          setLikeCount(prev => prev + 1);
          toast({ title: "שגיאה", description: "לא ניתן לבטל לייק", variant: "destructive" });
        } else {
          await supabase.rpc("decrement_review_likes", { review_id: id });
        }
      }
    } else {
      // Like
      setLiked(true);
      const newCount = likeCount + 1;
      setLikeCount(newCount);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
      onLikeUpdate?.(newCount);

      if (id) {
        const { error: insertError } = await supabase
          .from("review_likes")
          .insert({ review_id: id, user_id: user.id });

        if (insertError) {
          setLiked(false);
          setLikeCount(prev => prev - 1);
          toast({ title: "שגיאה", description: "לא ניתן לעדכן לייק", variant: "destructive" });
        } else {
          await supabase.rpc("increment_review_likes", { review_id: id });
        }
      }
    }
    setLikeLoading(false);
  };

  const handleHelpfulReply = () => {
    if (helpfulMarked) return;
    setHelpfulMarked(true);
    onHelpfulReply?.();
    toast({ title: "+20 נקודות!", description: "הביקורת שלכם זכתה בבונוס על תגובה מועילה." });
  };

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן למחוק את הביקורת", variant: "destructive" });
    } else {
      toast({ title: "הביקורת נמחקה" });
      onDelete?.(id);
    }
  };

  const handleEditSave = async () => {
    if (!id || editText.trim().length < 10) {
      toast({ title: "הביקורת קצרה מדי", description: "כתבו לפחות 10 תווים", variant: "destructive" });
      return;
    }
    setEditSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ text: editText, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את הביקורת", variant: "destructive" });
    } else {
      setDisplayText(editText);
      setWasEdited(true);
      setIsEditing(false);
      toast({ title: "הביקורת עודכנה ✓" });
      onEdit?.(id, editText);
    }
    setEditSaving(false);
  };

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className={`shadow-card hover:shadow-card-hover transition-all duration-500 animated-border bg-card ${flagged ? "border-destructive/30" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm text-foreground">
                {anonymous ? "אנונימי" : reviewerName}
              </p>
              <p className="text-xs text-muted-foreground">{date}</p>
              {/* Badges row — below name */}
              {(isExpert || isEarlyBird || verified) && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {verified && <VerifiedBadge />}
                  {isExpert && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-accent/15 text-accent border-0 text-[10px] gap-0.5 px-1.5 py-0.5">
                          <Shield size={10} /> מומחה
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                        משתמש עם 3+ ביקורות מדורגות גבוה בקטגוריה זו. לייקים ממומחה שווים x2!
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isEarlyBird && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-accent/15 text-accent border-0 text-[10px] gap-0.5 px-1.5 py-0.5">
                          <Zap size={10} /> Early Bird
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                        אחד מ-5 הביקורות הראשונות על העסק! בונוס 1.5x אוטומטי לנקודות.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
          <StarRating rating={rating} size={16} />

          {purchaseDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{getTimeSincePurchase(purchaseDate)}</span>
            </div>
          )}

          {/* Review text or edit mode */}
          {isEditing ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEditSave} disabled={editSaving} className="gap-1 text-xs">
                  <Check size={12} /> {editSaving ? "שומר..." : "שמירה"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(displayText); }} className="gap-1 text-xs">
                  <X size={12} /> ביטול
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{displayText}</p>
              {wasEdited && (
                <span className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-0.5">
                  <Pencil size={9} /> ערוכה
                </span>
              )}
            </>
          )}

          <p className="mt-3 text-xs text-muted-foreground">קורס: {courseName}</p>

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={likeLoading}
                className={`gap-1.5 text-xs transition-all ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                <motion.div animate={animating ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.4 }}>
                  <ThumbsUp size={14} className={liked ? "fill-primary" : ""} />
                </motion.div>
                <span>{likeCount > 0 ? likeCount : ""}</span>
                {!liked && likeCount === 0 && <span>מועיל</span>}
                {liked && <span className="text-[10px]">ביטול</span>}
              </Button>

              {/* Owner actions: edit & delete */}
              {isOwner && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={12} /> עריכה
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={12} /> מחיקה
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת ביקורת</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתם בטוחים שברצונכם למחוק את הביקורת? פעולה זו אינה ניתנת לביטול.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          מחיקה
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
            <ReportReviewDialog reviewId={id || ""} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReviewCard;

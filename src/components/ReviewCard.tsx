import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import ReviewResponse from "./ReviewResponse";
import ReportReviewDialog from "./ReportReviewDialog";
import ReviewProvenanceBadge, { type ReviewSource } from "./ReviewProvenanceBadge";
import { User, Clock, Pencil, ThumbsUp, Zap, Shield, Trash2, X, Check, Loader2, AlertTriangle, Eye, HelpCircle } from "lucide-react";
import { getTimeSincePurchase } from "@/data/mockData";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  /** True while a formal dispute is open and under investigation */
  isDisputed?: boolean;
  disputeStatus?: string | null;
  /** Set by admin after a complaint was resolved; review was kept on platform */
  challenged?: boolean;
  challengeUpheld?: boolean | null;
  onLikeUpdate?: (newLikeCount: number) => void;
  onHelpfulReply?: () => void;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string, newText: string) => void;
  /**
   * "verified" — purchase-verified review, counts toward trust score (default)
   * "open"     — community review, no purchase proof, NOT counted in trust score
   */
  reviewTier?: "verified" | "open";
  /**
   * Moderation status from the trust & compliance system:
   * "pending"      — awaiting initial moderation pass
   * "verified"     — cleared by AI + human review
   * "flagged"      — flagged by AI classifier, pending decision
   * "under_review" — formal investigation open
   * "removed"      — removed by compliance decision
   */
  moderationStatus?: "pending" | "verified" | "flagged" | "under_review" | "removed";
  /** AI decision reason shown to business owner in dashboard */
  aiDecisionReason?: string | null;
  /**
   * Provenance — how was this review verified?
   * Drives the ReviewProvenanceBadge shown below the reviewer name.
   * Falls back to deriving from `verified` and `reviewTier` if not provided.
   */
  reviewSource?: ReviewSource;
  /**
   * Active moderation case status for this review.
   * Shown as a small case-tracker chip to make trust handling transparent.
   */
  activeCaseStatus?: string | null;
  /** Whether the spam filter has flagged this review */
  isSpamFlagged?: boolean;
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
  isDisputed = false,
  disputeStatus = null,
  challenged = false,
  challengeUpheld = null,
  onLikeUpdate,
  onHelpfulReply,
  onDelete,
  onEdit,
  reviewTier = "verified",
  moderationStatus,
  aiDecisionReason,
  reviewSource,
  activeCaseStatus,
  isSpamFlagged = false,
}: ReviewCardProps) => {

  // Derive provenance source from existing fields if not explicitly provided
  const derivedSource: ReviewSource = reviewSource ?? (
    verified ? "verified_purchase" :
    reviewTier === "open" ? "community" :
    "email_verified"
  );
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
  const { user } = useAuth();

  const isOwner = user && userId && user.id === userId;

  // BUG FIX: was useState(() => {...}) — useState initializer runs once
  // synchronously and its return value is ignored; async work inside it
  // was fire-and-forget with no cleanup possible. useEffect is correct here.
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    supabase
      .from("review_likes")
      .select("id")
      .eq("review_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setLiked(true);
      });
    return () => { cancelled = true; };
  }, [user, id]);

  const handleLike = async () => {
    if (!user) {
      toast.error("יש להתחבר", { description: "התחברו כדי לסמן ביקורות כמועילות" });
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);

    if (liked) {
      // Unlike
      setLiked(false);
      const newCount = Math.max(Number(likeCount) - 1, 0);
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
          setLikeCount(prev =>Number( prev) + 1);
          toast.error("לא ניתן לבטל לייק");
        } else {
          await supabase.rpc("decrement_review_likes", { review_id: id });
        }
      }
    } else {
      // Like
      setLiked(true);
      const newCount =Number( likeCount) + 1;
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
          setLikeCount((prev) => Math.max(Number(prev) - 1, 0));          toast.error("לא ניתן לעדכן לייק");
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
  };

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("לא ניתן למחוק את הביקורת");
    } else {
      toast.success("הביקורת נמחקה");
      onDelete?.(id);
    }
  };

  const handleEditSave = async () => {
    if (!id || editText.trim().length < 10) {
      toast.error("הביקורת קצרה מדי", { description: "כתבו לפחות 10 תווים" });
      return;
    }
    setEditSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ text: editText, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("לא ניתן לעדכן את הביקורת");
    } else {
      setDisplayText(editText);
      setWasEdited(true);
      setIsEditing(false);
      toast.success("הביקורת עודכנה ✓");
      onEdit?.(id, editText);
    }
    setEditSaving(false);
  };

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className={`shadow-card hover:shadow-card-hover transition-all duration-500 animated-border bg-card relative ${reviewTier === "open" ? "opacity-90 bg-card/70" : ""} ${flagged ? "border-destructive/30" : ""} ${isDisputed ? "border-amber-500/40" : ""}`}>
        {/* ── Disputed overlay — blurs content while under investigation ── */}
        {isDisputed && (
          <div className="absolute inset-0 z-10 rounded-[inherit] overflow-hidden flex flex-col items-center justify-center gap-2 backdrop-blur-sm bg-background/60 border border-amber-500/30">
            <div className="bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1.5 flex items-center gap-2">
              <Shield size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ביקורת זו נמצאת בחקירה
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center max-w-[220px] leading-snug">
              {disputeStatus === "evidence_submitted"
                ? "הראיה התקבלה — Admin בוחן את המסמך"
                : "ממתין לתגובת הכותב — עד 72 שעות"}
            </p>
          </div>
        )}
        <CardContent className={`p-3 ${isDisputed ? "blur-[2px] pointer-events-none select-none" : ""}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-display font-semibold text-xs text-primary select-none">
              {anonymous ? <User size={12} className="text-primary/60" /> : reviewerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                <p className="font-display font-semibold text-xs text-foreground truncate">
                  {anonymous ? "אנונימי" : reviewerName}
                </p>
                {isExpert && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-accent/15 text-accent border-0 text-[9px] gap-0.5 px-1 py-0">
                        <Shield size={9} /> מומחה
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
                      <Badge className="bg-accent/15 text-accent border-0 text-[9px] gap-0.5 px-1 py-0">
                        <Zap size={9} /> Early Bird
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                      אחד מ-5 הביקורות הראשונות על העסק! +5 נקודות בונוס.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{date}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <StarRating rating={rating} size={13} />
            <ReviewProvenanceBadge source={derivedSource} />
            {activeCaseStatus && activeCaseStatus !== "closed_no_action" && activeCaseStatus !== "decision_issued" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-1.5 py-0.5 cursor-help">
                    <Eye size={8} /> ציות
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  ביקורת זו נמצאת תחת בחינת ציות על ידי צוות ReviewHub.
                </TooltipContent>
              </Tooltip>
            )}
            {isSpamFlagged && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-0.5 text-[9px] font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-1.5 py-0.5 cursor-help">
                    <AlertTriangle size={8} /> נבדקת
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  מסנן האיכות זיהה תבניות חשודות בביקורת זו.
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {purchaseDate && (
            <div className="flex items-center gap-1 mb-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              <span>{getTimeSincePurchase(purchaseDate)}</span>
            </div>
          )}

          {/* Review text or edit mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEditSave} disabled={editSaving} className="gap-1 text-xs h-7">
                  {editSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  {editSaving ? "שומר..." : "שמירה"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(displayText); }} className="gap-1 text-xs h-7">
                  <X size={11} /> ביטול
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-xs text-foreground/80 leading-relaxed line-clamp-4">{displayText}</p>
              {wasEdited && (
                <span className="text-[9px] text-muted-foreground mt-0.5 inline-flex items-center gap-0.5">
                  <Pencil size={8} /> ערוכה
                </span>
              )}
            </>
          )}

          {courseName && (
            <p className="mt-1.5 text-[10px] text-muted-foreground truncate">קורס: {courseName}</p>
          )}

          {flagged && flagReason && (
            <div className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1 inline-block">
              ⚠️ {flagReason}
            </div>
          )}

          {/* ── Moderation Status Badge ──────────────────────────────────── */}
          {moderationStatus && moderationStatus !== "verified" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2.5 py-1 cursor-help border ${
                  moderationStatus === "pending"
                    ? "bg-muted/60 text-muted-foreground border-border/40"
                    : moderationStatus === "flagged"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : moderationStatus === "under_review"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    : moderationStatus === "removed"
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : ""
                }`}>
                  {moderationStatus === "pending" && <><HelpCircle size={10} /> ממתין לאימות</>}
                  {moderationStatus === "flagged" && <><AlertTriangle size={10} /> מסומן לבדיקה</>}
                  {moderationStatus === "under_review" && <><Eye size={10} /> בחקירה</>}
                  {moderationStatus === "removed" && <><X size={10} /> הוסרה</>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[280px] leading-snug">
                {moderationStatus === "pending" && (
                  <p>ביקורת זו ממתינה לעיבור מערכת האימות האוטומטית.</p>
                )}
                {moderationStatus === "flagged" && (
                  <>
                    <p className="font-semibold mb-1">ביקורת זו מסומנת לבדיקה</p>
                    <p>{aiDecisionReason || "מסיבות ציות הביקורת נמצאת בבחינה."}</p>
                  </>
                )}
                {moderationStatus === "under_review" && (
                  <>
                    <p className="font-semibold mb-1">חקירה פתוחה</p>
                    <p>{aiDecisionReason || "צוות ReviewHub בוחן ביקורת זו. תגיע הכרעה תוך 72 שעות."}</p>
                  </>
                )}
                {moderationStatus === "removed" && (
                  <>
                    <p className="font-semibold mb-1">ביקורת הוסרה</p>
                    <p>{aiDecisionReason || "ביקורת זו הוסרה לאחר בחינת ציות."}</p>
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          )}

          {/* ── Public Transparency Log Badge ────────────────────────────── */}
          {/* Shown when an admin resolved a defamation complaint about this review */}
          {challenged && challengeUpheld === true && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-primary bg-primary/8 border border-primary/20 rounded-full px-2.5 py-1 cursor-help">
                  <Shield size={10} className="shrink-0" />
                  בוקרה ואושרה — יומן שקיפות
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[280px] leading-snug">
                <p className="font-semibold mb-1">ביקורת זו עמדה בפיקוח</p>
                <p>
                  בוצעה תלונה משפטית על ביקורת זו. ReviewHub בחנה אותה בתום לב
                  בהתאם להליך ה-Notice &amp; Takedown שלה ואישרה כי הביקורת
                  עומדת בתנאי הפלטפורמה.
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {ownerResponse && (
            <div className="mt-2">
              <ReviewResponse text={ownerResponse.text} date={ownerResponse.date} />
              {!helpfulMarked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHelpfulReply}
                  className="mt-1.5 text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <ThumbsUp size={12} />
                  תגובה מועילה
                </Button>
              ) : (
                <span className="text-xs text-primary mt-1.5 inline-block">✓ סומן כמועיל</span>
              )}
            </div>
          )}

          {/* Open-tier notice */}
          {reviewTier === "open" && (
            <p className="mt-2 text-[10px] text-muted-foreground/50 leading-snug border-t border-border/30 pt-1.5">
              משוב זה לא עבר אימות רכישה — אינו נספר בחישוב ציון האמון.
            </p>
          )}

          {/* Safe Harbor disclaimer */}
          <p className="mt-1 text-[9px] text-muted-foreground/45 leading-snug">
            דעת הכותב בלבד · ReviewHub אינה מאמתת עובדות
          </p>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                aria-label={liked ? "ביטול מועיל" : "מועיל"}
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
            <div className="flex items-center gap-2">
              <ReportReviewDialog reviewId={id || ""} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReviewCard;

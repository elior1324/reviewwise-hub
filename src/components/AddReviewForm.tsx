import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, PenLine, LogIn, ShieldCheck, ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReceiptUploader from "@/components/ReceiptUploader";

interface AddReviewFormProps {
  businessSlug: string;
  businessName: string;
  businessId?: string;
  courseId?: string;
  isVerifiedPurchaser?: boolean;
}

const AddReviewForm = ({ businessSlug, businessName, businessId, courseId, isVerifiedPurchaser = false }: AddReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receiptVerified, setReceiptVerified] = useState(isVerifiedPurchaser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "אנא בחרו דירוג", variant: "destructive" });
      return;
    }
    if (reviewText.trim().length < 10) {
      toast({ title: "הביקורת קצרה מדי", description: "כתבו לפחות 10 תווים", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Simulate submission — in production this saves to DB
    await new Promise(r => setTimeout(r, 800));
    
    toast({
      title: "הביקורת נשלחה בהצלחה! ✨",
      description: isVerifiedPurchaser
        ? "הביקורת שלכם תפורסם כביקורת רכישה מאומתת."
        : "הביקורת שלכם תפורסם ללא תג רכישה מאומתת.",
    });

    setRating(0);
    setReviewText("");
    setIsOpen(false);
    setSubmitting(false);
  };

  // Not logged in — show login CTA
  if (!user) {
    return (
      <Card className="shadow-card bg-card/50 border-dashed border-border/60">
        <CardContent className="p-6 text-center">
          <LogIn size={24} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-display font-semibold text-foreground mb-1">רוצים להשאיר ביקורת?</p>
          <p className="text-sm text-muted-foreground mb-4">התחברו כדי לשתף את החוויה שלכם עם {businessName}</p>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              <LogIn size={14} className="ml-2" />
              התחברו כדי להגיב
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Logged in — show toggle button or form
  return (
    <div>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          size="lg"
        >
          <PenLine size={16} className="ml-2" />
          הוסיפו ביקורת
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-card animated-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">כתבו ביקורת על {businessName}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-muted-foreground">
                    ביטול
                  </Button>
                </div>
                {/* Verification status */}
                <div className={`flex items-center gap-2 text-xs font-medium mt-2 px-3 py-1.5 rounded-lg w-fit ${
                  isVerifiedPurchaser
                    ? "bg-trust-green-light text-trust-green"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isVerifiedPurchaser ? (
                    <>
                      <ShieldCheck size={14} />
                      רכישה מאומתת — הביקורת תסומן כמאומתת
                    </>
                  ) : (
                    <>
                      <ShieldX size={14} />
                      ביקורת ללא אימות רכישה
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star rating */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">הדירוג שלכם</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i)}
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              i <= (hoverRating || rating)
                                ? "fill-star text-star"
                                : "fill-star-empty text-star-empty"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review text */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">הביקורת שלכם</p>
                    <Textarea
                      placeholder="שתפו את החוויה שלכם..."
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      rows={4}
                      className="glass border-border/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-left">{reviewText.length} תווים</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                  >
                    {submitting ? "שולח..." : "פרסום ביקורת"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AddReviewForm;

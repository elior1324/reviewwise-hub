import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, PenLine, LogIn, ShieldCheck, ShieldX, Plus, HelpCircle, Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import TurnstileWidget from "@/components/TurnstileWidget";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeText } from "@/lib/sanitize";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddReviewFormProps {
  businessSlug: string;
  businessName: string;
  businessId?: string;
  courseId?: string;
  isVerifiedPurchaser?: boolean;
}

const SUBJECT_MAX_LENGTH = 60;
const REVIEW_MAX_LENGTH  = 2000;
const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.csv";
const MAX_FILE_SIZE_MB = 10;

const DURATION_OPTIONS = [
  { value: "3_months_plus", label: "3 חודשים+" },
  { value: "half_year_plus", label: "חצי שנה+" },
  { value: "one_year_plus", label: "שנה+" },
  { value: "two_years_plus", label: "שנתיים+" },
];

const RequiredMark = () => <span className="text-destructive mr-0.5">*</span>;

const AddReviewForm = ({ businessSlug, businessName, businessId, courseId, isVerifiedPurchaser = false }: AddReviewFormProps) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receiptVerified, setReceiptVerified] = useState(isVerifiedPurchaser);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`הקובץ ${file.name} גדול מדי (מקסימום ${MAX_FILE_SIZE_MB}MB)`);
        continue;
      }
      newFiles.push(file);
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setShowFileDialog(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("אנא בחרו דירוג");
      return;
    }
    if (!subject.trim()) {
      toast.error("אנא מלאו את נושא התגובה");
      return;
    }
    if (reviewText.trim().length < 10) {
      toast.error("הביקורת קצרה מדי", { description: "כתבו לפחות 10 תווים" });
      return;
    }
    if (!duration) {
      toast.error("אנא בחרו משך זמן בהכשרה");
      return;
    }
    if (!turnstileToken) {
      toast.error("אנא אמתו שאתם לא רובוט");
      return;
    }

    // Sanitize user-supplied text before it reaches the database
    const cleanSubject    = sanitizeText(subject, SUBJECT_MAX_LENGTH);
    const cleanReviewText = sanitizeText(reviewText, REVIEW_MAX_LENGTH);

    setSubmitting(true);

    try {
      // Upload files if any
      let uploadedFilePaths: string[] = [];
      if (uploadedFiles.length > 0 && user) {
        setUploading(true);
        for (const file of uploadedFiles) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
          const filePath = `receipts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(filePath, file);

          if (uploadError) {
            toast.error("שגיאה בהעלאת קובץ", { description: uploadError.message });
          } else {
            uploadedFilePaths.push(filePath);

            // Save receipt record for verification
            if (businessId) {
              await supabase.from("customer_receipts").insert({
                user_id: user.id,
                business_id: businessId,
                course_id: courseId || null,
                file_path: filePath,
                file_type: ext === "pdf" ? "pdf" : ext === "csv" ? "pdf" : "image",
              });
            }
          }
        }
        setUploading(false);

        // Trigger verification if files were uploaded
        if (uploadedFilePaths.length > 0 && businessId) {
          try {
            const { data: result } = await supabase.functions.invoke("verify-invoice", {
              body: {
                action: "verify_receipt",
                receiptId: null,
                businessId,
                filePath: uploadedFilePaths[0],
              },
            });
            if (result?.verified) {
              setReceiptVerified(true);
            }
          } catch {
            // Verification failed silently, continue without verification
          }
        }
      }

      // Submit review (simulated — in production save to DB with subject & duration)
      await new Promise(r => setTimeout(r, 800));

      toast.success("הביקורת נשלחה בהצלחה! ✨", {
        description: receiptVerified
          ? "הביקורת שלכם תפורסם כביקורת רכישה מאומתת."
          : "הביקורת שלכם תפורסם ללא תג רכישה מאומתת.",
      });

      // Reset form
      setRating(0);
      setSubject("");
      setReviewText("");
      setDuration("");
      setUploadedFiles([]);
      setIsOpen(false);
    } catch {
      toast.error("אירעה שגיאה בשליחת הביקורת");
    }

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
              הירשמו או התחברו
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
          הוספת תגובה
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
                  receiptVerified
                    ? "bg-trust-green-light text-trust-green"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {receiptVerified ? (
                    <>
                      <ShieldCheck size={14} />
                      רכישה מאומתת — הביקורת תסומן כמאומתת
                    </>
                  ) : (
                    <>
                      <ShieldX size={14} />
                      ביקורת ללא אימות רכישה — העלו קבלה לאימות
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Star rating */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      הדירוג שלכם <RequiredMark />
                    </p>
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

                  {/* Subject */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      נושא התגובה <RequiredMark />
                    </p>
                    <Input
                      placeholder="לדוגמה: חוויית למידה מעולה"
                      value={subject}
                      onChange={e => {
                        if (e.target.value.length <= SUBJECT_MAX_LENGTH) {
                          setSubject(e.target.value);
                        }
                      }}
                      maxLength={SUBJECT_MAX_LENGTH}
                      className="glass border-border/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-left">
                      {subject.length}/{SUBJECT_MAX_LENGTH}
                    </p>
                  </div>

                  {/* Review text (detail) */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      פירוט התגובה <RequiredMark />
                    </p>
                    <Textarea
                      placeholder="שתפו את החוויה שלכם בהרחבה..."
                      value={reviewText}
                      onChange={e => {
                        if (e.target.value.length <= REVIEW_MAX_LENGTH) {
                          setReviewText(e.target.value);
                        }
                      }}
                      maxLength={REVIEW_MAX_LENGTH}
                      rows={4}
                      className="glass border-border/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-left">
                      {reviewText.length}/{REVIEW_MAX_LENGTH} תווים
                    </p>
                  </div>

                  {/* Training duration */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      כמה זמן נמצאתם בהכשרה / קורס / סדנה? <RequiredMark />
                    </p>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="glass border-border/50">
                        <SelectValue placeholder="בחרו משך זמן" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* File upload section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground">צירוף קובץ רכישה</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle size={15} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[250px]">
                          <p>העלו קבלה, חשבונית או הוכחת רכישה של הקורס/הכשרה. זה יעזור לאמת את הביקורת שלכם ולקבל תג "רכישה מאומתת".</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-muted-foreground">(אופציונלי)</span>
                    </div>

                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {uploadedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2 text-sm">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon size={14} className="text-muted-foreground shrink-0" />
                            ) : (
                              <FileText size={14} className="text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate flex-1 text-foreground/80">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFile(i)}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add file button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFileDialog(true)}
                      className="gap-1.5 text-xs border-dashed"
                    >
                      <Plus size={14} />
                      הוספת קובץ
                    </Button>

                    {/* File upload dialog */}
                    <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>העלאת קובץ</DialogTitle>
                          <DialogDescription>
                            בחרו קובץ מהמכשיר שלכם — PDF, תמונה, CSV ועוד
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <input
                            ref={fileRef}
                            type="file"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            id="review-file-upload"
                          />
                          <label
                            htmlFor="review-file-upload"
                            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
                          >
                            <Upload size={28} className="text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">לחצו לבחירת קבצים</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, JPG, PNG, CSV — עד {MAX_FILE_SIZE_MB}MB לקובץ
                              </p>
                            </div>
                          </label>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <FormPrivacyNotice className="mt-1" />

                  <TurnstileWidget
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setTurnstileToken(null)}
                    className="flex justify-center mt-2"
                  />

                  <Button
                    type="submit"
                    disabled={submitting || uploading || !turnstileToken}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
                  >
                    {(submitting || uploading) && <Loader2 size={16} className="animate-spin" />}
                    {uploading ? "מעלה קבצים..." : submitting ? "שולח..." : "פרסום ביקורת"}
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

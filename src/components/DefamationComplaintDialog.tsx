/**
 * DefamationComplaintDialog — Formal Legal Complaint Portal
 *
 * Allows any party (registered user or external complainant) to file a
 * structured legal complaint about a specific review.
 *
 * Maps to: defamation_complaints table
 *
 * Notice & Takedown workflow:
 *   1. Complainant fills this form → row inserted in defamation_complaints
 *   2. Admin reviews within 72 h → reviewer notified → 7-day response window
 *   3. Admin decides: uphold / edit / remove → status updated
 *   4. Result logged to review_public_log for public transparency
 *
 * The platform's good-faith operation of this workflow is the foundation of
 * its Safe Harbor defense under חוק איסור לשון הרע, סעיף 15.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gavel, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DefamationComplaintDialogProps {
  reviewId: string;
  /** Optional trigger element override */
  trigger?: React.ReactNode;
}

const COMPLAINT_TYPES = [
  {
    value: "defamation",
    label: "לשון הרע",
    description: "הצהרה כוזבת ומזיקה — חוק איסור לשון הרע התשכ\"ה-1965",
  },
  {
    value: "false_facts",
    label: "עובדות כוזבות",
    description: "עובדות שגויות המוצגות כאמת",
  },
  {
    value: "privacy_violation",
    label: "פגיעה בפרטיות",
    description: "חשיפת מידע אישי ללא הסכמה — חוק הגנת הפרטיות התשמ\"א-1981",
  },
  {
    value: "confidentiality_breach",
    label: "הפרת סודיות מסחרית",
    description: "גילוי סודות עסקיים — חוק עוולות מסחריות התשנ\"ט-1999",
  },
  {
    value: "ip_violation",
    label: "הפרת קניין רוחני",
    description: "שימוש ללא הרשאה בתוכן מוגן זכויות יוצרים",
  },
  {
    value: "conflict_of_interest",
    label: "ניגוד עניינים — מתחרה",
    description: "ביקורת שנכתבה על-ידי מתחרה עסקי לשם פגיעה",
  },
] as const;

type ComplaintType = (typeof COMPLAINT_TYPES)[number]["value"];

const STEPS = ["סוג התלונה", "פרטים", "אישור ושליחה"] as const;

const DefamationComplaintDialog = ({ reviewId, trigger }: DefamationComplaintDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [complaintType, setComplaintType] = useState<ComplaintType | "">("");
  const [complainantName, setComplainantName] = useState(user?.email?.split("@")[0] ?? "");
  const [complainantEmail, setComplainantEmail] = useState(user?.email ?? "");
  const [description, setDescription] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  const reset = () => {
    setStep(0);
    setSubmitted(false);
    setComplaintType("");
    setComplainantName(user?.email?.split("@")[0] ?? "");
    setComplainantEmail(user?.email ?? "");
    setDescription("");
    setEvidenceNote("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    setOpen(isOpen);
  };

  const handleSubmit = async () => {
    if (!complaintType || !complainantName.trim() || !complainantEmail.trim() || description.trim().length < 20) return;

    setSubmitting(true);
    try {
      const evidenceUrls = evidenceNote.trim()
        ? [evidenceNote.trim()]
        : undefined;

      const { error } = await supabase.from("defamation_complaints").insert({
        review_id:         reviewId,
        complainant_id:    user?.id ?? null,
        complainant_name:  complainantName.trim(),
        complainant_email: complainantEmail.trim(),
        complaint_type:    complaintType,
        description:       description.trim(),
        evidence_urls:     evidenceUrls,
      } as any);

      if (error) throw error;

      setSubmitted(true);
    } catch (err: any) {
      console.error("[DefamationComplaintDialog] submit error:", err);
      toast.error("לא ניתן לשלוח את התלונה", { description: "נסו שוב מאוחר יותר." });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep0 = !!complaintType;
  const canProceedStep1 =
    complainantName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(complainantEmail) &&
    description.trim().length >= 20;

  const selectedType = COMPLAINT_TYPES.find((t) => t.value === complaintType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
            <Gavel size={12} /> תלונה משפטית
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="glass border-border/60 max-w-lg" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Gavel size={18} className="text-destructive" />
            </div>
            <DialogTitle className="font-display text-lg">
              הגשת תלונה משפטית רשמית
            </DialogTitle>
          </div>
          {!submitted && (
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              הליך Notice & Takedown מובנה בהתאם לחוק איסור לשון הרע, התשכ"ה-1965.
              נגיב תוך 72 שעות.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Submitted confirmation ── */}
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 size={48} className="text-primary mx-auto" />
            <div>
              <p className="font-display font-bold text-lg text-foreground">תלונתכם התקבלה</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                קיבלנו את תלונתכם. צוות ReviewHub יבחן אותה תוך{" "}
                <strong>72 שעות</strong> ויצור קשר בכתובת{" "}
                <strong>{complainantEmail}</strong> עם עדכונים.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-xs text-muted-foreground leading-relaxed">
              <p>
                הכותב יקבל הודעה ויהיה לו <strong>7 ימים</strong> להגיב.
                ההחלטה תפורסם ב
                <strong> יומן השקיפות הציבורי</strong> של ReviewHub.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              לשאלות:{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                support@reviewshub.info
              </a>
            </p>
            <Button onClick={() => handleClose(false)} className="w-full">
              סגירה
            </Button>
          </div>
        ) : (
          <>
            {/* ── Step indicators ── */}
            <div className="flex items-center gap-1 mb-2">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      i <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline truncate ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < step ? "bg-primary" : "bg-border/40"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 0: Complaint type ── */}
            {step === 0 && (
              <div className="space-y-3">
                <Label className="block text-sm font-medium text-foreground">
                  סוג התלונה <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  {COMPLAINT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setComplaintType(type.value)}
                      className={`w-full text-right p-3 rounded-xl border transition-all ${
                        complaintType === type.value
                          ? "border-primary bg-primary/8"
                          : "border-border/50 hover:border-primary/40 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground">{type.label}</span>
                        {complaintType === type.value && (
                          <Badge className="text-[10px] bg-primary/15 text-primary border-0 shrink-0">
                            נבחר
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className="w-full bg-primary text-primary-foreground"
                >
                  המשך →
                </Button>
              </div>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <div className="space-y-4">
                {selectedType && (
                  <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-sm">
                    <p className="font-medium text-foreground">{selectedType.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedType.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">
                      שם מלא <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      className="glass border-border/50 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">
                      דוא"ל <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={complainantEmail}
                      onChange={(e) => setComplainantEmail(e.target.value)}
                      placeholder="israel@example.com"
                      className="glass border-border/50 text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">
                    תיאור התלונה (לפחות 20 תווים) <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="פרטו מדוע לדעתכם הביקורת מפרה את הדין. ציינו עובדות ספציפיות..."
                    rows={4}
                    className="glass border-border/50 resize-none text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-left">
                    {description.length} תווים
                  </p>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">
                    ראיות / הפניות (אופציונלי)
                  </Label>
                  <Input
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="קישור לראיה, מספר תיק, מסמך בית משפט..."
                    className="glass border-border/50 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ניתן לשלוח מסמכים נוספים לדוא"ל:{" "}
                    <a href="mailto:legal@reviewshub.info" className="text-primary hover:underline">
                      legal@reviewshub.info
                    </a>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="shrink-0">
                    ← חזרה
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    המשך לאישור →
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Confirm & submit ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/40 space-y-2 text-sm">
                  <p className="font-semibold text-foreground mb-2">סיכום התלונה</p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-muted-foreground">
                    <span className="font-medium text-foreground">סוג:</span>
                    <span>{selectedType?.label}</span>
                    <span className="font-medium text-foreground">שם:</span>
                    <span>{complainantName}</span>
                    <span className="font-medium text-foreground">דוא"ל:</span>
                    <span dir="ltr" className="break-all">{complainantEmail}</span>
                    <span className="font-medium text-foreground col-start-1">תיאור:</span>
                    <span className="leading-snug">{description.slice(0, 120)}{description.length > 120 ? "…" : ""}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/10 dark:bg-amber-900/10 border border-amber-500/30 text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p>
                    הגשת תלונה שקרית עלולה לחשוף אתכם לאחריות משפטית.
                    ReviewHub שומרת מידע מזהה על כל תלונה ועשויה לחשפו בצו בית משפט.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="shrink-0">
                    ← חזרה
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? "שולח תלונה..." : "שליחת תלונה רשמית"}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-snug">
                  בשליחה זו אתם מצהירים שהמידע שסיפקתם אמיתי לפי מיטב ידיעתכם.{" "}
                  <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    תנאי שימוש
                  </a>
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DefamationComplaintDialog;

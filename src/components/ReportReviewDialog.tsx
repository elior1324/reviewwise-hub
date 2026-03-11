/**
 * ReportReviewDialog — Unified Report & Legal Complaint Portal
 *
 * Single "דווח" entry point that branches into two paths:
 *
 *   A. Community Report  → review_reports table
 *      Quick flag for spam, fake reviews, offensive content, etc.
 *      Requires authentication.
 *
 *   B. Legal Complaint → defamation_complaints table
 *      Formal Notice & Takedown under חוק איסור לשון הרע, סעיף 15.
 *      Open to authenticated users and external parties alike.
 *      3-step wizard: type → details → confirm & submit.
 *
 * Notice & Takedown workflow (Path B):
 *   1. Complainant fills form → row inserted in defamation_complaints
 *   2. Admin reviews within 72 h → reviewer notified → 7-day response window
 *   3. Admin decides: uphold / edit / remove → status updated
 *   4. Result logged to review_public_log for public transparency
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
  Flag,
  Gavel,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Users,
  Scale,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportReviewDialogProps {
  reviewId: string;
}

type PathType = "community" | "legal";

type Step =
  | "select"         // Pick: community report OR legal complaint
  | "community"      // Community: reason + details
  | "legal_type"     // Legal step 0: pick complaint type
  | "legal_details"  // Legal step 1: name, email, description, evidence
  | "legal_confirm"  // Legal step 2: summary + legal warning
  | "done";          // Success (shared)

// ─── Community report reasons ─────────────────────────────────────────────────

const COMMUNITY_REASONS = [
  "ביקורת מזויפת",
  "תוכן פוגעני או משמיץ",
  "ספאם או פרסום",
  "מידע אישי חשוף",
  "ניגוד עניינים / מתחרה",
  "אחר",
];

// ─── Legal complaint types ─────────────────────────────────────────────────────

const COMPLAINT_TYPES = [
  {
    value: "defamation",
    label: "לשון הרע",
    description: 'הצהרה כוזבת ומזיקה — חוק איסור לשון הרע התשכ"ה-1965',
  },
  {
    value: "false_facts",
    label: "עובדות כוזבות",
    description: "עובדות שגויות המוצגות כאמת",
  },
  {
    value: "privacy_violation",
    label: "פגיעה בפרטיות",
    description: 'חשיפת מידע אישי ללא הסכמה — חוק הגנת הפרטיות התשמ"א-1981',
  },
  {
    value: "confidentiality_breach",
    label: "הפרת סודיות מסחרית",
    description: 'גילוי סודות עסקיים — חוק עוולות מסחריות התשנ"ט-1999',
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

// ─── Legal step indicators ─────────────────────────────────────────────────────
const LEGAL_STEPS = ["סוג התלונה", "פרטים", "אישור ושליחה"] as const;
const legalStepIndex: Record<Step, number> = {
  select: -1,
  community: -1,
  legal_type: 0,
  legal_details: 1,
  legal_confirm: 2,
  done: -1,
};

// ─── Component ────────────────────────────────────────────────────────────────

const ReportReviewDialog = ({ reviewId }: ReportReviewDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [submitting, setSubmitting] = useState(false);
  const [pathType, setPathType] = useState<PathType | null>(null);

  // Community report state
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  // Legal complaint state
  const [complaintType, setComplaintType] = useState<ComplaintType | "">("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep("select");
    setPathType(null);
    setReason("");
    setDetails("");
    setComplaintType("");
    setComplainantName(user?.email?.split("@")[0] ?? "");
    setComplainantEmail(user?.email ?? "");
    setDescription("");
    setEvidenceNote("");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    setOpen(val);
  };

  // ── Path select ──────────────────────────────────────────────────────────────
  const selectPath = (p: PathType) => {
    setPathType(p);
    if (p === "community") {
      setStep("community");
    } else {
      // Pre-fill email/name from user if logged in
      setComplainantName(user?.email?.split("@")[0] ?? "");
      setComplainantEmail(user?.email ?? "");
      setStep("legal_type");
    }
  };

  // ── Community submit ─────────────────────────────────────────────────────────
  const submitCommunityReport = async () => {
    if (!reason) return;
    if (!user) {
      toast({
        title: "יש להתחבר",
        description: "התחברו כדי לדווח על ביקורת.",
        variant: "destructive",
      });
      return;
    }
    if (!reviewId) return;

    setSubmitting(true);
    const { error } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    } as any);
    setSubmitting(false);

    if (error) {
      console.error("[ReportReviewDialog] community insert error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את הדיווח. נסו שוב.",
        variant: "destructive",
      });
      return;
    }

    setStep("done");
  };

  // ── Legal submit ─────────────────────────────────────────────────────────────
  const submitLegalComplaint = async () => {
    if (!complaintType || complainantName.trim().length < 2 || description.trim().length < 20) return;

    setSubmitting(true);
    try {
      const evidenceUrls = evidenceNote.trim() ? [evidenceNote.trim()] : undefined;

      const { error } = await supabase.from("defamation_complaints").insert({
        review_id: reviewId,
        complainant_id: user?.id ?? null,
        complainant_name: complainantName.trim(),
        complainant_email: complainantEmail.trim(),
        complaint_type: complaintType,
        description: description.trim(),
        evidence_urls: evidenceUrls,
      } as any);

      if (error) throw error;
      setStep("done");
    } catch (err: any) {
      console.error("[ReportReviewDialog] legal insert error:", err);
      sonnerToast.error("לא ניתן לשלוח את התלונה", {
        description: "נסו שוב מאוחר יותר.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Validation guards ─────────────────────────────────────────────────────────
  const canProceedLegalType = !!complaintType;
  const canProceedLegalDetails =
    complainantName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(complainantEmail) &&
    description.trim().length >= 20;

  const selectedType = COMPLAINT_TYPES.find((t) => t.value === complaintType);
  const currentLegalStepIdx = legalStepIndex[step];

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
          <Flag size={12} /> דווח
        </button>
      </DialogTrigger>

      <DialogContent className="glass border-border/60 max-w-lg" dir="rtl">

        {/* ══ DONE — shared success screen ══════════════════════════════════════ */}
        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 size={48} className="text-primary mx-auto" />
            <div>
              <p className="font-display font-bold text-lg text-foreground">
                {pathType === "legal" ? "תלונתכם התקבלה" : "הדיווח נשלח"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {pathType === "legal" ? (
                  <>
                    צוות ReviewHub יבחן את תלונתכם תוך{" "}
                    <strong>72 שעות</strong> ויצור קשר בכתובת{" "}
                    <strong>{complainantEmail}</strong>.
                  </>
                ) : (
                  "תודה. צוות ReviewHub יבדוק את הביקורת בהתאם להליך ה-Notice & Takedown שלנו."
                )}
              </p>
            </div>

            {pathType === "legal" && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                הכותב יקבל הודעה ויהיו לו <strong>7 ימים</strong> להגיב.
                ההחלטה תפורסם ב<strong> יומן השקיפות הציבורי</strong> של ReviewHub.
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              לשאלות:{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                support@reviewshub.info
              </a>
            </p>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              סגירה
            </Button>
          </div>
        )}

        {/* ══ ALL NON-DONE STEPS — show header ══════════════════════════════════ */}
        {step !== "done" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {pathType === "legal"
                    ? <Gavel size={17} className="text-primary" />
                    : <Flag size={17} className="text-primary" />}
                </div>
                <DialogTitle className="font-display text-lg">
                  {step === "select" && "דיווח על ביקורת"}
                  {step === "community" && "דיווח קהילתי"}
                  {pathType === "legal" && step !== "select" && step !== "community" && "תלונה משפטית רשמית"}
                </DialogTitle>
              </div>

              {step === "select" && (
                <DialogDescription className="text-sm text-muted-foreground">
                  בחרו את סוג הדיווח המתאים לכם.
                </DialogDescription>
              )}
              {step === "community" && (
                <DialogDescription className="text-sm text-muted-foreground">
                  סמנו את הסיבה המתאימה וצוות ReviewHub יבדוק.
                </DialogDescription>
              )}
              {pathType === "legal" && step !== "select" && step !== "community" && (
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  הליך Notice & Takedown בהתאם לחוק איסור לשון הרע, התשכ"ה-1965.
                  נגיב תוך 72 שעות.
                </DialogDescription>
              )}
            </DialogHeader>

            {/* ── Legal step progress bar ─────────────────────────────────────── */}
            {pathType === "legal" && step !== "select" && (
              <div className="flex items-center gap-1 mb-2">
                {LEGAL_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-1 flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        i <= currentLegalStepIdx
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs hidden sm:inline truncate ${
                        i === currentLegalStepIdx
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    {i < LEGAL_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-1 ${
                          i < currentLegalStepIdx ? "bg-primary" : "bg-border/40"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                STEP: select — choose path
            ════════════════════════════════════════════════════════════════════ */}
            {step === "select" && (
              <div className="space-y-3 mt-1">
                {/* Community card */}
                <button
                  type="button"
                  onClick={() => selectPath("community")}
                  className="w-full text-right p-4 rounded-xl border border-border/50 hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-500/20 transition-colors">
                      <Users size={16} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-foreground">דיווח קהילתי</p>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        ביקורת מזויפת, ספאם, תוכן פוגעני, ניגוד עניינים.
                        מהיר — צוות ReviewHub יבדוק ויחליט.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Legal card */}
                <button
                  type="button"
                  onClick={() => selectPath("legal")}
                  className="w-full text-right p-4 rounded-xl border border-border/50 hover:border-destructive/50 bg-muted/20 hover:bg-destructive/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-destructive/20 transition-colors">
                      <Scale size={16} className="text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">תלונה משפטית רשמית</p>
                          <Badge className="text-[9px] bg-destructive/10 text-destructive border-0 px-1.5 py-0">
                            Notice & Takedown
                          </Badge>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        לשון הרע, עובדות כוזבות, פגיעה בפרטיות, הפרת זכויות.
                        הליך מובנה לפי חוק איסור לשון הרע — מענה תוך 72 שעות.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                STEP: community — reason + details
            ════════════════════════════════════════════════════════════════════ */}
            {step === "community" && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm">סיבת הדיווח</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMUNITY_REASONS.map((r) => (
                      <Button
                        key={r}
                        variant={reason === r ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReason(r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm">פרטים נוספים (אופציונלי)</Label>
                  <Textarea
                    placeholder="ספרו לנו עוד..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="glass border-border/50"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStep("select"); setPathType(null); setReason(""); setDetails(""); }}
                    className="shrink-0"
                  >
                    ← חזרה
                  </Button>
                  <Button
                    onClick={submitCommunityReport}
                    disabled={!reason || submitting}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {submitting
                      ? <><Loader2 size={14} className="animate-spin ml-2" />שולח...</>
                      : "שלח דיווח"}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  הדיווח ייבדק בהתאם להליך ה-Notice & Takedown שלנו.{" "}
                  <a href="/terms" className="text-primary hover:underline">תנאי שימוש</a>.
                </p>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                STEP: legal_type — pick complaint type
            ════════════════════════════════════════════════════════════════════ */}
            {step === "legal_type" && (
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStep("select"); setPathType(null); setComplaintType(""); }}
                    className="shrink-0"
                  >
                    ← חזרה
                  </Button>
                  <Button
                    onClick={() => setStep("legal_details")}
                    disabled={!canProceedLegalType}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    המשך →
                  </Button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                STEP: legal_details — name, email, description, evidence
            ════════════════════════════════════════════════════════════════════ */}
            {step === "legal_details" && (
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
                    תיאור התלונה (לפחות 20 תווים){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="פרטו מדוע הביקורת מפרה את הדין. ציינו עובדות ספציפיות..."
                    rows={4}
                    className="glass border-border/50 resize-none text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-left">
                    {description.length} תווים
                  </p>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">ראיות / הפניות (אופציונלי)</Label>
                  <Input
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="קישור לראיה, מספר תיק, מסמך בית משפט..."
                    className="glass border-border/50 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ניתן לשלוח מסמכים נוספים ל:{" "}
                    <a
                      href="mailto:legal@reviewshub.info"
                      className="text-primary hover:underline"
                    >
                      legal@reviewshub.info
                    </a>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("legal_type")}
                    className="shrink-0"
                  >
                    ← חזרה
                  </Button>
                  <Button
                    onClick={() => setStep("legal_confirm")}
                    disabled={!canProceedLegalDetails}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    המשך לאישור →
                  </Button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                STEP: legal_confirm — summary + legal warning + submit
            ════════════════════════════════════════════════════════════════════ */}
            {step === "legal_confirm" && (
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
                    <span className="leading-snug">
                      {description.slice(0, 120)}
                      {description.length > 120 ? "…" : ""}
                    </span>
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
                  <Button
                    variant="outline"
                    onClick={() => setStep("legal_details")}
                    className="shrink-0"
                  >
                    ← חזרה
                  </Button>
                  <Button
                    onClick={submitLegalComplaint}
                    disabled={submitting}
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? "שולח תלונה..." : "שליחת תלונה רשמית"}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-snug">
                  בשליחה זו אתם מצהירים שהמידע שסיפקתם אמיתי לפי מיטב ידיעתכם.{" "}
                  <a
                    href="/terms"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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

export default ReportReviewDialog;

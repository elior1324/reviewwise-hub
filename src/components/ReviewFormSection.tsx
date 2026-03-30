/**
 * ReviewFormSection — Delayed-auth review flow.
 *
 * Users can write a review WITHOUT logging in first.
 * Auth is only required when they click "Submit".
 * Review data is preserved in localStorage across the auth flow.
 *
 * Flow:
 *   1. User writes review (rating, title, text, date of experience)
 *   2. Clicks submit → if not logged in, auth modal appears
 *   3. After login/signup → review auto-submits seamlessly (no reload)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Send, Loader2, CheckCircle2, LogIn, PenLine, ShieldCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import TurnstileWidget from "@/components/TurnstileWidget";

// ── LocalStorage ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "reviewhub_pending_review";
const EXPIRY_MS = 3600000; // 1 hour

interface PendingReview {
  businessId: string;
  businessSlug: string;
  rating: number;
  subject: string;
  text: string;
  experienceDate: string;
  timestamp: number;
}

interface ReviewFormSectionProps {
  businessSlug: string;
  businessName: string;
  businessId?: string;
}

function savePending(data: PendingReview) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPending(slug: string): PendingReview | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p: PendingReview = JSON.parse(raw);
    if (p.businessSlug !== slug || Date.now() - p.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return p;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function clearPending() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Star Picker — dynamic rating colors ──────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  1: "גרוע", 2: "לא טוב", 3: "בסדר", 4: "טוב", 5: "מעולה",
};

const RATING_COLORS: Record<number, { fill: string; bg: string }> = {
  1: { fill: "fill-red-500 text-red-500",         bg: "bg-red-500" },
  2: { fill: "fill-orange-500 text-orange-500",    bg: "bg-orange-500" },
  3: { fill: "fill-amber-400 text-amber-400",      bg: "bg-amber-400" },
  4: { fill: "fill-lime-400 text-lime-400",        bg: "bg-lime-400" },
  5: { fill: "fill-emerald-400 text-emerald-400",  bg: "bg-emerald-400" },
};

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const colors = active > 0 ? RATING_COLORS[active] : null;

  return (
    <div className="flex items-center gap-0.5 sm:gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= active;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`p-1 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isFilled && colors ? colors.bg : "bg-transparent"
            }`}
            aria-label={`${star} כוכבים`}
          >
            <Star
              size={28}
              className={`transition-colors duration-150 ${
                isFilled ? "fill-white text-white" : "fill-transparent text-muted-foreground/25"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

// ── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error: err } = await signUp(email, password, name || undefined);
        if (err) { setError(err.message || "שגיאה בהרשמה"); setLoading(false); return; }
      } else {
        const result = await signIn(email, password);
        if (result.error) { setError(result.error.message || "שגיאה בהתחברות"); setLoading(false); return; }
        if (result.mfaRequired) { setError("נדרש אימות דו-שלבי — התחברו דרך דף ההתחברות"); setLoading(false); return; }
      }
      onSuccess();
    } catch {
      setError("שגיאת רשת — נסו שוב");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle(window.location.href);
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6" dir="rtl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-display">
            {mode === "signup" ? "הרשמה לפרסום הביקורת" : "התחברות לפרסום הביקורת"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            הביקורת שלכם שמורה — {mode === "signup" ? "הירשמו" : "התחברו"} כדי לפרסם
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <Button type="button" variant="outline" className="w-full gap-2 h-10" onClick={handleGoogle} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            המשך עם Google
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">או</span></div>
          </div>

          {mode === "signup" && (
            <div className="space-y-1">
              <Label className="text-xs">שם (יוצג ליד הביקורת)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="השם שלכם" className="h-10 text-sm" />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">אימייל</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-10 text-sm" dir="ltr" required />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">סיסמה</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "לפחות 6 תווים" : "הסיסמה שלכם"} className="h-10 text-sm" required minLength={6} />
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-2 h-10" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            {loading
              ? "מתחבר..."
              : mode === "signup" ? "הרשמה ופרסום" : "התחברות ופרסום"}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-1">
            {mode === "signup" ? (
              <>כבר יש לכם חשבון? <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-primary hover:underline font-medium">התחברו</button></>
            ) : (
              <>אין לכם חשבון? <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-primary hover:underline font-medium">הירשמו</button></>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const ReviewFormSection = ({ businessSlug, businessName, businessId }: ReviewFormSectionProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [experienceDate, setExperienceDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const pendingAutoSubmit = useRef(false);
  const hasAutoSubmitted = useRef(false);
  const submittingRef = useRef(false);

  // ── Submit review to Edge Function ─────────────────────────────────────────
  const submitReview = useCallback(async (r: number, s: string, t: string) => {
    if (!businessId || submittingRef.current) return;
    if (!turnstileToken) { toast.error("אנא המתינו לאימות CAPTCHA"); return; }
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: {
          businessId,
          rating: r,
          subject: s.trim(),
          reviewText: t.trim(),
          trainingDuration: "3_months_plus",
          verifiedPurchase: false,
          anonymous: false,
          indemnityAccepted: true,
          indemnityAcceptedAt: new Date().toISOString(),
          turnstileToken,
        },
      });

      if (error || data?.error) {
        const msg = data?.error ?? error?.message ?? "שגיאה בשליחת הביקורת";
        if (msg.includes("duplicate") || msg.includes("כבר כתבת")) {
          toast.error("כבר כתבתם ביקורת על עסק זה");
          clearPending();
        } else {
          toast.error(msg);
        }
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      clearPending();
    } catch {
      toast.error("שגיאת רשת — נסו שוב");
    }
    submittingRef.current = false;
    setSubmitting(false);
  }, [businessId, turnstileToken]);

  // ── Restore pending review from localStorage ──────────────────────────────
  useEffect(() => {
    const pending = loadPending(businessSlug);
    if (!pending) return;
    setRating(pending.rating);
    setSubject(pending.subject);
    setText(pending.text);
    setExperienceDate(pending.experienceDate || "");
  }, [businessSlug]);

  // ── Auto-submit after auth (in-modal or OAuth redirect) ────────────────────
  // Triggers when user + turnstileToken both become available after auth.
  useEffect(() => {
    if (!user || !turnstileToken || hasAutoSubmitted.current || !businessId) return;

    // In-modal auth: pendingAutoSubmit flag is set by handleAuthSuccess
    // OAuth redirect: pending review exists in localStorage from before redirect
    const pending = loadPending(businessSlug);
    if (!pending) return;

    const shouldSubmit = pendingAutoSubmit.current || // in-modal auth
      (pending.rating > 0 && pending.text.trim().length >= 10); // OAuth redirect

    if (shouldSubmit) {
      pendingAutoSubmit.current = false;
      hasAutoSubmitted.current = true;
      submitReview(pending.rating, pending.subject, pending.text);
    }
  }, [user, turnstileToken, businessSlug, businessId, submitReview]);

  // ── Handle form submit click ──────────────────────────────────────────────
  const handleSubmit = () => {
    if (rating === 0) { toast.error("אנא בחרו דירוג"); return; }
    if (text.trim().length < 10) { toast.error("הביקורת חייבת להכיל לפחות 10 תווים"); return; }

    savePending({
      businessId: businessId || "",
      businessSlug,
      rating,
      subject: subject.trim(),
      text: text.trim(),
      experienceDate,
      timestamp: Date.now(),
    });

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    submitReview(rating, subject, text);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    pendingAutoSubmit.current = true;
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Card className="mb-6 border-primary/25 bg-primary/3" role="status" aria-live="polite">
        <CardContent className="py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            תודה על הביקורת!
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            הביקורת שלכם התקבלה ותפורסם לאחר בדיקה קצרה.
            <br />
            אנחנו מעריכים את הזמן שלכם.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Review form ───────────────────────────────────────────────────────────
  const isReady = rating > 0 && text.trim().length >= 10 && !!turnstileToken;

  return (
    <>
      <Card className="mb-6 border-border/50">
        <CardContent className="p-5 sm:p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <PenLine size={16} className="text-primary" />
            שתפו את החוויה שלכם
          </h3>

          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                דירוג כללי <span className="text-destructive text-xs">*</span>
              </Label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-muted-foreground">{RATING_LABELS[rating]}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">כותרת</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="סיכום קצר של החוויה"
                className="text-sm"
                maxLength={60}
              />
            </div>

            {/* Review text */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                הביקורת שלכם <span className="text-destructive text-xs">*</span>
              </Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ספרו על החוויה שלכם — מה עבד טוב, מה פחות, ולמי הייתם ממליצים..."
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-[11px] text-muted-foreground/50">
                {text.length.toLocaleString("he-IL")} / 2,000 תווים
              </p>
            </div>

            {/* Date of experience */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar size={12} className="text-muted-foreground" />
                תאריך החוויה
                <span className="text-muted-foreground text-[11px] font-normal">(אופציונלי)</span>
              </Label>
              <Input
                type="date"
                value={experienceDate}
                onChange={(e) => setExperienceDate(e.target.value)}
                className="text-sm w-full sm:w-48"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* CAPTCHA */}
            <TurnstileWidget
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />

            {/* Trust + Submit */}
            <div className="pt-3 border-t border-border/30 space-y-3">
              <p className="text-[11px] text-muted-foreground/60 flex items-start gap-1.5 leading-relaxed">
                <ShieldCheck size={12} className="shrink-0 mt-0.5 text-muted-foreground/40" />
                ביקורות מתבססות על חוויה אישית ועוברות בדיקה לפני פרסום.
                {" "}
                <a href="/review-policy" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary hover:underline whitespace-nowrap">
                  מדיניות ביקורות
                </a>
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isReady}
                className="w-full sm:w-auto gap-2"
                size="lg"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> שולח את הביקורת...</>
                ) : (
                  <><Send size={15} /> פרסום ביקורת</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthModal
        open={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default ReviewFormSection;

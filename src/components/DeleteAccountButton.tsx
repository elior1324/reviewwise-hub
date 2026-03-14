/**
 * DeleteAccountModal
 *
 * 3-step account-deletion flow:
 *   Step 1 – Re-enter password (verified client-side via signInWithPassword)
 *   Step 2 – Optional feedback / reason for leaving
 *   Step 3 – Final irreversible confirmation
 *
 * On confirmation:
 *   1. Calls the `request-account-deletion` edge function (soft delete + audit log)
 *   2. Signs the user out
 *   3. Redirects to home
 *
 * Exported:
 *   - DeleteAccountModal  (the full modal, open/close controlled by parent)
 *   - DeleteAccountTrigger  (a minimal unstyled text trigger — used in the footer)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ─── types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

// ─── main modal ──────────────────────────────────────────────────────────────
interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountModal = ({ open, onOpenChange }: DeleteAccountModalProps) => {
  const { user, signOut } = useAuth();
  const navigate     = useNavigate();
  const { toast }    = useToast();

  const [step,          setStep]          = useState<Step>(1);
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [feedback,      setFeedback]      = useState("");
  const [loading,       setLoading]       = useState(false);

  // ── reset on close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setPassword("");
    setPasswordError("");
    setFeedback("");
    setLoading(false);
    onOpenChange(false);
  };

  // ── Step 1: verify password ─────────────────────────────────────────────────
  const handleVerifyPassword = async () => {
    if (!password) {
      setPasswordError("יש להזין סיסמה.");
      return;
    }
    if (!user?.email) {
      setPasswordError("לא נמצאה כתובת אימייל לחשבון זה.");
      return;
    }
    setLoading(true);
    setPasswordError("");

    const { error } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password,
    });

    setLoading(false);

    if (error) {
      setPasswordError("הסיסמה שגויה. אנא נסו שנית.");
      return;
    }

    setStep(2);
  };

  // ── Step 3: execute soft-delete ─────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Send password + feedback to the edge function.
      // The edge function re-verifies the password server-side,
      // so the deletion cannot be triggered by bypassing this modal
      // and calling the API directly — even with a valid JWT.
      const { data, error } = await supabase.functions.invoke("request-account-deletion", {
        body: {
          password: password,                  // server-side re-verification
          feedback: feedback.trim() || null,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message ?? "Unknown error");

      // Sign out immediately
      await signOut();

      toast({
        title: "החשבון מסומן למחיקה",
        description: "החשבון שלכם יימחק לצמיתות תוך 30 יום. ניתן לפנות לתמיכה לביטול התהליך.",
      });

      handleClose();
      navigate("/");
    } catch (err: any) {
      console.error("[DeleteAccountModal] deletion failed:", err);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה. אנא פנו לתמיכה בכתובת support@reviewshub.info.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        {/* ── Step indicator ── */}
        <div className="flex items-center gap-1.5 mb-1" aria-hidden="true">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-destructive" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* ══════════ STEP 1 — password ══════════ */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-foreground">
                <ShieldAlert size={18} className="text-destructive shrink-0" />
                אימות זהות
              </DialogTitle>
              <DialogDescription className="text-right leading-relaxed">
                כדי להגן על חשבונכם, אנא הזינו את הסיסמה הנוכחית לפני שממשיכים.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="del-password" className="text-sm">סיסמה נוכחית</Label>
                <div className="relative">
                  <Input
                    id="del-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleVerifyPassword(); }}
                    placeholder="הזינו סיסמה"
                    className={`pl-10 ${passwordError ? "border-destructive" : ""}`}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive mt-1">{passwordError}</p>
                )}
              </div>

              <div className="flex gap-2 justify-start flex-row-reverse">
                <Button
                  onClick={handleVerifyPassword}
                  disabled={loading || !password}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {loading && <Loader2 size={14} className="ml-2 animate-spin" />}
                  המשך
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  ביטול
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ══════════ STEP 2 — feedback ══════════ */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                למה אתם עוזבים?
              </DialogTitle>
              <DialogDescription className="text-right leading-relaxed">
                שיתוף הסיבה עוזר לנו לשפר את הפלטפורמה. זהו שדה אופציונלי — ניתן לדלג.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="(אופציונלי) ספרו לנו מה הוביל להחלטה זו..."
                rows={4}
                maxLength={2000}
                className="resize-none text-sm"
                disabled={loading}
              />
              <p className="text-[11px] text-muted-foreground text-left">
                {feedback.length}/2000
              </p>

              <div className="flex gap-2 justify-start flex-row-reverse">
                <Button
                  onClick={() => setStep(3)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  המשך
                </Button>
                <Button variant="outline" onClick={() => setStep(3)}>
                  דלג
                </Button>
                <Button variant="ghost" onClick={() => setStep(1)} disabled={loading} className="mr-auto">
                  חזרה
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ══════════ STEP 3 — final confirmation ══════════ */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-destructive">
                <AlertTriangle size={18} className="shrink-0" />
                אישור מחיקת חשבון
              </DialogTitle>
              <DialogDescription className="text-right leading-relaxed">
                עיינו בפרטים לפני שאתם ממשיכים.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* warning box */}
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive">מה יקרה לאחר האישור:</p>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 shrink-0">•</span>
                    החשבון שלכם ייחסם מיידית ולא תוכלו להתחבר אליו.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 shrink-0">•</span>
                    הנתונים האישיים שלכם יימחקו לצמיתות תוך <strong>30 יום</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 shrink-0">•</span>
                    ביקורות שכתבתם יישארו בפלטפורמה תחת "משתמש מחוק" לצורך שמירת האמינות.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                    ניתן לבטל את המחיקה תוך 30 יום על ידי פנייה לתמיכה.
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                פעולה זו אינה הפיכה לאחר חלוף תקופת ההמתנה. הנתונים ייסרקו ויימחקו בהתאם
                למדיניות הפרטיות של הפלטפורמה.
              </p>

              <div className="flex gap-2 justify-start flex-row-reverse">
                <Button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                >
                  {loading && <Loader2 size={14} className="ml-2 animate-spin" />}
                  מחק את החשבון שלי
                </Button>
                <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                  חזרה
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── trigger ─────────────────────────────────────────────────────────────────
/**
 * DeleteAccountTrigger
 * A minimal unstyled text link that opens the DeleteAccountModal.
 * Designed for footer use — not visually prominent.
 */
interface DeleteAccountTriggerProps {
  className?: string;
}

export const DeleteAccountTrigger = ({ className = "" }: DeleteAccountTriggerProps) => {
  const [open, setOpen] = useState(false);
  const { user }        = useAuth();

  if (!user) return null; // only show when authenticated

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm text-muted-foreground/60 hover:text-destructive/70 transition-colors underline-offset-2 hover:underline ${className}`}
      >
        מחיקת חשבון
      </button>
      <DeleteAccountModal open={open} onOpenChange={setOpen} />
    </>
  );
};

// ─── default export (backwards compat — unused after refactor) ────────────────
export default DeleteAccountTrigger;

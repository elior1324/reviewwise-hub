/**
 * DeleteAccountModal
 *
 * Handles two account-lifecycle actions:
 *   • "מחיקת חשבון"  — soft-delete with a 7-day recovery window
 *   • "השהיית חשבון" — temporarily suspend (deactivate) the account
 *
 * Flow for deletion:
 *   confirm (choose action) → password → reason → final
 *
 * Flow for suspension:
 *   confirm (choose action) → password → final-suspend
 *
 * After 7 days the deletion becomes permanent and cannot be undone.
 * During the 7-day window the user can restore via the login page.
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
import {
  AlertTriangle, Lock, Trash2, ChevronLeft, PauseCircle, RotateCcw, Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

type Action = "delete" | "suspend";
type Step   = "confirm" | "password" | "reason" | "final" | "final-suspend";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── LEAVE_REASONS ──────────────────────────────────────────────────────────

const LEAVE_REASONS = [
  "סיימתי להשתמש בפלטפורמה",
  "חוויית משתמש לא מספקת",
  "פרטיות — אני רוצה שהנתונים שלי יימחקו",
  "עברתי לפלטפורמה אחרת",
  "אחר",
];

// ── Component ──────────────────────────────────────────────────────────────

export default function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const [step,     setStep]     = useState<Step>("confirm");
  const [action,   setAction]   = useState<Action>("delete");
  const [password, setPassword] = useState("");
  const [reason,   setReason]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const { toast }         = useToast();
  const navigate          = useNavigate();

  // Reset state when the modal is closed
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep("confirm");
      setAction("delete");
      setPassword("");
      setReason("");
      setError(null);
      setLoading(false);
    }
    onOpenChange(val);
  };

  // ── Step: choose action ────────────────────────────────────────────────
  const handleChooseAction = (chosen: Action) => {
    setAction(chosen);
    setStep("password");
    setError(null);
  };

  // ── Step: verify password → branch by action ───────────────────────────
  const handleVerifyPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (authErr) {
        setError("הסיסמה שגויה. אנא נסו שוב.");
        setLoading(false);
        return;
      }
      // Branch: suspension skips the "reason" step
      setStep(action === "suspend" ? "final-suspend" : "reason");
    } catch {
      setError("אירעה שגיאה. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step: reason → final delete confirmation ───────────────────────────
  const handleReasonContinue = () => {
    setStep("final");
    setError(null);
  };

  // ── Execute: permanent delete (7-day grace) ────────────────────────────
  const handleDeletePermanently = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-account-deletion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            password,
            reason: reason.trim() || null,
          }),
        },
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.message || "לא ניתן למחוק את החשבון כרגע. אנא פנו לתמיכה.");
        setLoading(false);
        return;
      }

      toast({
        title: "החשבון מסומן למחיקה",
        description: "יש לכם 7 ימים לשחזר את החשבון. לאחר מכן — המחיקה סופית.",
      });
      handleOpenChange(false);
      await signOut();
      navigate("/");
    } catch {
      setError("אירעה שגיאה בעת מחיקת החשבון. אנא פנו לצוות התמיכה.");
    } finally {
      setLoading(false);
    }
  };

  // ── Execute: suspend account ───────────────────────────────────────────
  const handleSuspend = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suspend-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ password }),
        },
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.message || "לא ניתן להשהות את החשבון כרגע. אנא פנו לתמיכה.");
        setLoading(false);
        return;
      }

      toast({
        title: "החשבון הושהה",
        description: "החשבון שלכם הושהה. ניתן להפעילו מחדש בכל עת על ידי התחברות.",
      });
      handleOpenChange(false);
      await signOut();
      navigate("/");
    } catch {
      setError("אירעה שגיאה בעת השהיית החשבון. אנא פנו לצוות התמיכה.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">

        {/* ── Step: choose action ────────────────────────────────────── */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">ניהול חשבון</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                בחרו את הפעולה הרצויה. ניתן להשהות את החשבון זמנית, או למחוק אותו לצמיתות.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 mt-3">
              {/* Suspend option */}
              <button
                onClick={() => handleChooseAction("suspend")}
                className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4 text-right hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/20 transition-colors">
                  <PauseCircle size={18} className="text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">השהיית חשבון</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    החשבון יושהה ולא יהיה גלוי. ניתן להפעילו מחדש בכל עת על ידי התחברות רגילה.
                  </p>
                </div>
              </button>

              {/* Delete option */}
              <button
                onClick={() => handleChooseAction("delete")}
                className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4 text-right hover:border-destructive/40 hover:bg-destructive/5 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-destructive/20 transition-colors">
                  <Trash2 size={18} className="text-destructive" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-destructive">מחיקת חשבון</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    החשבון יסומן למחיקה. יש לכם חלון של <strong className="text-foreground">7 ימים</strong> לשחזר אותו לפני שהמחיקה הופכת סופית.
                  </p>
                </div>
              </button>

              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="text-muted-foreground"
              >
                ביטול
              </Button>
            </div>
          </>
        )}

        {/* ── Step: password verification ───────────────────────────── */}
        {step === "password" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-primary" />
                </div>
                <DialogTitle>אמתו את זהותכם</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                הזינו את הסיסמה הנוכחית שלכם כדי להמשיך.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <Input
                type="password"
                placeholder="סיסמה נוכחית"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && handleVerifyPassword()}
                className="text-right"
                dir="ltr"
                autoComplete="current-password"
              />
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle size={11} />
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("confirm")}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  חזרה
                </Button>
                <Button
                  onClick={handleVerifyPassword}
                  disabled={loading || password.length < 6}
                  className="flex-1"
                >
                  {loading ? "מאמת..." : "המשיכו →"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: reason for leaving (delete path only) ────────────── */}
        {step === "reason" && (
          <>
            <DialogHeader>
              <DialogTitle>סיבת עזיבה (אופציונלי)</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                נשמח להבין מדוע אתם עוזבים. משוב זה עוזר לנו לשפר את הפלטפורמה.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="flex flex-wrap gap-2">
                {LEAVE_REASONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      reason === r
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="פירוט נוסף (אופציונלי)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="text-sm min-h-[80px] resize-none text-right"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-left">{reason.length}/500</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("password")}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  חזרה
                </Button>
                <Button onClick={handleReasonContinue} className="flex-1">
                  המשיכו →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: final delete confirmation ───────────────────────── */}
        {step === "final" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-destructive" />
                </div>
                <DialogTitle className="text-destructive">אישור סופי</DialogTitle>
              </div>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground mt-1">
                  <p>
                    אתם עומדים למחוק את החשבון של{" "}
                    <strong className="text-foreground">{user?.email}</strong>.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* 7-day grace window banner */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 mt-1">
              <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  חלון שחזור — 7 ימים
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  לאחר האישור, החשבון יושבת ויסומן למחיקה. תוך <strong className="text-foreground">7 ימים</strong> ניתן לשחזר אותו
                  על ידי התחברות או פנייה לתמיכה. לאחר 7 ימים — המחיקה סופית ובלתי הפיכה.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle size={11} />
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="destructive"
                onClick={handleDeletePermanently}
                disabled={loading}
                className="w-full font-semibold"
              >
                <Trash2 size={15} className="ml-2" />
                {loading ? "מוחק..." : "מחקו את החשבון"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="w-full"
              >
                ביטול — שמרו על החשבון שלי
              </Button>
            </div>
          </>
        )}

        {/* ── Step: final suspend confirmation ──────────────────────── */}
        {step === "final-suspend" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <PauseCircle size={18} className="text-amber-500" />
                </div>
                <DialogTitle>אישור השהיית חשבון</DialogTitle>
              </div>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground mt-1">
                  <p>
                    החשבון של <strong className="text-foreground">{user?.email}</strong> יושהה.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* Suspension info */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mt-1">
              <RotateCcw size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary">ניתן לחזור בכל עת</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  פרופילכם לא יהיה גלוי לאחרים, והנתונים שלכם יישמרו. כדי להפעיל את החשבון מחדש —
                  פשוט התחברו שוב.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle size={11} />
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={handleSuspend}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                <PauseCircle size={15} className="ml-2" />
                {loading ? "מושהה..." : "השהו את החשבון"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="w-full"
              >
                ביטול — שמרו על החשבון שלי
              </Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}

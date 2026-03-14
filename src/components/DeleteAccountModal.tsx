/**
 * DeleteAccountModal
 *
 * Destructive account deletion flow with three gates:
 *   1. Current password verification (server-side via supabase.auth.signInWithPassword)
 *   2. Optional "Reason for leaving" textarea
 *   3. Final "Delete Permanently" confirmation button
 *
 * On confirmation:
 *   - Calls the request-account-deletion edge function (marks account for deletion)
 *   - Signs the user out
 *
 * The component is rendered inside Footer.tsx so that the Delete Account
 * link lives in the footer — well away from main navigation.
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
import { AlertTriangle, Lock, Trash2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

type Step = "confirm" | "password" | "reason" | "final";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── LEAVE_REASONS — surfaced to the user as quick-select chips ─────────────

const LEAVE_REASONS = [
  "סיימתי להשתמש בפלטפורמה",
  "חוויית משתמש לא מספקת",
  "פרטיות — אני רוצה שהנתונים שלי יימחקו",
  "עברתי לפלטפורמה אחרת",
  "אחר",
];

// ── Component ──────────────────────────────────────────────────────────────

export default function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const [step, setStep]         = useState<Step>("confirm");
  const [password, setPassword] = useState("");
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const { toast }         = useToast();
  const navigate          = useNavigate();

  // Reset state when the modal is closed
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep("confirm");
      setPassword("");
      setReason("");
      setError(null);
      setLoading(false);
    }
    onOpenChange(val);
  };

  // ── Step 1 → Step 2: ask for password ─────────────────────────────────
  const handleConfirm = () => {
    setStep("password");
    setError(null);
  };

  // ── Step 2 → Step 3: verify password ──────────────────────────────────
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
      setStep("reason");
    } catch {
      setError("אירעה שגיאה. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 → Step 4: save reason, show final confirmation ─────────────
  const handleReasonContinue = () => {
    setStep("final");
    setError(null);
  };

  // ── Step 4: execute deletion ───────────────────────────────────────────
  const handleDeletePermanently = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Call the request-account-deletion edge function
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

      // Success — sign out and navigate home
      toast({
        title: "החשבון מסומן למחיקה",
        description: "החשבון שלכם יימחק תוך 30 ימים. התנתקתם בהצלחה.",
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">

        {/* ── Step: initial confirmation ────────────────────────────── */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-destructive" />
                </div>
                <DialogTitle className="text-destructive">מחיקת חשבון</DialogTitle>
              </div>
              <DialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground mt-2">
                  <p>
                    פעולה זו <strong className="text-foreground">בלתי הפיכה</strong>.
                    מחיקת החשבון תגרום לאיבוד קבוע של:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs pr-2">
                    <li>כל הביקורות שכתבתם</li>
                    <li>נתוני הפרופיל והפעילות שלכם</li>
                    <li>גישה לכל תוכן שנרכש דרך ReviewHub</li>
                    <li>נתוני עסק, אנליטיקס ואינטגרציות (אם קיימים)</li>
                  </ul>
                  <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive/90">
                      לאחר אישור, החשבון יסומן למחיקה. תהליך המחיקה יושלם תוך 30 ימים.
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="destructive"
                onClick={handleConfirm}
                className="w-full"
              >
                המשיכו לתהליך המחיקה
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                ביטול — שמרו על החשבון שלי
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
                הזינו את הסיסמה הנוכחית שלכם כדי להמשיך. שלב זה מגן עליכם מפני מחיקה לא מכוונת.
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
                  {loading ? "מאמת..." : "אמתו סיסמה →"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: reason for leaving ──────────────────────────────── */}
        {step === "reason" && (
          <>
            <DialogHeader>
              <DialogTitle>סיבת עזיבה (אופציונלי)</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                נשמח להבין מדוע אתם עוזבים. משוב זה עוזר לנו לשפר את הפלטפורמה.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              {/* Quick-select chips */}
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

              {/* Free-text */}
              <Textarea
                placeholder="פירוט נוסף (אופציונלי)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="text-sm min-h-[80px] resize-none text-right"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-left">
                {reason.length}/500
              </p>

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
                <Button
                  onClick={handleReasonContinue}
                  className="flex-1"
                >
                  המשיכו →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: final confirmation ──────────────────────────────── */}
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
                    אתם עומדים <strong className="text-foreground">למחוק לצמיתות</strong> את החשבון של <strong className="text-foreground">{user?.email}</strong>.
                  </p>
                  <p className="text-xs">
                    לאחר לחיצה על "מחקו לצמיתות" — לא תוכלו לבטל פעולה זו.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

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
                {loading ? "מוחק..." : "מחקו לצמיתות"}
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

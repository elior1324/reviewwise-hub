/**
 * DisputePortal — Business-facing Notice & Takedown trigger
 *
 * Renders on the BusinessDashboard next to each review.
 * Allows a verified business owner to open a formal dispute against a review,
 * triggering the 72-hour evidence window and automated reviewer notification.
 *
 * Flow:
 *   1. Business clicks "פתח הליך חקירה"
 *   2. Portal shows what will happen (email sent, 72h window, etc.)
 *   3. Business writes formal reason
 *   4. On submit → calls dispute-engine Edge Function with action:"open_dispute"
 *   5. Confirmation screen with countdown
 */

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge }    from "@/components/ui/badge";
import {
  Gavel, Clock, FileSearch, Mail, CheckCircle2,
  AlertTriangle, Loader2, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DisputePortalProps {
  reviewId:     string;
  businessId:   string;
  businessName: string;
  reviewText:   string;
  onDisputeOpened?: () => void;
}

const STEPS = [
  { icon: Mail,       label: "ReviewHub שולחת מייל לכותב" },
  { icon: Clock,      label: "72 שעות להגשת הוכחה" },
  { icon: FileSearch, label: "Admin בוחן את הראיות" },
  { icon: CheckCircle2, label: "החלטה + עדכון לוג ציבורי" },
];

type Phase = "idle" | "confirm" | "reason" | "submitting" | "done";

const DisputePortal = ({
  reviewId, businessId, businessName, reviewText, onDisputeOpened
}: DisputePortalProps) => {
  const [open, setOpen]   = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const reset = () => {
    setPhase("idle");
    setReason("");
    setExpiresAt(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    setOpen(isOpen);
  };

  const handleSubmit = async () => {
    if (reason.trim().length < 20) {
      toast.error("אנא תאר את הסיבה לדיווח (לפחות 20 תווים)");
      return;
    }
    setPhase("submitting");

    try {
      const { data, error } = await supabase.functions.invoke("dispute-engine", {
        body: {
          action:     "open_dispute",
          reviewId,
          businessId,
          reason:     reason.trim(),
        },
      });

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "שגיאה לא ידועה";
        toast.error("לא ניתן לפתוח את ההליך", { description: msg });
        setPhase("reason");
        return;
      }

      setExpiresAt(data.expiresAt);
      setPhase("done");
      onDisputeOpened?.();
    } catch (err: any) {
      toast.error("שגיאה בשליחה", { description: err.message });
      setPhase("reason");
    }
  };

  // Compute countdown label
  const deadline = expiresAt
    ? new Date(expiresAt).toLocaleString("he-IL", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Jerusalem",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <ShieldAlert size={13} />
          ערעור / חקירה
        </Button>
      </DialogTrigger>

      <DialogContent className="glass border-border/60 max-w-lg" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Gavel size={18} className="text-destructive" />
            </div>
            <DialogTitle className="font-display text-lg">
              פתיחת הליך ערעור על ביקורת
            </DialogTitle>
          </div>
          {phase !== "done" && (
            <DialogDescription className="text-sm text-muted-foreground">
              הליך Notice & Takedown מובנה — כל שלב מתועד ביומן הביקורת.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Phase: confirm — show what will happen ── */}
        {phase === "idle" && (
          <div className="space-y-4">
            {/* The review being disputed */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              "{reviewText}"
            </div>

            <p className="text-sm font-medium text-foreground">מה יקרה לאחר הגשת הבקשה:</p>
            <div className="grid grid-cols-2 gap-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border/30">
                  <s.icon size={14} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground leading-snug">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/10 dark:bg-amber-900/10 border border-amber-500/30 text-xs text-muted-foreground leading-relaxed flex gap-2">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p>
                פתיחת הליך שגוי עלולה לפגוע בנכונות עסקים לפרסם ביקורות. השתמש רק כאשר יש לך
                יסוד סביר לחשוב שהביקורת כוזבת או מטעה.
              </p>
            </div>

            <Button onClick={() => setPhase("reason")} className="w-full bg-primary text-primary-foreground">
              המשך — כתיבת סיבה רשמית →
            </Button>
          </div>
        )}

        {/* ── Phase: reason — enter formal declaration ── */}
        {phase === "reason" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-sm">
              <p className="font-semibold text-foreground mb-1">הצהרה משפטית רשמית</p>
              <p className="text-xs text-muted-foreground">
                תאר מדוע אתה מאמין שהביקורת כוזבת, מטעה, או מהווה לשון הרע.
                הצהרה זו תצורף לתיק הביקורת ועשויה לשמש ראיה.
              </p>
            </div>

            <div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="לדוגמה: הלקוח הזה מעולם לא רכש ממני. תאריך הביקורת מתייחס לתקופה שבה העסק שלי לא היה פעיל..."
                rows={5}
                className="glass border-border/50 resize-none text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-left">
                {reason.length} תווים (מינימום 20)
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPhase("idle")} className="shrink-0">
                ← חזרה
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={reason.trim().length < 20}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                פתיחת הליך חקירה רשמי
              </Button>
            </div>
          </div>
        )}

        {/* ── Phase: submitting ── */}
        {phase === "submitting" && (
          <div className="py-10 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">פותח הליך ומשלח הודעה לכותב...</p>
          </div>
        )}

        {/* ── Phase: done ── */}
        {phase === "done" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 size={48} className="text-primary mx-auto" />
            <div>
              <p className="font-display font-bold text-lg text-foreground">הליך החקירה נפתח</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                הכותב קיבל מייל עם הודעה ולינק להגשת הוכחה.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                <p className="text-xs text-muted-foreground mb-1">דדליין להגשת ראיה</p>
                <p className="font-semibold text-foreground text-xs">{deadline}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                <p className="text-xs text-muted-foreground mb-1">סטטוס ביקורת</p>
                <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-0">
                  בחקירה
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-snug px-2">
              הביקורת מוצגת באופן מטושטש לציבור עד לסיום החקירה.
              אתה תעודכן בדוא"ל עם סיום הבדיקה.
            </p>
            <Button onClick={() => handleClose(false)} className="w-full">סגירה</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DisputePortal;

/**
 * IndemnityModal — Legal responsibility acknowledgment gate
 *
 * Shown once before the review form opens.
 * The user must explicitly check the box and click "אישור" before they can
 * write or submit a review.
 *
 * This modal is a core element of ReviewHub's Safe Harbor defense under
 * חוק איסור לשון הרע, התשכ"ה-1965 — the reviewer accepts full personal
 * legal responsibility for the content they publish, and that acceptance
 * is timestamped and stored in the database alongside the review.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Scale, ShieldCheck, AlertTriangle } from "lucide-react";

interface IndemnityModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the user accepts — passes the acceptance timestamp */
  onAccept: (acceptedAt: string) => void;
  /** Called when the user dismisses without accepting */
  onDismiss: () => void;
}

const IndemnityModal = ({ open, onAccept, onDismiss }: IndemnityModalProps) => {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (!checked) return;
    onAccept(new Date().toISOString());
    setChecked(false); // reset for next time
  };

  const handleDismiss = () => {
    setChecked(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent
        className="glass border-border/60 max-w-lg"
        dir="rtl"
        // Prevent closing by clicking the backdrop — user must make an explicit choice
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scale size={18} className="text-primary" />
            </div>
            <DialogTitle className="font-display text-lg">
              הצהרת אחריות אישית לפרסום ביקורת
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
            בהתאם לחוק איסור לשון הרע, התשכ"ה-1965, אנא קראו את ההצהרה הבאה בעיון לפני שתמשיכו.
          </DialogDescription>
        </DialogHeader>

        {/* Main disclaimer box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/10 dark:bg-amber-900/10 p-4 space-y-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>ReviewHub פועלת כפלטפורמה טכנולוגית ניטרלית בלבד.</strong> אנחנו אינינו
              אחראים לתוכן הביקורות שמפרסמים המשתמשים.
            </p>
          </div>

          <hr className="border-border/30" />

          <p className="leading-relaxed text-muted-foreground">
            על-ידי פרסום ביקורת, <strong className="text-foreground">אני מאשר/ת כי:</strong>
          </p>

          <ul className="space-y-2 text-muted-foreground pr-2">
            <li className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                כל עובדה שאציין בביקורת <strong className="text-foreground">אמיתית לפי ידיעתי הטובה ביותר</strong>,
                ואני מבין/ה כי פרסום עובדות כוזבות עלול להוות עבירה פלילית ואזרחית.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                הביקורת מבטאת את <strong className="text-foreground">דעתי האישית בלבד</strong>,
                ואינה מונעת מניגוד עניינים, קשר מסחרי עם מתחרה, או מטרה לפגוע שלא בתום לב.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                אני נושא/ת ב<strong className="text-foreground">אחריות המלאה והבלעדית</strong> לתוכן שאפרסם,
                לרבות אחריות בגין לשון הרע, פגיעה בפרטיות, הפרת סודיות מסחרית,
                ואחריות לשיפוי ReviewHub בגין כל תביעה שתינקט בשל פרסומי.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                ReviewHub <strong className="text-foreground">שומרת את זהותי</strong> (כתובת IP, דוא"ל, חותמות זמן)
                ורשאית לחשוף אותה בצו בית משפט.
              </span>
            </li>
          </ul>
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="indemnity-checkbox"
            checked={checked}
            onCheckedChange={(val) => setChecked(Boolean(val))}
            className="mt-0.5 shrink-0"
          />
          <Label
            htmlFor="indemnity-checkbox"
            className="text-sm leading-relaxed cursor-pointer text-foreground"
          >
            אני מבין/ה ומסכים/ה לאמור לעיל, ואני נושא/ת באחריות האישית המלאה
            לתוכן הביקורת שאפרסם.
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleAccept}
            disabled={!checked}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            <Scale size={14} className="ml-2" />
            קיבלתי — המשך לכתיבת ביקורת
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="shrink-0"
          >
            ביטול
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/70 text-center leading-snug">
          הצהרה זו מתועדת בהתאם להליך ה-Safe Harbor שלנו.{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            תנאי שימוש מלאים
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default IndemnityModal;

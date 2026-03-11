import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ReportReviewDialogProps {
  reviewId: string;
}

const REASONS = [
  "ביקורת מזויפת",
  "תוכן פוגעני או משמיץ",
  "ספאם או פרסום",
  "מידע אישי חשוף",
  "ניגוד עניינים / מתחרה",
  "אחר",
];

const ReportReviewDialog = ({ reviewId }: ReportReviewDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    if (!user) {
      toast({ title: "יש להתחבר", description: "התחברו כדי לדווח על ביקורת.", variant: "destructive" });
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
      console.error("[ReportReviewDialog] insert error:", error);
      toast({ title: "שגיאה", description: "לא ניתן לשלוח את הדיווח. נסו שוב.", variant: "destructive" });
      return;
    }

    toast({ title: "הדיווח נשלח", description: "תודה. צוות ReviewHub יבדוק את הביקורת בהתאם להליך ה-Notice & Takedown שלנו." });
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
          <Flag size={12} /> דווח
        </button>
      </DialogTrigger>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display">דיווח על ביקורת</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">סיבת הדיווח</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => (
                <Button key={r} variant={reason === r ? "default" : "outline"} size="sm" onClick={() => setReason(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">פרטים נוספים (אופציונלי)</Label>
            <Textarea placeholder="ספרו לנו עוד..." value={details} onChange={e => setDetails(e.target.value)} className="glass border-border/50" rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={!reason || submitting} className="w-full bg-primary text-primary-foreground">
            {submitting ? <><Loader2 size={14} className="animate-spin ml-2" /> שולח...</> : "שלח דיווח"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            הדיווח ייבדק בהתאם להליך ה-Notice & Takedown שלנו. פרטים ב<a href="/terms" className="text-primary hover:underline">תנאי השימוש</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportReviewDialog;

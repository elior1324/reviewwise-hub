import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportReviewDialogProps {
  reviewId: string;
}

const REASONS = [
  "ביקורת מזויפת",
  "תוכן פוגעני או משמיץ",
  "ספאם או פרסום",
  "מידע אישי חשוף",
  "אחר",
];

const ReportReviewDialog = ({ reviewId }: ReportReviewDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    toast({ title: "הדיווח נשלח", description: "תודה. צוות ReviewHub יבדוק את הביקורת." });
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
          <Button onClick={handleSubmit} disabled={!reason} className="w-full bg-primary text-primary-foreground">
            שלח דיווח
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportReviewDialog;

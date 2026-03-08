import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReceiptUploaderProps {
  businessId: string;
  courseId?: string;
  onVerified: (verified: boolean) => void;
}

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";
const MAX_SIZE_MB = 10;

const ReceiptUploader = ({ businessId, courseId, onVerified }: ReceiptUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "verifying" | "verified" | "rejected">("idle");
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: `הקובץ גדול מדי (מקסימום ${MAX_SIZE_MB}MB)`, variant: "destructive" });
      return;
    }

    setStatus("uploading");
    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `receipts/${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "שגיאה בהעלאה", description: uploadError.message, variant: "destructive" });
      setStatus("idle");
      setUploading(false);
      return;
    }

    // Save receipt record
    const fileType = ext === "pdf" ? "pdf" : "image";
    const { data: receiptData, error: dbError } = await supabase
      .from("customer_receipts")
      .insert({
        user_id: user.id,
        business_id: businessId,
        course_id: courseId || null,
        file_path: filePath,
        file_type: fileType,
      })
      .select()
      .single();

    if (dbError) {
      toast({ title: "שגיאה בשמירה", description: dbError.message, variant: "destructive" });
      setStatus("idle");
      setUploading(false);
      return;
    }

    // Trigger AI verification
    setStatus("verifying");
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("verify-invoice", {
        body: {
          action: "verify_receipt",
          receiptId: receiptData.id,
          businessId,
          filePath,
        },
      });

      if (fnError) throw fnError;

      const score = result?.match_score ?? 0;
      const verified = result?.verified ?? false;
      setMatchScore(score);

      if (verified) {
        setStatus("verified");
        onVerified(true);
        toast({ title: "רכישה אומתה בהצלחה! ✅", description: "הביקורת שלכם תסומן כמאומתת." });
      } else {
        setStatus("rejected");
        onVerified(false);
        toast({
          title: "לא הצלחנו לאמת את הקבלה",
          description: "הביקורת תפורסם ללא תג אימות. ניתן לנסות שוב.",
          variant: "destructive",
        });
      }
    } catch {
      setStatus("rejected");
      onVerified(false);
      toast({ title: "שגיאה באימות", description: "נסו שוב מאוחר יותר", variant: "destructive" });
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">אימות רכישה (אופציונלי)</p>
      <p className="text-xs text-muted-foreground mb-2">
        העלו קבלה או חשבונית כדי לאמת את הרכישה שלכם ולקבל תג ביקורת מאומתת.
      </p>

      {status === "idle" && (
        <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-primary/40 transition-colors">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
            className="hidden"
            id="receipt-upload"
          />
          <label htmlFor="receipt-upload" className="cursor-pointer">
            <Upload size={20} className="mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">PDF או תמונה — עד {MAX_SIZE_MB}MB</p>
          </label>
        </div>
      )}

      {(status === "uploading" || status === "verifying") && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
          <Loader2 size={18} className="text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {status === "uploading" ? "מעלה את הקובץ..." : "AI מנתח את הקבלה..."}
            </p>
            <p className="text-xs text-muted-foreground">זה עשוי לקחת כמה שניות</p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-trust-green-light border border-trust-green/20">
          <CheckCircle size={18} className="text-trust-green shrink-0" />
          <div>
            <p className="text-sm font-medium text-trust-green">רכישה אומתה!</p>
            {matchScore && <p className="text-xs text-trust-green/70">ציון התאמה: {Math.round(matchScore * 100)}%</p>}
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <XCircle size={18} className="text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">לא ניתן לאמת</p>
            <p className="text-xs text-muted-foreground">ניתן להמשיך בלי אימות, או לנסות קובץ אחר</p>
            <Button variant="ghost" size="sm" className="mt-1 text-xs h-7" onClick={() => setStatus("idle")}>
              נסו שוב
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;

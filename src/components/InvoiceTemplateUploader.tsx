import { useState, useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceTemplateUploaderProps {
  businessId: string;
}

interface UploadedTemplate {
  id: string;
  file_path: string;
  file_type: string;
  ai_extracted_data: any;
  created_at: string;
}

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.csv,image/*,application/pdf";
const MAX_SIZE_MB = 10;

const InvoiceTemplateUploader = forwardRef<HTMLDivElement, InvoiceTemplateUploaderProps>(({ businessId }, ref) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<UploadedTemplate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("invoice_templates")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (data) setTemplates(data as UploadedTemplate[]);
    setLoaded(true);
  };

  if (!loaded) loadTemplates();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: `הקובץ גדול מדי (מקסימום ${MAX_SIZE_MB}MB)`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `templates/${businessId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "שגיאה בהעלאה", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Save to DB
    const fileType = ext === "csv" ? "csv" : ext === "pdf" ? "pdf" : "image";
    const { error: dbError } = await supabase
      .from("invoice_templates")
      .insert({ business_id: businessId, file_path: filePath, file_type: fileType });

    if (dbError) {
      toast({ title: "שגיאה בשמירה", description: dbError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Trigger AI analysis
    try {
      await supabase.functions.invoke("verify-invoice", {
        body: { action: "analyze_template", businessId, filePath },
      });
    } catch {
      // Non-blocking — AI analysis can happen asynchronously
    }

    toast({ title: "הקובץ הועלה בהצלחה! ✨", description: "ה-AI ינתח את המסמך ברקע." });
    await loadTemplates();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (template: UploadedTemplate) => {
    await supabase.storage.from("invoices").remove([template.file_path]);
    await supabase.from("invoice_templates").delete().eq("id", template.id);
    setTemplates(prev => prev.filter(t => t.id !== template.id));
    toast({ title: "הקובץ נמחק" });
  };

  return (
    <Card className="shadow-card bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          תבניות קבלות וחשבוניות
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          העלו דוגמאות של חשבוניות/קבלות שלכם כדי שה-AI יוכל לזהות אוטומטית רכישות של לקוחות.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload button */}
        <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
            className="hidden"
            id="invoice-upload"
          />
          {/* Camera input for mobile */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            className="hidden"
            id="invoice-camera"
          />
          <label htmlFor="invoice-upload" className="cursor-pointer">
            {uploading ? (
              <Loader2 size={28} className="mx-auto mb-2 text-primary animate-spin" />
            ) : (
              <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="font-display font-semibold text-sm text-foreground mb-1">
              {uploading ? "מעלה..." : "העלו קובץ קבלה/חשבונית"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, תמונה, גלריה, iCloud/Google Drive או CSV — עד {MAX_SIZE_MB}MB
            </p>
          </label>
          {!uploading && (
            <label htmlFor="invoice-camera" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary font-medium cursor-pointer hover:underline">
              📷 צלמו חשבונית עם המצלמה
            </label>
          )}
        </div>

        {/* Uploaded templates list */}
        <AnimatePresence>
          {templates.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.file_path.split("/").pop()}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground uppercase">{t.file_type}</span>
                  {t.ai_extracted_data && Object.keys(t.ai_extracted_data).length > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle size={10} /> AI ניתח
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle size={10} /> ממתין לניתוח
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-destructive hover:text-destructive shrink-0">
                <Trash2 size={14} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {loaded && templates.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            טרם הועלו תבניות. העלו קובץ כדי לאפשר אימות רכישות אוטומטי.
          </p>
        )}
      </CardContent>
    </Card>
  );
});

InvoiceTemplateUploader.displayName = "InvoiceTemplateUploader";

export default InvoiceTemplateUploader;

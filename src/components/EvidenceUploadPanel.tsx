/**
 * EvidenceUploadPanel — Reviewer-facing evidence submission page
 *
 * Accessible via /evidence/:token (token from dispute email link).
 * No login required — token-based authentication.
 *
 * Flow:
 *   1. Page loads → calls dispute-engine with action:"verify_token"
 *   2. If valid token: shows upload form with countdown
 *   3. User uploads PDF/image → file goes to Supabase Storage
 *   4. Calls dispute-engine with action:"submit_evidence"
 *   5. Confirmation screen
 *
 * Used as a standalone page at /evidence/:token (add route in App.tsx).
 */

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload, FileText, Image as ImageIcon, X, ShieldCheck,
  Clock, AlertTriangle, CheckCircle2, Loader2, Scale,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }    from "@/components/ui/badge";
import { toast }    from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar       from "@/components/Navbar";
import Footer       from "@/components/Footer";

type Phase = "loading" | "invalid" | "expired" | "ready" | "uploading" | "done" | "error";

interface TokenInfo {
  reviewId:      string;
  expiresAt:     string;
  businessName:  string;
  reviewSubject: string;
  disputeStatus: string;
}

const EvidenceUploadPanel = () => {
  const { token } = useParams<{ token: string }>();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [phase, setPhase]       = useState<Phase>("loading");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // ── Verify token on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPhase("invalid"); return; }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("dispute-engine", {
          body: { action: "verify_token", token },
        });

        if (error || !data?.success) {
          const msg = data?.error ?? "";
          setPhase(msg.includes("expired") || msg.includes("already been used") ? "expired" : "invalid");
          return;
        }

        setTokenInfo(data as TokenInfo);
        setPhase("ready");
      } catch {
        setPhase("error");
      }
    })();
  }, [token]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenInfo?.expiresAt) return;
    const update = () => {
      const diff = new Date(tokenInfo.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeRemaining("פג תוקף"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [tokenInfo]);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי — מקסימום 15MB");
      return;
    }
    setSelectedFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Submit evidence ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile || !token || !tokenInfo) return;
    setPhase("uploading");

    try {
      // Upload to Supabase Storage (evidence bucket — private)
      const ext      = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `disputes/${tokenInfo.reviewId}/${Date.now()}-evidence.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("invoices")          // re-use the invoices bucket (private)
        .upload(filePath, selectedFile, { upsert: false });

      if (uploadErr) throw uploadErr;

      // Submit evidence via Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke("dispute-engine", {
        body: { action: "submit_evidence", token, filePath },
      });

      if (fnErr || !data?.success) {
        throw new Error(data?.error ?? fnErr?.message ?? "שגיאה לא ידועה");
      }

      setPhase("done");
    } catch (err: any) {
      toast.error("שגיאה בהעלאה", { description: err.message });
      setPhase("ready");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />
      <div className="container py-16 max-w-xl">

        {/* Loading */}
        {phase === "loading" && (
          <div className="text-center py-20">
            <Loader2 size={36} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">בודק את הלינק...</p>
          </div>
        )}

        {/* Invalid / Expired */}
        {(phase === "invalid" || phase === "expired") && (
          <Card className="shadow-card bg-card border-destructive/30">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle size={48} className="text-destructive mx-auto" />
              <h2 className="font-display font-bold text-xl text-foreground">
                {phase === "expired" ? "פג תוקף הלינק" : "לינק לא תקין"}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {phase === "expired"
                  ? "חלון ה-72 שעות לחקירה עבר. אם אתה חושב שמדובר בטעות, פנה אלינו."
                  : "הלינק שהגעת דרכו אינו תקין. ייתכן שהוא כבר שומש או שנשמר לא נכון."}
              </p>
              <p className="text-xs text-muted-foreground">
                לעזרה:{" "}
                <a href="mailto:legal@reviewshub.info" className="text-primary hover:underline">
                  legal@reviewshub.info
                </a>
              </p>
              <Link to="/"><Button variant="outline" className="w-full">חזרה לדף הבית</Button></Link>
            </CardContent>
          </Card>
        )}

        {/* Ready to upload */}
        {phase === "ready" && tokenInfo && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Header card */}
            <Card className="shadow-card bg-card animated-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Scale size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground">הביקורת שלך נמצאת בחקירה</p>
                    <p className="text-xs text-muted-foreground">
                      עסק <strong>{tokenInfo.businessName}</strong> ערער על ביקורתך
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground border border-border/40 mb-4">
                  נושא הביקורת: <strong className="text-foreground">{tokenInfo.reviewSubject || "ביקורת"}</strong>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
                  <Clock size={20} className="text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">זמן שנותר להגשת ראיה</p>
                    <p className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                      {timeRemaining}
                    </p>
                  </div>
                  <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-0 shrink-0">
                    72 שעות
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Upload card */}
            <Card className="shadow-card bg-card">
              <CardContent className="p-6 space-y-4">
                <p className="font-semibold text-foreground">העלאת הוכחת עסקה</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  העלה קבלה, חשבונית, חוזה, אישור תשלום, או כל מסמך המעיד על כך שאכן ביצעת עסקה
                  עם <strong>{tokenInfo.businessName}</strong>. הקובץ מאוחסן מוצפן ונגיש רק לצוות
                  הבדיקה של ReviewHub.
                </p>

                {/* File drop zone */}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-upload"
                />
                {!selectedFile ? (
                  <label
                    htmlFor="evidence-upload"
                    className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <Upload size={32} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium text-foreground text-sm">לחץ לבחירת קובץ</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP — עד 15MB</p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/8 border border-primary/20">
                    {selectedFile.type.startsWith("image/")
                      ? <ImageIcon size={18} className="text-primary shrink-0" />
                      : <FileText  size={18} className="text-primary shrink-0" />}
                    <span className="flex-1 text-sm text-foreground truncate">{selectedFile.name}</span>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  <ShieldCheck size={15} className="ml-2" />
                  שליחת הוכחה לבדיקה
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-snug">
                  🔒 הקובץ מוצפן ונגיש רק לצוות הבדיקה של ReviewHub. לא יועבר לעסק.{" "}
                  <a href="/terms" className="text-primary hover:underline">תנאי שימוש</a>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Uploading */}
        {phase === "uploading" && (
          <div className="text-center py-20 space-y-4">
            <Loader2 size={36} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">מעלה ושולח לבדיקה...</p>
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-card bg-card border-primary/20">
              <CardContent className="p-8 text-center space-y-5">
                <CheckCircle2 size={56} className="text-primary mx-auto" />
                <div>
                  <p className="font-display font-bold text-xl text-foreground">הראיה התקבלה ✓</p>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    צוות ReviewHub יבחן את המסמך תוך <strong>48 שעות</strong> ויעדכן אותך בדוא"ל.
                    אם הראיה תקפה, הביקורת שלך תוחזר עם תג <strong>✓ מאומת משפטית</strong>.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/8 border border-primary/20 text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground block mb-1">מה קורה עכשיו?</strong>
                  Admin בודק את הראיה → אם תקפה, ביקורתך מוחזרת עם תג "מאומת משפטית" ← נקודות שוחררות ← עסק מקבל הודעה.
                </div>
                <Link to="/">
                  <Button className="w-full">חזרה לפלטפורמה</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EvidenceUploadPanel;

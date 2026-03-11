/**
 * TwoFactorSetup.tsx
 *
 * TOTP enrollment / management widget for the user's account settings page.
 *
 * States:
 *   "idle"     — show current status (enrolled or not) + action button
 *   "enroll"   — show QR code + manual secret + 6-digit verification input
 *   "unenroll" — show confirmation dialog before removing the factor
 *
 * Usage:
 *   import TwoFactorSetup from "@/components/TwoFactorSetup";
 *   <TwoFactorSetup />
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────

type SetupStep = "idle" | "enroll" | "verifying";

// ─────────────────────────────────────────────────────────────────────────────

const TwoFactorSetup = () => {
  const { mfaEnroll, mfaVerifyEnrollment, mfaUnenroll, mfaListFactors } = useAuth();

  const [step,        setStep]        = useState<SetupStep>("idle");
  const [factorId,    setFactorId]    = useState<string | null>(null);
  const [qrCode,      setQrCode]      = useState<string>("");
  const [secret,      setSecret]      = useState<string>("");
  const [code,        setCode]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const [checking,    setChecking]    = useState(true);  // initial factor check
  const [enrolled,    setEnrolled]    = useState(false);
  const [enrolledId,  setEnrolledId]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  // ── Check current enrollment status on mount ───────────────────────────────
  useEffect(() => {
    (async () => {
      const { totp, error } = await mfaListFactors();
      setChecking(false);
      if (error) return;
      const verified = totp.find((f: any) => f.status === "verified");
      if (verified) {
        setEnrolled(true);
        setEnrolledId(verified.id);
      }
    })();
  }, [mfaListFactors]);

  // ── Begin enrollment ───────────────────────────────────────────────────────
  const handleStartEnroll = async () => {
    setLoading(true);
    const { qrCode: qr, secret: s, factorId: fid, error } = await mfaEnroll();
    setLoading(false);

    if (error || !fid) {
      toast.error("שגיאה בהפעלת 2FA — נסו שוב.");
      return;
    }

    setQrCode(qr);
    setSecret(s);
    setFactorId(fid);
    setStep("enroll");
  };

  // ── Verify first code to confirm enrollment ────────────────────────────────
  const handleVerifyEnrollment = async () => {
    if (!factorId || code.length !== 6) return;
    setStep("verifying");
    setLoading(true);

    const { error } = await mfaVerifyEnrollment(factorId, code);
    setLoading(false);

    if (error) {
      setStep("enroll");
      setCode("");
      toast.error("קוד שגוי — בדקו את האפליקציה ונסו שנית.");
      return;
    }

    setEnrolled(true);
    setEnrolledId(factorId);
    setStep("idle");
    toast.success("אימות דו-שלבי הופעל בהצלחה!");
  };

  // ── Auto-submit once 6 digits entered in enrollment step ──────────────────
  useEffect(() => {
    if (code.length === 6 && step === "enroll" && !loading) {
      handleVerifyEnrollment();
    }
  }, [code]);

  // ── Unenroll ───────────────────────────────────────────────────────────────
  const handleUnenroll = async () => {
    if (!enrolledId) return;
    setLoading(true);
    const { error } = await mfaUnenroll(enrolledId);
    setLoading(false);

    if (error) {
      toast.error("שגיאה בהסרת 2FA — נסו שוב.");
      return;
    }

    setEnrolled(false);
    setEnrolledId(null);
    setStep("idle");
    toast.success("אימות דו-שלבי הוסר.");
  };

  // ── Copy secret ────────────────────────────────────────────────────────────
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (checking) {
    return (
      <Card className="elegant-card" dir="rtl">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // ── Idle / status view ─────────────────────────────────────────────────────

  if (step === "idle") {
    return (
      <Card className="elegant-card" dir="rtl">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              אימות דו-שלבי (2FA)
            </span>
            <Badge variant={enrolled ? "default" : "secondary"}>
              {enrolled ? "פעיל" : "לא פעיל"}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {enrolled
              ? "החשבון שלכם מוגן עם אימות דו-שלבי באמצעות TOTP."
              : "הגנו על חשבונכם בשכבת אבטחה נוספת — נדרש קוד חד-פעמי בכל כניסה."}
          </p>
        </CardHeader>

        <CardContent>
          {enrolled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  className="gap-2"
                >
                  <ShieldOff className="h-4 w-4" />
                  הסירו אימות דו-שלבי
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>הסרת אימות דו-שלבי</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם אתם בטוחים? לאחר ההסרה, תתחברו עם סיסמה בלבד ללא קוד נוסף.
                    מומלץ לא לעשות זאת.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogAction
                    onClick={handleUnenroll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> מסיר...</>
                      : "הסירו 2FA"
                    }
                  </AlertDialogAction>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={handleStartEnroll}
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> טוען...</>
                : <><ShieldCheck className="h-4 w-4" /> הפעילו 2FA</>
              }
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Enroll view — QR code + secret + code input ────────────────────────────

  return (
    <Card className="elegant-card" dir="rtl">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          הגדרת אימות דו-שלבי
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          סרקו את ה-QR עם אפליקציית אימות (Google Authenticator, Authy וכו׳)
          ולאחר מכן הזינו את הקוד שמופיע.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* QR Code */}
        {qrCode && (
          <div className="flex justify-center">
            <div
              className="w-44 h-44 bg-white rounded-xl p-2 flex items-center justify-center shadow-sm"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
          </div>
        )}

        {/* Manual entry secret */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            לא יכולים לסרוק? הזינו את המפתח ידנית:
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs bg-secondary px-3 py-2 rounded-md font-mono tracking-widest break-all"
              dir="ltr"
            >
              {secret}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopySecret}
              className="shrink-0"
              aria-label="העתק מפתח"
            >
              {copied
                ? <Check className="h-4 w-4 text-green-500" />
                : <Copy className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* OTP input */}
        <div className="space-y-2">
          <p className="text-sm font-medium">הזינו את הקוד מהאפליקציה לאישור:</p>
          <div className="flex justify-center" dir="ltr">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={loading || step === "verifying"}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-11 h-12 text-lg rounded-md border-border/60 focus:border-primary"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button
          onClick={handleVerifyEnrollment}
          disabled={code.length !== 6 || loading || step === "verifying"}
          className="w-full bg-primary text-primary-foreground glow-primary gap-2"
        >
          {loading || step === "verifying"
            ? <><Loader2 className="h-4 w-4 animate-spin" /> מאמת...</>
            : "אשרו והפעילו 2FA"
          }
        </Button>

        <button
          type="button"
          onClick={() => { setStep("idle"); setCode(""); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          ← ביטול
        </button>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;

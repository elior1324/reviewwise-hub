/**
 * TwoFactorVerify.tsx
 *
 * Shown during the login flow when the user has TOTP enrolled and
 * signIn() returns { mfaRequired: true, mfaFactorId }.
 *
 * Flow:
 *   1. Mount → call mfaChallenge(factorId) to open a server challenge.
 *   2. User enters the 6-digit code from their authenticator app.
 *   3. Submit → call mfaVerify(factorId, challengeId, code).
 *   4. On success → parent clears the MFA step (user is now fully signed in).
 *   5. On failure → show Hebrew error; allow retry (challenge stays valid).
 */
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────

interface TwoFactorVerifyProps {
  factorId: string;
  /** Called when the TOTP code is verified successfully. */
  onSuccess: () => void;
  /** Called when the user clicks "Cancel / back to login". */
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const TwoFactorVerify = ({ factorId, onSuccess, onCancel }: TwoFactorVerifyProps) => {
  const { mfaChallenge, mfaVerify } = useAuth();

  const [code,        setCode]        = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [challenging, setChallenging] = useState(true); // opening challenge on mount

  const hasChallenged = useRef(false);

  // ── Open challenge on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (hasChallenged.current) return;
    hasChallenged.current = true;

    (async () => {
      const { challengeId: cid, error } = await mfaChallenge(factorId);
      setChallenging(false);
      if (error || !cid) {
        toast.error("שגיאה בפתיחת אתגר 2FA — נסו שוב.");
        onCancel();
        return;
      }
      setChallengeId(cid);
    })();
  }, [factorId, mfaChallenge, onCancel]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!challengeId || code.length !== 6) return;
    setLoading(true);

    const { error } = await mfaVerify(factorId, challengeId, code);

    setLoading(false);
    if (error) {
      setCode("");
      toast.error("קוד שגוי או פג תוקף — בדקו את האפליקציה ונסו שנית.");
      return;
    }

    toast.success("אומת בהצלחה!");
    onSuccess();
  };

  // ── Auto-submit once 6 digits entered ─────────────────────────────────────
  useEffect(() => {
    if (code.length === 6 && challengeId && !loading) {
      handleVerify();
    }
  }, [code]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Card className="w-full max-w-md elegant-card" dir="rtl">
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="font-display text-xl">אימות דו-שלבי</CardTitle>
        <p className="text-sm text-muted-foreground">
          פתחו את אפליקציית האימות והזינו את הקוד בן 6 הספרות
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {challenging ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* OTP input — 6 slots */}
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={loading}
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

            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading || !challengeId}
              className="w-full bg-primary text-primary-foreground glow-primary gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> מאמת...</>
                : <><ArrowRight className="h-4 w-4" /> אמתו קוד</>
              }
            </Button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← חזרה להתחברות
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorVerify;

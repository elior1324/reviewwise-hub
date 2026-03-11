/**
 * ResetPassword.tsx
 *
 * The page a user lands on after clicking the "Reset password" link in their email.
 * Supabase fires a PASSWORD_RECOVERY event via onAuthStateChange (works with both the
 * legacy implicit-grant flow and the modern PKCE flow — never depends on hash parsing).
 *
 * Security requirements enforced here:
 *  • New password must pass the full validatePassword() check (8 chars, upper, lower,
 *    digit, symbol, blocklist, pattern).
 *  • Confirm-password field must match before the request is sent.
 *  • minLength HTML attribute is set to 8 to prevent browser auto-fill bypass.
 *  • The strength meter gives the user live feedback while they type.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { validatePassword } from "@/lib/password-validation";
import { translateAuthError } from "@/lib/auth-errors";
import PasswordStrengthMeter from "@/components/ui/password-strength-meter";

const ResetPassword = () => {
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  // True once Supabase fires the PASSWORD_RECOVERY event
  const [isRecovery, setIsRecovery]     = useState(false);
  const navigate = useNavigate();

  // ── Listen for Supabase PASSWORD_RECOVERY event ────────────────────────────
  // This works with BOTH the legacy implicit-grant hash flow and the modern
  // PKCE flow. Never parse the URL hash directly — let Supabase handle it.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Full validation (all 5 rules + blocklist + patterns)
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      toast.error(pwCheck.message);
      return;
    }

    // 2. Confirm field must match
    if (password !== confirm) {
      toast.error("הסיסמאות אינן תואמות — נסו שנית");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(translateAuthError(error.message));
    } else {
      toast.success("הסיסמה עודכנה בהצלחה!", {
        description: "מעבירים אתכם לדף ההתחברות.",
      });
      // Sign the user out so they log in fresh with the new password
      await supabase.auth.signOut();
      navigate("/auth");
    }
    setLoading(false);
  };

  // ── Invalid / expired link state ───────────────────────────────────────────
  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="container flex items-center justify-center py-20 pb-32">
          <Card className="w-full max-w-md elegant-card text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold">ממתינים לקישור איפוס</h2>
              <p className="text-sm text-muted-foreground">
                הקישור אינו תקין, פג תוקפו, או שכבר השתמשתם בו.
                <br />
                בקשו קישור חדש מדף ההתחברות.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                חזרה להתחברות
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Password reset form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container flex items-center justify-center py-10 md:py-20 pb-32">
        <Card className="w-full max-w-md elegant-card">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="font-display text-2xl">איפוס סיסמה</CardTitle>
            <p className="text-sm text-muted-foreground">
              בחרו סיסמה חזקה וחדשה לחשבונכם
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── New password ─────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="new-password">סיסמה חדשה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10 pl-10"
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />
                    }
                  </button>
                </div>

                {/* Strength meter — shown while typing */}
                {password.length > 0 && (
                  <PasswordStrengthMeter password={password} />
                )}
              </div>

              {/* ── Confirm password ─────────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">אימות סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={`pr-10 pl-10 ${
                      confirm.length > 0 && confirm !== password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "הסתר אימות סיסמה" : "הצג אימות סיסמה"}
                  >
                    {showConfirm
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />
                    }
                  </button>
                </div>
                {/* Mismatch hint */}
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-destructive" role="alert">
                    הסיסמאות אינן תואמות
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground gap-2"
                disabled={loading || (confirm.length > 0 && confirm !== password)}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> מעדכן...</>
                  : "עדכנו סיסמה"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;

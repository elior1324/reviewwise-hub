import { useState, useEffect, useRef } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TwoFactorVerify from "@/components/TwoFactorVerify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, ShieldAlert, AlertTriangle } from "lucide-react";
import PrivacyConsentCheckbox from "@/components/PrivacyConsentCheckbox";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import TurnstileWidget from "@/components/TurnstileWidget";
import { validatePassword } from "@/lib/password-validation";
import { translateAuthError } from "@/lib/auth-errors";
import PasswordStrengthMeter from "@/components/ui/password-strength-meter";
import { supabase } from "@/integrations/supabase/client";
import { formatCountdown, secondsUntil } from "@/lib/auth-security";

// ─────────────────────────────────────────────────────────────────────────────

const AuthPage = () => {
  const [mode,           setMode]           = useState<"login" | "signup" | "forgot" | "mfa">("login");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [displayName,    setDisplayName]    = useState("");
  const [showPassword,   setShowPassword]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [googleLoading,  setGoogleLoading]  = useState(false);
  const [appleLoading,   setAppleLoading]   = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // MFA state — populated after a successful password auth that requires AAL2
  const [mfaFactorId,   setMfaFactorId]   = useState<string>("");

  // Rate-limit UI state
  const [lockedUntilMs,      setLockedUntilMs]      = useState<number | null>(null);
  const [remainingAttempts,  setRemainingAttempts]  = useState<number | null>(null);
  const [countdown,          setCountdown]          = useState<string>("");

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();

  // ── Countdown ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (lockedUntilMs === null) {
      setCountdown("");
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      return;
    }

    const tick = () => {
      const secs = secondsUntil(lockedUntilMs);
      setCountdown(formatCountdown(secs));
      if (secs === 0) {
        setLockedUntilMs(null);
        setRemainingAttempts(null);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockedUntilMs]);

  // ── Email + password submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" && !privacyConsent) {
      toast.error("יש לאשר את מדיניות הפרטיות ותנאי השימוש כדי להירשם.");
      return;
    }
    if (mode !== "forgot" && !turnstileToken) {
      toast.error("אנא אמתו שאתם לא רובוט.");
      return;
    }
    if (mode === "signup") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        toast.error(pwCheck.message);
        return;
      }
    }

    setLoading(true);

    if (mode === "login") {
      const result = await signIn(email, password, turnstileToken ?? undefined);

      if (result.rateLimit && !result.rateLimit.allowed) {
        // Locked out — show countdown
        setLockedUntilMs(result.rateLimit.lockedUntilMs);
        setRemainingAttempts(0);
        toast.error(translateAuthError(result.error?.message ?? "account_locked"));
        setLoading(false);
        return;
      }

      if (result.error) {
        // Show remaining attempts warning if close to lockout
        if (result.rateLimit && result.rateLimit.remainingAttempts !== undefined) {
          setRemainingAttempts(result.rateLimit.remainingAttempts);
        }
        toast.error(translateAuthError(result.error.message));
        setLoading(false);
        return;
      }

      // MFA required — switch to MFA step
      if (result.mfaRequired && result.mfaFactorId) {
        setMfaFactorId(result.mfaFactorId);
        setMode("mfa");
        setLoading(false);
        return;
      }

      // Full login success
      setRemainingAttempts(null);
      setLockedUntilMs(null);
      toast.success("התחברתם בהצלחה!");
      navigate("/");

    } else if (mode === "signup") {
      const { data, error } = await signUp(email, password, displayName, turnstileToken ?? undefined);
      if (error) {
        toast.error(translateAuthError(error.message));
      } else if (!data?.user) {
        toast.error("ההרשמה נכשלה — ייתכן בעיה בשרת. אנא נסו שנית או פנו לתמיכה.");
      } else {
        toast.success("נרשמתם בהצלחה! בדקו את המייל לאימות.");
      }

    } else {
      // ── Forgot password — send reset email ───────────────────────────────
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Must match a URL listed in Supabase → Auth → URL Configuration → Redirect URLs
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(translateAuthError(error.message));
      } else {
        toast.success("קישור לאיפוס סיסמה נשלח לאימייל שלכם.", {
          description: "בדקו את תיבת הדואר הנכנס (וגם ספאם).",
          duration: 6000,
        });
        setMode("login");
      }
    }

    setLoading(false);
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "שגיאה בהתחברות עם Google");
      setGoogleLoading(false);
    }
  };

  // ── Apple OAuth ────────────────────────────────────────────────────────────
  const handleAppleAuth = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      toast.error(error.message || "שגיאה בהתחברות עם Apple");
      setAppleLoading(false);
    }
  };

  // ── MFA callbacks ──────────────────────────────────────────────────────────
  const handleMfaSuccess = () => {
    toast.success("התחברתם בהצלחה!");
    navigate("/");
  };

  const handleMfaCancel = () => {
    setMode("login");
    setMfaFactorId("");
  };

  // ── Derived UI state ───────────────────────────────────────────────────────
  const isForgot       = mode === "forgot";
  const isSignup       = mode === "signup";
  const isLocked       = lockedUntilMs !== null;

  const submitDisabled =
    loading ||
    isLocked ||
    (isSignup && !privacyConsent) ||
    (!isForgot && !turnstileToken);

  const title = isForgot
    ? "שכחתם סיסמה?"
    : mode === "login"
    ? "התחברו ל-ReviewHub"
    : "הצטרפו ל-ReviewHub";

  const subtitle = isForgot
    ? "הזינו את כתובת האימייל שלכם ונשלח קישור לאיפוס הסיסמה"
    : mode === "login"
    ? "הזינו את פרטי ההתחברות שלכם"
    : "צרו חשבון חדש תוך שניות";

  // ─────────────────────────────────────────────────────────────────────────

  // MFA step — replace the whole card with the verify widget
  if (mode === "mfa") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="container flex items-center justify-center py-10 md:py-20 pb-32">
          <TwoFactorVerify
            factorId={mfaFactorId}
            onSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container flex items-center justify-center py-10 md:py-20 pb-32">
        <Card className="w-full max-w-md elegant-card">
          <CardHeader className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-2">
              <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="font-display text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* ── Account locked banner ──────────────────────────────────────── */}
            {isLocked && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm space-y-0.5">
                  <p className="font-medium text-destructive">החשבון נעול זמנית</p>
                  <p className="text-muted-foreground">
                    יותר מדי ניסיונות כושלים. נסו שוב בעוד{" "}
                    <span className="font-mono font-semibold text-foreground">{countdown}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── Remaining attempts warning ─────────────────────────────────── */}
            {!isLocked && remainingAttempts !== null && remainingAttempts <= 2 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {remainingAttempts === 0
                    ? "נסיון נוסף יגרום לנעילת החשבון."
                    : `נותרו ${remainingAttempts} ניסיונות לפני נעילה.`}
                </p>
              </div>
            )}

            {/* ── Google OAuth (hidden on forgot-password mode) ─────────────── */}
            {!isForgot && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/50 hover:bg-secondary gap-3 h-12"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || isLocked}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> מתחבר...</>
                    : mode === "login" ? "התחברו עם Google" : "הירשמו עם Google"
                  }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/50 hover:bg-secondary gap-3 h-12"
                  onClick={handleAppleAuth}
                  disabled={appleLoading || isLocked}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {appleLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> מתחבר...</>
                    : mode === "login" ? "התחברו עם Apple" : "הירשמו עם Apple"
                  }
                </Button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">או</span>
                  <Separator className="flex-1" />
                </div>
              </>
            )}

            {/* ── Main form ─────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Display name — signup only */}
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">שם תצוגה</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="name"
                      placeholder="השם שלכם"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pr-10"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pr-10"
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password — hidden in forgot mode */}
              {!isForgot && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">סיסמה</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:underline"
                      >
                        שכחתם סיסמה?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pr-10 pl-10"
                      dir="ltr"
                      autoComplete={isSignup ? "new-password" : "current-password"}
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

                  {/* Strength meter — shown while typing in signup */}
                  {isSignup && password.length > 0 && (
                    <PasswordStrengthMeter password={password} />
                  )}
                </div>
              )}

              {isSignup && (
                <PrivacyConsentCheckbox
                  checked={privacyConsent}
                  onCheckedChange={setPrivacyConsent}
                  className="mt-1"
                />
              )}

              {mode === "login" && <FormPrivacyNotice className="mt-1" />}

              {/* Turnstile — hidden in forgot mode */}
              {!isForgot && (
                <TurnstileWidget
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  className="flex justify-center mt-2"
                />
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground glow-primary gap-2"
                disabled={submitDisabled}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> טוען...</>
                  : isForgot
                  ? <><ArrowRight className="h-4 w-4" /> שלחו קישור לאיפוס</>
                  : isLocked
                  ? `נעול — ${countdown}`
                  : mode === "login"
                  ? "התחברו"
                  : "הרשמו"
                }
              </Button>
            </form>

            {/* ── Mode switcher ─────────────────────────────────────────────── */}
            <div className="text-center space-y-1">
              {isForgot ? (
                <button
                  onClick={() => setMode("login")}
                  className="text-sm text-primary hover:underline"
                >
                  ← חזרה להתחברות
                </button>
              ) : (
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-primary hover:underline"
                >
                  {mode === "login"
                    ? "אין לכם חשבון? הרשמו כאן"
                    : "כבר יש לכם חשבון? התחברו"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;

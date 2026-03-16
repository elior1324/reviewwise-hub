import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Mail, Lock, User, Eye, EyeOff, Loader2, MailCheck, RefreshCw,
  CheckCheck, AlertCircle, ArrowRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PrivacyConsentCheckbox from "@/components/PrivacyConsentCheckbox";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import { validatePassword } from "@/lib/password-validation";
import { translateAuthError } from "@/lib/auth-errors";
import PasswordStrengthMeter from "@/components/ui/password-strength-meter";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────

interface BusinessAuthProps {
  mode: "login" | "signup";
}

const BusinessAuth = ({ mode }: BusinessAuthProps) => {
  const [email,               setEmail]               = useState("");
  const [turnstileToken,      setTurnstileToken]      = useState<string | null>(null);
  const [turnstileError,      setTurnstileError]      = useState(false);
  const [turnstileAttempts,   setTurnstileAttempts]   = useState(0);
  const [turnstileKey,        setTurnstileKey]        = useState(0);
  const [password,            setPassword]            = useState("");
  const [confirmPassword,     setConfirmPassword]     = useState("");
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name,                setName]                = useState("");
  const [loading,             setLoading]             = useState(false);
  const [privacyConsent,      setPrivacyConsent]      = useState(false);
  const [googleLoading,       setGoogleLoading]       = useState(false);
  const [appleLoading,        setAppleLoading]        = useState(false);

  // ── B-02: Email confirmation state (shown after successful signup) ──────────
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [confirmedEmail,   setConfirmedEmail]   = useState("");
  const [resending,        setResending]        = useState(false);

  // ── Forgot-password inline mode ─────────────────────────────────────────────
  const [forgotMode,  setForgotMode]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();

  // ── Main submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!privacyConsent) {
          toast.error("יש לאשר את מדיניות הפרטיות ותנאי השימוש");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("הסיסמאות אינן תואמות", {
            description: "וודאו שהסיסמה ואישורה זהים.",
          });
          setLoading(false);
          return;
        }
        const pwCheck = validatePassword(password);
        if (!pwCheck.valid) {
          toast.error(pwCheck.message);
          setLoading(false);
          return;
        }
        if (!turnstileToken) {
          toast.error("אנא השלימו את אימות האנושיות");
          setLoading(false);
          return;
        }
        const { data, error } = await signUp(email, password, name, turnstileToken);

        if (error) throw error;
        if (!data?.user) {
          throw new Error("ההרשמה נכשלה — ייתכן בעיה בשרת. אנא נסו שנית או פנו לתמיכה.");
        }

        // ── B-02: Instead of a disappearing toast, show a persistent confirmation screen ──
        setConfirmedEmail(email);
        setShowEmailConfirm(true);

      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/business/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend confirmation email ───────────────────────────────────────────────
  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: confirmedEmail });
      if (error) throw error;
      toast.success("אימייל האימות נשלח מחדש בהצלחה");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("שגיאה בשליחה מחדש: " + msg);
    } finally {
      setResending(false);
    }
  };

  // ── Forgot password — send reset email ─────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("אנא הזינו כתובת אימייל");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success("קישור לאיפוס סיסמה נשלח לאימייל שלכם.", {
        description: "בדקו את תיבת הדואר הנכנס (וגם ספאם).",
        duration: 6000,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth handlers ──────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    // Pass intent=business so AuthCallback knows to funnel the user into
    // business registration (instead of the regular learner homepage).
    const { error } = await signInWithGoogle(
      `${window.location.origin}/auth/callback?intent=business`
    );
    if (error) {
      toast.error(error.message || "שגיאה בהתחברות עם Google");
      setGoogleLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      toast.error(error.message || "שגיאה בהתחברות עם Apple");
      setAppleLoading(false);
    }
  };

  // ── B-02: Email confirmation screen ────────────────────────────────────────
  if (showEmailConfirm) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <BusinessNavbar />
        <div className="container py-20 flex justify-center">
          <Card className="w-full max-w-md shadow-card bg-card">
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <MailCheck size={32} className="text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground mb-2">
                  בדקו את תיבת האימייל שלכם
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  שלחנו קישור לאימות החשבון לכתובת:
                </p>
                <p className="font-mono text-sm font-semibold text-primary mt-1 break-all">
                  {confirmedEmail}
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-right space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">השלבים הבאים:</p>
                {[
                  "לחצו על הקישור באימייל לאימות החשבון",
                  "לאחר האימות תועברו לדף הרשמת העסק",
                  "מלאו את פרטי העסק שלכם ותוכלו להתחיל",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                לא קיבלתם את האימייל? בדקו את תיקיית הספאם, או:
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleResendEmail}
                disabled={resending}
              >
                {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                שלח שוב את האימייל
              </Button>

              <Separator />

              <p className="text-sm text-muted-foreground">
                כבר אימתתם?{" "}
                <Link to="/business/login" className="text-primary hover:underline font-medium">
                  התחברו כאן
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  // ── Forgot-password screen ──────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <BusinessNavbar />
        <div className="container py-20 flex justify-center">
          <Card className="w-full max-w-md shadow-card bg-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">שכחתם סיסמה?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                הזינו את כתובת האימייל שלכם ונשלח קישור לאיפוס הסיסמה
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {forgotSent ? (
                /* ── Success state ── */
                <div className="space-y-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <MailCheck size={28} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">הקישור נשלח!</p>
                    <p className="text-sm text-muted-foreground">
                      בדקו את תיבת הדואר הנכנס עבור{" "}
                      <span className="font-medium text-foreground">{forgotEmail}</span>
                      {" "}(כולל ספאם).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}
                  >
                    ← חזרה להתחברות
                  </Button>
                </div>
              ) : (
                /* ── Send-reset form ── */
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="כתובת אימייל"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pr-10 glass border-border/50"
                      required
                      dir="ltr"
                      autoComplete="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
                    disabled={loading}
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> שולח...</>
                      : <><ArrowRight size={16} /> שלחו קישור לאיפוס</>
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full text-sm text-primary hover:underline text-center"
                  >
                    ← חזרה להתחברות
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  // ── Main auth form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />
      <div className="container py-20 flex justify-center">
        <Card className="w-full max-w-md shadow-card animated-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {mode === "login" ? "ברוכים השבים" : "צרו חשבון עסקי"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "התחברו כדי לנהל את הביקורות והנתונים שלכם"
                : "התחילו לאסוף ביקורות מאומתות עוד היום"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-border/50 hover:bg-secondary gap-3 h-12"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "מתחבר..." : mode === "login" ? "התחברו עם Google" : "הירשמו עם Google"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border/50 hover:bg-secondary gap-3 h-12"
              onClick={handleAppleAuth}
              disabled={appleLoading}
            >
              {appleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {appleLoading ? "מתחבר..." : mode === "login" ? "התחברו עם Apple" : "הירשמו עם Apple"}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">או</span>
              <Separator className="flex-1" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="שם העסק / שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 glass border-border/50"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="כתובת אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 glass border-border/50"
                  required
                  dir="ltr"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="סיסמה"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10 glass border-border/50"
                    required
                    minLength={8}
                    dir="ltr"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength meter — shown only in signup while typing */}
                {mode === "signup" && password.length > 0 && (
                  <PasswordStrengthMeter password={password} />
                )}
              </div>

              {/* Confirm password — signup only */}
              {mode === "signup" && (
                <div className="space-y-1">
                  <div className="relative">
                    <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="אימות סיסמה"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 pl-10 glass border-border/50"
                      required
                      minLength={8}
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Inline match feedback */}
                  {confirmPassword.length > 0 && (
                    password === confirmPassword ? (
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCheck size={12} aria-hidden="true" />
                        הסיסמאות תואמות
                      </p>
                    ) : (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle size={12} aria-hidden="true" />
                        הסיסמאות אינן תואמות
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Forgot password link — login mode only */}
              {mode === "login" && (
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    שכחתם סיסמה?
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <PrivacyConsentCheckbox
                  checked={privacyConsent}
                  onCheckedChange={setPrivacyConsent}
                  className="mt-1"
                />
              )}

              {mode === "login" && <FormPrivacyNotice className="mt-1" />}

              {/* Turnstile — signup only, using the wrapper that handles dev bypass */}
              {mode === "signup" && (
                <>
                  {turnstileError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                      <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-destructive font-medium">אימות CAPTCHA נכשל</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          לא הצלחנו לאמת שאתם לא רובוט. לחצו על "נסו שוב" או רעננו את הדף.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setTurnstileError(false);
                          setTurnstileToken(null);
                          setTurnstileAttempts(0);
                          setTurnstileKey(k => k + 1);
                        }}
                      >
                        <RefreshCw size={12} />
                        נסו שוב
                      </Button>
                    </div>
                  ) : (
                    <TurnstileWidget
                      key={turnstileKey}
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                        setTurnstileError(false);
                        setTurnstileAttempts(0);
                      }}
                      onError={() => {
                        setTurnstileToken(null);
                        const next = turnstileAttempts + 1;
                        setTurnstileAttempts(next);
                        if (next <= 1) {
                          // Silent auto-retry on first error
                          setTurnstileKey(k => k + 1);
                        } else {
                          setTurnstileError(true);
                        }
                      }}
                      onExpire={() => setTurnstileToken(null)}
                    />
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
                disabled={
                  loading ||
                  (mode === "signup" && !privacyConsent) ||
                  (mode === "signup" && confirmPassword.length > 0 && password !== confirmPassword)
                }
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "טוען..." : mode === "login" ? "התחברו" : "צרו חשבון"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              ההרשמה מחברת אוטומטית את חשבון Google שלכם לחשבון העסקי — ניתן להתחבר בכל דרך שתבחרו.
            </p>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>אין לכם חשבון? <Link to="/business/signup" className="text-primary hover:underline">הירשמו</Link></>
              ) : (
                <>כבר יש לכם חשבון? <Link to="/business/login" className="text-primary hover:underline">התחברו</Link></>
              )}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">או</span>
              <Separator className="flex-1" />
            </div>

            <Link
              to="/business/dashboard"
              className="flex items-center justify-center w-full border border-dashed border-border/50 hover:bg-accent/50 h-11 text-muted-foreground hover:text-foreground rounded-md text-sm font-medium transition-colors"
            >
              👁️ כניסה לדמו — צפייה בלוח הבקרה
            </Link>
          </CardContent>
        </Card>
      </div>
      <BusinessFooter />
    </div>
  );
};

export default BusinessAuth;

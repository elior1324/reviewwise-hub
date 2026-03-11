import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PrivacyConsentCheckbox from "@/components/PrivacyConsentCheckbox";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import { validatePassword } from "@/lib/password-validation";
import { translateAuthError } from "@/lib/auth-errors";
import PasswordStrengthMeter from "@/components/ui/password-strength-meter";

// ─────────────────────────────────────────────────────────────────────────────

interface BusinessAuthProps {
  mode: "login" | "signup";
}

const BusinessAuth = ({ mode }: BusinessAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [appleLoading, setAppleLoading] = useState(false);

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
        const pwCheck = validatePassword(password);
        if (!pwCheck.valid) {
          toast.error(pwCheck.message);
          setLoading(false);
          return;
        }
        const { data, error } = await signUp(email, password, name);

        if (error) throw error;
        if (!data?.user) {
          // Supabase returned no error but also no user — auth hook likely blocked signup silently
          throw new Error("ההרשמה נכשלה — ייתכן בעיה בשרת. אנא נסו שנית או פנו לתמיכה.");
        }
        toast.success("החשבון נוצר בהצלחה!", { description: "בדקו את האימייל שלכם לאימות החשבון." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/business/dashboard");
      }
    } catch (err: any) {
      toast.error(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    // Pass the business dashboard as the post-login destination.
    // AuthCallback will redirect business users there automatically.
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "שגיאה בהתחברות עם Google");
      setGoogleLoading(false);
    }
    // No finally — redirect already happened if no error.
  };

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
                />
              </div>
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

              {mode === "signup" && (
                <PrivacyConsentCheckbox
                  checked={privacyConsent}
                  onCheckedChange={setPrivacyConsent}
                  className="mt-1"
                />
              )}

              {mode === "login" && <FormPrivacyNotice className="mt-1" />}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
                disabled={loading || (mode === "signup" && !privacyConsent)}
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

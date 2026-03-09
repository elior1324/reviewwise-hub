import { useState, useCallback } from "react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import PrivacyConsentCheckbox from "@/components/PrivacyConsentCheckbox";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import TurnstileWidget from "@/components/TurnstileWidget";
import { validatePassword } from "@/lib/password-validation";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !privacyConsent) {
      toast.error("יש לאשר את מדיניות הפרטיות ותנאי השימוש כדי להירשם.");
      return;
    }
    if (!turnstileToken) {
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
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "פרטי התחברות שגויים" : error.message);
      } else {
        toast.success("התחברתם בהצלחה!");
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("נרשמתם בהצלחה! בדקו את המייל לאימות.");
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהתחברות עם Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container flex items-center justify-center py-10 md:py-20 pb-32">
        <Card className="w-full max-w-md elegant-card">
          <CardHeader className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-2">
              <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="font-display text-2xl">
              {mode === "login" ? "התחברו ל-ReviewHub" : "הצטרפו ל-ReviewHub"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "הזינו את פרטי ההתחברות שלכם"
                : "צרו חשבון חדש תוך שניות"}
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
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "מתחבר..." : mode === "login" ? "התחברו עם Google" : "הירשמו עם Google"}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">או</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">שם תצוגה</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="השם שלכם"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10 pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <PrivacyConsentCheckbox
                  checked={privacyConsent}
                  onCheckedChange={setPrivacyConsent}
                  className="mt-1"
                />
              )}

              {mode === "login" && <FormPrivacyNotice className="mt-1" />}

              <TurnstileWidget
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                className="flex justify-center mt-2"
              />

              <Button type="submit" className="w-full bg-primary text-primary-foreground glow-primary" disabled={loading || (mode === "signup" && !privacyConsent) || !turnstileToken}>
                {loading ? "טוען..." : mode === "login" ? "התחברו" : "הרשמו"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-primary hover:underline"
              >
                {mode === "login" ? "אין לכם חשבון? הרשמו כאן" : "כבר יש לכם חשבון? התחברו"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;

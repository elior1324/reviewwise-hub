import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

interface BusinessAuthProps {
  mode: "login" | "signup";
}

const BusinessAuth = ({ mode }: BusinessAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/business/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="ltr">
      <BusinessNavbar />
      <div className="container py-20 flex justify-center">
        <Card className="w-full max-w-md shadow-card animated-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Your Business Account"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "Sign in to manage your reviews and analytics"
                : "Start collecting verified reviews today"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Business / Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 glass border-border/50"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 glass border-border/50"
                  required
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 glass border-border/50"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" disabled={loading}>
                {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {mode === "login" ? (
                <>Don't have an account? <a href="/business/signup" className="text-primary hover:underline">Sign up</a></>
              ) : (
                <>Already have an account? <a href="/business/login" className="text-primary hover:underline">Sign in</a></>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      <BusinessFooter />
    </div>
  );
};

export default BusinessAuth;

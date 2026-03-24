/**
 * InviteRedirect
 *
 * Public landing page at /invite/:code
 *
 * When a logged-in user shares their personal invite link, this page:
 *   1. Saves the invite code to localStorage ("rh_invite_code")
 *   2. Shows a welcome screen encouraging the visitor to sign up
 *   3. On CTA click, navigates to /auth so the signup flow picks up the code
 *
 * After the new user signs up and confirms their email, AuthContext will
 * call process_user_referral() and award 150 points to the inviter.
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gift, Users, ShieldCheck, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Perks shown on the invite landing page ────────────────────────────────────

const PERKS = [
  {
    icon: <ShieldCheck size={18} className="text-primary" />,
    title: "ביקורות שעברו בדיקה",
    desc: "מערכת סינון פעילה — ללא ספאם, ללא בוטים",
  },
  {
    icon: <Star size={18} className="text-primary" />,
    title: "ציוני אמון שקופים",
    desc: "הבינו מי באמת ראוי לאמון שלכם לפני שאתם קונים",
  },
  {
    icon: <Users size={18} className="text-primary" />,
    title: "קהילה אמינה",
    desc: "הצטרפו לאלפי משתמשים שעוזרים אחד לשני לקנות בחכמה",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const InviteRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate  = useNavigate();

  // Persist the invite code so AuthContext can read it after signup / login
  useEffect(() => {
    if (code) {
      localStorage.setItem("rh_invite_code", code.toUpperCase());
    }
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-lg w-full space-y-8">

          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-sm">
              <Gift size={36} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-foreground mb-2">
                הוזמנתם ל-ReviewHub!
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                חבר שלכם מזמין אתכם לצטרף לקהילת הביקורות המאומתות של ReviewHub.
                הירשמו בחינם ועזרו לחבר שלכם לצבור נקודות.
              </p>
            </div>
          </div>

          {/* Invite code badge */}
          {code && (
            <div className="flex items-center justify-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
              <Users size={16} className="text-primary shrink-0" />
              <span className="text-sm text-foreground">
                קוד הזמנה:{" "}
                <span className="font-bold font-mono text-primary tracking-wider">
                  {code.toUpperCase()}
                </span>
              </span>
            </div>
          )}

          {/* Perks */}
          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="flex items-start gap-3 bg-card border border-border/50 rounded-xl p-4"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {perk.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{perk.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
              size="lg"
            >
              <ArrowLeft size={16} className="ml-2" />
              צרו חשבון חינם עכשיו
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              יש לכם כבר חשבון?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                התחברו
              </button>
            </p>
          </div>

          {/* Fine print */}
          <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
            קוד ההזמנה יישמר באופן מאובטח עד לסיום ההרשמה.
            PointsRewardHub נרשמים בחינם — ללא כרטיס אשראי נדרש.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InviteRedirect;

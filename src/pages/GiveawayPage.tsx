import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, ShieldCheck, Trophy, Star, ArrowLeft, Users, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GiveawayWinner {
  month_year: string;
  prize_amount: number;
  announced_at: string | null;
}

const PRIZE_AMOUNT = 5000;

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (ym: string) => {
  const [year, month] = ym.split("-");
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
};

const GiveawayPage = () => {
  const { user } = useAuth();
  const [winners, setWinners]         = useState<GiveawayWinner[]>([]);
  const [myEntries, setMyEntries]     = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    document.title = "הגרלה חודשית ₪5,000 | ReviewHub";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Past winners (public)
      const { data: winnerData } = await supabase
        .from("giveaway_winners" as any)
        .select("month_year, prize_amount, announced_at")
        .not("announced_at", "is", null)
        .order("month_year", { ascending: false })
        .limit(6);

      setWinners((winnerData || []) as any);

      // This month's entry count (public aggregate)
      const { count } = await supabase
        .from("giveaway_entries" as any)
        .select("id", { count: "exact", head: true })
        .eq("giveaway_month", currentMonth());

      setTotalEntries(count ?? 0);

      // My entries this month
      if (user) {
        const { count: myCount } = await supabase
          .from("giveaway_entries" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("giveaway_month", currentMonth());

        setMyEntries(myCount ?? 0);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const STEPS = [
    {
      icon: <ShieldCheck size={22} className="text-primary" />,
      title: "קנו דרך קישור Verified Deal",
      desc: "לחצו על כפתור «רכישה מאומתת» בדף כל קורס, שירות או מוצר דיגיטלי. הרכישה עוברת דרך תשתית האימות של ReviewHub.",
    },
    {
      icon: <Star size={22} className="text-primary" />,
      title: "כתבו ביקורת מאומתת תוך 30 יום",
      desc: "לאחר הרכישה תקבלו בקשת ביקורת. שתפו את החוויה שלכם — ביקורת אמיתית, מינימום 10 תווים.",
    },
    {
      icon: <Gift size={22} className="text-primary" />,
      title: "נכנסים להגרלה אוטומטית",
      desc: "כל ביקורת מאומתת = כניסה אחת להגרלה החודשית. הגרלה מתקיימת ב-1 לכל חודש.",
    },
    {
      icon: <Trophy size={22} className="text-primary" />,
      title: "זוכים ₪5,000",
      desc: "הפרס ניתן לשימוש לרכישת כל קורס, שירות או מוצר דיגיטלי. הזוכה מוכרז ב-ReviewHub.",
    },
  ];

  const RULES = [
    "הגרלה חודשית — מתקיימת ב-1 לכל חודש קלנדרי.",
    "כניסה אחת להגרלה לכל ביקורת מאומתת רכישה שנכתבה.",
    "מניעת הונאה: כניסה אחת בלבד לכל משתמש בכל חודש.",
    "ביקורת חייבת להיות עבור רכישה שנעשתה דרך קישור Verified Deal של ReviewHub.",
    "הפרס בשווי ₪5,000 — ניתן לרכישת כל קורס, שירות או מוצר דיגיטלי שמופיע ב-ReviewHub.",
    "ReviewHub שומרת לעצמה את הזכות לפסול ביקורות שנמצאו מזויפות.",
    "זוכה שלא מגיב תוך 14 יום — יוגרל זוכה חלופי.",
  ];

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <Badge className="bg-primary/15 text-primary border-primary/30 text-sm px-4 py-1 gap-2">
              <Gift size={14} />
              הגרלה חודשית פעילה
            </Badge>

            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground leading-tight">
              כתבו ביקורת מאומתת —
              <br />
              <span className="text-primary">זכו ₪{PRIZE_AMOUNT.toLocaleString()}</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              כל ביקורת מאומתת שתכתבו לאחר רכישה דרך ReviewHub מזכה אתכם בכניסה אוטומטית להגרלה החודשית.
              הפרס ניתן לרכישת כל קורס, שירות או מוצר דיגיטלי.
            </p>

            <div className="flex items-center justify-center gap-6 pt-2 flex-wrap">
              {totalEntries !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={16} className="text-primary" />
                  <span><strong className="text-foreground">{totalEntries}</strong> כניסות החודש</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} className="text-primary" />
                <span>הגרלה: {formatMonth(currentMonth())}</span>
              </div>
              {user && myEntries > 0 && (
                <Badge variant="secondary" className="gap-1.5 text-sm bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 size={14} />
                  יש לכם {myEntries} כניסה החודש
                </Badge>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2 flex-wrap">
              <Link to="/search">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-primary">
                  <ShieldCheck size={16} />
                  גשו לרכישה מאומתת
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="gap-2">
                    הירשמו בחינם
                    <ArrowLeft size={16} />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <h2 className="font-display font-bold text-2xl text-center mb-10">איך זה עובד?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border/60 bg-card/80 p-5 text-right space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display font-bold text-primary/40">{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key details */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-primary" />
              <h2 className="font-display font-bold text-xl">פרטי ההגרלה</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-card border border-border/50 p-4">
                <p className="font-display font-bold text-2xl text-primary">₪{PRIZE_AMOUNT.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">שווי הפרס</p>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-4">
                <p className="font-display font-bold text-2xl text-foreground">חודשי</p>
                <p className="text-xs text-muted-foreground mt-1">תדירות הגרלה</p>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-4">
                <p className="font-display font-bold text-2xl text-foreground">1</p>
                <p className="text-xs text-muted-foreground mt-1">כניסה לכל ביקורת מאומתת</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              הפרס ניתן לשימוש לרכישת <strong className="text-foreground">כל קורס, שירות דיגיטלי, SaaS, ייעוץ עסקי או מוצר דיגיטלי</strong> שמופיע ב-ReviewHub — לא רק קורסים.
            </p>
          </div>
        </div>
      </section>

      {/* Past winners */}
      {!loading && winners.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container max-w-2xl">
            <h2 className="font-display font-bold text-2xl text-center mb-8">זוכים קודמים</h2>
            <div className="space-y-3">
              {winners.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/80 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={16} className="text-primary" />
                    <span className="font-semibold text-foreground text-sm">{formatMonth(w.month_year)}</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    ₪{w.prize_amount.toLocaleString()}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rules */}
      <section className="py-16">
        <div className="container max-w-2xl">
          <h2 className="font-display font-bold text-xl mb-6">תקנון ההגרלה</h2>
          <div className="space-y-3">
            {RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                <span>{rule}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border/30 bg-muted/30 px-5 py-4">
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              <strong className="text-muted-foreground">גילוי נאות:</strong> ההגרלה נועדה לעודד ביקורות מאומתות ואמיתיות. "חומת האמון" של ReviewHub מבדילה לחלוטין בין הגרלה זו לבין חישוב ציון האמון — הכניסה להגרלה אינה משפיעה על הציון האובייקטיבי של שום עסק.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GiveawayPage;

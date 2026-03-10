import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShieldCheck, CheckCircle, Star, UserCheck, Lock, ArrowLeft, BadgeCheck, MessageSquare, Zap
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "אימות רכישה מוחלט",
    desc: "רק לקוחות שביצעו רכישה בפועל יכולים לכתוב ביקורת. ללא ביקורות מזויפות, ללא ספאם.",
  },
  {
    icon: UserCheck,
    title: "זהות מאומתת",
    desc: "כל מבקר מאמת את פרטיו לפני הגשת הביקורת, כך שכל ביקורת מחוברת לאדם אמיתי.",
  },
  {
    icon: BadgeCheck,
    title: "תג אמינות רשמי",
    desc: "קבלו תג 'ביקורות מאומתות' שמוצג בפרופיל שלכם ומעיד על אמינות העסק.",
  },
  {
    icon: MessageSquare,
    title: "תגובה לביקורות",
    desc: "הגיבו לביקורות ישירות מהדאשבורד — הראו ללקוחות שאכפת לכם מהחוויה שלהם.",
  },
  {
    icon: Zap,
    title: "בקשות ביקורת אוטומטיות",
    desc: "שלחו קישורי ביקורת ייחודיים לאחר כל רכישה, ידנית או דרך העלאת CSV.",
  },
  {
    icon: Lock,
    title: "מניעת מניפולציות",
    desc: "מערכת AI מזהה ומסננת ביקורות חשודות לפני שהן מתפרסמות.",
  },
];

const ReviewsSolution = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> ביקורות מאומתות
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              ביקורות שלקוחות{" "}
              <span className="gradient-text glow-text">באמת סומכים עליהן</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              ReviewHub מאמתת כל ביקורת מול רכישה אמיתית — כך שהדירוג שלכם משקף חוויות לקוח אמיתיות בלבד.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex gap-4 justify-center flex-wrap">
              <Link to="/business/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  התחילו בחינם
                </Button>
              </Link>
              <Link to="/business/pricing">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  ראו תכניות מחיר
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4">
            כיצד עובד מנגנון האימות?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            תהליך מובנה שמבטיח שרק לקוחות אמיתיים מדרגים את העסק שלכם.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i + 2}
                className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-10">
              שלושה שלבים פשוטים
            </motion.h2>
            <div className="space-y-6 text-right">
              {[
                { step: "1", title: "לקוח מבצע רכישה", desc: "לאחר הרכישה, המערכת שולחת קישור ביקורת אישי ומאובטח ללקוח." },
                { step: "2", title: "הלקוח מדרג", desc: "הלקוח נכנס דרך הקישור האישי ומשלים את הביקורת — לא נדרשת הרשמה." },
                { step: "3", title: "הביקורת מתפרסמת", desc: "לאחר אימות, הביקורת מתפרסמת בפרופיל שלכם עם תג 'ביקורת מאומתת'." },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0} className="glass rounded-3xl p-10 border border-primary/20">
            <Star className="text-primary mx-auto mb-4" size={32} />
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">
              בנו אמינות עם ביקורות אמיתיות
            </h2>
            <p className="text-muted-foreground mb-6">
              הצטרפו לאלפי עסקים שמשתמשים ב-ReviewHub כדי לבנות אמון ולהגדיל מכירות.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/business/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                  התחילו בחינם
                </Button>
              </Link>
              <Link to="/business">
                <Button variant="outline" className="border-border/50">
                  <ArrowLeft size={16} className="ml-1" /> חזרה לעמוד הראשי
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <BusinessFooter />
    </div>
  );
};

export default ReviewsSolution;

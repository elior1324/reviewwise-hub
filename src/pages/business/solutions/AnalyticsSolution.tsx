import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart3, TrendingUp, Bell, LineChart, Target, Award, ArrowLeft, Eye
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "דאשבורד בזמן אמת",
    desc: "עקבו אחר דירוגים, ביקורות חדשות, אחוזי מענה ומגמות — הכל במקום אחד.",
  },
  {
    icon: TrendingUp,
    title: "ניתוח מגמות",
    desc: "ראו כיצד הדירוג שלכם משתנה לאורך זמן וזהו נקודות שיפור ונקודות חוזק.",
  },
  {
    icon: Bell,
    title: "התרעות חכמות",
    desc: "קבלו עדכון מיידי על ביקורת שלילית חדשה כדי לטפל בה לפני שתתפשט.",
  },
  {
    icon: LineChart,
    title: "דוחות שבועיים",
    desc: "דוח שבועי אוטומטי עם סיכום ביצועים, ביקורות בולטות ותובנות AI.",
  },
  {
    icon: Target,
    title: "השוואה לתחום",
    desc: "ראו כיצד הדירוג שלכם ביחס לעסקים דומים בתחום שלכם.",
  },
  {
    icon: Eye,
    title: "ניתוח סנטימנט",
    desc: "AI מנתח את הטון של הביקורות ומזהה נושאים חוזרים — חיובי ושלילי.",
  },
];

const AnalyticsSolution = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <BarChart3 size={16} /> אנליטיקס ודוחות
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              הנתונים שעוזרים לכם{" "}
              <span className="gradient-text glow-text">לצמוח</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              לוח בקרה מקיף עם כל המידע שאתם צריכים כדי להבין את הלקוחות, לשפר את השירות ולשמור על מוניטין גבוה.
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
            מה כוללת מערכת האנליטיקס?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            כלים חכמים שהופכים ביקורות לנתונים עסקיים אמיתיים.
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

      {/* Stats */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-foreground text-center mb-10">
              מספרים שמדברים
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { value: "+42%", label: "גידול בהמרות בממוצע לאחר הוספת ביקורות לאתר" },
                { value: "4.8★", label: "דירוג ממוצע של עסקים שמגיבים לביקורות" },
                { value: "<24h", label: "זמן תגובה ממוצע של עסקים שמשתמשים בהתרעות" },
              ].map((stat, i) => (
                <motion.div key={stat.label} variants={fadeUp} custom={i + 1} className="glass rounded-2xl p-6 border border-border/50">
                  <div className="text-3xl font-display font-bold text-primary mb-2">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
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
            <Award className="text-primary mx-auto mb-4" size={32} />
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">
              קבלו תובנות עמוקות על העסק שלכם
            </h2>
            <p className="text-muted-foreground mb-6">
              האנליטיקס המלא זמין בתכנית Pro ומעלה — התחילו בחינם ושדרגו בכל עת.
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

export default AnalyticsSolution;

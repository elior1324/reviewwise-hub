import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Code, Star, Layout, Palette, Zap, Globe, ArrowLeft, Monitor } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const WIDGET_TYPES = [
  {
    icon: Star,
    title: "תג דירוג",
    desc: "תג קטן ומרשים עם הדירוג הממוצע שלכם — מושלם לדפי נחיתה ועמודי מוצר.",
  },
  {
    icon: Layout,
    title: "קרוסלת ביקורות",
    desc: "הציגו את הביקורות הטובות ביותר שלכם בקרוסלה דינמית ואטרקטיבית.",
  },
  {
    icon: Monitor,
    title: "וידג׳ט מורחב",
    desc: "תצוגה מלאה של ביקורות עם אפשרות סינון, מיון ועיצוב מותאם אישית.",
  },
  {
    icon: Palette,
    title: "התאמה אישית מלאה",
    desc: "התאימו את הצבעים, הגופנים והגדלים לעיצוב המותג שלכם.",
  },
  {
    icon: Code,
    title: "הטמעה בשורה אחת",
    desc: "העתיקו snippet קצר של JavaScript והוסיפו לאתר שלכם — ללא מתכנת.",
  },
  {
    icon: Zap,
    title: "עדכון אוטומטי",
    desc: "הוידג׳ט מתעדכן בזמן אמת עם כל ביקורת חדשה — אין צורך לעדכן ידנית.",
  },
];

const WidgetsSolution = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Code size={16} /> וידג׳טים להטמעה
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              הציגו ביקורות{" "}
              <span className="gradient-text glow-text">ישירות באתר שלכם</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              וידג׳טים אלגנטיים שמאפשרים לכם להציג ביקורות מאומתות בכל עמוד באתר — בשורת קוד אחת.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex gap-4 justify-center flex-wrap">
              <Link to="/partners/trust-badge">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  נסו את הוידג׳ט
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

      {/* Widget types */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4">
            סוגי וידג׳טים זמינים
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            בחרו את הוידג׳ט המתאים לכל עמוד ולכל מטרה שיווקית.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WIDGET_TYPES.map((w, i) => (
              <motion.div
                key={w.title}
                variants={fadeUp}
                custom={i + 2}
                className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <w.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{w.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Code example */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-foreground text-center mb-8">
              הטמעה פשוטה כמו העתק-הדבק
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="bg-muted/50 rounded-2xl p-6 border border-border font-mono text-sm text-muted-foreground leading-relaxed" dir="ltr">
              <p className="text-green-400 mb-1">{"<!-- ReviewHub Widget -->"}</p>
              <p>{"<script"}</p>
              <p className="pr-4 text-blue-400">{'  src="https://reviewshub.info/reviewhub-widget.js"'}</p>
              <p className="pr-4 text-yellow-400">{'  data-business-id="YOUR_ID"'}</p>
              <p className="pr-4 text-yellow-400">{'  data-variant="carousel"'}</p>
              <p>{">"}</p>
              <p>{"</script>"}</p>
            </motion.div>
            <motion.p variants={fadeUp} custom={2} className="text-center text-sm text-muted-foreground mt-4">
              פשוט החליפו את <code className="text-primary">YOUR_ID</code> במזהה העסק שלכם מהדאשבורד.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0} className="glass rounded-3xl p-10 border border-primary/20">
            <Globe className="text-primary mx-auto mb-4" size={32} />
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">
              הוסיפו ביקורות לאתר שלכם היום
            </h2>
            <p className="text-muted-foreground mb-6">
              הוידג׳טים זמינים בכל המסלולים — כולל החינמי. הרשמו עכשיו והתחילו להטמיע.
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

export default WidgetsSolution;

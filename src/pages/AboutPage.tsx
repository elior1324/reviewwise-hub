import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, Target, BookOpen, Users, Award, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> מערכת אימות עצמאית
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              תשתית אמון —{" "}
              <span className="gradient-text glow-text">לא פלטפורמת שיווק</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ReviewHub היא מערכת אימות עצמאית. אנחנו מחברים למערכות תשלום ומפיקים נתוני אמון המבוססים על רשומות מסחריות אמיתיות — לא על מה שיוצר אומר על עצמו.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* What is ReviewHub */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
            מה אנחנו עושים
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              ReviewHub מחברת יוצרי קורסים ופרילנסרים למנגנון אימות עצמאי. כל ביקורת שאתם קוראים
              קושרה לרכישה ממשית — <strong className="text-foreground">לא על בסיס הצהרה עצמית, אלא מול נתוני מסחר בפועל.</strong>
            </p>
            <p>
              ציוני האמון שאנחנו מפיקים מורכבים משלושה מרכיבים מדידים: נפח ביקורות, יחס החזרים ותלונות,
              ותקופת פעילות מאומתת. המתודולוגיה המלאה פתוחה לציבור — אתם יכולים לבדוק בדיוק
              איך כל מספר מתקבל.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* What We Are Not */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <XCircle size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                מה אנחנו לא
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5 text-foreground/80 leading-relaxed">
              <p>
                אנחנו <strong className="text-foreground">לא</strong> פלטפורמת שיווק. יוצרים לא יכולים לרכוש דירוג טוב יותר,
                להסיר ביקורות שליליות, או לשלם על מיקום בולט יותר בתוצאות החיפוש.
              </p>
              <p>
                אנחנו <strong className="text-foreground">לא</strong> רשת ביקורות פתוחה שבה כל אחד יכול לכתוב כל דבר.
                כל ביקורת שעוברת אימות קשורה לרכישה ממשית. ביקורות שלא עברו אימות מסומנות בצורה ברורה.
              </p>
              <p>
                אנחנו <strong className="text-foreground">לא</strong> שותפים עסקיים של היוצרים שאנחנו מדרגים.
                כאשר קיימים קישורי שותפים (affiliate), זה מצוין במפורש — וציון האמון נשאר בלתי תלוי לחלוטין.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-10">
            ארבעת אבני הבסיס
          </motion.h2>
          <div className="space-y-8">
            {[
              {
                icon: ShieldCheck,
                title: "אימות עצמאי",
                desc: "אנחנו מאמתים רכישות מול מערכות תשלום — לא על בסיס הצהרת הלקוח ולא על בסיס הצהרת היוצר. הנתון עובר אימות אובייקטיבי לפני שהוא מופיע בציון.",
              },
              {
                icon: Users,
                title: "ביקורות בלתי ניתנות למחיקה",
                desc: "בעל עסק לא יכול למחוק ביקורת שלילית. יוצר לא יכול לדרוש הסרה. ביקורות מוסרות רק אם הן מפרות כללים מוגדרים ועוברות בדיקה עצמאית.",
              },
              {
                icon: Award,
                title: "ציון שאינו למכירה",
                desc: "ציון האמון מחושב אוטומטית מנתוני מסחר. אין אפשרות לרכוש ציון גבוה יותר, לשלם על מיקום עדיף, או להסיר נתון לא נוח. המדרג לא מוכר.",
              },
              {
                icon: TrendingUp,
                title: "מתודולוגיה פתוחה",
                desc: "הנוסחה לחישוב ציון האמון מפורסמת ונגישה לכל. אתם יכולים לבדוק בדיוק איך כל מרכיב מחושב — ולהחליט בעצמכם אם אתם מסכימים עם הגישה שלנו.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp} custom={i + 1} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8">
              העקרונות המבניים שלנו
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "עצמאות", desc: "ציוני האמון אינם מושפעים מיחסים עסקיים. אין יוצר שיכול לרכוש דירוג — לכל כיוון." },
                { title: "שקיפות", desc: "המתודולוגיה פתוחה. כשאנחנו לא יודעים משהו — אנחנו אומרים את זה במפורש." },
                { title: "מגבלות מוצהרות", desc: "ציון אמון הוא אות מבוסס נתונים, לא ערובה. אנחנו מפרסמים את מה שאנחנו לא מודדים." },
              ].map(({ title, desc }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i + 1} className="rounded-xl p-6 bg-card border border-border/50">
                  <CheckCircle size={20} className="text-primary mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              בדקו לפני שאתם משלמים
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              עיינו בציוני האמון, קראו ביקורות מאומתות, והחליטו על בסיס נתונים — לא על בסיס שיווק.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/search">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  חפשו ובדקו
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  הצטרפו כיוצר
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              שאלות? כתבו לנו: <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">support@reviewshub.info</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;

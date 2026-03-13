import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, Target, BookOpen, Users, Award, TrendingUp, CheckCircle, XCircle, BarChart2, AlertTriangle, Clock, Star } from "lucide-react";
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

      {/* TrustScore Formula — full methodology section */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <BarChart2 size={24} className="text-primary" />
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              נוסחת ציון האמון — המתודולוגיה המלאה
            </h2>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10 leading-relaxed">
            ציון האמון (0–100) מחושב אוטומטית מנתוני מסחר ממשיים. להלן פירוט המרכיבים, משקלם, ומנגנוני ההגנה מפני הונאה.
          </motion.p>

          {/* Component breakdown */}
          <div className="space-y-5">
            {[
              {
                icon: Star,
                label: "נפח ביקורות מאומתות",
                weight: "עד 40 נקודות",
                weightColor: "text-emerald-500",
                desc: "מודד את מספר ביקורות הרכישה המאומתות שנרשמו. נפח גבוה יותר מקנה אמינות סטטיסטית — ביקורת בודדת, חיובית ככל שתהיה, אינה מספיקה לציון גבוה.",
                formula: "volumePoints = min(verifiedCount / 0.25, 40)",
              },
              {
                icon: TrendingUp,
                label: "בריאות החזרים ותלונות",
                weight: "עד 35 נקודות",
                weightColor: "text-blue-500",
                desc: "יחס ההחזרים, ביטולים, ותלונות מורשמות ביחס לסה״כ עסקאות מאומתות. מרכיב זה הוא הבודד ביותר — ספק עם המון ביקורות חיוביות אך יחס החזרים גבוה יקבל ניכוי משמעותי.",
                formula: "refundHealth = 35 × (1 − refundRate)",
              },
              {
                icon: Clock,
                label: "ותק ואריכות פעילות מאומתת",
                weight: "עד 25 נקודות",
                weightColor: "text-violet-500",
                desc: "מספר החודשים שבהם נרשמה לפחות עסקה מאומתת אחת. ספקים חדשים מקבלים ניקוד חלקי ועולים בהדרגה. זה מגן מפני חשבונות חדשים שנוצרו למטרת הונאת ציון.",
                formula: "longevityPoints = min(activeMonths / 0.48, 25)",
              },
            ].map(({ icon: Icon, label, weight, weightColor, desc, formula }, i) => (
              <motion.div key={label} variants={fadeUp} custom={i + 2} className="rounded-xl border border-border/40 bg-card/60 p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground">{label}</h3>
                  </div>
                  <span className={`text-xs font-bold ${weightColor} bg-card border border-border/40 rounded px-2 py-1 shrink-0`}>{weight}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                <code className="text-xs font-mono bg-muted/60 text-primary px-3 py-1.5 rounded block">{formula}</code>
              </motion.div>
            ))}

            {/* Fraud penalty multiplier */}
            <motion.div variants={fadeUp} custom={5} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">מכפיל עונשי להונאה</h3>
                  <span className="text-xs font-bold text-amber-500">מפחית עד 100% מהציון</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                אם מתגלה דפוס ביקורות חשוד — קבוצת חשבונות חדשים שכתבו ביקורות תוך שעות זה מזה, IP address משותף, או שינוי קיצוני וחד בדפוס הביקורות — מופעל מכפיל עונשי שמפחית את הציון הסופי. ספק שיופנה לחקירה יסומן בגלוי בפרופיל שלו.
              </p>
              <code className="text-xs font-mono bg-muted/60 text-amber-500 px-3 py-1.5 rounded block">finalScore = (volumePoints + refundHealth + longevityPoints) × fraudPenaltyMultiplier</code>
            </motion.div>
          </div>

          {/* Grade thresholds */}
          <motion.div variants={fadeUp} custom={6} className="mt-10">
            <h3 className="font-display font-semibold text-foreground mb-4">סף ציונים לדרגות אמון</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { grade: "A+", range: "90–100", color: "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" },
                { grade: "A",  range: "75–89",  color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" },
                { grade: "B",  range: "60–74",  color: "text-blue-500 border-blue-500/30 bg-blue-500/5" },
                { grade: "C",  range: "45–59",  color: "text-amber-500 border-amber-500/30 bg-amber-500/5" },
                { grade: "D",  range: "30–44",  color: "text-orange-500 border-orange-500/30 bg-orange-500/5" },
                { grade: "F",  range: "0–29",   color: "text-red-500 border-red-500/30 bg-red-500/5" },
              ].map(({ grade, range, color }) => (
                <div key={grade} className={`rounded-lg border p-3 text-center ${color}`}>
                  <p className="font-display font-bold text-xl">{grade}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{range}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Confidence levels note */}
          <motion.div variants={fadeUp} custom={7} className="mt-8 rounded-xl border border-border/40 bg-card/40 p-5 text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground block mb-1">רמות ביטחון וסף נתונים מינימלי</strong>
            ספק שהצטרף לאחרונה ויש לו פחות מ-3 ביקורות מאומתות יוצג עם הסימון <span className="text-primary font-medium">״נתונים לא מספיקים״</span> במקום ציון. זה מונע את הסיטואציה שבה ציון גבוה מושתת על ביקורת אחת בלבד. ספק חייב לצבור לפחות 3 ביקורות מאומתות לפני שמוצג לו ציון בפרופיל.
          </motion.div>
        </motion.div>
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

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  ShieldCheck, Target, BookOpen, Users, Award, TrendingUp,
  CheckCircle, XCircle, BarChart2, AlertTriangle, Clock, Star,
  Tag, BadgePercent, Trophy, Sparkles, ChevronRight, Gift,
  Activity, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  computeVerifiedPricing,
  formatPrice,
  LEARNER_DISCOUNT_RATE,
  PLATFORM_FEE_RATE,
  TOTAL_TRUST_CHARGE,
} from "@/lib/affiliate";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

// ── Trust grade tiers — mirrors the visual language of the referral tier system ──
// These represent the OUTPUT grades (A+ through F), not internal formula weights.

const TRUST_GRADE_TIERS = [
  { grade: "F",  range: "0–29",   color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
  { grade: "D",  range: "30–44",  color: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/30"  },
  { grade: "C",  range: "45–59",  color: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  { grade: "B",  range: "60–74",  color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/30"    },
  { grade: "A",  range: "75–89",  color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { grade: "A+", range: "90–100", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-600/40" },
];

// ── Trust signal importance labels (replaces raw weight numbers) ──────────────

const SIGNAL_IMPORTANCE = {
  primary:     { label: "אות ראשי",     color: "text-emerald-600", bg: "bg-emerald-500/8 dark:bg-emerald-500/10", border: "border-emerald-500/30" },
  significant: { label: "אות משמעותי", color: "text-blue-500",    bg: "bg-blue-500/8 dark:bg-blue-500/10",       border: "border-blue-500/30"    },
  supporting:  { label: "אות תומך",    color: "text-violet-500",  bg: "bg-violet-500/8 dark:bg-violet-500/10",   border: "border-violet-500/30"  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary"
            >
              <ShieldCheck size={16} /> מערכת אימות עצמאית
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6"
            >
              תשתית אמון —{" "}
              <span className="gradient-text glow-text">לא פלטפורמת שיווק</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              ReviewHub היא מערכת אימות עצמאית. אנחנו מחברים למערכות תשלום ומפיקים נתוני אמון
              המבוססים על רשומות מסחריות אמיתיות — לא על מה שיוצר אומר על עצמו.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── What ReviewHub does ──────────────────────────────────────────────── */}
      <section className="container py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6"
          >
            מה אנחנו עושים
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              ReviewHub היא תשתית אמון לחינוך הדיגיטלי. הפלטפורמה מדרגת קורסים אונליין לפי
              ביקורות מאומתות רכישה — ומפיקה ציון אמון עצמאי לכל קורס וכל יוצר. ReviewHub אינה
              פלטפורמת שיווק ואינה גורמת עסקית של יוצרי הקורסים.
            </p>
            <p>
              ציוני האמון מבוססים על אותות פעילות מאומתת — עקביות, נפח, ואמינות הביקורות לאורך
              זמן. שקיפות היא ערך יסוד שלנו: הגורמים שמשפיעים על הציון מוצגים בגלוי, כך שאפשר
              להבין את ההיגיון גם ללא חשיפת כל פרמטר פנימי.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 5/5 Verified Deal ────────────────────────────────────────────────── */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <Tag size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                מודל 5 / 5 — שקיפות תפעולית מלאה
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5">
              <p className="text-foreground/80 leading-relaxed">
                ReviewHub פועלת לפי מודל{" "}
                <strong className="text-foreground">5/5 Verified Deal</strong> — תשתית מסחרית
                שנבנתה על עיקרון Win-Win-Win: הלומד חוסך, היוצר צובר אמון, והפלטפורמה מרוויחה
                מתפעול.
              </p>

              {/* Live economics table */}
              {(() => {
                const ex = computeVerifiedPricing(1000);
                return (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                    <div className="bg-primary/10 px-5 py-3">
                      <p className="text-sm font-bold text-foreground">
                        דוגמה: קורס במחיר {formatPrice(ex.listPrice)}
                      </p>
                    </div>
                    <div className="divide-y divide-border/40 text-sm">
                      {[
                        { label: "מחיר שוק (רשמי)",                          value: formatPrice(ex.listPrice),       highlight: false },
                        { label: `הנחת לומד (${ex.learnerDiscountPct}%) — מיידית בקופה`, value: `−${formatPrice(ex.learnerDiscount)}`, highlight: true  },
                        { label: "לומד משלם בפועל",                          value: formatPrice(ex.verifiedPrice),   highlight: false },
                        { label: `עמלת ReviewHub (${ex.platformFeePct}%)`,    value: `−${formatPrice(ex.platformFee)}`,   highlight: false },
                        { label: "יוצר מקבל",                                value: formatPrice(ex.creatorNet),      highlight: true  },
                      ].map(({ label, value, highlight }) => (
                        <div
                          key={label}
                          className={`flex items-center justify-between px-5 py-3 ${
                            highlight ? "bg-primary/5 font-semibold" : ""
                          }`}
                        >
                          <span className={highlight ? "text-primary" : "text-muted-foreground"}>
                            {label}
                          </span>
                          <span className={highlight ? "text-primary" : "text-foreground"}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-foreground/80 leading-relaxed">
                <strong className="text-foreground block mb-1">חומת אמון (Trust Firewall)</strong>
                כל עסקה מסחרית — עמלת תפעול, מנוי Pro, שדרוג Enterprise — מתבצעת במערכת נפרדת
                לחלוטין ממנגנון חישוב ציון האמון. ציון האמון מחושב מנתוני ביקורות בלבד, ולא ניתן
                להשפיע עליו בכסף.
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── What We Are Not ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <XCircle size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                מה אנחנו לא
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5 text-foreground/80 leading-relaxed">
              <p>
                אנחנו <strong className="text-foreground">לא</strong> מנגנון דירוג שניתן לרכוש.
                יוצרים לא יכולים לרכוש ציון אמון גבוה יותר, להסיר ביקורות שליליות, או להשפיע
                ידנית על הנתונים שמרכיבים את הפרופיל שלהם. הדרך היחידה לשפר את הציון היא
                ביצועים אמיתיים — מאומתים על ידי הנתונים.
              </p>
              <p>
                אנחנו <strong className="text-foreground">לא</strong> רשת ביקורות פתוחה שבה כל
                אחד יכול לכתוב כל דבר. כל ביקורת שעוברת אימות קשורה לרכישה ממשית. ביקורות שלא
                עברו אימות מסומנות בצורה ברורה.
              </p>
              <p>
                אנחנו <strong className="text-foreground">לא</strong> שותפים עסקיים של היוצרים
                שאנחנו מדרגים. ReviewHub פועלת כשכבת אימות עצמאית — ציוני האמון, מדדי הנראות,
                ומשקל הפרופיל בפלטפורמה מחושבים מנתוני אימות בלבד. קישורי רכישה מסומנים בגילוי
                נאות ברור, ועמלות התפעול משמשות אך ורק לתחזוקת תשתית האימות.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Four pillars ─────────────────────────────────────────────────────── */}
      <section className="container py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display font-bold text-2xl md:text-3xl text-foreground mb-10"
          >
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
                title: "שקיפות עקרונית",
                desc: "הגורמים שמרכיבים את ציון האמון מוצגים בגלוי. אנחנו מפרסמים את האותות שאנחנו בודקים ואת ההיגיון מאחורי הציון — ואת הגבולות של מה שאנחנו יכולים למדוד.",
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

      {/* ── Values ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8"
            >
              העקרונות המבניים שלנו
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "עצמאות",
                  desc: "ציוני האמון אינם מושפעים מיחסים עסקיים. אין יוצר שיכול לרכוש דירוג — לכל כיוון.",
                },
                {
                  title: "שקיפות",
                  desc: "האותות שמרכיבים את הציון מפורסמים. כשאנחנו לא יודעים משהו — אנחנו אומרים את זה במפורש.",
                },
                {
                  title: "מגבלות מוצהרות",
                  desc: "ציון אמון הוא אות מבוסס נתונים, לא ערובה. אנחנו מפרסמים את מה שאנחנו לא מודדים.",
                },
              ].map(({ title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-xl p-6 bg-card border border-border/50"
                >
                  <CheckCircle size={20} className="text-primary mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust Signals — conceptual breakdown (no formulas) ───────────────── */}
      <section className="container py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <BarChart2 size={24} className="text-primary" />
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              אותות האמון — מה מרכיב את הציון
            </h2>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10 leading-relaxed">
            ציון האמון (0–100) מחושב אוטומטית מאותות פעילות מאומתת. להלן הגורמים שאנחנו
            בודקים — ואיך כל אחד מהם תורם לתמונת האמינות הכוללת.
          </motion.p>

          {/* Signal cards — no formulas, conceptual descriptions */}
          <div className="space-y-4">
            {[
              {
                icon: Star,
                label: "פעילות מאומתת",
                importance: SIGNAL_IMPORTANCE.primary,
                desc: "ביקורות מאומתות רכישה הן הבסיס לכל ציון. ביקורת מקבלת משקל רק לאחר שהרכישה אומתה מול מערכות התשלום. עוצמת הציון גדלה עם עומק ועקביות הפעילות — ביקורת בודדת, חיובית ככל שתהיה, אינה מספיקה לציון גבוה.",
              },
              {
                icon: TrendingUp,
                label: "בריאות מסחרית",
                importance: SIGNAL_IMPORTANCE.significant,
                desc: "ציון האמון משקף את איכות חוויית הלקוח בפועל — לא רק את הביקורות הכתובות. יחס תלונות ובקשות החזר נבחן ביחס לסך הפעילות המאומתת. ביצועים מסחריים חלשים מתגלים בנתונים, גם אם ביקורות כתובות נראות חיוביות.",
              },
              {
                icon: Clock,
                label: "עקביות לאורך זמן",
                importance: SIGNAL_IMPORTANCE.supporting,
                desc: "חשבון חדש עם ביקורות רבות מייצג פחות בטחון מאשר פעילות מאומתת שמתמשכת לאורך חודשים. עקביות לאורך זמן היא אות של בשלות ויציבות. ספקים חדשים מתחילים עם ציון חלקי ועולים בהדרגה ככל שהפעילות המאומתת מצטברת.",
              },
            ].map(({ icon: Icon, label, importance, desc }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i + 2}
                className="rounded-xl border border-border/40 bg-card/60 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground">{label}</h3>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${importance.color} ${importance.bg} ${importance.border}`}
                  >
                    {importance.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}

            {/* Anti-manipulation signal — styled separately as a protection mechanism */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">הגנה מפני מניפולציה</h3>
                  <span className="text-xs font-semibold text-amber-500">מנגנון הגנה אוטומטי</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                מנגנוני זיהוי אוטומטיים בודקים דפוסי ביקורות חשודים — כמו פעילות מרוכזת
                בפרקי זמן קצרים, חשבונות מסונכרנים, או שינויים קיצוניים בנתונים. ספק
                שמופנה לחקירה מסומן בגלוי בפרופיל שלו. ציונים שהתגלתה בהם פעילות לא תקינה
                מתוקנים בהתאם.
              </p>
            </motion.div>
          </div>

          {/* ── Grade thresholds — rendered as tier milestone chips ── */}
          <motion.div variants={fadeUp} custom={6} className="mt-10">
            <h3 className="font-display font-semibold text-foreground mb-4">דרגות האמון — המסלול</h3>

            {/* Progress card — same visual language as the referral tier card */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" />
                  <span className="font-bold text-sm text-emerald-500">דוגמה: ציון 82 → דרגה A</span>
                </div>
                <Badge variant="outline" className="text-[11px] text-emerald-500 border-emerald-500/40">
                  82 / 100
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-background/60 border border-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: "82%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  עוד <span className="font-bold text-foreground">8</span> נקודות ציון לדרגה A+
                </p>
              </div>

              {/* Grade milestone chips — same chip style as referral tier milestones */}
              <div className="flex gap-2 flex-wrap">
                {TRUST_GRADE_TIERS.map((t) => (
                  <div
                    key={t.grade}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${t.color} ${t.bg} ${t.border}`}
                  >
                    {t.grade}
                    <span className="font-normal opacity-70">({t.range})</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Minimum data threshold note */}
          <motion.div
            variants={fadeUp}
            custom={7}
            className="mt-6 rounded-xl border border-border/40 bg-card/40 p-5 text-sm text-muted-foreground leading-relaxed"
          >
            <strong className="text-foreground block mb-1">סף נתונים מינימלי</strong>
            ספק שהצטרף לאחרונה ויש לו מספר קטן של ביקורות מאומתות יוצג עם הסימון{" "}
            <span className="text-primary font-medium">״נתונים לא מספיקים״</span> במקום ציון. זה
            מונע את הסיטואציה שבה ציון גבוה מושתת על ביקורת בודדת בלבד, ומבטיח שכל ציון
            המוצג מגובה בבסיס נתונים מספיק.
          </motion.div>
        </motion.div>
      </section>

      {/* ── Ecosystem: Trust Score · Points · Benefits — one system ─────────── */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-3">
              <Sparkles size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                ציון האמון ומסע הלומד — מערכת אחת
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 leading-relaxed">
              ביקורות מאומתות הן לא רק נתונים לצרכן — הן המנוע שמניע את כל האקוסיסטם. פעילות
              משמעותית בפלטפורמה — כתיבת ביקורות, השתתפות קהילתית, הזמנת חברים — היא מה
              שמעניק לנתונים את האמינות שלהם.
            </motion.p>

            {/* Three-column ecosystem cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: Star,
                  title: "ביקורת מאומתת",
                  desc: "כתבתם ביקורת על רכישה שביצעתם — הביקורת עוברת אימות ומחזקת את תמונת האמינות של העסק שדירגתם.",
                  iconColor: "text-primary",
                  iconBg:    "bg-primary/10",
                },
                {
                  icon: Activity,
                  title: "ציון האמון מתעצם",
                  desc: "כל ביקורת מאומתת מחזקת את אותות האמינות של העסק — יותר ביקורות עקביות לאורך זמן מייצרות ציון אמון חזק ומהימן יותר.",
                  iconColor: "text-emerald-500",
                  iconBg:    "bg-emerald-500/10",
                },
                {
                  icon: Trophy,
                  title: "נקודות והטבות",
                  desc: "פעילות בפלטפורמה — כולל הזמנת חברים — צוברת נקודות בפרופיל האישי שלכם. נקודות מספיקות מזכות בהטבות פלטפורמה ממשיות.",
                  iconColor: "text-amber-500",
                  iconBg:    "bg-amber-500/10",
                },
              ].map(({ icon: Icon, title, desc, iconColor, iconBg }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  custom={i + 2}
                  className="rounded-xl border border-border/50 bg-card p-5 space-y-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Benefits reference — 600 points threshold */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 mb-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <Gift size={15} className="text-primary" />
                <strong className="text-foreground text-sm">הטבות פלטפורמה</strong>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                משתמשים שצברו נקודות מספיקות דרך פעילות מאומתת — ביקורות, תרומה לקהילה,
                והזמנת חברים — זכאים לממש הטבות פלטפורמה, כגון הנחה על קורס לבחירתם.
                ההטבות מוצגות בפרופיל האישי וניתנות למימוש ישיר דרך הממשק.
              </p>
              <p className="text-xs text-muted-foreground/70">
                ציון האמון ומנגנון הנקודות פועלים באופן עצמאי — הנקודות אינן משפיעות על
                ציון האמון של עסק כלשהו.
              </p>
            </motion.div>

            {/* Ecosystem integrity note */}
            <motion.div
              variants={fadeUp}
              custom={6}
              className="rounded-xl border border-border/40 bg-card/40 p-4 text-sm text-muted-foreground leading-relaxed mb-6"
            >
              <strong className="text-foreground block mb-1">שלמות המערכת</strong>
              ציוני האמון נבנים מפעילות מאומתת של לומדים אמיתיים. מסע הנקודות נבנה מהפניית
              לומדים נוספים והשתתפות משמעותית בפלטפורמה. שני המנגנונים תלויים בפעילות אמיתית
              — ולא ניתן לקצר דרכם בכסף.
            </motion.div>

            <motion.div variants={fadeUp} custom={7}>
              <Link to="/user/referrals">
                <Button variant="outline" className="gap-2 text-sm border-border/50">
                  <Trophy size={15} className="text-amber-500" />
                  ראו את מסע הנקודות שלכם
                  <ChevronRight size={13} />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="container py-20">
        <div
          className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border"
          style={{
            background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))",
          }}
        >
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              בדקו לפני שאתם משלמים
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              עיינו בציוני האמון, קראו ביקורות מאומתות, והחליטו על בסיס נתונים — לא על בסיס
              שיווק.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/search">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary"
                >
                  חפשו ובדקו
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  רשמו עסק לאימות
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              שאלות? כתבו לנו:{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                support@reviewshub.info
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;

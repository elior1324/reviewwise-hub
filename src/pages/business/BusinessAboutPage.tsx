import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Instagram,
  Mail,
  QrCode,
  ShieldCheck,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Users,
  TrendingUp,
  Link2,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const CHANNELS = [
  { icon: MessageCircle, label: "WhatsApp",      desc: "שיעור פתיחה גבוה, ישיר" },
  { icon: Instagram,     label: "Instagram DM",  desc: "אוטומטי" },
  { icon: Mail,          label: "אימייל",         desc: "עם תבנית מותאמת" },
  { icon: QrCode,        label: "QR Code",        desc: "לדלפק, למוצר, לחשבונית" },
];

const STEPS = [
  {
    num: "01",
    title: "שלח קישור ייחודי",
    body: "מלוח הבקרה שלך, שניות. הקישור יוצא דרך WhatsApp, Instagram DM, אימייל, או QR Code.",
  },
  {
    num: "02",
    title: "הלקוח כותב, ללא חיכוך",
    body: "טופס נקי. ללא הרשמה. כל קישור חד-פעמי — לא ניתן לשיתוף, לא ניתן לזיוף.",
  },
  {
    num: "03",
    title: "AI בודק לפני פרסום",
    body: "ניתוח sentiment, זיהוי ספאם, תיוג נושאים. ביקורת חשודה עוברת לבדיקה אנושית. AI עוזר — לא מחליט.",
  },
  {
    num: "04",
    title: "ביקורת עולה, Trust Score מתעדכן",
    body: "הכול אוטומטי. אתה מקבל התראה. הפרופיל שלך חי.",
  },
];

const SCORE_PARAMS = [
  { label: "ממוצע דירוג כוכבים",      weight: "50%" },
  { label: "אחוז ביקורות מאומתות",    weight: "25%" },
  { label: "עדכניות — 90 ימים אחרונים", weight: "15%" },
  { label: "מגוון מבקרים ייחודיים",   weight: "10%" },
];

const DASHBOARD_FEATURES = [
  {
    icon: CheckCircle2,
    title: "ביקורות",
    badge: "כל תוכנית",
    badgePrimary: false,
    body: "קרא, הגב, דווח על ביקורת חשודה. תגובה שלך מופיעה ציבורית — לקוחות רואים עסק שמקשיב.",
  },
  {
    icon: BarChart3,
    title: "אנליטיקה",
    badge: "Pro",
    badgePrimary: true,
    body: "גרפי מגמה, פילוח לפי ערוץ, ניתוח sentiment. תדע בדיוק מה עובד ומה לא.",
  },
  {
    icon: Users,
    title: "השוואה תחרותית",
    badge: "Pro",
    badgePrimary: true,
    body: "ראה איפה אתה עומד מול עסקים באותה קטגוריה. מידע, לא לחץ.",
  },
  {
    icon: TrendingUp,
    title: "ווידג׳טים",
    badge: "Pro",
    badgePrimary: true,
    body: "Embed code לאתר שלך. הביקורות מגיעות ישירות לנקודת ההחלטה של הלקוח.",
  },
  {
    icon: Sparkles,
    title: "עוזר תגובה AI",
    badge: "Pro",
    badgePrimary: true,
    body: "ביקורת קשה? AI מציע טיוטה. אתה עורך ומאשר — תמיד.",
  },
];

const FAQS = [
  {
    q: "איך מתחילים?",
    a: "נרשמים, יוצרים פרופיל, ומתחילים לשלוח קישורים ללקוחות. Free — ללא עלות, ללא כרטיס אשראי. הפרופיל עולה באותו יום.",
  },
  {
    q: "איך אני אוסף ביקורות?",
    a: "יוצרים קישור ייחודי מלוח הבקרה ושולחים ללקוח — דרך WhatsApp, Instagram DM, אימייל, או QR. כל קישור חד-פעמי. לא ניתן לשיתוף, לא ניתן לשימוש חוזר.",
  },
  {
    q: "הביקורות באמת מאומתות?",
    a: "כן — כמה שאפשר בסקייל. כל ביקורת מגיעה דרך טוקן ייחודי שאתה יצרת. AI בודק את התוכן לפני פרסום. ביקורת חשודה עוברת לבדיקה אנושית. אין מערכת שהיא 100%, אבל זו הרמה הגבוהה ביותר שקיימת.",
  },
  {
    q: "יכולה להיות ביקורת שקרית?",
    a: "כן. לכן יש מנגנון דיווח. דיווחת — הביקורת עוברת לבדיקה אנושית. הוסרה? נקודות המבקר מבוטלות. אנחנו לא מוחקים ביקורות שליליות. רק כאלה שמפרות כללים.",
  },
  {
    q: "אפשר למחוק ביקורת שלילית?",
    a: "לא. ביקורת לגיטימית נשארת. מה שאתה יכול: להגיב עליה ציבורית. תגובה טובה לביקורת שלילית בונה אמון יותר ממחיקתה.",
  },
  {
    q: "איך Trust Score מחושב?",
    a: "ממוצע דירוג (50%) + אחוז ביקורות מאומתות (25%) + עדכניות (15%) + מגוון מבקרים (10%). הכול מהביקורות בפועל. אין קיצורי דרך.",
  },
  {
    q: "אם אשלם יותר — הציון יעלה?",
    a: "לא. תוכנית המנוי לא נוגעת ב-Trust Score. עסק Free עם ביקורות מצוינות יציג ציון גבוה יותר מעסק Enterprise עם ביקורות בינוניות. בכוונה.",
  },
  {
    q: "מה ההבדל בין Free ל-Pro?",
    a: "Free: פרופיל, עד 50 ביקורות, תגובות. Pro: ביקורות ללא הגבלה + כל ערוצי האיסוף + אנליטיקה + תג מאומת + ווידג׳טים + השוואה תחרותית + עוזר תגובה AI.",
  },
  {
    q: "מה קורה כשמגיעים ל-50 ביקורות ב-Free?",
    a: "המערכת מפסיקה לקבל ביקורות חדשות. ביקורות קיימות נשמרות. שדרוג ל-Pro — ואפשר להמשיך.",
  },
  {
    q: "מה קורה אם אני מפסיק לשלם?",
    a: "הפרופיל נשאר פעיל. הביקורות נשמרות. גישה לפיצ׳רי Pro — אנליטיקה, ערוצי איסוף, ווידג׳טים — מוקפאת עד לחידוש.",
  },
  {
    q: "יכול לענות לביקורות?",
    a: "כן — בכל תוכנית. התגובה מופיעה ציבורית מתחת לביקורת. ב-Pro: AI מציע טיוטה. אתה תמיד מאשר לפני פרסום.",
  },
  {
    q: 'מה זה תג "מאומת"?',
    a: "אימות מסמכי עסק דרך מערכת AFVE. מראה ללקוחות שמדובר בעסק אמיתי שעבר בדיקה. האימות פתוח לכל תוכנית. הצגת התג בפרופיל — Pro.",
  },
  {
    q: "איך עובדים קישורי האפיליאייט?",
    a: "מצרפים קישור לפרופיל שלך. לקוח לוחץ — הקליק נרשם — הוא מועבר ליעד. ערוץ הכנסה שנשען ישירות על האמון שבנית.",
  },
  {
    q: "המערכת הוגנת לעסקים קטנים?",
    a: "כן — ובכוונה. Trust Score מחושב על בסיס איכות, לא גודל. עסק עם 20 ביקורות מצוינות יכול לנצח רשת עם 500 בינוניות. הגודל לא עוזר כאן.",
  },
  {
    q: "יש API?",
    a: "בתוכנית Enterprise — כן. ב-Free וב-Pro — לא.",
  },
  {
    q: "כמה זמן עד שביקורת מתפרסמת?",
    a: "בדרך כלל דקות. אם עברה לבדיקה אנושית — קצת יותר. אתה מקבל התראה על כל ביקורת חדשה.",
  },
  {
    q: "קישור פג תוקף ללקוח — מה קורה?",
    a: "הלקוח רואה הודעה עם אפשרות לבקש קישור חדש. תוקף מוגבל הוא חלק ממנגנון האימות — לא באג.",
  },
  {
    q: "יכול לייצא את הנתונים שלי?",
    a: "כן. GDPR compliant. הנתונים שלך — שלך.",
  },
];

export default function BusinessAboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        {/* pt-24 accounts for fixed navbar (16) + optional business mode strip + comfortable breathing room */}
        <div className="container pt-28 pb-20 md:pt-32 md:pb-28 relative">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
            >
              <ShieldCheck size={14} aria-hidden="true" /> לעסקים
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display font-bold text-3xl md:text-5xl text-foreground leading-tight mb-5"
            >
              לקוחות מחפשים סיבה לסמוך עליך.
              <br />
              <span className="text-primary">ReviewHub נותנת להם אחת.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              לא כלי שיווקי. לא "ניהול מוניטין" בסגנון ישן. תשתית — כי האמון נבנה לפני ששיחת המכירה מתחילה.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link to="/business/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                  התחל בחינם
                  <ArrowLeft size={16} aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/business/pricing">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  תוכניות ומחירים
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────── */}
      <section className="border-y border-border/50">
        <div className="container py-16">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              הבעיה שעסקים מכירים
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              לקוח מצא אותך. ראה ביקורת שלילית אחת מלפני שנתיים. עזב.
              <br />
              לא כי אתה לא טוב — כי לא הייתה תמונה שלמה.
            </p>
            <p className="mt-4 text-foreground font-medium">
              ReviewHub בונה את התמונה הזו: ביקורות אמיתיות, מאומתות, מעודכנות — שגורמות ללקוח הבא להישאר.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            איך זה עובד
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            4 שלבים — מהקישור לביקורת
          </h2>
        </div>

        {/* Channels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
          {CHANNELS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="flex flex-col items-center text-center p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                <Icon size={20} className="text-primary" aria-hidden="true" />
              </div>
              <span className="font-display font-semibold text-sm text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </motion.div>
          ))}
        </div>

        {/* Steps */}
        <div className="max-w-2xl mx-auto space-y-4">
          {STEPS.map(({ num, title, body }, i) => (
            <motion.div
              key={num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="flex gap-5 items-start rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-bold text-sm flex items-center justify-center">
                {num}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Trust Score ──────────────────────────────────────── */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <ShieldCheck size={14} aria-hidden="true" /> Trust Score
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
              מספר שאי אפשר לקנות
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              כל עסק מקבל ציון 0–100, מחושב מנתוני ביקורות בלבד.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden mb-5">
              <table className="w-full text-sm" aria-label="פרמטרי Trust Score">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="text-start px-5 py-3 font-display font-semibold text-foreground">פרמטר</th>
                    <th className="text-end px-5 py-3 font-display font-semibold text-foreground">משקל</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {SCORE_PARAMS.map(({ label, weight }) => (
                    <tr key={label} className="hover:bg-primary/5 transition-colors">
                      <td className="px-5 py-3 text-foreground/80">{label}</td>
                      <td className="px-5 py-3 font-display font-bold text-primary text-end">{weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-sm text-foreground">
                <strong>מה לא משפיע:</strong> תוכנית המנוי שלך. כמה שילמת. כמה ותיק אתה.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                ציון גבוה יש רק לעסק שנותן שירות טוב. זה לא באג — זו הסיבה שלקוחות סומכים עליו.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard features ───────────────────────────────── */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            לוח הבקרה
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            מה שולט בלוח הבקרה שלך
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {DASHBOARD_FEATURES.map(({ icon: Icon, title, badge, badgePrimary, body }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-border/50 bg-card p-5 flex gap-4 items-start hover:border-primary/30 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={20} className="text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      badgePrimary
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Affiliate ────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-primary/5">
        <div className="container py-16">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Link2 size={22} className="text-primary" aria-hidden="true" />
            </div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-3">
              הפרופיל שלך גם מרוויח
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              צרף קישור אפיליאייט לקורס, שירות, או מוצר. כל לקוח שמגיע לפרופיל שלך ולוחץ — הקליק נרשם, הוא מועבר ליעד. האמון שבנית הופך לתנועה שמכניסה.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="container py-20" id="faq">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <HelpCircle size={14} aria-hidden="true" /> שאלות נפוצות
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
            כל מה שצריך לדעת לפני שמתחילים
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            בלי עיגולים.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={q}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={Math.floor(i / 3)}
            >
              <div className="rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-display font-semibold text-foreground text-start flex-1">
                    {q}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                    {a}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="border-t border-border/50">
        <div className="container py-20">
          <div
            className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border"
            style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}
          >
            <div className="absolute inset-0 bg-primary/5 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <ShieldCheck size={36} className="text-primary mx-auto mb-4" aria-hidden="true" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
                הלקוח שלך לא רוצה שיווק.
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-lg mx-auto">
                הוא רוצה לדעת מה חשבו עליך אנשים שכבר שילמו.
                ReviewHub נותנת לו את זה.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/business/signup">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                    הצטרף בחינם
                    <ArrowLeft size={16} aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/business/pricing">
                  <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                    תוכניות ומחירים
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BusinessFooter />
    </div>
  );
}

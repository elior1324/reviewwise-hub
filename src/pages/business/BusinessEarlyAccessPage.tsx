import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Eye, MessageSquare, Globe,
  ChevronDown, UserCheck, Sparkles, Lock,
  Search, Send, BarChart3, CheckCircle
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const FAQ_ITEMS = [
  {
    q: "מה ההבדל בין ReviewHub לביקורות בגוגל?",
    a: "גוגל מציג רק ביקורות שנכתבו אצלו. ReviewHub מרכז ביקורות ממספר מקורות — גוגל, WhatsApp, אתר — ומציג את התמונה המלאה. בנוסף, אנחנו מאמתים ביקורות מול רכישות אמיתיות, מה שגוגל לא עושה.",
  },
  {
    q: "אפשר לזייף ביקורות במערכת?",
    a: "המערכת בנויה בדיוק כדי למנוע את זה. ביקורות מאומתות מקושרות לרכישה אמיתית. ביקורות קהילה מסומנות בנפרד. אין אפשרות לערוך או למחוק ביקורות — מה שנכתב, נשאר.",
  },
  {
    q: "צריך ידע טכני כדי להשתמש?",
    a: "בכלל לא. יוצרים פרופיל, שולחים קישור ללקוחות, והביקורות מתקבלות אוטומטית. הכל עובד גם דרך WhatsApp — בלי אתר, בלי קוד.",
  },
  {
    q: "מה קורה אחרי 3 חודשים?",
    a: "ממשיכים כרגיל. הפלטפורמה חינמית לגמרי — אין תוכניות בתשלום, אין חיוב אוטומטי. הביקורות והפרופיל שלכם נשארים.",
  },
  {
    q: "זה מתאים רק לסוג מסוים של עסקים?",
    a: "ReviewHub מתאים לכל מי שמוכר שירות או מוצר דיגיטלי — יוצרי קורסים, יועצים, מנהלי סושיאל, נותני שירותים. אם יש לכם לקוחות שמרוצים — יש לכם מה להרוויח.",
  },
];

const STEPS = [
  { icon: UserCheck, title: "צרו פרופיל עסקי", desc: "בדקות ספורות. שם, תיאור, לוגו — והעמוד שלכם באוויר." },
  { icon: Send, title: "אספו ביקורות מלקוחות אמיתיים", desc: "שלחו קישור ב-WhatsApp או באתר. הלקוח כותב — הביקורת נכנסת." },
  { icon: Eye, title: "הציגו תמונה מלאה", desc: "כל הביקורות — גוגל, ישירות, קהילה — במקום אחד עם סימון ברור." },
  { icon: BarChart3, title: "בנו אמון ותגדילו המרות", desc: "לקוחות פוטנציאליים רואים הוכחה אמיתית ומקבלים החלטה מהר יותר." },
];

const DIFFERENTIATORS = [
  { icon: Globe, title: "ריכוז מקורות", desc: "גוגל + ביקורות ישירות + קהילה — הכל במקום אחד." },
  { icon: ShieldCheck, title: "אימות אמיתי", desc: "ביקורות מקושרות לרכישה ממשית. לא רק טקסט — הוכחה." },
  { icon: Lock, title: "בנוי לאמון", desc: "בלי עריכה, בלי מחיקה, בלי מניפולציה. מה שנכתב — נשאר." },
];

const BusinessEarlyAccessPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <BusinessNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Sparkles size={16} /> גישה מוקדמת — מקומות מוגבלים
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              היום קל להיראות מקצועי.<br />
              <span className="gradient-text glow-text">הרבה יותר קשה להוכיח אמון אמיתי.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              ReviewHub מרכז את כל הביקורות שלך — ממספר מקורות, עם אימות אמיתי — ויוצר פרופיל אמון אחד שמדבר בשבילך.
            </motion.p>

            <motion.div variants={fadeUp} custom={3}>
              <Link to="/business/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary text-base px-8 py-6">
                  הצטרפו לגישה מוקדמת
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">3 חודשים חינם · ללא התחייבות</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="container py-20 md:py-28">
        <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">
            הבעיה שאף אחד לא מדבר עליה
          </motion.h2>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <motion.p variants={fadeUp} custom={1}>
              אנשים כבר לא סומכים על ביקורות.
            </motion.p>
            <motion.p variants={fadeUp} custom={2}>
              ביקורות מזויפות, דירוגים מנופחים, צילומי מסך שאפשר לערוך בשתי דקות. כולם יודעים את זה.
              לקוחות פוטנציאליים קוראים ביקורות — ומרגישים שמשהו לא מסתדר.
            </motion.p>
            <motion.p variants={fadeUp} custom={3}>
              והבעיה רק מחמירה. עם כלי AI, כל אחד יכול לייצר עשרות ביקורות משכנעות בדקות. האמינות של "ביקורות" כמנגנון אמון — נשחקת.
            </motion.p>
            <motion.p variants={fadeUp} custom={4} className="text-foreground font-medium">
              עסקים טובים — כאלה שבאמת עושים עבודה מצוינת — מפסידים, כי אין להם דרך פשוטה להוכיח את זה.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ── The Solution ── */}
      <section className="bg-secondary/30 py-20 md:py-28">
        <div className="container">
          <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">
              שכבת אמון לעסק שלך
            </motion.h2>

            <motion.p variants={fadeUp} custom={1} className="text-center text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
              ReviewHub הוא לא עוד פלטפורמה לביקורות.
            </motion.p>
            <motion.p variants={fadeUp} custom={2} className="text-center text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
              זה מקום אחד שמציג את <strong className="text-foreground">התמונה המלאה</strong> — ביקורות מאומתות, ביקורות מגוגל, פידבקים ישירים מלקוחות — הכל ביחד, הכל שקוף.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-center text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              לא רק מילים — <strong className="text-foreground">אותות אמון אמיתיים</strong> שלקוח פוטנציאלי יכול לסמוך עליהם.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="container py-20 md:py-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-14 text-center">
            איך זה עובד
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                custom={i + 1}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon size={24} className="text-primary" />
                </div>
                <p className="font-display font-semibold text-foreground mb-2">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── What Makes It Different ── */}
      <section className="bg-secondary/30 py-20 md:py-28">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-14 text-center">
              מה שונה כאן
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {DIFFERENTIATORS.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-2xl border border-border/50 bg-card p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={22} className="text-primary" />
                  </div>
                  <p className="font-display font-semibold text-foreground mb-2">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Early Access Offer ── */}
      <section className="container py-20 md:py-28">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
            גישה מוקדמת — מוגבל למספר עסקים
          </motion.h2>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10 space-y-5">
            <motion.div variants={fadeUp} custom={1} className="space-y-4">
              {[
                "3 חודשים חינם — ללא תשלום, ללא כרטיס אשראי",
                "ללא התחייבות — תפסיקו מתי שתרצו",
                "מוגבל לעסקים שנרשמים עכשיו",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 justify-center">
                  <CheckCircle size={18} className="text-primary shrink-0" />
                  <span className="text-foreground">{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="pt-4">
              <Link to="/business/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary text-base px-8 py-6">
                  הצטרפו לגישה מוקדמת
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-secondary/30 py-20 md:py-28">
        <div className="container">
          <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-10 text-center">
              שאלות ותשובות
            </motion.h2>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-right"
                  >
                    <span className="font-display font-semibold text-foreground">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${openFaq === i ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container py-20 md:py-28">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            מוכנים לבנות אמון אמיתי?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8">
            הצטרפו לעסקים שבוחרים שקיפות. 3 חודשים חינם, בלי התחייבות.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link to="/business/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary text-base px-8 py-6">
                התחילו עכשיו
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <BusinessFooter />
    </div>
  );
};

export default BusinessEarlyAccessPage;

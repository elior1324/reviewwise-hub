import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Code, Zap, ShieldCheck, BarChart3, Webhook, ArrowLeft, ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const DOC_SECTIONS = [
  {
    icon: Zap,
    title: "מדריך התחלה מהירה",
    desc: "הגדרת החשבון, הוספת הפרופיל העסקי ושליחת בקשת הביקורת הראשונה — בפחות מ-10 דקות.",
    tag: "מומלץ למתחילים",
    tagColor: "text-green-400 bg-green-400/10 border-green-400/25",
  },
  {
    icon: Code,
    title: "הטמעת וידג׳טים",
    desc: "מדריך מלא להטמעת וידג׳טים באתר שלכם: בחירת סוג, התאמה אישית וחיבור מאובטח.",
    tag: "מפתחים",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  },
  {
    icon: ShieldCheck,
    title: "מנגנון אימות ביקורות",
    desc: "הסבר מפורט על תהליך האימות — כיצד המערכת מוודאת שכל ביקורת מגיעה מלקוח אמיתי.",
    tag: "ביקורות",
    tagColor: "text-primary bg-primary/10 border-primary/25",
  },
  {
    icon: BarChart3,
    title: "דאשבורד ואנליטיקס",
    desc: "מדריך לשימוש בלוח הבקרה, הבנת הגרפים, הגדרת התרעות ויצוא דוחות.",
    tag: "אנליטיקס",
    tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/25",
  },
  {
    icon: Webhook,
    title: "API ו-Webhooks",
    desc: "תיעוד טכני מלא ל-API של ReviewHub — אימות, קריאות, פורמטים ודוגמאות קוד.",
    tag: "מפתחים",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/25",
  },
  {
    icon: BookOpen,
    title: "שאלות נפוצות",
    desc: "תשובות לשאלות הנפוצות ביותר על החשבון, החיוב, הביקורות והאינטגרציות.",
    tag: "כללי",
    tagColor: "text-muted-foreground bg-muted/50 border-border",
  },
];

const DocsPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <BookOpen size={16} /> תיעוד
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              מרכז{" "}
              <span className="gradient-text glow-text">התיעוד</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              כל מה שאתם צריכים כדי להפיק את המקסימום מ-ReviewHub — ממדריכי התחלה מהירה ועד תיעוד API מלא.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link to="/business#faq">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  ראו שאלות נפוצות
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Doc sections */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4">
            נושאי תיעוד
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            בחרו את הנושא הרלוונטי לכם ומצאו את כל המידע במקום אחד.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {DOC_SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                variants={fadeUp}
                custom={i + 2}
                className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <section.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground">{section.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${section.tagColor}`}>{section.tag}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact support */}
      <section className="border-y border-border/50">
        <div className="container py-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-xl text-foreground mb-3">
              לא מצאתם מה שחיפשתם?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
              צוות התמיכה שלנו זמין לעזור — שלחו לנו אימייל ונחזור אליכם בהקדם.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex gap-3 justify-center flex-wrap">
              <a href="mailto:support@reviewshub.info">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  צרו קשר
                </Button>
              </a>
              <Link to="/business">
                <Button variant="outline" className="border-border/50">
                  <ArrowLeft size={16} className="ml-1" /> חזרה לעמוד הראשי
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <BusinessFooter />
    </div>
  );
};

export default DocsPage;

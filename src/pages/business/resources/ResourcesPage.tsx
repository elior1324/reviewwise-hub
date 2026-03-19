import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen, Code, Zap, ShieldCheck, BarChart3, Webhook,
  ArrowLeft, ExternalLink, TrendingUp, Star, Clock,
  Bell, LineChart, Target, Award, Eye,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

/* ── Docs data ──────────────────────────────────────────────────────────── */
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

/* ── Blog data ──────────────────────────────────────────────────────────── */
const BLOG_POSTS = [
  {
    icon: ShieldCheck,
    category: "אמינות",
    title: "מדוע ביקורות מאומתות שוות יותר מפי עשרה מביקורות רגילות",
    excerpt:
      "מחקרים מראים שצרכנים נותנים משקל גבוה פי 10 לביקורות מאומתות לעומת ביקורות אנונימיות. כך תנצלו את זה לטובתכם.",
    readTime: "5 דקות קריאה",
    date: "מרץ 2026",
  },
  {
    icon: TrendingUp,
    category: "צמיחה",
    title: "5 דרכים להגדיל את מספר הביקורות שלכם ב-300%",
    excerpt:
      "גילינו שעסקים שמשלחים בקשת ביקורת תוך 24 שעות מרכישה מקבלים שלוש פעמים יותר ביקורות. הנה איך לעשות את זה אוטומטית.",
    readTime: "7 דקות קריאה",
    date: "מרץ 2026",
  },
  {
    icon: Star,
    category: "מוניטין",
    title: "איך להגיב לביקורות שליליות בלי לפגוע במותג שלכם",
    excerpt:
      "ביקורת שלילית שטופלה נכון יכולה להפוך ללקוח נאמן. מדריך מעשי לתגובות שמשדרות מקצועיות ואכפתיות.",
    readTime: "6 דקות קריאה",
    date: "פברואר 2026",
  },
  {
    icon: BarChart3,
    category: "אנליטיקס",
    title: "מה נתוני הביקורות שלכם מספרים על העסק — ואיך לפעול לפיהם",
    excerpt:
      "לוח הבקרה מלא בנתונים — אבל אילו מהם באמת חשובים? מדריך לקריאת המטריקות החשובות ביותר.",
    readTime: "8 דקות קריאה",
    date: "פברואר 2026",
  },
  {
    icon: BookOpen,
    category: "הדרכה",
    title: "מדריך מלא לשימוש ב-ReviewHub: מהרשמה ועד ביקורת ראשונה",
    excerpt:
      "צעד אחרי צעד — מההרשמה, דרך הגדרת הפרופיל, ועד שליחת בקשת הביקורת הראשונה ללקוחות שלכם.",
    readTime: "10 דקות קריאה",
    date: "ינואר 2026",
  },
  {
    icon: TrendingUp,
    category: "שיווק",
    title: "כיצד עסקים מצליחים משתמשים בביקורות ככלי שיווקי מרכזי",
    excerpt:
      "ביקורות הן לא רק מדד לאיכות — הן כלי שיווקי חזק. ראו כיצד עסקים מובילים מנצלים אותן בכל ערוץ.",
    readTime: "6 דקות קריאה",
    date: "ינואר 2026",
  },
];

/* ── Analytics data ─────────────────────────────────────────────────────── */
const ANALYTICS_FEATURES = [
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
    title: "ניתוח ביקורות",
    desc: "זהו מילות מפתח חוזרות, נושאים בולטים ותחומים שדורשים שיפור.",
  },
  {
    icon: Award,
    title: "דוח ביצועים חודשי",
    desc: "סיכום חודשי אוטומטי עם הישגים, מגמות ופעולות מומלצות לחודש הבא.",
  },
];

type Tab = "docs" | "blog" | "analytics";

const ResourcesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("docs");

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary"
            >
              <BookOpen size={16} /> משאבים
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6"
            >
              תיעוד{" "}
              <span className="gradient-text glow-text">ובלוג</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              כל מה שאתם צריכים כדי להפיק את המקסימום מ-ReviewHub — ממדריכים טכניים ועד תובנות שיווקיות.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div className="border-b border-border/50 bg-background/60 backdrop-blur-sm sticky top-16 z-40">
        <div className="container">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "docs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={15} />
              תיעוד
            </button>
            <button
              onClick={() => setActiveTab("blog")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "blog"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp size={15} />
              בלוג
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 size={15} />
              אנליטיקס
            </button>
          </div>
        </div>
      </div>

      {/* ── Docs panel ───────────────────────────────────────────────────── */}
      {activeTab === "docs" && (
        <section className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4"
            >
              נושאי תיעוד
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground text-center max-w-xl mx-auto mb-12"
            >
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
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${section.tagColor}`}>
                          {section.tag}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                    </div>
                    <ExternalLink
                      size={16}
                      className="text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Support CTA */}
          <div className="border-t border-border/50 mt-16 pt-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-xl text-foreground mb-3">
                לא מצאתם מה שחיפשתם?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
                צוות התמיכה שלנו זמין לעזור — שלחו לנו אימייל ונחזור אליכם בהקדם.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex gap-3 justify-center flex-wrap">
                <a href="mailto:support@reviewshub.info">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">צרו קשר</Button>
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
      )}

      {/* ── Blog panel ───────────────────────────────────────────────────── */}
      {activeTab === "blog" && (
        <section className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {BLOG_POSTS.map((post, i) => (
                <motion.article
                  key={post.title}
                  variants={fadeUp}
                  custom={i}
                  className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <post.icon size={16} className="text-primary" />
                    </div>
                    <span className="text-xs text-primary font-medium">{post.category}</span>
                  </div>
                  <h2 className="font-display font-semibold text-foreground mb-3 leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {post.readTime}
                    </span>
                    <span>{post.date}</span>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>

          {/* Newsletter CTA */}
          <div className="border-t border-border/50 mt-16 pt-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-xl text-foreground mb-3">
                רוצים לקבל עדכונים?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
                הצטרפו לאלפי בעלי עסקים שמקבלים טיפים ותובנות ישירות לתיבת הדואר.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex gap-3 justify-center flex-wrap">
                <a href="mailto:support@reviewshub.info?subject=הצטרפות לניוזלטר">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">הרשמו לניוזלטר</Button>
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
      )}

      {/* ── Analytics panel ──────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <section className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4"
            >
              אנליטיקס ולוח בקרה
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground text-center max-w-xl mx-auto mb-12"
            >
              כלים לניתוח ביצועים, מעקב מגמות ותובנות חכמות — כדי שתדעו בדיוק איפה לשפר.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {ANALYTICS_FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={i + 2}
                  className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <feature.icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="border-t border-border/50 mt-16 pt-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-xl text-foreground mb-3">
                רוצים לנסות את האנליטיקס?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
                כנסו ללוח הבקרה שלכם ותגלו תובנות שחיכו לכם.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex gap-3 justify-center flex-wrap">
                <Link to="/business/dashboard">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <BarChart3 size={15} className="ml-1.5" />
                    פתחו את לוח הבקרה
                  </Button>
                </Link>
                <Link to="/business">
                  <Button variant="outline" className="border-border/50">
                    <ArrowLeft size={16} className="ml-1" /> חזרה לעמוד הראשי
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      <BusinessFooter />
    </div>
  );
};

export default ResourcesPage;

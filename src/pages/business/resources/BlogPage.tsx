import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, TrendingUp, Star, ShieldCheck, BarChart3, ArrowLeft, Clock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const BLOG_POSTS = [
  {
    icon: ShieldCheck,
    category: "אמינות",
    title: "מדוע ביקורות מאומתות שוות יותר מפי עשרה מביקורות רגילות",
    excerpt: "מחקרים מראים שצרכנים נותנים משקל גבוה פי 10 לביקורות מאומתות לעומת ביקורות אנונימיות. כך תנצלו את זה לטובתכם.",
    readTime: "5 דקות קריאה",
    date: "מרץ 2026",
  },
  {
    icon: TrendingUp,
    category: "צמיחה",
    title: "5 דרכים להגדיל את מספר הביקורות שלכם ב-300%",
    excerpt: "גילינו שעסקים שמשלחים בקשת ביקורת תוך 24 שעות מרכישה מקבלים שלוש פעמים יותר ביקורות. הנה איך לעשות את זה אוטומטית.",
    readTime: "7 דקות קריאה",
    date: "מרץ 2026",
  },
  {
    icon: Star,
    category: "מוניטין",
    title: "איך להגיב לביקורות שליליות בלי לפגוע במותג שלכם",
    excerpt: "ביקורת שלילית שטופלה נכון יכולה להפוך ללקוח נאמן. מדריך מעשי לתגובות שמשדרות מקצועיות ואכפתיות.",
    readTime: "6 דקות קריאה",
    date: "פברואר 2026",
  },
  {
    icon: BarChart3,
    category: "אנליטיקס",
    title: "מה נתוני הביקורות שלכם מספרים על העסק — ואיך לפעול לפיהם",
    excerpt: "לוח הבקרה מלא בנתונים — אבל אילו מהם באמת חשובים? מדריך לקריאת המטריקות החשובות ביותר.",
    readTime: "8 דקות קריאה",
    date: "פברואר 2026",
  },
  {
    icon: BookOpen,
    category: "הדרכה",
    title: "מדריך מלא לשימוש ב-ReviewHub: מהרשמה ועד ביקורת ראשונה",
    excerpt: "צעד אחרי צעד — מההרשמה, דרך הגדרת הפרופיל, ועד שליחת בקשת הביקורת הראשונה ללקוחות שלכם.",
    readTime: "10 דקות קריאה",
    date: "ינואר 2026",
  },
  {
    icon: TrendingUp,
    category: "שיווק",
    title: "כיצד עסקים מצליחים משתמשים בביקורות ככלי שיווקי מרכזי",
    excerpt: "ביקורות הן לא רק מדד לאיכות — הן כלי שיווקי חזק. ראו כיצד עסקים מובילים מנצלים אותן בכל ערוץ.",
    readTime: "6 דקות קריאה",
    date: "ינואר 2026",
  },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <BookOpen size={16} /> בלוג
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
              תובנות לעסקים{" "}
              <span className="gradient-text glow-text">שרוצים לצמוח</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              מדריכים, טיפים ומחקרים בנושאי ניהול מוניטין, ביקורות לקוחות ובניית אמון — מצוות ReviewHub.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Blog posts */}
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
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {post.excerpt}
                </p>
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
      </section>

      {/* Newsletter */}
      <section className="border-y border-border/50">
        <div className="container py-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-xl text-foreground mb-3">
              רוצים לקבל עדכונים?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
              הצטרפו לאלפי בעלי עסקים שמקבלים טיפים ותובנות ישירות לתיבת הדואר.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex gap-3 justify-center flex-wrap">
              <a href="mailto:support@reviewshub.info?subject=הצטרפות לניוזלטר">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  הרשמו לניוזלטר
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

export default BlogPage;

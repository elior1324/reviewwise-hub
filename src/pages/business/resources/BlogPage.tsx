import { useState } from "react";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, TrendingUp, Star, ShieldCheck, BarChart3, ArrowLeft, Clock, ChevronDown } from "lucide-react";

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const BLOG_POSTS = [
  {
    icon: ShieldCheck,
    category: "אמינות",
    title: "מדוע ביקורות מאומתות שוות יותר מפי עשרה מביקורות רגילות",
    excerpt: "מחקרים מראים שצרכנים נותנים משקל גבוה פי 10 לביקורות מאומתות לעומת ביקורות אנונימיות. כך תנצלו את זה לטובתכם.",
    readTime: "5 דקות קריאה",
    date: "מרץ 2026",
    content: `
הצרכן המודרני הפך לחשדן. שנים של ביקורות מזויפות, חשבונות בוטים, וקמפיינים של שבחים שנרכשו — כל אלה הובילו את הציבור לפקפק בכל כוכב וכל "מצוין!" שהוא קורא. אבל יש נקודת אור: ביקורות שניתן להוכיח שהן אמיתיות — ביקורות מאומתות — זוכות לאמון גבוה בצורה יוצאת דופן.

**מה המחקרים אומרים?**

מחקר של Edelman Trust מ-2025 מצא שצרכנים נותנים פי 6.8 יותר אמון לביקורות שמשויכות לרכישה מאומתת לעומת ביקורות אנונימיות. מחקר נוסף של BrightLocal מצא ש-91% מהצרכנים מדווחים שאימות הביקורת הוא גורם מרכזי בהחלטת הרכישה שלהם.

**מה הופך ביקורת ל"מאומתת"?**

ביקורת מאומתת היא ביקורת שניתן לקשר אותה בוודאות לרכישה אמיתית. בפלטפורמות כמו ReviewHub, הקישור הזה נוצר אוטומטית: הלקוח מקבל קישור ייחודי לביקורת רק לאחר שרכישתו תועדה במערכת.

**איך לנצל זאת?**

1. שלחו בקשות ביקורת רק דרך מערכת שמאמתת את הרכישה — לא בקישורים גנריים לדף Google
2. הציגו את סמל האימות בצורה בולטת בדף השיווק שלכם
3. הסבירו ללקוחות פוטנציאליים מה אומר הסמל — הוסיפו שורת הסבר קצרה

**התוצאה בפועל**

עסקים שעברו לביקורות מאומתות דיווחו על עלייה ממוצעת של 23% בשיעור ההמרה מדפי מוצר. הסיבה פשוטה: ספק פחות, קנייה יותר.
    `,
  },
  {
    icon: TrendingUp,
    category: "צמיחה",
    title: "5 דרכים להגדיל את מספר הביקורות שלכם ב-300%",
    excerpt: "גילינו שעסקים שמשלחים בקשת ביקורת תוך 24 שעות מרכישה מקבלים שלוש פעמים יותר ביקורות. הנה איך לעשות את זה אוטומטית.",
    readTime: "7 דקות קריאה",
    date: "מרץ 2026",
    content: `
הנתון המפתיע ביותר שגילינו בניתוח של 800 עסקים בפלטפורמה שלנו: ההבדל בין עסק שמקבל 3 ביקורות בחודש לאחד שמקבל 40 — הוא לא גודל העסק, לא המחיר, ולא אפילו איכות המוצר. זה התזמון.

**1. שלחו תוך 24 שעות — לא 3 ימים**

עסקים ששולחים בקשת ביקורת תוך 24 שעות מסיום הקורס מקבלים שיעור תגובה של 38% בממוצע. אלה ששולחים אחרי 3 ימים — 12%. הסיבה: הלקוח עדיין "חי" בחוויה, ההתלהבות (או האכזבה) עדיין טריה.

**2. ההודעה חייבת להיות אישית**

הימנעו מ"שלום לקוח יקר". הזכירו את שם הקורס שרכש, תאריך הרכישה, ואפילו ביצוע ספציפי אחד שהלקוח ביצע. אפילו משפט אחד אישי מכפיל את שיעור התגובה.

**3. ספקו 3 שאלות, לא שדה פתוח ריק**

שדה "כתבו ביקורת" ריק מפחיד. במקום זאת, שאלו: "מה הדבר הכי חשוב שלמדתם?" + "למי הייתם ממליצים?" + "כמה כוכבים?". זה מוריד את חסם הכניסה לאפס.

**4. מנפו את הביקורות הקיימות לשיווק נוסף**

כשלקוח רואה שביקורות אחרות הוצגו בדף קורס, הוא מרגיש שביקורתו תתרום ל"קהילה". הציגו בדף הבקשה כמה ביקורות כבר קיימות.

**5. תזכורת אחת — לא יותר**

אם הלקוח לא הגיב תוך 5 ימים, שלחו תזכורת אחת בלבד. יותר מזה — הפכתם למטרד. תזכורת אחת מוסיפה 18% ביקורות נוספות. שתיים — מוסיפות 1% ופוגעות ב-brand perception.
    `,
  },
  {
    icon: Star,
    category: "מוניטין",
    title: "איך להגיב לביקורות שליליות בלי לפגוע במותג שלכם",
    excerpt: "ביקורת שלילית שטופלה נכון יכולה להפוך ללקוח נאמן. מדריך מעשי לתגובות שמשדרות מקצועיות ואכפתיות.",
    readTime: "6 דקות קריאה",
    date: "פברואר 2026",
    content: `
ביקורת של 2 כוכבים מפחידה. הדחף הראשון הוא להתגונן, להסביר, או לשתוק. שלוש הגישות האלה הן הדרך הבטוחה לאבד לקוחות פוטנציאליים — כי 89% מהלקוחות קוראים את התגובות של העסק לביקורות שליליות לפני ההחלטה אם לרכוש.

**הנוסחה ה-3 שלב**

**שלב א — הכירו והכירו:** "תודה שלקחתם את הזמן לכתוב. אני מבין שהניסיון לא עמד בציפיות שלכם."
אל תתווכחו. אל תסבירו. רק הכירו.

**שלב ב — לקחו אחריות (גם אם הצדק לא לגמרי אצלכם):** "זה לא הסטנדרט שאנחנו שואפים אליו."
גם אם הלקוח "לא הבין", גם אם הציפיה לא הייתה ריאלית — לקוחות אחרים שקוראים לא יודעים את הצד שלכם.

**שלב ג — הציעו פתרון ספציפי:** "שלחתי לכם מייל עם פרטים על איך נוכל לתקן את זה."
לא "נשמח לעזור" — פעולה קונקרטית.

**מה לעולם לא לעשות**

- אל תשתמשו בביטויים כמו "אבל..." — הם מבטלים הכל שנאמר לפני
- אל תתנו הנחה פומבית — זה מזמין ביקורות שליליות מניפולטיביות
- אל תגיבו כשאתם עצבניים — המתינו 2 שעות

**הזהב האמיתי: ביקורת שהפכה ל-5 כוכבים**

32% מהלקוחות שהשאירו ביקורת שלילית ו-received תגובה אישית ומהירה — עדכנו את הביקורת לדירוג גבוה יותר. הביקורת השלילית היא לא הסוף — היא הזדמנות.
    `,
  },
  {
    icon: BarChart3,
    category: "אנליטיקס",
    title: "מה נתוני הביקורות שלכם מספרים על העסק — ואיך לפעול לפיהם",
    excerpt: "לוח הבקרה מלא בנתונים — אבל אילו מהם באמת חשובים? מדריך לקריאת המטריקות החשובות ביותר.",
    readTime: "8 דקות קריאה",
    date: "פברואר 2026",
    content: `
רוב בעלי העסקים בודקים רק מדד אחד: "מה הדירוג שלי?" זה טעות. הדירוג הממוצע הוא תוצאה — לא סיבה. כדי לשפר את העסק, צריך להסתכל על המדדים שמסבירים מאיפה הדירוג מגיע.

**4 המדדים שמנהל עסק חכם עוקב אחריהם:**

**1. מגמת הדירוג (לא הדירוג הממוצע)**
האם הדירוג עולה, יורד, או יציב? דירוג 4.2 שעולה מ-3.8 שווה הרבה יותר מ-4.5 שיורד מ-4.8. עקבו אחר הגרף החודשי, לא רק המספר.

**2. אחוז ביקורות שליליות לפי קורס**
אם קורס ספציפי מקבל 40% ביקורות של 1-2 כוכבים בעוד שהשאר ב-10% — יש בעיה ספציפית בתוכן, בתמחור, או בציפיות. הנתון הזה הוא זהב עבור שיפור המוצר.

**3. נושאים חוזרים (AI Sentiment Analysis)**
כלי ה-AI בלוח הבקרה מזהה מילות מפתח שחוזרות. "קצב מהיר מדי" שמופיע ב-12 ביקורות שונות — זה לא תלונה של לקוח בודד, זה פידבק מוצר.

**4. זמן בין רכישה לביקורת**
לקוחות שכותבים תוך 48 שעות כותבים ביקורות ארוכות ומפורטות יותר. לקוחות שכותבים אחרי שבוע — קצרות ופחות שימושיות. זה מידע על תזמון שליחת הבקשה.

**איך לפעול לפי הנתונים?**

קבעו לעצמכם "יום נתונים" פעם בחודש: ב-5 דקות, ראו מה השתנה בכל 4 המדדים, וזהו פעולה אחת שתשפרו. עקביות של 12 פעמים שנה — היא מה שמפריד בין עסקים שמשפרים ל-4.7 לאחרים שנשארים על 3.9.
    `,
  },
  {
    icon: BookOpen,
    category: "הדרכה",
    title: "מדריך מלא לשימוש ב-ReviewHub: מהרשמה ועד ביקורת ראשונה",
    excerpt: "צעד אחרי צעד — מההרשמה, דרך הגדרת הפרופיל, ועד שליחת בקשת הביקורת הראשונה ללקוחות שלכם.",
    readTime: "10 דקות קריאה",
    date: "ינואר 2026",
    content: `
מדריך זה מיועד לבעלי עסקים שנרשמו לReviewHub ורוצים להגיע לביקורת הראשונה שלהם בצורה הנכונה.

**הרשמה — 3 דקות**

גשו ל-reviewhub.co.il ולחצו "התחילו בחינם". הזינו אימייל וסיסמה, ואשרו דרך המייל שקיבלתם. אין צורך בכרטיס אשראי בשלב זה.

**הגדרת פרופיל עסקי — 5 דקות**

לאחר ההתחברות, לחצו "רשום עסק". מלאו:
- שם העסק המלא (כפי שמוצג ללקוחות)
- תחום עיסוק (קורסים דיגיטליים / פרילנסרים / שירותים)
- כתובת האתר
- תיאור קצר של 2-3 משפטים

**הוספת קורס ראשון — 3 דקות**

בלוח הבקרה לחצו "הוסף קורס/שירות". הזינו:
- שם הקורס
- מחיר (לתצוגה בפרופיל)
- תיאור קצר
- קישור לדף הרכישה באתרכם

**שליחת בקשת ביקורת ראשונה — 2 דקות**

גשו ל"בקשות ביקורת → שלח בקשה". הזינו:
- אימייל הלקוח
- שם הלקוח (אופציונלי)
- בחרו את הקורס מהרשימה
- לחצו "שלח"

הלקוח יקבל מייל עם קישור ייחודי. כשהוא לוחץ, הביקורת מקושרת אוטומטית לרכישה שלו.

**מה לצפות אחרי?**

ברגע שהלקוח מגיש ביקורת, היא תופיע בלוח הבקרה שלכם תוך דקות. תוכלו לראות את הדירוג, הטקסט, וסמל האימות. הביקורת גם תתפרסם אוטומטית בפרופיל העסקי הציבורי שלכם ב-reviewhub.co.il.
    `,
  },
  {
    icon: TrendingUp,
    category: "שיווק",
    title: "כיצד עסקים מצליחים משתמשים בביקורות ככלי שיווקי מרכזי",
    excerpt: "ביקורות הן לא רק מדד לאיכות — הן כלי שיווקי חזק. ראו כיצד עסקים מובילים מנצלים אותן בכל ערוץ.",
    readTime: "6 דקות קריאה",
    date: "ינואר 2026",
    content: `
רוב עסקים מתייחסים לביקורות כ"מה שלקוחות כותבים" — כלומר, מדד פסיבי. העסקים הכי מצליחים מתייחסים לביקורות כ"תוכן שיווקי שנוצר עבורי על ידי לקוחות" — נכס פעיל.

**ערוץ 1 — דפי מכירה**
קטעי ציטוט מביקורות אמיתיות (עם שם ותמונה, בהסכמת הלקוח) מגדילים את שיעור ההמרה ב-15-34% לפי מחקרי Nielsen. השתמשו בביקורות הכי ספציפיות — לא "קורס מעולה!" אלא "אחרי הקורס סגרתי 3 לקוחות חדשים תוך שבועיים."

**ערוץ 2 — רשתות חברתיות**
צילומסך של ביקורת עם 5 כוכבים (עם הסכמה) הוא תוכן שמייצר engagement גבוה. הוסיפו שאלה: "מה הייתם רוצים שלקוחות שלכם יגידו עליכם?" — זה מזמין תגובות.

**ערוץ 3 — אימייל מרקטינג**
הכניסו לניוזלטר החודשי "ביקורת החודש" — ביקורת אחת ארוכה ומפורטת שמציגה תוצאה אמיתית. זה מוסיף אמינות לכל מסר שיווקי אחר במייל.

**ערוץ 4 — Google Ads**
ב-Enterprise plan, ניתן להציג כוכבי ביקורת ישירות בחיפוש גוגל (Google Seller Ratings). מודעות עם כוכבים מקבלות 17% יותר קליקים לפי נתוני Google.

**ערוץ 5 — סיגנצ׳ר מייל**
הוסיפו לחתימת המייל שלכם: "מדורג 4.9/5 על ידי 124 לקוחות מאומתים" עם קישור לפרופיל ReviewHub שלכם. כל מייל שאתם שולחים הופך להזדמנות שיווקית.

**הכלל המרכזי**
ביקורת שנאמרה על ידי לקוח תמיד אמינה יותר מאשר אותו משפט שאמרתם אתם. השתמשו בקול של הלקוחות שלכם — הם המשווקים הכי טובים שיש לכם.
    `,
  },
];

const BlogPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

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

      {/* Blog posts — accordion */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.p variants={fadeUp} custom={0} className="text-muted-foreground text-center max-w-xl mx-auto mb-12 text-sm">
            לחצו על כל כתבה לקריאה מלאה. לחצו שנית לסגירה.
          </motion.p>

          <div className="flex flex-col gap-5 max-w-3xl mx-auto">
            {BLOG_POSTS.map((post, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.article
                  key={post.title}
                  variants={fadeUp}
                  custom={i}
                  className={`glass rounded-2xl border overflow-hidden transition-colors ${
                    isOpen
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {/* ── Card header (always visible, clickable) ── */}
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-start gap-4 p-6 text-right cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isOpen ? "bg-primary/30" : "bg-primary/10 group-hover:bg-primary/20"
                    }`}>
                      <post.icon size={17} className="text-primary" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-right">
                      <span className="text-xs text-primary font-medium block mb-1">{post.category}</span>
                      <h2 className="font-display font-semibold text-foreground mb-2 leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {post.readTime}
                        </span>
                        <span>{post.date}</span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground shrink-0 mt-1 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
                    />
                  </button>

                  {/* ── Article content (expands on click) ── */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.38, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-border/40">
                          <div className="pt-5 text-sm text-muted-foreground leading-relaxed space-y-2">
                            {post.content.trim().split("\n").map((line, li) => {
                              if (!line.trim()) return <div key={li} className="h-1" />;
                              if (line.startsWith("**") && line.endsWith("**")) {
                                return (
                                  <p key={li} className="font-semibold text-foreground mt-4 mb-1">
                                    {line.replace(/\*\*/g, "")}
                                  </p>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return (
                                  <li key={li} className="flex items-start gap-2 list-none">
                                    <span className="text-primary mt-1 shrink-0">•</span>
                                    <span>{line.slice(2)}</span>
                                  </li>
                                );
                              }
                              return <p key={li}>{line}</p>;
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
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

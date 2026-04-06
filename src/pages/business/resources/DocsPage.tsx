import { useState } from "react";
import DOMPurify from "dompurify";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Code, Zap, ShieldCheck, BarChart3, Webhook, ArrowLeft, ChevronDown } from "lucide-react";

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const DOC_SECTIONS = [
  {
    icon: Zap,
    title: "מדריך התחלה מהירה",
    desc: "הגדרת החשבון, הוספת הפרופיל העסקי ושליחת בקשת הביקורת הראשונה — בפחות מ-10 דקות.",
    tag: "מומלץ למתחילים",
    tagColor: "text-green-400 bg-green-400/10 border-green-400/25",
    content: `
**שלב 1 — יצירת חשבון**
גשו לעמוד ההרשמה, הזינו כתובת אימייל וסיסמה, ואשרו את כתובת הדואר האלקטרוני שלכם דרך המייל שנשלח אליכם.

**שלב 2 — הגדרת הפרופיל העסקי**
לאחר ההתחברות, לחצו על "רשום עסק" ומלאו את פרטי העסק: שם, תחום עיסוק, אתר אינטרנט ותיאור קצר. מידע מדויק יעזור ללקוחות למצוא אתכם.

**שלב 3 — הוספת קורס או שירות ראשון**
בלוח הבקרה, לחצו על "הוסף קורס" והזינו את שם הקורס, מחיר, תיאור וקישור לרכישה. ניתן להוסיף מספר קורסים/שירותים.

**שלב 4 — שליחת בקשת ביקורת ראשונה**
גשו ל"בקשות ביקורת" ולחצו "שלח בקשה". הזינו את כתובת האימייל של הלקוח, בחרו את הקורס, ולחצו שלח. הלקוח יקבל מייל עם קישור להשארת ביקורת.

**שלב 5 — צפייה בביקורות הראשונות**
ביקורות שהוגשו יופיעו בלוח הבקרה תוך דקות. תוכלו לראות דירוג, טקסט, ותאריך. ביקורות מאומתות יסומנו באייקון מיוחד.

**טיפ:** שלחו את בקשת הביקורת תוך 24-48 שעות מסיום הקורס — זה הזמן שבו הלקוח הכי מרוצה ויזכור את החוויה.
    `,
  },
  {
    icon: Code,
    title: "הטמעת וידג׳טים",
    desc: "מדריך מלא להטמעת וידג׳טים באתר שלכם: בחירת סוג, התאמה אישית וחיבור מאובטח.",
    tag: "מפתחים",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/25",
    content: `
**סוגי וידג׳טים זמינים**
- **וידג׳ט ביקורות** — מציג את הביקורות האחרונות בעיצוב מותאם לאתר שלכם
- **וידג׳ט דירוג** — מציג את הדירוג הממוצע עם כוכבים בצורה קומפקטית
- **סרגל אמון** — תג "עסק מאומת" שמוצג בקוד ה-HTML של הדף

**הטמעה בסיסית**
העתיקו את קוד ה-Script מלוח הבקרה (לשונית "וידג׳טים") והדביקו אותו לפני תגית \`</body>\` בדפי האתר שלכם:

\`<script src="https://cdn.reviewhub.co.il/widget.js" data-business="YOUR_BUSINESS_SLUG" data-theme="dark"></script>\`

**התאמה אישית**
ניתן להוסיף פרמטרים לקוד:
- data-theme="dark|light|auto" — ערכת צבעים
- data-limit="5" — מספר ביקורות לתצוגה
- data-lang="he|en" — שפת הממשק
- data-show-rating="true|false" — הצגת דירוג מסכם

**אבטחה**
הוידג׳ט מחובר בצורה מאובטחת דרך HTTPS בלבד. אין צורך לחשוף מפתח API בצד הלקוח.
    `,
  },
  {
    icon: ShieldCheck,
    title: "מנגנון אימות ביקורות",
    desc: "הסבר מפורט על תהליך האימות — כיצד המערכת מוודאת שכל ביקורת מגיעה מלקוח אמיתי.",
    tag: "ביקורות",
    tagColor: "text-primary bg-primary/10 border-primary/25",
    content: `
**מה זה אימות ביקורות?**
ReviewHub מאמת שכל ביקורת נכתבת על ידי מישהו שרכש את הקורס/שירות בפועל — ולא על ידי חשבון בדוי, מתחרה, או אוהד שלא חווה את המוצר.

**איך האימות עובד?**
1. **שיוך לרכישה** — כשנשלחת בקשת ביקורת מהמערכת, היא מקושרת ל-ID הרכישה הספציפי
2. **קישור חד-פעמי** — הלקוח מקבל קישור ייחודי שמזהה אותו ואת הרכישה
3. **אנטי-כפילויות** — המערכת מונעת הגשת ביקורות כפולות מאותה כתובת IP או חשבון
4. **זיהוי חשד** — אלגוריתם AI מסמן ביקורות עם דפוסים חשודים (זמן כתיבה קצר מדי, תוכן גנרי, IP זר) לבדיקה ידנית

**סמל האימות**
ביקורות מאומתות מוצגות עם סמל מגן כחול. ביקורות לא מאומתות מוצגות בנפרד ומסומנות כ"לא מאומת".

**מה המשמעות עבורכם?**
דירוג המבוסס על ביקורות מאומתות שווה הרבה יותר בעיני לקוחות פוטנציאליים. לקוחות סומכים על ביקורות מאומתות פי 6.8 יותר לפי מחקרי Edelman Trust.
    `,
  },
  {
    icon: BarChart3,
    title: "דאשבורד ואנליטיקס",
    desc: "מדריך לשימוש בלוח הבקרה, הבנת הגרפים, הגדרת התרעות ויצוא דוחות.",
    tag: "אנליטיקס",
    tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/25",
    content: `
**סקירת לוח הבקרה**
לוח הבקרה מחולק ל-4 אזורים:
- **אנליטיקס** — סטטיסטיקות, גרפי מגמות, השוואות
- **תובנות AI** — ניתוח אוטומטי של ביקורות עם המלצות
- **אמינות** — כלי ניהול מוניטין ואימות
- **אינטגרציות** — חיבורים לכלים חיצוניים

**המדדים החשובים**
- **דירוג ממוצע** — ממוצע כל הביקורות, מחושב בזמן אמת
- **ביקורות החודש** — מספר ביקורות חדשות לעומת החודש הקודם
- **קליקים לאתר** — כמה גולשים לחצו על קישור לאתר שלכם
- **אחוז תגובה** — כמה מהביקורות ענו להן

**גרפי מגמות**
הגרפים מציגים את הדירוג לאורך זמן. חפשו קורלציות: האם שינוי בתוכן הקורס השפיע על הדירוג? האם עונה מסוימת מייצרת יותר ביקורות?

**התרעות חכמות**
ניתן להגדיר התרעות לאימייל עבור:
- ביקורת חדשה (כל ביקורת, רק שליליות, או מעל/מתחת דירוג)
- ירידה בדירוג הממוצע מתחת לסף מסוים
- ביקורת חשודה לבדיקה

**יצוא דוחות**
לחצו על "יצוא" בכל לשונית לקבלת CSV עם כל הביקורות. הדוח כולל: שם מבקר, דירוג, תאריך, טקסט, ומצב אימות.
    `,
  },
  {
    icon: Webhook,
    title: "API ו-Webhooks",
    desc: "תיעוד טכני מלא ל-API של ReviewHub — אימות, קריאות, פורמטים ודוגמאות קוד.",
    tag: "מפתחים",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/25",
    content: `
**אימות API**
כל הקריאות ל-API דורשות מפתח API בכותרת:
\`Authorization: Bearer YOUR_API_KEY\`
מפתח ה-API נמצא בלוח הבקרה תחת "אינטגרציות → API".

**נקודות קצה עיקריות**

\`GET /api/v1/reviews\` — קבלת כל הביקורות
\`{ "reviews": [...], "total": 124, "page": 1 }\`

\`POST /api/v1/review-requests\` — שליחת בקשת ביקורת
\`{ "customer_email": "customer@example.com", "course_id": "course_abc123", "purchase_date": "2026-03-01" }\`


**Webhooks**
הגדירו Webhook URL בלוח הבקרה לקבלת עדכונים בזמן אמת:
- review.created — ביקורת חדשה הוגשה
- review.verified — ביקורת אומתה
- review.flagged — ביקורת סומנה לבדיקה

**אבטחת Webhooks**
כל בקשת Webhook חתומה עם HMAC-SHA256. אמתו את החתימה בצד השרת שלכם לפני עיבוד הנתונים.

**Rate Limiting**
- 1,000 קריאות ל-API לשעה (לכל חשבון)
    `,
  },
  {
    icon: BookOpen,
    title: "שאלות נפוצות",
    desc: "תשובות לשאלות הנפוצות ביותר על החשבון, הביקורות והאינטגרציות.",
    tag: "כללי",
    tagColor: "text-muted-foreground bg-muted/50 border-border",
    content: `
**האם אני יכול לבטל ביקורת שקיבלתי?**
לא ניתן למחוק ביקורות שהתקבלו — אמינות המערכת מבוססת על כך. עם זאת, אם ביקורת מפרה את תנאי השימוש (גסויות, תוכן שקרי מוכח), ניתן לדווח עליה לבדיקה של הצוות שלנו.

**כמה זמן לוקח לביקורת להופיע?**
ביקורות מופיעות מיד לאחר הגשתן. ביקורות שסומנו לבדיקה ידנית עשויות להתעכב 24-48 שעות.

**האם לקוחות יכולים לערוך ביקורת שכתבו?**
כן. לקוח יכול לעדכן את ביקורתו בתוך 30 יום מתאריך ההגשה, דרך הקישור המקורי שקיבל.

**כמה עולה להשתמש ב-ReviewHub?**
הפלטפורמה חינמית לגמרי, ללא הגבלת זמן. כל הפיצ׳רים פתוחים לכולם — אין תוכניות בתשלום.

**האם הנתונים שלי מוגנים?**
כן. כל הנתונים מוצפנים ב-AES-256 במנוחה ו-TLS 1.3 בתעבורה. אנחנו עומדים בתקן GDPR ולא מוכרים נתוני לקוחות לגורמים שלישיים.

**איך אני מחבר את ReviewHub ל-CRM שלי?**
יש חיבור ישיר ל-HubSpot, Salesforce ו-Monday. ניתן גם להשתמש ב-Zapier עם טריגר מהוובהוק.
    `,
  },
];

const DocsPage = () => {
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

      {/* Doc sections — accordion */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-4">
            נושאי תיעוד
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            לחצו על כרטיסיה לקריאת התיעוד המלא. לחצו שנית לסגירה.
          </motion.p>

          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {DOC_SECTIONS.map((section, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={section.title}
                  variants={fadeUp}
                  custom={i + 2}
                  className={`glass rounded-2xl border transition-colors overflow-hidden ${
                    isOpen
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {/* ── Header (always visible, clickable) ── */}
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-center gap-4 p-6 text-right cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? "bg-primary/30" : "bg-primary/10 group-hover:bg-primary/20"
                    }`}>
                      <section.icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-semibold text-foreground">{section.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${section.tagColor}`}>{section.tag}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
                    />
                  </button>

                  {/* ── Expanded content ── */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-border/40">
                          <div className="pt-5 text-sm text-muted-foreground leading-relaxed space-y-3">
                            {section.content.trim().split("\n").map((line, li) => {
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
                                    <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.slice(2).replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded text-blue-300">$1</code>')) }} />
                                  </li>
                                );
                              }
                              if (line.startsWith("`") && line.endsWith("`")) {
                                return (
                                  <code key={li} className="block font-mono text-xs bg-muted/60 px-3 py-2 rounded-lg text-blue-300 border border-border/40 whitespace-pre-wrap">
                                    {line.slice(1, -1)}
                                  </code>
                                );
                              }
                              return (
                                <p key={li} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded text-blue-300">$1</code>')) }} />
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
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

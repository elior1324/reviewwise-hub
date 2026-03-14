import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  ShieldCheck,
  BadgeCheck,
  Scale,
  Building2,
  Bot,
  FileText,
  Target,
  BookOpen,
} from "lucide-react";

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07 },
  }),
};

// ─── Layout components ───────────────────────────────────────────────────────
const Section = ({
  icon: Icon,
  number,
  title,
  subtitle,
  children,
}: {
  icon: any;
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-40px" }}
    variants={fadeUp}
    className="scroll-mt-24"
    id={`section-${number}`}
  >
    {/* Section header */}
    <div className="flex items-start gap-4 mb-6">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={20} className="text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-0.5">
          סעיף {number}
        </p>
        <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="pr-[60px] space-y-5 text-muted-foreground leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const SubHeading = ({ children }: { children: ReactNode }) => (
  <h3 className="font-display font-semibold text-base text-foreground mt-6 mb-2">
    {children}
  </h3>
);

const BulletList = ({ items }: { items: Array<{ bold?: string; text: string }> }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="text-primary mt-1 shrink-0">▪</span>
        <span>
          {item.bold && <strong className="text-foreground">{item.bold} </strong>}
          {item.text}
        </span>
      </li>
    ))}
  </ul>
);

const Callout = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="border-r-4 border-primary bg-primary/5 rounded-l-lg pr-4 pl-3 py-3 my-4">
    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">{label}</p>
    <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>
  </div>
);

const FeatureTable = ({
  rows,
}: {
  rows: Array<[string, string]>;
}) => (
  <div className="rounded-xl overflow-hidden border border-border/60 my-4">
    {rows.map(([label, desc], i) => (
      <div
        key={i}
        className={`grid grid-cols-[180px_1fr] gap-4 px-4 py-3 ${
          i % 2 === 0 ? "bg-muted/30" : "bg-background"
        }`}
      >
        <span className="text-sm font-semibold text-foreground/80 leading-snug self-start pt-0.5">
          {label}
        </span>
        <span className="text-sm text-muted-foreground leading-relaxed">{desc}</span>
      </div>
    ))}
  </div>
);

const ProcessTable = ({
  steps,
}: {
  steps: Array<[string, string]>;
}) => (
  <div className="rounded-xl overflow-hidden border border-border/60 my-4">
    <div className="grid grid-cols-[160px_1fr] bg-primary/10 px-4 py-2.5">
      <span className="text-xs font-bold text-primary uppercase tracking-wider">שלב</span>
      <span className="text-xs font-bold text-primary uppercase tracking-wider">פעולה</span>
    </div>
    {steps.map(([step, action], i) => (
      <div
        key={i}
        className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-3 ${
          i % 2 === 0 ? "bg-muted/20" : "bg-background"
        }`}
      >
        <span className="text-sm font-semibold text-foreground self-start pt-0.5">{step}</span>
        <span className="text-sm text-muted-foreground leading-relaxed">{action}</span>
      </div>
    ))}
  </div>
);

const StakeholderTable = ({
  rows,
}: {
  rows: Array<[string, string]>;
}) => (
  <div className="rounded-xl overflow-hidden border border-border/60 my-4">
    <div className="grid grid-cols-[140px_1fr] bg-foreground/90 px-4 py-2.5">
      <span className="text-xs font-bold text-background uppercase tracking-wider">בעל עניין</span>
      <span className="text-xs font-bold text-background uppercase tracking-wider">מטרת הפלטפורמה</span>
    </div>
    {rows.map(([who, goal], i) => (
      <div
        key={i}
        className={`grid grid-cols-[140px_1fr] gap-4 px-4 py-3 ${
          i % 2 === 0 ? "bg-muted/20" : "bg-background"
        }`}
      >
        <span className="text-sm font-semibold text-foreground self-start pt-0.5">{who}</span>
        <span className="text-sm text-muted-foreground leading-relaxed">{goal}</span>
      </div>
    ))}
  </div>
);

// ─── Glossary term ───────────────────────────────────────────────────────────
const GlossaryTerm = ({ term, def }: { term: string; def: string }) => (
  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 border-b border-border/40 last:border-0">
    <span className="text-sm font-semibold text-foreground shrink-0 sm:w-52">{term}</span>
    <span className="text-sm text-muted-foreground leading-relaxed">{def}</span>
  </div>
);

// ─── TOC link ────────────────────────────────────────────────────────────────
const TocLink = ({ num, title }: { num: string; title: string }) => (
  <a
    href={`#section-${num}`}
    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
  >
    <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
      {num}
    </span>
    {title}
  </a>
);

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TrustArchitecturePage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> מדיניות פלטפורמה ותשתית אמון
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              ארכיטקטורת האמון של ReviewHub
            </h1>
            <p className="text-muted-foreground text-lg mb-3">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto">
              מסמך זה מתאר את המנגנונים התפעוליים, מדיניות הניהול ועקרונות האמון המנחים את פעילות
              הפלטפורמה — ממנגנוני אימות ועד פרוטוקולי טיפול בסכסוכים.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Metadata strip ──────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-muted/20">
        <div className="container py-3 flex flex-wrap gap-x-8 gap-y-1.5 text-xs text-muted-foreground">
          {[
            ["סוג מסמך", "מדיניות פלטפורמה"],
            ["גרסה", "1.0"],
            ["סטטוס", "בתוקף"],
            ["גורם מפרסם", "ReviewHub בע\"מ"],
            ["תאריך כניסה לתוקף", "מרץ 2026"],
          ].map(([k, v]) => (
            <span key={k}>
              <strong className="text-foreground/70">{k}: </strong>{v}
            </span>
          ))}
        </div>
      </div>

      <div className="container py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">

          {/* ── Sticky TOC (desktop) ───────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">
                תוכן עניינים
              </p>
              <TocLink num="1" title="תפקיד הפלטפורמה" />
              <TocLink num="2" title="מנוע אימות לקוחות" />
              <TocLink num="3" title="פרוטוקול הודעה והסרה" />
              <TocLink num="4" title="פורטל ניהול מוניטין" />
              <TocLink num="5" title="שכבת מידור AI" />
              <TocLink num="6" title="תשתית משפטית" />
              <TocLink num="7" title="יישור בעלי עניין" />
              <TocLink num="8" title="מילון מונחים" />
            </div>
          </aside>

          {/* ── Main content ───────────────────────────────────── */}
          <main className="space-y-14">

            {/* Preamble */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-5 rounded-xl border border-border/60 bg-muted/20"
            >
              <p className="text-sm font-semibold text-foreground mb-2">מבוא</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ReviewHub פועלת כתשתית אמון לכלכלה הדיגיטלית. הפלטפורמה מספקת סביבה מובנית ועצמאית שבה
                צרכנים יכולים לפרסם ולקרוא ביקורות על מוצרים דיגיטליים, קורסים מקוונים, כלי SaaS,
                שירותי AI, יוצרים ומנטורים.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                העיקרון המנחה: הפלטפורמה אינה נוקטת עמדה. היא קיימת כדי לספק לצרכנים מידע מדויק ומאומת לפני
                רכישת מוצרים דיגיטליים בעלי ערך גבוה. מהימנות המערכת נשענת באופן שווה על הוגנותה כלפי
                הצרכנים וכלפי הגופים המופיעים בה.
              </p>
            </motion.div>

            {/* ── Section 1 ─── Platform Role ──────────────────── */}
            <Section
              icon={ShieldCheck}
              number="1"
              title="תפקיד הפלטפורמה — מארח ניטרלי"
              subtitle="הגדרת המעמד המשפטי והתפעולי של ReviewHub כמארח תוכן"
            >
              <p>
                ReviewHub פועלת כמתווכת ניטרלית ופלטפורמת אחסון תוכן. בתפקיד זה, הפלטפורמה אינה מחברת,
                מזמינה, מאמתת את הדיוק העובדתי של, או מאשרת ביקורות לפני פרסומן.
              </p>

              <SubHeading>1.1  עקרונות תפעוליים מרכזיים</SubHeading>
              <BulletList
                items={[
                  { bold: "אי-כתיבה:", text: "ReviewHub אינה כותבת, עורכת, משנה או מחברת תוכן ביקורות. כל תוכן ביקורת הוא באחריות הבלעדית של המשתמש שהגיש אותה." },
                  { bold: "תפקיד תשתית:", text: "הפלטפורמה מספקת את התשתית הטכנית והפרוצדורלית שדרכה משתמשי צד שלישי מפרסמים את חוויותיהם עם גופים מופיעים." },
                  { bold: "אין ערובה לדיוק:", text: "ReviewHub אינה מצהירה על דיוק, שלמות או מהימנות של ביקורות שפורסמו בפלטפורמה." },
                  { bold: "הצהרת כתב ויתור:", text: "כל דף מוצר ופרופיל כולל הצהרה גלויה הקובעת שכל הביקורות נכתבו על ידי צדדים שלישיים ו-ReviewHub אינה מאשרת את תוכנן." },
                ]}
              />

              <SubHeading>1.2  מסגרת אחריות המתווך</SubHeading>
              <p>
                המעמד הניטרלי של הפלטפורמה מתוכנן להיות עקבי עם הוראות ה-safe harbour הזמינות לפלטפורמות
                מתווכות על פי הדין החל. ReviewHub אינה רוכשת ידיעה על תוכן בלתי חוקי מתוך מעורבות
                עריכתית — היא רוכשת ידיעה כזו רק דרך דיווחי משתמשים או זיהוי אוטומטי, ופועלת במהירות
                עם קבלת דיווחים כאלה.
              </p>

              <FeatureTable
                rows={[
                  ["מה ReviewHub עושה", "מספקת תשתית אחסון; מפעילה מידור טרום-פרסום; מנהלת תהליך יישוב סכסוכים; מציגה ציוני אמון מנתוני רכישה מאומתים."],
                  ["מה ReviewHub אינה עושה", "כתיבה, עריכה או אישור ביקורות בודדות; ערובה לדיוק עובדתי של תוכן שהוגש; דיכוי ביקורות מסיבות מסחריות; מכירה או מניפולציה של ציוני אמון."],
                  ["אחריות הסוקר", "כל סוקר מקבל, בעת הגשה, שהוא האחראי הבלעדי לנכונות ולחוקיות התוכן שהוא מפרסם."],
                  ["אחריות הגוף", "גופים שתובעים ומנהלים פרופיל ב-ReviewHub מקבלים את מנגנון הביקורות של הפלטפורמה כתנאי לכך."],
                ]}
              />
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 2 ─── Verification Engine ───────────── */}
            <Section
              icon={BadgeCheck}
              number="2"
              title="מנוע אימות לקוחות"
              subtitle="מנגנונים לביסוס שהסוקרים הם לקוחות אמיתיים"
            >
              <p>
                תכונה אדריכלית מרכזית של ReviewHub היא מערכת האימות הדו-שכבתית. המערכת מבחינה בין
                ביקורות אימות רכישה למשוב קהילתי, ומשקללת אותן באופן שונה באלגוריתם ציון האמון.
                אף ביקורת אינה יכולה להתפרסם ללא השלמת אימות זהות.
              </p>

              <SubHeading>2.1  שכבת זהות — נדרשת לכל הביקורות</SubHeading>
              <p>
                כל המשתמשים חייבים לאמת את זהותם דרך ספק OAuth נתמך (Google או LinkedIn) לפני הגשת
                ביקורת. הגשות אנונימיות אינן מותרות בשום נסיבה.
              </p>

              <SubHeading>2.2  שכבת אימות רכישה — ביקורות שכבה א'</SubHeading>
              <FeatureTable
                rows={[
                  ["סוגי הוכחה מקובלים", "קבלת רכישה, חשבונית מס, אישור הרשמה, אישור תשלום, או רשומת עסקה שהוציא ספק המוצר או מעבד תשלומים מוכר."],
                  ["אחסון", "מסמכי הוכחה מאוחסנים בפרטיות ובהצפנה. אינם מוצגים בפומבי. נגישים פנימית ליישוב סכסוכים ולרשויות מוסמכות."],
                  ["אימות", "מסמכים נבדקים על פי קריטריוני אותנטיות בסיסיים (פורמט, מנפיק, תאריך, סכום)."],
                  ["תצוגה", "ביקורות אימות רכישה מוצגות עם תג אימות גלוי ורשומות תחת שכבה ייעודית בדף הפרופיל."],
                  ["השפעה על ציון האמון", "רק ביקורות שכבה א' (אימות רכישה) תורמות לציון האמון של הגוף. משוב קהילתי (שכבה ב') מוצג אך אינו משפיע על הציון."],
                ]}
              />
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 3 ─── Notice & Takedown ─────────────── */}
            <Section
              icon={Scale}
              number="3"
              title="פרוטוקול הודעה והסרה"
              subtitle="תהליך סכסוך מובנה לביקורות שנטענות כשגויות או משמיצות"
            >
              <p>
                ReviewHub מפעילה תהליך יישוב סכסוכים פורמלי המספק מנגנון מובנה מבחינה משפטית לערעור
                על אותנטיות של ביקורת שפורסמה.
              </p>

              <SubHeading>3.1  יזום סכסוך</SubHeading>
              <BulletList
                items={[
                  { bold: "עילות מותרות:", text: "מעמד לקוח שנוי במחלוקת; אי-דיוק עובדתי; תוכן משמיץ; הפרת מדיניות." },
                  { bold: "סכסוכים סרק:", text: "סכסוכים סרק או טקטיים (כגון ביקורת על כל הביקורות השליליות ללא ביסוס) עלולים להוביל להשהיית מנגנון הסכסוך עבור אותו גוף." },
                ]}
              />

              <SubHeading>3.2  נוהל סכסוך וציר זמן</SubHeading>
              <ProcessTable
                steps={[
                  ["1 — הגשת דיווח", "הגוף מגיש סכסוך דרך לוח הבקרה, מציין עילות וראיות תומכות."],
                  ["2 — הודעת סוקר", "הסוקר מקבל הודעה אוטומטית תוך 24 שעות, המבקשת הוכחת רכישה."],
                  ["3 — תגובת סוקר", "לסוקר 72 שעות להגיש הוכחת רכישה או להגיב לסכסוך."],
                  ["4א — הוכחה הוגשה", "אם הוגשה הוכחה מספקת, הביקורת נשמרת. הסכסוך מסומן כנפתר לטובת הסוקר."],
                  ["4ב — אין תגובה", "אם הסוקר אינו מגיב תוך 72 שעות, הביקורת מוסרת זמנית ומסומנת כ'ממתין לאימות.'"],
                  ["5 — בדיקת ReviewHub", "במקרים מורכבים, צוות Trust & Safety מנהל בדיקה ידנית ומוציא החלטה סופית תוך 7 ימי עסקים."],
                ]}
              />

              <SubHeading>3.3  תיוג ביניים</SubHeading>
              <p>
                במהלך סכסוך פעיל, הביקורת הרלוונטית עשויה להיות מתויגת במחוון סטטוס ניטרלי הגלוי
                לצרכנים. התיוג אינו קובע שהביקורת שגויה — הוא מציין בלבד שאמיתותה מצויה בתהליך
                סכסוך פורמלי.
              </p>
              <Callout label="תיוג ביניים סטנדרטי">
                "ביקורת זו נמצאת כרגע בתהליך אימות מהימנות. היא תשוחזר או תוסר עם סיום הליך הבדיקה."
              </Callout>
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 4 ─── Reputation Portal ─────────────── */}
            <Section
              icon={Building2}
              number="4"
              title="פורטל ניהול מוניטין"
              subtitle="כלים הזמינים לגופים מופיעים לניהול נוכחותם בפלטפורמה"
            >
              <p>
                ReviewHub מעניקה לגופים מופיעים מערכת כלים מובנית לניהול המוניטין שלהם בשקיפות —
                מבלי להעניק יכולת לדכא או לתמרן תוכן ביקורות.
              </p>

              <SubHeading>4.1  זכות תגובה רשמית</SubHeading>
              <BulletList
                items={[
                  { bold: "תצוגה:", text: "תגובות מוצגות ישירות מתחת לביקורת המתאימה, מזוהות בבירור כתגובה רשמית של הגוף." },
                  { bold: "מידור:", text: "תגובות כפופות לאותה שכבת מידור אוטומטית כמו ביקורות (ראו סעיף 5)." },
                  { bold: "בלתי-ניתן לשינוי:", text: "תגובה שהוגשה ניתנת לעריכה בתוך 24 שעות מהפרסום. לאחר חלון זה, התגובה נעולה." },
                ]}
              />

              <SubHeading>4.2  ערר פנימי ובקשת הסרה</SubHeading>
              <p>
                כאשר גוף מאמין שסוקר לא היה לקוח, הוא רשאי להגיש בקשת הסרה פורמלית. ראיות תומכות
                עשויות לכלול: רשומות מכירות, נתוני CRM, יומני עסקאות, או הצהרה בשבועה.
              </p>

              <SubHeading>4.3  לוח בקרה אנליטי</SubHeading>
              <FeatureTable
                rows={[
                  ["מגמת ציון אמון", "גרף של ציון האמון לאורך תקופות שנבחרו."],
                  ["מהירות ביקורות", "נפח ביקורות חדשות לחודש ויחס מאומת/לא מאומת."],
                  ["ניתוח סנטימנט", "סיווג תוכן הביקורות לפי סנטימנט ואשכולות נושא — באמצעות AI."],
                  ["יומן יישוב סכסוכים", "סטטוס ותוצאות כל הסכסוכים ובקשות ההסרה שהוגשו."],
                  ["השוואת מתחרים", "השוואה אנונימית לציון אמון ממוצע בקטגוריה (מנוי Enterprise בלבד)."],
                ]}
              />
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 5 ─── AI Moderation ──────────────────── */}
            <Section
              icon={Bot}
              number="5"
              title="שכבת מידור AI"
              subtitle="ניתוח תוכן אוטומטי ואכיפת מדיניות לפני פרסום"
            >
              <p>
                כל הגשות ביקורות עוברות עיבוד על ידי מערכת המידור האוטומטית של ReviewHub לפני פרסום.
                המערכת פועלת על בסיס מיטב המאמצים ואינה ערובה לציות לתוכן; היא משלימה ולא מחליפה בדיקה
                אנושית של מקרים מדורגים.
              </p>

              <SubHeading>5.1  היקף הזיהוי</SubHeading>
              <BulletList
                items={[
                  { bold: "שפה אסורה:", text: "גסויות, נאום שנאה, כינויים גנאיים, או תוכן שאדם סביר יחשיב כפוגעני בצורה קיצונית שאינה קשורה למוצר." },
                  { bold: "תקיפות אישיות:", text: "תוכן המכוון לתכונות אישיות של אנשים (כגון עובדים) שאינן קשורות לחוויית המוצר." },
                  { bold: "ספאם ותיאום:", text: "הגשות כפולות, חריגות בקצב הגשה, דפוסי תוכן העולים בקנה אחד עם מניפולציית ביקורות מתואמת." },
                  { bold: "שידול מסחרי:", text: "ביקורות המכילות קישורי שותפים, קודי קידום מכירות, או שנראות כמי שהועברו תמורת תגמול ללא גילוי." },
                  { bold: "נתונים אישיים:", text: "תוכן הכולל בטעות נתונים אישיים של צדדים שלישיים (שמות מלאים, פרטי קשר, מידע פיננסי)." },
                ]}
              />

              <SubHeading>5.2  מסגרת פעולה</SubHeading>
              <FeatureTable
                rows={[
                  ["זוהתה שפה אסורה", "ביקורת נחסמת. הסוקר מקבל הודעה עם אזכור מדיניות ספציפי. הסוקר רשאי לתקן ולהגיש מחדש."],
                  ["זוהתה תקיפה אישית", "הביקורת מוחזרת לסוקר עם הנחיות ממוקדות. ההגשה מושהית ל-24 שעות."],
                  ["אות ספאם / תיאום", "הביקורת מוחזקת בתור בדיקה ידנית. פעילות החשבון מסומנת לבדיקת Trust & Safety."],
                  ["שידול מסחרי", "ביקורת נחסמת. הוצאת אזהרת חשבון. הפרות חוזרות מביאות להשעיית חשבון."],
                  ["מקרה גבולי", "הביקורת מפורסמת עם סימון פנימי ומועברת לביקורת אנושית תקופתית."],
                ]}
              />

              <SubHeading>5.3  מגבלות ועקיפה אנושית</SubHeading>
              <p>
                מערכות אוטומטיות פועלות תחת ספים סטטיסטיים ויפיקו גם חיוביים כוזבים (ביקורות לגיטימיות
                שנחסמות) וגם שליליים כוזבים. כל סוקר שהגשתו נחסמה רשאי לבקש בדיקה אנושית על ידי
                פנייה לצוות Trust & Safety. בדיקות אנושיות מסתיימות תוך 5 ימי עסקים.
              </p>
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 6 ─── Legal Infrastructure ───────────── */}
            <Section
              icon={FileText}
              number="6"
              title="תשתית משפטית"
              subtitle="מסמכים משפטיים נדרשים ומסגרת האחריות"
            >
              <p>
                התשתית המשפטית של ReviewHub כוללת שלושה מסמכי ליבה המסדירים את הזכויות והחובות של
                כל הצדדים המתקשרים עם הפלטפורמה.
              </p>

              <SubHeading>6.1  תנאי שימוש</SubHeading>
              <BulletList
                items={[
                  { bold: "אחריות משתמש:", text: "כל סוקר מקבל אחריות משפטית בלעדית לנכונות, לדיוק ולחוקיות התוכן שהוא מפרסם." },
                  { bold: "התנהגות אסורה:", text: "התנאים אוסרים במפורש ביקורות בדויות, מניפולציה מתואמת, תוכן משמיץ וביקורות מתומרצות ללא גילוי." },
                  { bold: "זכויות אכיפה:", text: "ReviewHub שומרת לעצמה את הזכות להסיר תוכן, להשעות חשבונות ולהפנות מקרים לרשויות מוסמכות." },
                ]}
              />

              <SubHeading>6.2  כתב ויתור על אחריות — גופים מופיעים</SubHeading>
              <p>
                גופים שתובעים ומנהלים פרופיל ב-ReviewHub מקבלים את מנגנון הביקורות כתנאי לכך,
                ומאשרים שהפלטפורמה מארחת ביקורות צד שלישי ואינה שולטת בתוכנן.
              </p>

              <SubHeading>6.3  מדיניות פרטיות — הגנת זהות סוקר</SubHeading>
              <FeatureTable
                rows={[
                  ["נתוני זהות", "זהות הסוקר מאוחסנת בצורה מאובטחת ואינה מוצגת לציבור מעבר לשם המוצג שנבחר."],
                  ["מסמכי הוכחה", "מסמכי הוכחת רכישה מאוחסנים במאגר פרטי מוצפן. אינם נגישים לגופים מופיעים."],
                  ["גילוי חוקי", "נתונים אישיים של סוקר עשויים להיחשף לגוף, לרשות מוסמכת, או לבית משפט רק עם קבלת צו משפטי תקף."],
                  ["שמירת נתונים", "ביקורות ומטא-נתונים נשמרים כל עוד החשבון פעיל, בתוספת תקופת שמירה רגולטורית. מסמכי הוכחה נשמרים לאורך הביקורת הקשורה בתוספת 3 שנים."],
                  ["ניידות נתונים", "סוקרים רשאים לבקש ייצוא נתוניהם בכל עת דרך פורטל הגדרות החשבון."],
                  ["זכות למחיקה", "סוקרים רשאים לבקש מחיקת ביקורותיהם ונתוניהם האישיים, בכפוף לכל הגבלה משפטית פעילה."],
                ]}
              />
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 7 ─── Stakeholder Alignment ─────────── */}
            <Section
              icon={Target}
              number="7"
              title="יישור בעלי עניין"
              subtitle="התוצאות המיועדות של ארכיטקטורת האמון לכל קבוצת בעלי עניין"
            >
              <p>
                הארכיטקטורה המתוארת במסמך זה אינה נועדה להיות עוינת כלפי אף צד. היא מתוכננת
                למקסם את הדיוק ואת אפשרות האימות של המידע הזמין לצרכנים.
              </p>

              <StakeholderTable
                rows={[
                  ["צרכנים", "סביבת מידע מהימנה ומאומתת עצמאית להערכת מוצרים דיגיטליים לפני רכישה. צרכנים יכולים להבחין בין ביקורות אימות רכישה למשוב לא מאומת, ולדעת שציוני האמון משקפים ראיות מסחריות ולא שיקול דעת עריכתי."],
                  ["גופים מופיעים", "מערכת מוניטין שקופה ומבוססת ראיות עם מנגנונים ברורים לתגובה מקצועית, ערעור והגשת עררים. גופים מוגנים מבידיון אנונימי תוך שמירה על אחריותיות לפני משוב לקוחות אמיתי."],
                  ["ReviewHub", "הגנה משפטית מרבית כמתווכת ניטרלית; תשתית אמון בת-קיימא השומרת על אמינות דרך הוגנות פרוצדורלית; פלטפורמה שנשארת ניתנת להגנה במסגרות אחריות מתווכים חלות."],
                ]}
              />

              <Callout label="הצהרת יושרה של המערכת">
                ציון האמון שמפיקה ReviewHub אינו מוצר. לא ניתן לרכוש אותו, לשדרגו, או להשפיע עליו
                דרך מערכת יחסים מסחרית עם הפלטפורמה. הוא פונקציה של ראיות לקוחות הניתנות לאימות
                עצמאי. מגבלה זו אינה חסרון — היא המקור לערכה של הפלטפורמה.
              </Callout>
            </Section>

            <hr className="border-border/40" />

            {/* ── Section 8 ─── Glossary ───────────────────────── */}
            <Section
              icon={BookOpen}
              number="8"
              title="מילון מונחים"
              subtitle="הגדרות של מונחי מפתח המשמשים במסמך זה"
            >
              <div className="divide-y divide-border/40">
                <GlossaryTerm
                  term="משוב קהילתי"
                  def="ביקורת שהוגשה ללא הוכחת רכישה מלווה. מסווגת כשכבה ב'. מוצגת בפרופיל אך אינה נכללת בחישוב ציון האמון."
                />
                <GlossaryTerm
                  term="סכסוך מהימנות"
                  def="ערעור פורמלי שהוגש על ידי גוף מופיע על אמיתות ביקורת שפורסמה."
                />
                <GlossaryTerm
                  term="גוף מופיע"
                  def="כל עסק, יוצר, מוצר SaaS, ספק קורסים, או מקצוען עצמאי עם פרופיל תבוע או לא תבוע ב-ReviewHub."
                />
                <GlossaryTerm
                  term="אימות OAuth"
                  def="אימות דרך ספק זהות צד שלישי (Google, LinkedIn). נדרש לכל הגשות הביקורות."
                />
                <GlossaryTerm
                  term="הוכחת רכישה"
                  def="ראיה מסמכנת שהוגשה על ידי סוקר המבססת שעסקה מסחרית התרחשה בין הסוקר לבין הגוף המופיע."
                />
                <GlossaryTerm
                  term="ציון אמון"
                  def="ציון מורכב המחושב מנתוני אימות רכישה שכבה א'. משקף נפח ביקורות מאומתות, יחס תלונות/החזרים, ותקופת פעילות מאומתת. אינו מושפע מגורמים מסחריים."
                />
                <GlossaryTerm
                  term="ביקורת אימות רכישה"
                  def="ביקורת המלווה בהוכחת רכישה מאומתת. מסווגת כשכבה א'. תורמת לציון האמון של הגוף ומוצגת עם תג אימות."
                />
              </div>
            </Section>

            {/* ── Document control footer ──────────────────────── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-xl border border-border/50 bg-muted/20 p-5 text-sm text-muted-foreground space-y-2"
            >
              <p className="font-semibold text-foreground text-base">בקרת מסמך</p>
              <p>
                מסמך זה כפוף לבדיקה תקופתית. הגרסה הנוכחית מחליפה את כל הגרסאות הקודמות.
                שאלות בנוגע לפרשנות או יישום מדיניות זו יש להפנות לצוות Trust & Safety:&nbsp;
                <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                  support@reviewshub.info
                </a>
              </p>
              <p className="text-xs">
                © 2026 ReviewHub בע"מ. כל הזכויות שמורות. מסמך זה נועד לשימוש פנימי בלבד.
              </p>
            </motion.div>

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrustArchitecturePage;

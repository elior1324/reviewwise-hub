/**
 * AccessibilityStatement.tsx
 * הצהרת נגישות — ReviewHub
 * עומד בסעיף 35 לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע"ג-2013
 * נתיב: /accessibility
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Accessibility, Monitor, Keyboard, Eye, MessageSquare,
  RefreshCw, Settings, User, Phone, Mail, Calendar,
  ShieldCheck, Building2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const META = {
  updated: "24 במרץ 2026",
  reviewDate: "מרץ 2026",
  version: "2.0",
  coordinator: "ReviewHub",
  coordinatorRole: "רכז נגישות",
  email: "support@reviewshub.info",
  phone: "+972-52-349-1723",
  implementedBy: "ReviewHub — צוות פיתוח פנימי",
};

const AccessibilityStatement = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Accessibility size={16} /> הצהרת נגישות
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              הצהרת נגישות
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה {META.version} — עודכן: {META.updated}
            </p>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              ב-ReviewHub אנו מחויבים להנגשת הפלטפורמה לכל אדם, כולל אנשים עם מוגבלות.
              אנו מאמינים שאמון מתחיל בשוויון — וכולם זכאים לגישה מלאה ושווה למידע.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* ── Accessibility Coordinator (Section 35 - MANDATORY) ─────── */}
          <Section icon={User} title="רכז/ת נגישות">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-foreground mb-4">
                בהתאם לסעיף 35 לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע״ג-2013,
                להלן פרטי רכז הנגישות של ReviewHub:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Building2 size={14} className="text-primary shrink-0" />
                  <span><strong>שם:</strong> {META.coordinator}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <ShieldCheck size={14} className="text-primary shrink-0" />
                  <span><strong>תפקיד:</strong> {META.coordinatorRole}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail size={14} className="text-primary shrink-0" />
                  <span><strong>דוא״ל:</strong>{" "}
                    <a href={`mailto:${META.email}`} className="text-primary hover:underline">{META.email}</a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={14} className="text-primary shrink-0" />
                  <span><strong>טלפון:</strong>{" "}
                    <a href={`tel:${META.phone.replace(/-/g, "")}`} className="text-primary hover:underline" dir="ltr">{META.phone}</a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar size={14} className="text-primary shrink-0" />
                  <span><strong>סקירת נגישות אחרונה:</strong> {META.reviewDate}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Settings size={14} className="text-primary shrink-0" />
                  <span><strong>ביצוע ההנגשה:</strong> {META.implementedBy}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Why Accessibility ──────────────────────────────────────── */}
          <Section icon={Eye} title="מדוע נגישות חשובה לנו">
            <p>
              ReviewHub היא פלטפורמת אמון — ואמון פירושו שוויון. כרבע מהאוכלוסייה בישראל
              נתקלת בקשיי נגישות דיגיטלית: לקויי ראייה, לקויי שמיעה, אנשים עם מוגבלות מוטורית, בני הגיל השלישי ועוד.
            </p>
            <p className="mt-3">
              אנו מאמינים שלכל אדם יש את הזכות לגשת למידע, לקרוא ביקורות, ולקבל החלטות מושכלות — ללא מחסומים.
              לכן השקענו משאבים משמעותיים כדי להבטיח שהפלטפורמה תהיה נגישה לכולם.
            </p>
          </Section>

          {/* ── Standards ──────────────────────────────────────────────── */}
          <Section icon={Monitor} title="תקנים שאנו עומדים בהם">
            <p>
              הפלטפורמה הונגשה בהתאם לתקנים הבאים:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>תקן ישראלי ת״י 5568</strong> — תקן הנגישות הישראלי לתוכן אינטרנט</li>
              <li><strong>תקנות שוויון זכויות לאנשים עם מוגבלות</strong> (התאמות נגישות לשירות), תשע״ג-2013 — סימן ג׳: שירותי אינטרנט</li>
              <li><strong>WCAG 2.1 ברמה AA</strong> — הנחיות הנגישות הבינלאומיות של ארגון W3C</li>
            </ul>
            <p className="mt-3">
              הפלטפורמה מותאמת ונבדקה בדפדפנים המובילים: Chrome, Firefox, Safari ו-Edge,
              הן במחשב שולחני והן במכשירים ניידים (iOS ו-Android).
            </p>
          </Section>

          {/* ── Features ───────────────────────────────────────────────── */}
          <Section icon={Settings} title="התאמות הנגישות בפלטפורמה">
            <p className="mb-3">
              הפלטפורמה כוללת <strong>תפריט נגישות</strong> הממוקם בסרגל הניווט העליון
              (סמל <Accessibility size={14} className="inline text-primary" />).
              לחיצה על הסמל פותחת תפריט המאפשר את ההתאמות הבאות:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>שינוי גודל טקסט</strong> — שלוש רמות: רגיל (100%), גדול (115%), וגדול מאוד (130%)</li>
              <li><strong>ניגודיות גבוהה</strong> — מצב ניגודיות גבוהה (רקע כהה וטקסט בהיר) לשיפור הקריאות</li>
              <li><strong>הפחתת אנימציות</strong> — עוצר את כל האנימציות והמעברים, מתאים למי שרגיש להבהובים ותנועה</li>
              <li><strong>הדגשת קישורים</strong> — מוסיף קו תחתון לכל הקישורים לזיהוי קל יותר</li>
              <li><strong>פונט קריא</strong> — מחליף לפונט Arial הקריא והברור</li>
              <li><strong>סמן מוגדל</strong> — מגדיל את סמן העכבר לנראות טובה יותר</li>
              <li><strong>גווני אפור</strong> — מציג את האתר בגווני אפור בלבד, מתאים לרגישות לצבעים</li>
              <li><strong>ריווח טקסט</strong> — מגדיל מרווחים בין אותיות, מילים ושורות לקריאה נוחה יותר</li>
              <li><strong>הפיכת צבעים</strong> — מעבר לרקע בהיר וטקסט כהה</li>
              <li><strong>איפוס הגדרות</strong> — מחזיר את כל ההגדרות למצב ברירת המחדל</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              ההגדרות נשמרות אוטומטית במכשיר שלכם ויישארו פעילות גם בביקורים הבאים.
              כאשר הגדרות נגישות פעילות, מוצג אינדיקטור ויזואלי ליד סמל הנגישות.
            </p>
          </Section>

          {/* ── Keyboard & Screen Readers ──────────────────────────────── */}
          <Section icon={Keyboard} title="ניווט מקלדת וקוראי מסך">
            <p>
              הפלטפורמה תומכת בניווט מלא באמצעות מקלדת בלבד:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mt-3">
              <li>ניווט בין אלמנטים באמצעות <strong>Tab</strong> ו-<strong>Shift+Tab</strong></li>
              <li>הפעלת כפתורים ולינקים באמצעות <strong>Enter</strong> ו-<strong>Space</strong></li>
              <li>סגירת תפריטים ודיאלוגים באמצעות <strong>Escape</strong></li>
              <li>מצב <strong>Focus Visible</strong> — טבעת ויזואלית ברורה סביב האלמנט הפעיל</li>
            </ul>
            <p className="mt-3">
              הפלטפורמה מותאמת לתוכנות קוראי מסך, כגון <strong>JAWS</strong>, <strong>NVDA</strong>,
              <strong> VoiceOver</strong> (macOS/iOS) ו-<strong>TalkBack</strong> (Android).
              תגיות ARIA משמשות בהתאם לצורך להנגשת רכיבים דינמיים.
            </p>
          </Section>

          {/* ── RTL & Language ─────────────────────────────────────────── */}
          <Section icon={Monitor} title="תמיכה בכיוון קריאה ושפה">
            <p>
              הפלטפורמה בנויה כ-<strong>RTL-first</strong> (מימין לשמאל) — כיוון הקריאה העברי הוא ברירת המחדל.
              כל הרכיבים, הטפסים והתפריטים מותאמים לכיוון קריאה מימין לשמאל, כולל:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-3">
              <li>תגית <code className="text-xs bg-muted px-1.5 py-0.5 rounded">dir=&quot;rtl&quot;</code> ברמת ה-HTML</li>
              <li>סדר כפתורים, טפסים ותפריטים מותאם לעברית</li>
              <li>קישורים חיצוניים (URLs) מוצגים ב-LTR לקריאה נכונה</li>
            </ul>
          </Section>

          {/* ── Ongoing Efforts ────────────────────────────────────────── */}
          <Section icon={RefreshCw} title="מאמצים מתמשכים">
            <p>
              אנו ממשיכים לשפר את הנגישות כחלק ממחויבותנו לשוויון. בין הפעולות שאנו מבצעים:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mt-3">
              <li>בדיקות נגישות תקופתיות בעדכוני גרסה</li>
              <li>בדיקת תאימות עם קוראי מסך וטכנולוגיות מסייעות</li>
              <li>בדיקה ידנית של זרימות משתמש מרכזיות (חיפוש, כתיבת ביקורת, הרשמה)</li>
              <li>טיפול בפניות נגישות תוך 14 ימי עבודה</li>
            </ul>
            <p className="mt-3">
              למרות מאמצינו, ייתכן שחלקים מסוימים באתר טרם הונגשו במלואם.
              אנו עובדים באופן שוטף על שיפורם ונשמח לקבל משוב.
            </p>
          </Section>

          {/* ── Report Accessibility Issue ─────────────────────────────── */}
          <Section icon={MessageSquare} title="דיווח על בעיית נגישות">
            <p>
              נתקלתם בבעיית נגישות? נשמח לשמוע ולטפל בהקדם. כדי שנוכל לסייע בצורה הטובה ביותר,
              אנא ציינו:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-3">
              <li>תיאור הבעיה ומה ניסיתם לבצע</li>
              <li>באיזה עמוד נתקלתם בבעיה</li>
              <li>סוג וגרסה של הדפדפן ומערכת ההפעלה</li>
              <li>הטכנולוגיה המסייעת בה השתמשתם (אם רלוונטי)</li>
            </ul>

            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-semibold text-foreground mb-3">דרכי פנייה בנושאי נגישות:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail size={14} className="text-primary shrink-0" />
                  <span>דוא״ל:{" "}
                    <a href={`mailto:${META.email}?subject=בעיית נגישות באתר ReviewHub`} className="text-primary hover:underline">{META.email}</a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={14} className="text-primary shrink-0" />
                  <span>טלפון:{" "}
                    <a href={`tel:${META.phone.replace(/-/g, "")}`} className="text-primary hover:underline" dir="ltr">{META.phone}</a>
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                אנו מתחייבים לטפל בפניות נגישות תוך 14 ימי עבודה מיום קבלת הפנייה.
              </p>
            </div>
          </Section>

          {/* ── External Complaint ─────────────────────────────────────── */}
          <Section icon={ShieldCheck} title="הגשת תלונה לנציבות">
            <p>
              אם פניתם אלינו ולא קיבלתם מענה מספק, ניתן להגיש תלונה לנציבות שוויון זכויות לאנשים עם מוגבלות:
            </p>
            <div className="mt-3 rounded-xl bg-secondary/50 border border-border/50 p-4 text-sm space-y-1.5">
              <p><strong>נציבות שוויון זכויות לאנשים עם מוגבלות</strong></p>
              <p>משרד המשפטים, רח׳ כנפי נשרים 15, ירושלים</p>
              <p>טלפון: <a href="tel:*6763" className="text-primary hover:underline" dir="ltr">*6763</a></p>
              <p>פקס: 02-6467027</p>
              <p>אתר: <a href="https://www.gov.il/he/departments/the_commission_for_equal_rights_of_persons_with_disabilities" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">נציבות שוויון זכויות</a></p>
            </div>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    className="scroll-mt-20"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed">
      {children}
    </div>
  </motion.section>
);

export default AccessibilityStatement;

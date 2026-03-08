import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Accessibility, Monitor, Keyboard, Eye, MessageSquare, RefreshCw, Settings } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              ב-ReviewHub אנו מחויבים לקידום הנגישות ופועלים לאפשר לכל אדם, כולל אנשים עם מוגבלות וצרכים מיוחדים, להשתמש וליהנות מהשירותים שאנו מציעים.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Why Accessibility */}
          <Section icon={Eye} title="מדוע נגישות חשובה לנו">
            <p>
              כרבע מהאוכלוסייה בישראל נתקלת בקשיי נגישות לאינטרנט: לקויי ראייה, לקויי שמיעה, אנשים עם מוגבלות מוטורית, בני הגיל השלישי ועוד.
            </p>
            <p className="mt-3">
              אנו מאמינים שלכל אדם יש את הזכות לחיות בכבוד, בשוויון, בנוחות ובעצמאות. לכן השקענו משאבים משמעותיים כדי להבטיח שהפלטפורמה שלנו תהיה קלה לשימוש ונגישה לכולם.
            </p>
          </Section>

          {/* Standards */}
          <Section icon={Monitor} title="תקנים והתאמות">
            <p>
              ביצענו את ההתאמות הנדרשות בפלטפורמה שלנו והטמענו את כללי הנגישות ככל שניתן, בהתאם לעקרונות הבאים:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mt-3">
              <li>תקן הנגישות הישראלי (ת"י 5568)</li>
              <li>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע"ג-2013 — סימן ג': שירותי האינטרנט</li>
              <li>הנחיות WCAG 2.1 ברמה AA</li>
            </ul>
            <p className="mt-3">
              הפלטפורמה מותאמת לדפדפנים המובילים: Chrome, Firefox, Safari ו-Edge.
            </p>
          </Section>

          {/* Features */}
          <Section icon={Settings} title="התאמות הנגישות בפלטפורמה">
            <p className="mb-3">
              הפלטפורמה כוללת תפריט נגישות הממוקם בפינה השמאלית העליונה של כל עמוד (סמל <Accessibility size={14} className="inline text-primary" />). לחיצה על הסמל פותחת תפריט המאפשר את ההתאמות הבאות:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>שינוי גודל טקסט</strong> — שלוש רמות: רגיל, גדול (115%), וגדול מאוד (130%). לחיצה חוזרת מחליפה בין הרמות</li>
              <li><strong>ניגודיות גבוהה</strong> — מפעיל מצב ניגודיות גבוהה (רקע כהה וטקסט בהיר) לשיפור הקריאות</li>
              <li><strong>הפחתת אנימציות</strong> — עוצר את כל האנימציות והמעברים באתר, מתאים למי שרגיש להבהובים ותנועה</li>
              <li><strong>הדגשת קישורים</strong> — מוסיף קו תחתון לכל הקישורים באתר לזיהוי קל יותר</li>
              <li><strong>איפוס הגדרות</strong> — מחזיר את כל ההגדרות למצב ברירת המחדל</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              ההגדרות נשמרות אוטומטית במכשיר שלכם ויישמרו גם בביקורים הבאים באתר.
            </p>
          </Section>

          {/* Keyboard & Screen Readers */}
          <Section icon={Keyboard} title="ניווט מקלדת וקוראי מסך">
            <p>
              הפלטפורמה תומכת בניווט מלא באמצעות מקלדת ומותאמת לעבודה עם תוכנות קוראי מסך, כגון JAWS, NVDA ותוכנות נוספות.
            </p>
          </Section>

          {/* Ongoing Efforts */}
          <Section icon={RefreshCw} title="מאמצים מתמשכים">
            <p>
              אנו ממשיכים במאמצים לשפר את נגישות הפלטפורמה כחלק ממחויבותנו לאפשר שימוש נוח עבור כלל האוכלוסייה, ובכלל זה אנשים עם מוגבלות וצרכים מיוחדים.
            </p>
            <p className="mt-3">
              יש לציין כי למרות מאמצינו להנגיש את כלל הדפים בפלטפורמה, ייתכן שתיתקלו בחלקים שטרם הונגשו. אנו עובדים באופן שוטף על שיפורם.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={MessageSquare} title="דיווח על בעיית נגישות">
            <p>
              אם במהלך הגלישה בפלטפורמה נתקלתם בבעיה בנושא נגישות, נשמח אם תדווחו לנו ואנו נדאג לטפל בכך בהקדם.
            </p>
            <p className="mt-3 font-semibold text-foreground">
              כדי שנוכל לטפל בבעיה בדרך הטובה ביותר, אנו ממליצים לצרף את הפרטים הבאים:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mt-2">
              <li>תיאור הבעיה</li>
              <li>מהי הפעולה שניסיתם לבצע</li>
              <li>באיזה דף גלשתם</li>
              <li>סוג וגרסה של הדפדפן</li>
              <li>מערכת הפעלה</li>
              <li>סוג הטכנולוגיה המסייעת (במידה והשתמשתם)</li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm">
              <p className="text-muted-foreground">
                ניתן לפנות אלינו בנושאי נגישות דרך עמוד <a href="/terms" className="text-primary hover:underline">יצירת הקשר</a> שבאתר.
              </p>
            </div>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
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

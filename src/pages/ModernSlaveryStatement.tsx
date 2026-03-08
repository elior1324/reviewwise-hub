import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart, Building2, Users, ShieldCheck, Search, TrendingUp, Mail, FileText } from "lucide-react";
import { ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) => (
  <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="pr-[52px] text-muted-foreground leading-relaxed">{children}</div>
  </motion.section>
);

const ModernSlaveryStatement = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Heart size={16} /> הצהרה נגד עבדות מודרנית
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              הצהרה נגד עבדות מודרנית וסחר בבני אדם
            </h1>
            <p className="text-muted-foreground text-lg">
              שנת הכספים ינואר 2025 — דצמבר 2025
            </p>
            <p className="text-muted-foreground mt-2">
              ReviewHub בע"מ נוקטת גישת אפס סובלנות כלפי עבדות וסחר בבני אדם בפעילות העסקית ובשרשראות האספקה שלנו.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Business Overview */}
          <Section icon={Building2} title="סקירה עסקית">
            <p className="mb-3">
              ReviewHub נוסדה מתוך חזון ליצור מטבע עצמאי של אמון — פלטפורמה דיגיטלית המפגישה עסקים וצרכנים כדי לטפח אמון ולעודד שיתוף פעולה. אנו חינמיים לשימוש, פתוחים לכולם ובנויים על שקיפות.
            </p>
            <p className="mb-3">
              ReviewHub מארחת ביקורות כדי לעזור לצרכנים לקנות בביטחון ולספק לעסקים תובנות עשירות לשיפור חוויית הלקוח. ככל שיותר צרכנים משתמשים בפלטפורמה ומשתפים את דעותיהם, כך התובנות שאנו מציעים לעסקים עשירות יותר.
            </p>
            <p>
              ReviewHub בע"מ היא חברה רשומה בישראל ומפעילה את פעילותה מתל אביב.
            </p>
          </Section>

          {/* Organizational Structure */}
          <Section icon={FileText} title="מבנה ארגוני ושרשראות אספקה">
            <p className="mb-3">
              כעסק SaaS (תוכנה כשירות), האנשים שלנו, המומחיות וזכויות הקניין הרוחני הם ליבת העסק שלנו. למרות שאנו עובדים עם ספקים למגוון שירותים, רוב הספקים שלנו מספקים לנו חומרת IT, שירותי רשת ותוכנה.
            </p>
            <p>
              מודל העסק שלנו אינו נושא עמו רמה גבוהה של סיכון לעבדות. עם זאת, אנו מחויבים לוודא שאין עבדות מודרנית או סחר בבני אדם בכל חלק מהעסק או שרשרת האספקה שלנו.
            </p>
          </Section>

          {/* Our Approach */}
          <Section icon={ShieldCheck} title="הגישה שלנו">
            <p className="mb-3">
              ב-ReviewHub אנו שואפים לעבוד בהתאם לסטנדרטים המקצועיים הגבוהים ביותר ולציית לכל החוקים, התקנות והכללים הרלוונטיים לעסקנו, כולל חוקי העבודה הישראליים.
            </p>

            <p className="font-semibold text-foreground mb-2">ספקים:</p>
            <p className="mb-3">
              צוותי משאבי האנוש והמשפט שלנו עובדים בשיתוף פעולה עם פונקציית הרכש כדי להבטיח עמידה במחויבויות למניעת עבדות מודרנית. אנו מחייבים ספקים חוזית לעמוד בקוד ההתנהגות שלנו נגד עבדות מודרנית כחלק ממשא ומתן חוזי.
            </p>

            <p className="font-semibold text-foreground mb-2">עובדים:</p>
            <p className="mb-3">
              נהלי הגיוס וההעסקה שלנו כוללים בדיקות קדם-העסקה מתאימות לכל עובדי ReviewHub, כגון בדיקות זכות עבודה ובדיקות רקע. עובדים חדשים מקבלים הכשרה שמסבירה את מדיניות החברה ומאשרת שהעובדים יכולים ליצור קשר בכל עניין מדאיג בסודיות מלאה, בהתאם לחוק הגנה על עובדים (חשיפת עבירות ופגיעה בטוהר המידות או במינהל התקין), התשנ"ז-1997.
            </p>
            <p className="mb-3">
              אנו מחויבים לתשלום שכר הוגן לעובדינו ולקבלני המשנה שלנו בהתאם לחוק שכר מינימום, התשמ"ז-1987, ומעבר לו.
            </p>

            <p className="font-semibold text-foreground mb-2">לקוחות:</p>
            <p>
              אנו נמנעים מלעשות עסקים עם עסקים שגורמים או יוצרים נזק, אינם עולים בקנה אחד עם הסטנדרטים האתיים שלנו, או שאינם חולקים את אותם ערכים ואמונות יסוד כמונו. עסקים כאלה — שאנו מכנים ״עסקים לא מתאימים״ — עלולים לפגוע במוניטין של ReviewHub ולערער את אמינות הפלטפורמה.
            </p>
          </Section>

          {/* Policies */}
          <Section icon={Users} title="מדיניות החברה">
            <p className="mb-3">
              מדיניות ReviewHub פועלת לזיהוי ומניעה של כל עבדות וסחר בבני אדם בפעילותנו. אנו עובדים לשמירה על סטנדרטים מקצועיים ואתיים גבוהים ומוודאים שעובדינו מכירים את תפקידם בשמירה עליהם.
            </p>
            <p className="mb-3">
              כל עובדי ReviewHub מקבלים חוזה העסקה בכתב, כולל קוד האתיקה של החברה, ומחויבים למדיניות הארגונית הכוללת:
            </p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>קוד אתיקה ארגוני</li>
              <li>מדיניות נגד שוחד ושחיתות</li>
              <li>מדיניות אי-אפליה ונגד הטרדה — בהתאם לחוק שוויון ההזדמנויות בעבודה, התשמ"ח-1988, וחוק למניעת הטרדה מינית, התשנ"ח-1998</li>
              <li>מדיניות חשיפת עבירות (Whistleblowing)</li>
              <li>קוד התנהגות נגד עבדות מודרנית</li>
            </ul>
          </Section>

          {/* Due Diligence */}
          <Section icon={Search} title="בדיקת נאותות והערכת סיכונים">
            <p className="mb-3">
              אנו שואפים לעבוד עם לקוחות, קבלנים וספקים שמתאימים ומשלימים את הסטנדרטים האתיים והערכים הארגוניים שלנו.
            </p>
            <p className="mb-3">לזיהוי מגזרים וקטגוריות עם סיכוני עבדות מודרנית גבוהים, השתמשנו במדדים הבאים:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground mb-4">
              <li>תלות בכוח עבודה בעל מיומנות נמוכה</li>
              <li>תלות בכוח עבודה מהגר</li>
              <li>נוכחות ילדים</li>
              <li>עבודה מסוכנת או בלתי רצויה</li>
              <li>מיקום במדינה עם רמות שחיתות גבוהות, ממשל חלש ואכיפה לקויה של זכויות אדם</li>
            </ul>
            <p className="mb-3">
              מאחר ש-ReviewHub היא עסק מבוסס אינטרנט, הספקים העיקריים שלנו כוללים ספקי שירותים מקוונים לתפעול הפלטפורמה ושירותי ייעוץ מעסקים מוכרים. על בסיס גורמים אלה, אנו מעריכים שסיכון העבדות המודרנית בשרשרת האספקה שלנו נמוך.
            </p>
            <p className="font-semibold text-foreground mb-2">אנו ממשיכים:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>לבצע בדיקת נאותות בעת בחירת ספקים וקבלנים</li>
              <li>לבדוק באופן קבוע את הספקים והקבלנים בהם אנו משתמשים</li>
              <li>ליצור קשרים עסקיים עם ספקים המשקפים את הערכים הארגוניים שלנו</li>
              <li>לוודא שלכל ספק או קבלן יש סעיף יחס אתי בחוזה, במיוחד כאשר אנו מעריכים אותם כבעלי סיכון בינוני עד גבוה</li>
            </ul>
          </Section>

          {/* Further Steps */}
          <Section icon={TrendingUp} title="צעדים נוספים">
            <p className="mb-3">
              אנו ממשיכים לשאוף לשיפור האמצעים שאנו נוקטים כדי להבטיח שנפחית את הסיכון לעבדות מודרנית בשרשראות האספקה שלנו.
            </p>
            <p className="mb-3">
              יישמנו <strong>קוד התנהגות חדש לספקים</strong> החל בכלל העולם על כל הספקים שלנו. קוד התנהגות חדש זה משלב את כל המדיניות וההנחיות הקיימות שלנו הרלוונטיות לספקים, וקובע סטנדרטים ברורים להתנהגות אתית, שיטות בנות-קיימא ואחריות חברתית.
            </p>
            <p>
              כדי להבטיח אחריותיות, שילבנו עמידה בקוד ההתנהגות החדש כמחויבות חוזית בהסכמי הספקים שלנו, ויצרנו התחייבויות אכיפות לאורך כל שרשרת האספקה.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר">
            <p>
              אם יש לכם שאלות או חששות בנוגע למחויבותנו למניעת עבדות מודרנית וסחר בבני אדם, אתם מוזמנים לפנות אלינו:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:ethics@reviewhub.co.il" className="text-primary hover:underline">ethics@reviewhub.co.il</a></p>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              הצהרה זו אושרה על ידי הנהלת ReviewHub בע"מ ועודכנה לאחרונה: מרץ 2026
            </p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ModernSlaveryStatement;

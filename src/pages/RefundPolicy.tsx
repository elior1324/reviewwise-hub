import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { RotateCcw, FileText, CreditCard, Clock, Mail, AlertTriangle, Shield } from "lucide-react";
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

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-16 md:py-24 relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <RotateCcw size={16} /> מדיניות ביטולים
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              מדיניות ביטול עסקה והחזרים
            </h1>
            <p className="text-muted-foreground text-lg">
              גרסה 1.0 — מרץ 2026
            </p>
            <p className="text-muted-foreground mt-2">
              מדיניות זו מסדירה את תנאי ביטול עסקאות והחזרים כספיים עבור שירותי ReviewHub בתשלום, בהתאם לחוק הגנת הצרכן, התשמ"א-1981.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Right to Cancel */}
          <Section icon={Shield} title="זכות ביטול עסקה — חוק הגנת הצרכן">
            <p className="mb-3">
              בהתאם לסעיף 14ג לחוק הגנת הצרכן, התשמ"א-1981, ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010, עומדת לכם הזכות לבטל עסקה בתנאים הבאים:
            </p>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-foreground mb-4">
              <p className="font-semibold mb-2">📋 זכות ביטול עסקה בעסקת מכר מרחוק:</p>
              <p>רשאים לבטל את העסקה <strong>תוך 14 ימים מיום ביצוע העסקה או מיום קבלת מסמך הגילוי</strong> (המאוחר מביניהם), ובתנאי שלא החלתם לעשות שימוש בשירות.</p>
            </div>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li><strong>תקופת ביטול:</strong> 14 ימים מיום ביצוע העסקה או מיום קבלת פרטי העסקה בכתב — לפי המאוחר.</li>
              <li><strong>אזרח ותיק / אדם עם מוגבלות / עולה חדש:</strong> זכאים לביטול תוך <strong>4 חודשים</strong> מיום ביצוע העסקה או מיום קבלת פרטי העסקה — לפי המאוחר, ובלבד שההתקשרות כללה שיחה בין הצדדים (כולל שיחה באמצעות תקשורת אלקטרונית).</li>
            </ul>
          </Section>

          {/* How to Cancel */}
          <Section icon={FileText} title="אופן ביטול העסקה">
            <p className="mb-3">ניתן לבטל עסקה באחת הדרכים הבאות:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>דוא"ל:</strong> שליחת הודעת ביטול לכתובת <a href="mailto:billing@reviewhub.co.il" className="text-primary hover:underline">billing@reviewhub.co.il</a></li>
              <li><strong>טופס מקוון:</strong> באמצעות פנייה דרך עמוד "צור קשר" באתר</li>
              <li><strong>דואר רשום:</strong> ReviewHub בע"מ, תל אביב, ישראל</li>
            </ul>
            <p className="mb-3">הודעת הביטול צריכה לכלול:</p>
            <ul className="list-disc pr-6 space-y-1 text-muted-foreground">
              <li>שם מלא וכתובת אימייל של בעל החשבון</li>
              <li>שם התוכנית / מנוי שברצונכם לבטל</li>
              <li>תאריך ביצוע העסקה</li>
              <li>סיבת הביטול (לא חובה אך מומלץ)</li>
            </ul>
          </Section>

          {/* Cancellation Fees */}
          <Section icon={CreditCard} title="דמי ביטול">
            <p className="mb-3">בהתאם לחוק הגנת הצרכן:</p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>ביטול בתוך 14 ימים ולפני תחילת מתן השירות:</strong> ReviewHub רשאית לגבות <strong>דמי ביטול בסך 5% מערך העסקה או 100 ש"ח — הנמוך מביניהם</strong>.</li>
              <li><strong>ביטול לאחר תחילת מתן השירות:</strong> יינתן החזר יחסי (Pro Rata) עבור התקופה שלא נוצלה, בניכוי דמי ביטול כאמור.</li>
              <li><strong>ביטול לאחר 14 ימים:</strong> לא יינתן החזר כספי, אך המנוי לא יתחדש אוטומטית בתום התקופה הנוכחית.</li>
            </ul>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-foreground text-sm">
              💡 <strong>שימו לב:</strong> ביטול חידוש אוטומטי אינו מהווה ביטול עסקה. לביטול חידוש, יש להודיע לפחות 30 ימים לפני תום תקופת המנוי הנוכחית.
            </div>
          </Section>

          {/* Refund Process */}
          <Section icon={Clock} title="תהליך ההחזר הכספי">
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li>החזר כספי יבוצע <strong>תוך 14 ימי עסקים</strong> מיום קבלת הודעת הביטול.</li>
              <li>ההחזר יבוצע באותו אמצעי תשלום בו בוצעה העסקה המקורית.</li>
              <li>ReviewHub תשלח אישור ביטול ופירוט ההחזר בדוא"ל.</li>
            </ul>
          </Section>

          {/* Free Plan */}
          <Section icon={RotateCcw} title="תוכנית חינם (Starter)">
            <p>
              תוכנית החינם אינה כרוכה בתשלום ולכן אינה כפופה למדיניות ביטולים והחזרים. ניתן למחוק חשבון חינמי בכל עת דרך הגדרות החשבון.
            </p>
          </Section>

          {/* Trial Period */}
          <Section icon={Clock} title="תקופות ניסיון">
            <p className="mb-3">
              ככל שתקבלו תקופת ניסיון חינם:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>לא ייגבה תשלום בתקופת הניסיון.</li>
              <li>בתום תקופת הניסיון, המנוי יתחדש אוטומטית לתוכנית בתשלום אלא אם תבטלו לפני כן.</li>
              <li>ביטול בתקופת הניסיון אינו כרוך בדמי ביטול.</li>
            </ul>
          </Section>

          {/* Special Cases */}
          <Section icon={AlertTriangle} title="מקרים מיוחדים">
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>תקלה טכנית:</strong> אם לא הצלחתם להשתמש בשירות עקב תקלה טכנית שלנו — תהיו זכאים להחזר מלא עבור התקופה המושפעת.</li>
              <li><strong>חיוב שגוי:</strong> במקרה של חיוב כפול או שגוי, פנו אלינו ונתקן ונחזיר את הסכום בתוך 7 ימי עסקים.</li>
              <li><strong>הפסקת שירות על ידי ReviewHub:</strong> אם ReviewHub מפסיקה שירות בתשלום, יינתן החזר יחסי עבור התקופה שלא סופקה.</li>
            </ul>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="יצירת קשר בנושא ביטולים והחזרים">
            <p>לכל שאלה בנושא ביטול עסקה או החזר כספי:</p>
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2 text-sm">
              <p className="font-semibold text-foreground">ReviewHub בע"מ</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:billing@reviewhub.co.il" className="text-primary hover:underline">billing@reviewhub.co.il</a></p>
              <p className="text-muted-foreground">כתובת: תל אביב, ישראל</p>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              מדיניות זו עודכנה לאחרונה: מרץ 2026
            </p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;

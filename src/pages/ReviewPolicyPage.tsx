/**
 * ReviewPolicyPage — transparent review guidelines for ReviewHub.
 *
 * Explains who can write a review, when, and what the rules are.
 * Designed to build trust without creating friction.
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, Clock, AlertTriangle, Scale, MessageSquare, Eye } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Section = ({
  icon: Icon,
  title,
  children,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
  index: number;
}) => (
  <motion.div variants={fadeUp} custom={index} className="space-y-3">
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-foreground/80 leading-relaxed space-y-3 pr-[46px]">
      {children}
    </div>
  </motion.div>
);

export default function ReviewPolicyPage() {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-20 md:py-28 relative">
          <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-5 text-primary"
            >
              <ShieldCheck size={16} /> מדיניות ביקורות
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4"
            >
              כללי הביקורות שלנו
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground max-w-lg mx-auto leading-relaxed"
            >
              אנחנו מאמינים שביקורות אמיתיות הן הבסיס לאמון.
              הכללים הבאים נועדו להבטיח שכל ביקורת שמפורסמת ב-ReviewHub משקפת חוויה אמיתית.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container py-16 md:py-20">
        <motion.div
          className="max-w-2xl mx-auto space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* 1. Who can write */}
          <Section icon={UserCheck} title="מי יכול לכתוב ביקורת?" index={0}>
            <p>
              כל אדם שהייתה לו חוויה אמיתית עם עסק, מוצר או שירות
              שמופיע ב-ReviewHub יכול לכתוב ביקורת.
            </p>
            <p>
              אין צורך בהוכחת רכישה כדי לכתוב ביקורת. עם זאת, ביקורות
              שמגובות בהוכחת רכישה מקבלות סימון מיוחד ונחשבות אמינות יותר
              במערכת הדירוג.
            </p>
            <p>
              <strong className="text-foreground">מי לא יכול לכתוב ביקורת:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/70">
              <li>בעלי עסק — לא ניתן לכתוב ביקורת על העסק שלכם</li>
              <li>עובדים או שותפים עסקיים — ניגוד עניינים</li>
              <li>מי שלא חווה את השירות בפועל</li>
            </ul>
          </Section>

          {/* 2. When */}
          <Section icon={Clock} title="מתי אפשר לכתוב ביקורת?" index={1}>
            <p>
              אפשר לכתוב ביקורת בכל שלב — גם אם החוויה הייתה לפני חודשים
              או אפילו שנים. אין חלון זמן שמגביל אתכם.
            </p>
            <p>
              ביקורות עדכניות יותר מקבלות משקל מעט גבוה יותר בחישוב ציון האמון,
              אבל ביקורות ישנות לא מוסרות ולא מוסתרות — הן חלק מההיסטוריה
              של העסק.
            </p>
          </Section>

          {/* 3. Authenticity */}
          <Section icon={Eye} title="מה מותר ומה אסור?" index={2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/3 p-4">
                <p className="font-semibold text-foreground text-xs mb-2">מותר ומעודד</p>
                <ul className="space-y-1.5 text-xs text-foreground/70">
                  <li>✓ לשתף חוויה אישית — חיובית או שלילית</li>
                  <li>✓ לתאר מה עבד ומה לא</li>
                  <li>✓ לעדכן ביקורת ישנה אם המצב השתנה</li>
                  <li>✓ לכתוב בכל שפה</li>
                </ul>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/3 p-4">
                <p className="font-semibold text-foreground text-xs mb-2">אסור</p>
                <ul className="space-y-1.5 text-xs text-foreground/70">
                  <li>✗ ביקורות מזויפות או שאינן מבוססות על חוויה</li>
                  <li>✗ ביקורות בתמורה לתגמול כספי</li>
                  <li>✗ תוכן מאיים, פוגעני, או מכיל מידע אישי</li>
                  <li>✗ ביקורות שנכתבו על ידי בעל העסק או מטעמו</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 4. Fairness */}
          <Section icon={Scale} title="הוגנות וניטרליות" index={3}>
            <p>
              ReviewHub לא מעודדת ביקורות חיוביות יותר מביקורות שליליות.
              אנחנו מאמינים שתמונה מלאה — כולל ביקורת — היא מה שהופך
              את המערכת לאמינה.
            </p>
            <p>
              בעלי עסקים לא יכולים למחוק ביקורות שליליות. הם יכולים
              לדווח על ביקורות שמפרות את הכללים, אבל ההחלטה נשארת בידי
              צוות הבדיקה שלנו.
            </p>
            <p>
              ביקורת שלילית כשלעצמה אינה עילה להסרה. רק ביקורות שמפרות
              כללים ברורים (כמו מידע כוזב או ניגוד עניינים) ייבדקו להסרה.
            </p>
          </Section>

          {/* 5. Moderation */}
          <Section icon={AlertTriangle} title="בדיקה ופיקוח" index={4}>
            <p>
              כל ביקורת שנכתבת ב-ReviewHub עוברת בדיקה אוטומטית
              לזיהוי ספאם, תוכן פוגעני, ודפוסים חשודים. ביקורות שמסומנות
              כחשודות עוברות בדיקה נוספת.
            </p>
            <p>
              אנחנו לא חוסמים ביקורות שליליות — רק ביקורות שמפרות
              את הכללים. ביקורת שלילית שמתארת חוויה אמיתית תפורסם
              ככל ביקורת אחרת.
            </p>
            <p>
              אם ביקורת מוסרת, הכותב מקבל הודעה עם הסיבה. בעלי עסקים
              שמדווחים על ביקורת מקבלים עדכון על ההחלטה.
            </p>
          </Section>

          {/* 6. Business responses */}
          <Section icon={MessageSquare} title="תגובות בעלי עסקים" index={5}>
            <p>
              בעלי עסקים יכולים להגיב לביקורות באופן ציבורי. התגובה
              מוצגת מתחת לביקורת כדי לאפשר תמונה מלאה.
            </p>
            <p>
              אנחנו מעודדים בעלי עסקים להגיב באופן מכבד ומקצועי,
              גם כשמדובר בביקורות שליליות. תגובה טובה לביקורת שלילית
              מחזקת את האמון יותר מאלף ביקורות חיוביות.
            </p>
          </Section>

          {/* Summary strip */}
          <motion.div
            variants={fadeUp}
            custom={6}
            className="rounded-xl border border-primary/20 bg-primary/3 p-5 text-center"
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              <strong className="text-foreground">בקיצור:</strong>{" "}
              כתבו על חוויה אמיתית, היו הוגנים, ואל תשכחו —
              גם ביקורת שלילית עוזרת לכולם לקבל החלטות טובות יותר.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

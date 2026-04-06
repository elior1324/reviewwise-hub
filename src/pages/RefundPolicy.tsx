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
              ReviewHub היא פלטפורמה חינמית לגמרי, ללא הגבלת זמן. אין תוכניות בתשלום, אין מנויים ואין חיובים.
              מדיניות זו נשמרת לצורך שקיפות בהתאם לחוק הגנת הצרכן, התשמ"א-1981.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-12">

          {/* Free service — no fees */}
          <Section icon={RotateCcw} title="שירות חינמי">
            <p className="mb-3">
              ReviewHub היא פלטפורמה חינמית לגמרי, ללא הגבלת זמן. מאחר שאין חיובים כספיים,
              אין צורך בביטול עסקה, דמי ביטול או החזרים. ניתן למחוק חשבון בכל עת דרך הגדרות החשבון.
            </p>
            <p>
              במקרה של שינוי עתידי במודל השירות, תישלח הודעה בדוא״ל לפחות 30 ימים מראש לכל בעלי העסקים הרשומים.
            </p>
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
              <p className="font-semibold text-foreground">ReviewHub</p>
              <p className="text-muted-foreground">אימייל: <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">support@reviewshub.info</a></p>
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

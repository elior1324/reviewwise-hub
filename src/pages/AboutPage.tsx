import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import FloatingEarnCTA from "@/components/FloatingEarnCTA";
import { motion } from "framer-motion";
import { ShieldCheck, Target, BookOpen, Users, Award, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <FloatingEarnCTA />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <Target size={16} /> המטרה שלנו
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              לעזור לכם לבחור{" "}
              <span className="gradient-text glow-text">נכון</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ReviewHub נבנה כדי לפתור בעיה אחת פשוטה — כשאתם משקיעים כסף ומאמץ בלימודים, אתם ראויים לדעת בדיוק מה אתם מקבלים.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* What is ReviewHub */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
            מה זה ReviewHub?
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              ReviewHub היא פלטפורמת ביקורות מאומתות לקורסים, סדנאות, תוכניות מנטורינג ושירותי למידה דיגיטלית בישראל. 
              בניגוד לפלטפורמות ביקורות רגילות, אצלנו <strong className="text-foreground">רק מי שרכש את הקורס יכול לכתוב ביקורת</strong>.
            </p>
            <p>
              המשמעות היא שכל ביקורת שאתם קוראים באתר מבוססת על חוויה אמיתית של סטודנט שעבר את הקורס — לא פרסום, לא עסקאות, ולא ביקורות מזויפות.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Why education matters */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <BookOpen size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                למה חשוב ללמוד — ומהאנשים הנכונים
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5 text-foreground/80 leading-relaxed">
              <p>
                השכלה היא ההשקעה הכי חכמה שאדם יכול לעשות בעצמו. בעולם שמשתנה במהירות, 
                מי שלא ממשיך ללמוד — נשאר מאחור. קורסים מקצועיים, סדנאות מעשיות ותוכניות מנטורינג 
                מעניקים לכם כלים מעשיים שמייצרים תוצאות בפועל.
              </p>
              <p>
                אבל לא כל קורס שווה, ולא כל מרצה באמת יודע ללמד. 
                <strong className="text-foreground"> הבחירה ממי אתם לומדים חשובה לא פחות ממה שאתם לומדים.</strong> 
                מורה מנוסה עם ידע מעשי יכול לחסוך לכם שנים של ניסוי וטעייה, 
                בעוד קורס גרוע עלול לגרום לכם לבזבז כסף ולאבד מוטיבציה.
              </p>
              <p>
                זו בדיוק הסיבה שהקמנו את ReviewHub — כדי שתוכלו לקבל החלטות מושכלות 
                על סמך חוויות אמיתיות של אנשים שכבר עברו את הדרך.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-10">
            איך זה עובד?
          </motion.h2>
          <div className="space-y-8">
            {[
              {
                icon: ShieldCheck,
                title: "ביקורות מאומתות בלבד",
                desc: "כל ביקורת מקושרת לרכישה אמיתית. בעלי עסקים מאמתים את הרוכשים באמצעות קישורים ייחודיים, העלאת נתוני רכישה, או חיבור למערכות תשלום.",
              },
              {
                icon: Users,
                title: "שקיפות מלאה",
                desc: "אתם יכולים לראות מתי כל מבקר רכש את הקורס, כמה זמן עבר מאז הרכישה, ואם הביקורת עודכנה לאורך הזמן — כדי שתקבלו תמונה מלאה ואמינה.",
              },
              {
                icon: Award,
                title: "מערכת AI חכמה",
                desc: "הטכנולוגיה שלנו מזהה ביקורות חשודות, מסכמת משוב מסטודנטים, ומסייעת לכם למצוא את הקורס המתאים ביותר לצרכים שלכם.",
              },
              {
                icon: TrendingUp,
                title: "כלים לבעלי עסקים",
                desc: "יוצרי קורסים מקבלים לוח בקרה מקצועי עם ניתוח ביקורות, כלי איסוף משוב, וידג׳טים להטמעה באתר — הכל כדי לבנות אמון אמיתי.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp} custom={i + 1} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8">
              הערכים שמנחים אותנו
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "אמינות", desc: "רק ביקורות מאומתות. אין קיצורי דרך, אין פשרות." },
                { title: "שקיפות", desc: "כל מידע פתוח — דירוגים, זמני רכישה, ותגובות בעלי עסקים." },
                { title: "איכות", desc: "אנחנו מאמינים שמי שמספק שירות טוב — ראוי שידעו על כך." },
              ].map(({ title, desc }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i + 1} className="rounded-xl p-6 bg-card border border-border/50">
                  <CheckCircle size={20} className="text-primary mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              מוכנים למצוא את הקורס הבא שלכם?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              חפשו מבין מאות קורסים מאומתים ובחרו את ההשקעה הנכונה עבורכם.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/search">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  עיינו בקורסים
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  הצטרפו כבעלי עסק
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              שאלות? כתבו לנו: <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">support@reviewshub.info</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default AboutPage;

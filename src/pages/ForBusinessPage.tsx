import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Star, TrendingUp, Users, Zap, BarChart3, Code, Award, ArrowLeft, CheckCircle } from "lucide-react";
import { BUSINESSES } from "@/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

// Logos / Social proof businesses that "use" ReviewHub
const TRUSTED_COMPANIES = [
  { name: "אקדמיית שיווק דיגיטלי", logo: "DMA", rating: 4.8, reviews: 124 },
  { name: "Code Masters IL", logo: "CM", rating: 4.6, reviews: 89 },
  { name: "בית הספר לעיצוב ת״א", logo: "DS", rating: 4.9, reviews: 67 },
  { name: "מרכז מדעי הנתונים", logo: "DH", rating: 4.7, reviews: 156 },
  { name: "Hebrew Tech", logo: "HT", rating: 4.5, reviews: 42 },
  { name: "אקדמיית צמיחה", logo: "GA", rating: 4.4, reviews: 31 },
  { name: "TechPro Academy", logo: "TP", rating: 4.7, reviews: 98 },
  { name: "LearnX Israel", logo: "LX", rating: 4.6, reviews: 73 },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "ביקורות מאומתות",
    desc: "רק לקוחות שרכשו בפועל יכולים לכתוב ביקורות. אמינות מוחלטת.",
  },
  {
    icon: BarChart3,
    title: "דאשבורד מתקדם",
    desc: "עקבו אחר דירוגים, מגמות, ביקורות חדשות ואחוזי מענה בזמן אמת.",
  },
  {
    icon: Code,
    title: "וידג׳טים להטמעה",
    desc: "הטמיעו ביקורות ודירוגים ישירות באתר שלכם בשורת קוד אחת.",
  },
  {
    icon: Zap,
    title: "בקשות ביקורת אוטומטיות",
    desc: "שלחו לקוחות קישורי ביקורת ייחודיים או העלו CSV של רכישות.",
  },
  {
    icon: TrendingUp,
    title: "מערכת אפיליאט",
    desc: "צרו קישורי הפניה עם מעקב קליקים, המרות והכנסות.",
  },
  {
    icon: Award,
    title: "זיהוי AI חכם",
    desc: "מערכת ה-AI מזהה ביקורות חשודות ומסכמת משוב סטודנטים אוטומטית.",
  },
];

const TESTIMONIALS = [
  {
    name: "רוני כ.",
    role: "מייסד, אקדמיית שיווק דיגיטלי",
    text: "מאז שהצטרפנו ל-ReviewHub, שיעור ההמרה שלנו עלה ב-34%. הביקורות המאומתות נתנו ללקוחות פוטנציאליים את הביטחון לרכוש.",
    rating: 5,
  },
  {
    name: "מיכל ש.",
    role: "מנהלת שיווק, Code Masters IL",
    text: "הוידג׳טים מדהימים. הטמענו את הקרוסלה באתר ומייד ראינו עלייה באינגייג׳מנט. הדאשבורד נותן לנו תמונה ברורה על מה שהסטודנטים חושבים.",
    rating: 5,
  },
  {
    name: "יוסי ד.",
    role: "מייסד, מרכז מדעי הנתונים",
    text: "הכלי הכי חשוב שהוספנו לעסק. הביקורות המאומתות בנו לנו אמון ברמה שלא חשבנו שאפשר להגיע אליה.",
    rating: 5,
  },
];

const PLANS = [
  {
    name: "בסיסי",
    price: "חינם",
    features: ["פרופיל עסקי ציבורי", "עד 50 ביקורות", "תג דירוג בסיסי", "תגובות לביקורות"],
    cta: "התחילו בחינם",
    highlighted: false,
  },
  {
    name: "מקצועי",
    price: "₪199/חודש",
    features: ["ביקורות ללא הגבלה", "וידג׳טים להטמעה", "בקשות ביקורת אוטומטיות", "דאשבורד מתקדם", "מערכת אפיליאט", "סיכום AI"],
    cta: "התחילו תקופת ניסיון",
    highlighted: true,
  },
  {
    name: "ארגוני",
    price: "צרו קשר",
    features: ["הכל מהמקצועי", "גישת API מלאה", "אינטגרציות מותאמות", "מנהל חשבון אישי", "Google Ads Review Stars", "דוחות מתקדמים"],
    cta: "דברו איתנו",
    highlighted: false,
  },
];

const ForBusinessPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* Hero — Trustpilot-style */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
                  <Zap size={16} /> לבעלי עסקים וחברות
                </motion.div>
                <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
                  בנו אמון אמיתי עם{" "}
                  <span className="gradient-text glow-text">ביקורות מאומתות</span>
                </motion.h1>
                <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  הצטרפו למאות עסקים בישראל שמשתמשים ב-ReviewHub כדי לאסוף ביקורות מאומתות, לבנות מוניטין ולהגדיל מכירות.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="flex gap-3 flex-wrap">
                  <Link to="/register">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                      צרו חשבון בחינם
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                      קראו עוד
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <motion.div variants={fadeUp} custom={2} className="hidden md:block">
                {/* Stats preview card */}
                <div className="rounded-2xl p-6 bg-card border border-border/50 shadow-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary glow-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-display font-bold text-sm">R</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">דאשבורד ReviewHub</p>
                      <p className="text-xs text-muted-foreground">תצוגה מקדימה</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "דירוג ממוצע", value: "4.8 ⭐" },
                      { label: "ביקורות החודש", value: "+23" },
                      { label: "אחוז מענה", value: "92%" },
                      { label: "קליקי אפיליאט", value: "1,240" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-display font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <TrendingUp size={14} />
                    <span>ההמרות עלו ב-34% החודש</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof — LOI: Companies using ReviewHub */}
      <section className="border-y border-border/50 glass">
        <div className="container py-12">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium">חברות ועסקים שכבר סומכים על ReviewHub</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {TRUSTED_COMPANIES.map((company) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-sm">
                  {company.logo}
                </div>
                <p className="text-xs text-foreground font-medium text-center leading-tight">{company.name}</p>
                <div className="flex items-center gap-1">
                  <Star size={10} className="fill-star text-star" />
                  <span className="text-xs text-muted-foreground">{company.rating}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "850+", label: "עסקים רשומים" },
            { value: "12,400+", label: "ביקורות מאומתות" },
            { value: "34%", label: "עלייה ממוצעת בהמרות" },
            { value: "98%", label: "שביעות רצון עסקית" },
          ].map(({ value, label }, i) => (
            <motion.div key={label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <p className="font-display font-bold text-3xl md:text-4xl text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">כל מה שצריך לניהול המוניטין שלכם</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">כלים מקצועיים שנבנו במיוחד עבור יוצרי קורסים ושירותי למידה בישראל</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials from business owners */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">מה בעלי עסקים אומרים</h2>
          <p className="text-muted-foreground">חברות שכבר משתמשות ב-ReviewHub משתפות את החוויה שלהן</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-xl p-6 bg-card border border-border/50"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }, (_, j) => (
                  <Star key={j} size={16} className="fill-star text-star" />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-display font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">תוכניות ומחירים</h2>
            <p className="text-muted-foreground">בחרו את התוכנית המתאימה לעסק שלכם</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className={`rounded-xl p-6 border ${
                  plan.highlighted
                    ? "bg-card border-primary/50 shadow-card-hover relative"
                    : "bg-card border-border/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    הכי פופולרי
                  </div>
                )}
                <h3 className="font-display font-bold text-xl text-foreground mb-1">{plan.name}</h3>
                <p className="font-display font-bold text-3xl text-primary mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle size={14} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              מוכנים לבנות אמון אמיתי?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              הצטרפו למאות עסקים שכבר משתמשים ב-ReviewHub. התחילו בחינם ושדרגו כשתהיו מוכנים.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                צרו חשבון בחינם <ArrowLeft size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default ForBusinessPage;

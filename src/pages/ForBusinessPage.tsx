import Navbar from "@/components/Navbar";
import logoIcon from "@/assets/logo-icon-cropped.png";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Star, TrendingUp, Users, Zap, BarChart3, Code, Award, ArrowLeft, CheckCircle, X, Crown, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

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
    name: "סטארטר",
    price: "חינם",
    period: "",
    features: ["פרופיל עסקי ציבורי", "עד 10 ביקורות בחודש", "תג דירוג בסיסי", "תגובות לביקורות"],
    excluded: ["וידג׳טים להטמעה", "חיבור CRM ולידים", "דוחות AI"],
    cta: "התחילו בחינם",
    highlighted: false,
  },
  {
    name: "מקצועי",
    price: "₪189",
    period: "/חודש",
    originalPrice: "₪249",
    features: ["ביקורות ללא הגבלה", "דאשבורד מתקדם", "וידג׳טים להטמעה", "בקשות ביקורת אוטומטיות", "מערכת אפיליאט", "סיכומי AI שבועיים", "תמיכה בעדיפות"],
    excluded: ["חיבור CRM ולידים"],
    cta: "התחילו 14 ימי ניסיון",
    highlighted: true,
  },
  {
    name: "פרימיום",
    price: "₪389",
    period: "/חודש",
    features: ["הכל מהמקצועי, ועוד:", "חיבור CRM — HubSpot, Salesforce", "ניהול לידים אוטומטי", "Webhook (Zapier/Make)", "Google Ads Review Stars ⭐", "דוחות AI יומיים", "גישת API מלאה", "מנהל הצלחה אישי"],
    excluded: [],
    cta: "שדרגו לפרימיום",
    highlighted: false,
    premium: true,
  },
];

const ForBusinessPage = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* Hero */}
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
                  הצטרפו לעסקים בישראל שמשתמשים ב-ReviewHub כדי לאסוף ביקורות מאומתות, לבנות מוניטין ולהגדיל מכירות.
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
                <div className="rounded-2xl p-6 bg-card border border-border/50 shadow-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden">
                      <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">דאשבורד ReviewHub</p>
                      <p className="text-xs text-muted-foreground">תצוגה מקדימה</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "דירוג ממוצע", value: "— ⭐" },
                      { label: "ביקורות החודש", value: "—" },
                      { label: "אחוז מענה", value: "—" },
                      { label: "קליקי אפיליאט", value: "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-display font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
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
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</

import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import AIChatbot from "@/components/AIChatbot";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Star, TrendingUp, Zap, BarChart3, Code,
  Award, ArrowLeft, CheckCircle, Users, X, Crown, Sparkles,
  Lock, MessageSquare, FileText, Webhook, LineChart, Headphones,
  UserCheck, Globe, ChevronDown
} from "lucide-react";
import { useAuth, STRIPE_TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import featureProfile from "@/assets/previews/feature-profile.jpg";
import featureAnalytics from "@/assets/previews/feature-analytics.jpg";
import featureAffiliate from "@/assets/previews/feature-affiliate.jpg";
import featureAiReport from "@/assets/previews/feature-ai-report.jpg";
import featureCrm from "@/assets/previews/feature-crm.jpg";
import featureWidgets from "@/assets/previews/feature-widgets.jpg";
import starterPreview from "@/assets/previews/starter-dashboard.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

// ─── Features organized by tier ───────────────────────────
const FREE_FEATURES = [
  { icon: ShieldCheck, title: "ביקורות מאומתות", desc: "רק לקוחות שרכשו בפועל יכולים לכתוב ביקורות. אמינות מוחלטת.", preview: starterPreview },
  { icon: UserCheck, title: "פרופיל עסקי ציבורי", desc: "עמוד עסק מותאם אישית עם פרטים, לוגו ותיאור.", preview: featureProfile },
  { icon: MessageSquare, title: "תגובות לביקורות", desc: "הגיבו לביקורות של הלקוחות שלכם ובנו שיח.", preview: featureProfile },
  { icon: Star, title: "תג דירוג בסיסי", desc: "הציגו את הדירוג שלכם עם תג אמינות ReviewHub." },
];

const PRO_FEATURES = [
  { icon: BarChart3, title: "דאשבורד אנליטיקס", desc: "עקבו אחר דירוגים, מגמות וביקורות חדשות בזמן אמת.", preview: featureAnalytics },
  { icon: Code, title: "וידג׳טים להטמעה", desc: "הציגו ביקורות ודירוגים באתר שלכם בשורת קוד אחת.", preview: featureWidgets },
  { icon: Zap, title: "בקשות ביקורת אוטומטיות", desc: "שלחו קישורי ביקורת ייחודיים או העלו CSV של רכישות." },
  { icon: TrendingUp, title: "מערכת אפיליאט (שיווק שותפים)", desc: "קישורי הפניה עם מעקב קליקים, המרות והכנסות. עמלה של 10% על כל מכירה שנכנסת דרככם.", preview: featureAffiliate },
  { icon: Globe, title: "רשתות חברתיות ואתר", desc: "חברו YouTube, Instagram, TikTok, LinkedIn, Facebook ואתר האינטרנט שלכם לפרופיל העסקי." },
  { icon: Award, title: "סיכומי AI שבועיים", desc: "ניתוח אוטומטי של ביקורות עם תובנות לשיפור.", preview: featureAiReport },
  { icon: Headphones, title: "תמיכה בעדיפות", desc: "תמיכה מהירה עם מענה תוך 4 שעות בימי עבודה." },
];

const PREMIUM_FEATURES = [
  { icon: Users, title: "חיבור CRM", desc: "חברו HubSpot, Salesforce ועוד ישירות לפלטפורמה.", locked: true, preview: featureCrm },
  { icon: FileText, title: "ניהול לידים והפניות", desc: "ניהול לידים אוטומטי — כל ביקורת חיובית הופכת להפניה.", locked: true, preview: featureCrm },
  { icon: Webhook, title: "Webhook למערכות חיצוניות", desc: "חברו ל-Zapier, Make ולכל מערכת עם webhook.", locked: true },
  { icon: Globe, title: "Google Ads Review Stars ⭐", desc: "הציגו כוכבי דירוג ישירות במודעות Google שלכם.", locked: true },
  { icon: LineChart, title: "דוחות AI מתקדמים יומיים", desc: "ניתוח עמוק עם מגמות, התרעות ותחזיות.", locked: true, preview: featureAiReport },
  { icon: Code, title: "גישת API מלאה", desc: "בנו אינטגרציות מותאמות אישית עם ה-API שלנו.", locked: true },
];

const PLANS = [
  {
    name: "סטארטר",
    price: "חינם",
    period: "לתמיד",
    tier: "free" as const,
    features: [
      "פרופיל עסקי ציבורי",
      "עד 10 ביקורות בחודש",
      "תג דירוג בסיסי",
      "תגובות לביקורות",
    ],
    excluded: ["רשתות חברתיות ואתר", "דאשבורד אנליטיקס", "וידג׳טים להטמעה", "בקשות ביקורת אוטומטיות", "חיבור CRM ולידים", "דוחות AI"],
    cta: "התחילו בחינם",
    highlighted: false,
  },
  {
    name: "מקצועי",
    price: "₪189",
    period: "/חודש",
    tier: "pro" as const,
    originalPrice: "₪249",
    savings: "חסכו ₪60/חודש",
    features: [
      "ביקורות ללא הגבלה",
      "רשתות חברתיות ואתר בפרופיל",
      "דאשבורד מתקדם עם אנליטיקס",
      "וידג׳טים להטמעה באתר",
      "בקשות ביקורת אוטומטיות",
      "מערכת אפיליאט מלאה — עמלה 10% על כל מכירה",
      "סיכומי AI שבועיים",
      "תמיכה בעדיפות",
    ],
    excluded: ["חיבור CRM ולידים", "Google Ads Review Stars", "דוחות AI יומיים"],
    cta: "התחילו 14 ימי ניסיון",
    highlighted: true,
  },
  {
    name: "פרימיום",
    price: "₪389",
    period: "/חודש",
    tier: "premium" as const,
    features: [
      "הכל מהמקצועי, ועוד:",
      "חיבור CRM — HubSpot, Salesforce ועוד",
      "ניהול לידים והפניות אוטומטי",
      "Webhook לכל מערכת (Zapier/Make)",
      "Google Ads Review Stars ⭐",
      "דוחות AI מתקדמים יומיים",
      "גישת API מלאה",
      "מנהל הצלחה אישי",
    ],
    excluded: [],
    cta: "שדרגו לפרימיום",
    highlighted: false,
    premium: true,
  },
];

const TRUSTED = [
  { name: "אקדמיית שיווק דיגיטלי", initials: "DMA" },
  { name: "Code Masters IL", initials: "CM" },
  { name: "בית הספר לעיצוב ת״א", initials: "DS" },
  { name: "מרכז מדעי הנתונים", initials: "DH" },
  { name: "Hebrew Tech", initials: "HT" },
  { name: "אקדמיית צמיחה", initials: "GA" },
  { name: "TechPro Academy", initials: "TP" },
  { name: "LearnX Israel", initials: "LX" },
];

const BusinessLanding = () => {
  const { user, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const toggleFeature = (title: string) => {
    setExpandedFeature(prev => prev === title ? null : title);
  };

  const handleCheckout = async (tier: "pro" | "premium") => {
    if (!user) {
      toast({ title: "יש להתחבר תחילה", variant: "destructive" });
      return;
    }
    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS[tier].price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
                  <Zap size={16} /> לבעלי עסקים
                </motion.div>
                <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
                  בנו אמון אמיתי עם{" "}
                  <span className="gradient-text glow-text">ביקורות מאומתות</span>
                </motion.h1>
                <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  הצטרפו למאות עסקים בישראל שמשתמשים ב-ReviewHub כדי לאסוף ביקורות מאומתות, לבנות מוניטין ולהגדיל מכירות.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="flex gap-3 flex-wrap">
                  {user ? (
                    <Link to="/business/dashboard">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                        לדאשבורד שלי
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/business/signup">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                        צרו חשבון בחינם
                      </Button>
                    </Link>
                  )}
                  {!user && (
                    <Link to="/business/login">
                      <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                        כבר יש לי חשבון
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
              <motion.div variants={fadeUp} custom={2} className="hidden md:block">
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

      {/* Social Proof */}
      <section className="border-y border-border/50 glass">
        <div className="container py-12">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium">חברות ועסקים שכבר סומכים על ReviewHub</p>
          <div className="flex flex-wrap justify-center gap-4">
            {TRUSTED.map((company) => (
              <div key={company.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-xs">
                  {company.initials}
                </div>
                <span className="text-xs text-foreground font-medium">{company.name}</span>
              </div>
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

      {/* Free Features */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              חינם לתמיד
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">התחילו ללא עלות</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">כל הכלים הבסיסיים שצריך כדי להתחיל לאסוף ביקורות מאומתות</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FREE_FEATURES.map(({ icon: Icon, title, desc, preview }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group cursor-pointer ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-border/50 hover:border-primary/30"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <AnimatePresence mode="wait">
                  {expandedFeature === title && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.97 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                      className="overflow-hidden"
                    >
                      <motion.img
                        src={preview}
                        alt={`תצוגה מקדימה — ${title}`}
                        className="mt-4 rounded-lg border border-border/30 w-full"
                        loading="lazy"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.2 }}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2 text-center">תצוגה מקדימה של הפיצ׳ר</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro Features — visible to all but clearly labeled */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={14} /> תוכנית מקצועי{user ? " — ₪189/חודש" : ""}
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">כלים מתקדמים לצמיחה</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">אנליטיקס, אוטומציה ואפיליאט — הכל בחבילה אחת</p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRO_FEATURES.map(({ icon: Icon, title, desc, preview }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group cursor-pointer ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-primary/20 hover:border-primary/40"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <AnimatePresence mode="wait">
                  {expandedFeature === title && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.97 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                      className="overflow-hidden"
                    >
                      <motion.img
                        src={preview}
                        alt={`תצוגה מקדימה — ${title}`}
                        className="mt-4 rounded-lg border border-border/30 w-full"
                        loading="lazy"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.2 }}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2 text-center">תצוגה מקדימה של הפיצ׳ר</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
      </section>

      {/* Premium Features — shown with lock icons */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Crown size={14} /> תוכנית פרימיום{user ? " — ₪389/חודש" : ""}
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">CRM, לידים ואינטגרציות</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">חברו את ReviewHub לכל המערכות שלכם והפכו ביקורות ללידים</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, title, desc, preview }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-xl p-6 bg-card border transition-all duration-300 group relative cursor-pointer ${
                  expandedFeature === title ? "border-primary/50 shadow-card-hover" : "border-border/50 hover:border-primary/30"
                }`}
                onClick={() => preview && toggleFeature(title)}
              >
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    <Lock size={10} /> פרימיום
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  {preview && (
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 mt-7 ${expandedFeature === title ? "rotate-180" : ""}`} />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <AnimatePresence>
                  {expandedFeature === title && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <img src={preview} alt={`תצוגה מקדימה — ${title}`} className="mt-4 rounded-lg border border-border/30 w-full" loading="lazy" />
                      <p className="text-[11px] text-muted-foreground mt-2 text-center">תצוגה מקדימה של הפיצ׳ר</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing — only visible to authenticated users */}
      {user && (
        <section className="container py-20" id="pricing">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">תוכניות ומחירים</h2>
            <p className="text-muted-foreground">בחרו את התוכנית המתאימה לעסק שלכם</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
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
                    ? "bg-card border-primary/50 shadow-card-hover relative scale-[1.03]"
                    : plan.premium
                    ? "bg-gradient-to-b from-card to-primary/5 border-primary/30 relative"
                    : "bg-card border-border/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} /> הכי פופולרי
                  </div>
                )}
                {plan.premium && (
                  <div className="absolute -top-3 right-4 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown size={12} /> הכל כולל הכל
                  </div>
                )}
                <h3 className="font-display font-bold text-xl text-foreground mb-1">{plan.name}</h3>
                <div className="mb-1">
                  {plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through ml-2">{plan.originalPrice}</span>
                  )}
                  <span className="font-display font-bold text-3xl text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.savings && (
                  <p className="text-xs text-primary font-semibold mb-3">{plan.savings}</p>
                )}
                {!plan.savings && <div className="mb-4" />}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle size={14} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.excluded.length > 0 && (
                  <ul className="space-y-1.5 mb-4 opacity-50">
                    {plan.excluded.map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                        <X size={14} className="shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.tier === "free" ? (
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={subscriptionTier === "free"}>
                    {subscriptionTier === "free" ? "✓ התוכנית הנוכחית" : plan.cta}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(plan.tier as "pro" | "premium")}
                    disabled={checkoutLoading === plan.tier || subscriptionTier === plan.tier}
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                        : plan.premium
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {subscriptionTier === plan.tier ? "✓ התוכנית הנוכחית" : checkoutLoading === plan.tier ? "טוען..." : plan.cta}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">כל התוכניות כוללות SSL, גיבוי יומי ואבטחת מידע מלאה. ביטול בכל עת.</p>
        </section>
      )}

      {/* CTA for non-authenticated — replaces pricing */}
      {!user && (
        <section className="container py-20">
          <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
            <div className="absolute inset-0 bg-primary/5 blur-3xl" />
            <div className="relative">
              <Lock size={32} className="mx-auto mb-4 text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
                רוצים לראות מחירים ולהתחיל?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                צרו חשבון עסקי בחינם כדי לראות את כל התוכניות, המחירים והפיצ'רים המתקדמים. ההרשמה לוקחת פחות מדקה.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/business/signup">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                    צרו חשבון בחינם <ArrowLeft size={16} />
                  </Button>
                </Link>
                <Link to="/business/login">
                  <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                    כבר יש לי חשבון
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA for authenticated */}
      {user && (
        <section className="container py-20">
          <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
            <div className="absolute inset-0 bg-primary/5 blur-3xl" />
            <div className="relative">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
                מוכנים לבנות אמון אמיתי?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                שדרגו את התוכנית שלכם ופתחו את כל הכלים המתקדמים.
              </p>
              <Link to="/business/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                  עברו לדאשבורד <ArrowLeft size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <BusinessFooter />
      <AIChatbot context="business" />
    </div>
  );
};

export default BusinessLanding;

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import {
  Crown, Sparkles, Check, Zap, Star, BarChart3, Link2, MessageSquare,
  Users, Code2, Brain, Webhook, Contact, HelpCircle, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    nameHe: "סטארטר",
    price: "₪0",
    period: "",
    description: "התחלה מושלמת לעסקים שרוצים לנהל ביקורות.",
    features: [
      { text: "עד 10 ביקורות בחודש", icon: MessageSquare },
      { text: "לוח בקרה בסיסי", icon: BarChart3 },
      { text: "פרופיל עסקי ציבורי", icon: Users },
      { text: "תגובה לביקורות", icon: MessageSquare },
      { text: "תמיכה קהילתית", icon: HelpCircle },
    ],
    cta: "הישארו בסטארטר",
    ctaVariant: "outline" as const,
    popular: false,
    glow: false,
    tier: "free",
  },
  {
    id: "pro",
    name: "Business Growth",
    nameHe: "צמיחה עסקית",
    price: "₪189",
    period: "/ חודש",
    description: "כל מה שצריך כדי לצמוח ולמשוך לקוחות חדשים.",
    features: [
      { text: "ביקורות ללא הגבלה", icon: Star },
      { text: "לוח אנליטיקס מלא", icon: BarChart3 },
      { text: "קישורים לרשתות חברתיות", icon: Link2 },
      { text: "ווידג׳ט ביקורות לאתר שלכם", icon: Code2 },
      { text: "בקשות ביקורת אוטומטיות", icon: Zap },
      { text: "מערכת אפיליאט", icon: Link2 },
      { text: "תמיכה בעדיפות גבוהה", icon: HelpCircle },
    ],
    cta: "שדרגו למקצועי",
    ctaVariant: "default" as const,
    popular: true,
    glow: true,
    tier: "pro",
  },
  {
    id: "premium",
    name: "Enterprise & Automation",
    nameHe: "ארגוני ואוטומציה",
    price: "₪479",
    period: "/ חודש",
    description: "הפתרון המלא — AI, אוטומציות ו-CRM.",
    features: [
      { text: "הכל מתוכנית מקצועי", icon: Sparkles },
      { text: "דוחות AI שבועיים + יומיים", icon: Brain },
      { text: "חיבור ל-6,000+ אפליקציות (Zapier/Make)", icon: Webhook },
      { text: "אינטגרציית HubSpot CRM", icon: Contact },
      { text: "סנכרון CRM אוטומטי", icon: Contact },
      { text: "ייצוא כוכבים ל-Google Ads", icon: Star },
      { text: "גישת API מלאה", icon: Code2 },
      { text: "מנהל הצלחה אישי", icon: Crown },
    ],
    cta: "עברו לפרימיום",
    ctaVariant: "default" as const,
    popular: false,
    glow: false,
    tier: "premium",
  },
];

const PricingPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const navigate = useNavigate();

  const handleUpgrade = (planId: string) => {
    if (planId === "free") {
      navigate("/business/dashboard");
      return;
    }
    setSelectedPlan(planId === "pro" ? "מקצועי" : "פרימיום");
    setShowPopup(true);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 text-xs px-3 py-1">
              <Zap size={12} className="ml-1" /> תוכניות לעסקים
            </Badge>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 leading-tight">
              בחרו את התוכנית <br className="hidden sm:block" />
              <span className="gradient-text">שתקדם את העסק שלכם</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              מביקורות ראשונות ועד אוטומציה מלאה — יש לנו תוכנית שמתאימה בדיוק לשלב שבו העסק שלכם נמצא.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="flex"
            >
              <div
                className={`relative flex flex-col w-full rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
                  plan.popular
                    ? "border-primary/40 bg-card shadow-2xl shadow-primary/10 scale-[1.02] md:scale-105 z-10"
                    : "border-border/40 bg-card shadow-card hover:border-border/60 hover:shadow-lg"
                } ${plan.glow ? "ring-1 ring-primary/20" : ""}`}
              >
                {/* Glow effect for popular plan */}
                {plan.glow && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none -z-10 blur-sm" />
                )}

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow-lg shadow-primary/30 gap-1">
                      <Star size={12} className="fill-primary-foreground" /> הפופולרי ביותר
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className={`mb-6 ${plan.popular ? "pt-2" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {plan.id === "premium" && <Crown size={18} className="text-primary" />}
                    {plan.id === "pro" && <Sparkles size={18} className="text-primary" />}
                    <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground/60 font-medium">{plan.nameHe}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`font-display font-bold ${plan.popular ? "text-5xl" : "text-4xl"} text-foreground`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{plan.description}</p>
                </div>

                {/* Divider */}
                <div className={`h-px mb-6 ${plan.popular ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent" : "bg-border/40"}`} />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map(({ text, icon: Icon }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? "bg-primary/15" : "bg-muted"
                      }`}>
                        <Check size={12} className={plan.popular ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <span className="text-sm text-foreground/80 leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    variant={plan.ctaVariant}
                    className={`w-full h-12 text-sm font-semibold gap-2 rounded-xl transition-all ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                        : plan.id === "premium"
                        ? "bg-foreground/5 text-foreground border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        : ""
                    }`}
                  >
                    {plan.id === "pro" && <Sparkles size={16} />}
                    {plan.id === "premium" && <Crown size={16} />}
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground/60 mt-10 flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={12} />
          ניתן לשדרג, לשנמך או לבטל בכל עת. ללא התחייבות.
        </motion.p>
      </section>

      {/* Popup */}
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-sm w-full mx-4 rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              מערכת התשלומים בקרוב! 🚀
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              אינטגרציית התשלומים בשלבי פיתוח אחרונים.<br />
              כדי לשדרג לתוכנית <strong className="text-foreground">{selectedPlan}</strong>, צרו קשר עם צוות התמיכה שלנו.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.open("mailto:support@reviewhub.co.il?subject=שדרוג לתוכנית " + selectedPlan, "_blank")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2"
              >
                <MessageSquare size={14} /> צרו קשר לשדרוג
              </Button>
              <button
                onClick={() => setShowPopup(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                אולי מאוחר יותר
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <BusinessFooter />
    </div>
  );
};

export default PricingPage;

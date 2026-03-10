import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingComponent, REVIEWHUB_PLANS, type BillingCycle } from "@/components/ui/pricing-card";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Zap, Star, MessageSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const navigate = useNavigate();

  const handlePlanSelect = (planId: string) => {
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
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="container relative pt-20 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 text-xs px-3 py-1">
              <Zap size={12} className="ms-1" aria-hidden="true" /> תוכניות לעסקים
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

      {/* Pricing component — cards + comparison table */}
      <PricingComponent
        plans={REVIEWHUB_PLANS}
        billingCycle={billingCycle}
        onCycleChange={setBillingCycle}
        onPlanSelect={handlePlanSelect}
        heading=""
        subheading=""
        className="pt-0"
      />

      {/* Fine print */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-muted-foreground/60 pb-16 flex items-center justify-center gap-1.5"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        ניתן לשדרג, לשנמך או לבטל בכל עת. ללא התחייבות.
      </motion.p>

      {/* ── Upgrade popup ─────────────────────────────────────────────────── */}
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-sm w-full mx-4 rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-primary" aria-hidden="true" />
            </div>
            <h2 id="upgrade-dialog-title" className="font-display font-bold text-lg text-foreground mb-2">
              מערכת התשלומים בקרוב! 🚀
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              אינטגרציית התשלומים בשלבי פיתוח אחרונים.<br />
              כדי לשדרג לתוכנית <strong className="text-foreground">{selectedPlan}</strong>, צרו קשר עם צוות התמיכה שלנו.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() =>
                  window.open(
                    `mailto:support@reviewshub.info?subject=שדרוג לתוכנית ${selectedPlan}`,
                    "_blank"
                  )
                }
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2"
              >
                <MessageSquare size={14} aria-hidden="true" /> צרו קשר לשדרוג
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

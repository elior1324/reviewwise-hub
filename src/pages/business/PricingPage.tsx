import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PricingComponent, REVIEWHUB_PLANS, type BillingCycle } from "@/components/ui/pricing-card";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Zap, ArrowLeft, BarChart3, TrendingUp, Bell, LineChart, Target, Eye,
         Tag, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Analytics features (merged from AnalyticsSolution) ────────────────────────
const ANALYTICS_FEATURES = [
  { icon: BarChart3,  title: "דאשבורד בזמן אמת",   desc: "עקבו אחר דירוגים, ביקורות חדשות, אחוזי מענה ומגמות — הכל במקום אחד." },
  { icon: TrendingUp, title: "ניתוח מגמות",          desc: "ראו כיצד הדירוג שלכם משתנה לאורך זמן וזהו נקודות שיפור ונקודות חוזק." },
  { icon: Bell,       title: "התרעות חכמות",          desc: "קבלו עדכון מיידי על ביקורת שלילית חדשה כדי לטפל בה לפני שתתפשט." },
  { icon: LineChart,  title: "דוחות שבועיים",         desc: "דוח שבועי אוטומטי עם סיכום ביצועים, ביקורות בולטות ותובנות AI." },
  { icon: Target,     title: "השוואה לתחום",           desc: "ראו כיצד הדירוג שלכם ביחס לעסקים דומים בתחום שלכם." },
  { icon: Eye,        title: "ניתוח סנטימנט",          desc: "AI מנתח את הטון של הביקורות ומזהה נושאים חוזרים — חיובי ושלילי." },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Coupon state (inside the popup) ───────────────────────────────────────
  const [couponOpen,    setCouponOpen]    = useState(false);
  const [couponCode,    setCouponCode]    = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<{
    message: string;
    billingStartsAt: string;
    durationMonths: number;
  } | null>(null);

  // ── Checkout state ─────────────────────────────────────────────────────────
  const [selectedPlanId,  setSelectedPlanId]  = useState<string>(""); // "pro" | "enterprise"
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError,   setCheckoutError]   = useState<string | null>(null);

  const handleCouponApply = async () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) { setCouponError("נא להזין קוד קופון"); return; }
    if (!user) { navigate("/auth"); return; }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("apply-coupon", {
        body: { code: trimmed },
      });
      if (fnError || !data?.success) {
        setCouponError(data?.error ?? "שגיאה בהפעלת הקופון. נסה שנית.");
        return;
      }
      setCouponSuccess({
        message:         data.message,
        billingStartsAt: data.billing_starts_at,
        durationMonths:  data.duration_months,
      });
      setCouponCode("");
    } catch {
      setCouponError("שגיאת רשת. נסה שנית.");
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Redirect to hyp payment page ──────────────────────────────────────────
  const handleCheckout = async () => {
    if (!user) {
      navigate("/business/login", { state: { from: "/business/pricing" } });
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      // priceId format: plan_{tier}_{billingCycle}
      const priceId = `plan_${selectedPlanId}_${billingCycle}`;
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (fnError) throw new Error(fnError.message ?? "שגיאת שרת");
      if (!data?.url) throw new Error("לא התקבלה כתובת תשלום. נסו שנית.");
      // Redirect browser to hyp hosted payment page
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCheckoutError(msg || "שגיאה בהפניה לתשלום. נסו שנית.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    if (planId === "free") {
      navigate("/business/dashboard");
      return;
    }
    setSelectedPlan(planId === "pro" ? "מקצועי" : "אנטרפרייז");
    setSelectedPlanId(planId); // "pro" | "enterprise"
    // Reset popup state when opening
    setCouponOpen(false);
    setCouponCode("");
    setCouponError(null);
    setCouponSuccess(null);
    setCheckoutError(null);
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

      {/* ── Analytics & Dashboard section ───────────────────────────────── */}
      <section className="container py-16 border-b border-border/40" id="analytics">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 justify-center mb-3">
            <BarChart3 size={18} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">לוח בקרה ונתונים</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-3">
            הנתונים שעוזרים לכם לצמוח
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-10 text-sm leading-relaxed">
            לוח בקרה מקיף עם כל המידע שאתם צריכים — מדירוגים ועד תובנות AI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANALYTICS_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="glass rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon size={17} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-center">
            {[
              { value: "+42%",  label: "גידול ממוצע בהמרות" },
              { value: "4.8★",  label: "דירוג ממוצע לעסקים פעילים" },
              { value: "<24h",  label: "זמן תגובה ממוצע בהתרעות" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl px-4 py-4 border border-border/40">
                <div className="text-2xl font-display font-bold text-primary mb-1">{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
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
            dir="rtl"
          >
            {couponSuccess ? (
              /* ── Coupon success screen ── */
              <div className="space-y-4">
                <CheckCircle2 size={40} className="text-green-400 mx-auto" />
                <h2 className="font-display font-bold text-lg text-foreground">הקופון הופעל!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {couponSuccess.message}
                </p>
                <div className="rounded-xl border border-green-700/40 bg-green-950/20 p-4 text-right space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">תקופת חינם</span>
                    <span className="font-semibold text-green-400">{couponSuccess.durationMonths} חודשים</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">תחילת חיוב</span>
                    <span className="font-semibold text-foreground">
                      {new Date(couponSuccess.billingStartsAt).toLocaleDateString("he-IL", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">אימייל אישור נשלח לתיבת הדואר שלך.</p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate("/business/dashboard")}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    עבור ללוח הבקרה
                  </Button>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    סגור
                  </button>
                </div>
              </div>
            ) : (
              /* ── Checkout: plan summary + proceed to payment ── */
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-primary" aria-hidden="true" />
                </div>
                <h2 id="upgrade-dialog-title" className="font-display font-bold text-lg text-foreground mb-1">
                  שדרוג לתוכנית {selectedPlan}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  חיוב {billingCycle === "annual" ? "שנתי" : "חודשי"} — ניתן לבטל בכל עת
                </p>

                {/* Free first month — universal, no coupon needed */}
                <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 mb-4 text-sm text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
                  חודש ראשון חינם — אחרי זה תשלום רגיל
                </div>

                {/* Checkout error */}
                {checkoutError && (
                  <div className="rounded-lg border border-red-700/40 bg-red-950/20 px-4 py-2 mb-3 text-xs text-red-400 text-right">
                    {checkoutError}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2"
                  >
                    {checkoutLoading
                      ? <><Loader2 size={15} className="animate-spin" /> מעביר לתשלום...</>
                      : <><Zap size={14} aria-hidden="true" /> המשך לתשלום מאובטח ₪</>
                    }
                  </Button>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={checkoutLoading}
                  >
                    אולי מאוחר יותר
                  </button>
                </div>

                {/* ── Coupon accordion ── */}
                <div className="rounded-xl border border-border/40 overflow-hidden text-right">
                  <button
                    type="button"
                    onClick={() => { setCouponOpen(o => !o); setCouponError(null); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={14} className="text-green-500" />
                      יש לך קוד קופון?
                    </span>
                    {couponOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {couponOpen && (
                    <div className="px-4 pb-4 pt-1 bg-muted/10 space-y-2">
                      <div className="flex gap-2" dir="ltr">
                        <Input
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                          onKeyDown={e => e.key === "Enter" && handleCouponApply()}
                          placeholder="RH-XXXX-XXXX"
                          className="font-mono tracking-widest uppercase bg-background border-border/60"
                          maxLength={12}
                          disabled={couponLoading}
                        />
                        <Button
                          onClick={handleCouponApply}
                          disabled={couponLoading || !couponCode.trim()}
                          className="bg-green-700 hover:bg-green-600 text-white shrink-0"
                        >
                          {couponLoading
                            ? <Loader2 size={15} className="animate-spin" />
                            : "הפעל"}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-red-400 text-xs text-right">{couponError}</p>
                      )}
                      <p className="text-xs text-muted-foreground text-right">
                        קופון מעניק 2 חודשים ב-90% הנחה (בנוסף לחודש הניסיון החינמי לכולם).
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      <BusinessFooter />
    </div>
  );
};

export default PricingPage;

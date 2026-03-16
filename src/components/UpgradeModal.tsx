import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { CheckCircle, Crown, Sparkles, Zap, Tag, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth, STRIPE_TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: "pro" | "enterprise";
  featureName?: string;
}

// NLP-optimised feature lists:
//   Pro  — benefit-oriented language + specificity bias
//   Enterprise — future pacing + identity ("שליטה מלאה")
const PLANS = [
  {
    tier: "pro" as const,
    name: "מקצועי",
    price: "₪189",
    period: "/חודש",
    icon: Sparkles,
    features: [
      "ביקורות ללא הגבלה — צמחו ללא מגבלות",
      "בקשות ביקורת אוטומטיות — כל לקוח, בזמן הנכון",
      "דאשבורד אנליטיקס בזמן אמת",
      "מערכת אפיליאט — הרוויחו מהמלצות",
      "תמיכה בעדיפות גבוהה תוך 4 שעות",
      "סיכומי AI שבועיים",
    ],
  },
  {
    tier: "enterprise" as const,
    name: "אנטרפרייז",
    price: "₪479",
    period: "/חודש",
    icon: Crown,
    features: [
      "הכל מחבילת מקצועי, ועוד:",
      "ניהול מספר עסקים ללא הגבלה",
      "דוחות AI יומיים ושבועיים מותאמים אישית",
      "חיבור CRM — HubSpot, Salesforce, Monday",
      "ניהול לידים וזיהוי לקוחות חמים אוטומטי",
      "Webhooks — Zapier, Make, n8n",
      "כוכבי ביקורות ב-Google Ads ⭐",
      "גישת API מלאה לאינטגרציות מותאמות",
      "מנהל הצלחה אישי ייעודי",
    ],
  },
];

const UpgradeModal = ({ open, onOpenChange, requiredTier = "pro", featureName }: UpgradeModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponOpen,    setCouponOpen]    = useState(false);
  const [couponCode,    setCouponCode]    = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<{
    message: string;
    billingStartsAt: string;
    durationMonths: number;
  } | null>(null);

  const handleCouponApply = async () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) { setCouponError("נא להזין קוד קופון"); return; }
    if (!user) {
      toast({ title: "יש להתחבר תחילה", variant: "destructive" });
      return;
    }
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

  const handleCheckout = async (tier: "pro" | "enterprise") => {
    if (!user) {
      toast({ title: "יש להתחבר תחילה", variant: "destructive" });
      return;
    }
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS[tier].price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-center">
            <Zap size={20} className="inline ml-2 text-primary" />
            שדרגו כדי לפתוח פיצ׳רים מתקדמים
          </DialogTitle>
          <DialogDescription className="text-center">
            {featureName
              ? `הפיצ׳ר "${featureName}" דורש חבילת ${requiredTier === "enterprise" ? "אנטרפרייז" : "מקצועי"} ומעלה.`
              : "בחרו את החבילה המתאימה לצרכים שלכם."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Coupon success screen ─────────────────────────────────────── */}
        {couponSuccess ? (
          <div className="mt-6 rounded-xl border border-green-700/50 bg-green-950/30 p-6 text-center space-y-3">
            <CheckCircle2 size={36} className="text-green-400 mx-auto" />
            <p className="text-green-300 font-semibold text-base">{couponSuccess.message}</p>
            <p className="text-sm text-muted-foreground">
              גישה חינמית ל-<strong className="text-foreground">{couponSuccess.durationMonths} חודשים</strong> הופעלה.
              החיוב יתחיל ב-<strong className="text-foreground">
                {new Date(couponSuccess.billingStartsAt).toLocaleDateString("he-IL", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </strong>.
            </p>
            <p className="text-xs text-muted-foreground">אימייל אישור נשלח לתיבת הדואר שלך.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onOpenChange(false)}
            >
              סגור
            </Button>
          </div>
        ) : (
          <>
            {/* ── Plan cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isRecommended = plan.tier === requiredTier;
                return (
                  <div
                    key={plan.tier}
                    className={`rounded-xl border p-5 transition-all ${
                      isRecommended
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    {isRecommended && (
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">⭐ מומלץ</div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={20} className={plan.tier === "enterprise" ? "text-primary" : "text-accent"} />
                      <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                    </div>
                    <div className="mb-4">
                      <span className="font-display font-bold text-3xl">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.tier === "enterprise"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                          : "bg-accent text-accent-foreground hover:bg-accent/90"
                      }`}
                      onClick={() => handleCheckout(plan.tier)}
                      disabled={!!loading}
                    >
                      {loading === plan.tier ? "טוען..." : `שדרגו ל${plan.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* ── Coupon accordion ───────────────────────────────────────── */}
            <div className="mt-5 rounded-xl border border-border/40 overflow-hidden">
              <button
                type="button"
                onClick={() => { setCouponOpen(o => !o); setCouponError(null); }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Tag size={14} className="text-green-500" />
                  יש לך קוד קופון?
                </span>
                {couponOpen
                  ? <ChevronUp size={14} />
                  : <ChevronDown size={14} />}
              </button>

              {couponOpen && (
                <div className="px-4 pb-4 pt-1 bg-muted/10 space-y-2">
                  <div className="flex gap-2" dir="ltr">
                    <Input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                      onKeyDown={e => e.key === "Enter" && handleCouponApply()}
                      placeholder="RH-XXXX-XXXX"
                      className="font-mono tracking-widest uppercase bg-background border-border/60 text-foreground placeholder:text-muted-foreground"
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
                    <p className="text-red-400 text-xs">{couponError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    הזן קוד קופון לקבלת גישה חינמית ל-3 חודשים ללא כרטיס אשראי.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;

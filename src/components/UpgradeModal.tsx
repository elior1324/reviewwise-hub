import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Crown, Sparkles, Zap } from "lucide-react";
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
      "ווידג'ט ביקורות להטמעה באתר שלכם",
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
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;

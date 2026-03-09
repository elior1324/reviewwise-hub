import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminPlanSwitcherProps {
  businessId: string;
  currentTier: string;
  onTierChanged: (newTier: string) => void;
}

const TIERS = [
  { id: "free", label: "סטארטר (Basic)", icon: Shield, color: "border-border bg-secondary text-foreground" },
  { id: "pro", label: "מקצועי (Professional)", icon: Sparkles, color: "border-accent bg-accent/10 text-accent" },
  { id: "premium", label: "פרימיום (Premium)", icon: Crown, color: "border-primary bg-primary/10 text-primary" },
] as const;

const AdminPlanSwitcher = ({ businessId, currentTier, onTierChanged }: AdminPlanSwitcherProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSwitch = async (tier: string) => {
    if (tier === currentTier || loading) return;
    setLoading(tier);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ subscription_tier: tier })
        .eq("id", businessId);

      if (error) throw error;

      onTierChanged(tier);
      toast({
        title: "✅ החבילה שונתה",
        description: `החבילה שונתה ל-${TIERS.find(t => t.id === tier)?.label}. השינויים נכנסו לתוקף מיידית.`,
      });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
    setLoading(null);
  };

  return (
    <Card className="border-dashed border-2 border-destructive/30 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-xs font-bold text-destructive uppercase tracking-wider">🔧 Admin — מחליף חבילות לבדיקה</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          שינוי החבילה ישפיע מיידית על הפיצ׳רים הזמינים בדאשבורד. שימוש לבדיקות בלבד.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map(({ id, label, icon: Icon, color }) => (
            <Button
              key={id}
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => handleSwitch(id)}
              className={`flex flex-col items-center gap-1 h-auto py-3 text-xs transition-all ${
                currentTier === id ? `${color} ring-2 ring-offset-1 ring-offset-background` : "border-border/50"
              } ${currentTier === id ? "ring-primary/50" : ""}`}
            >
              {loading === id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Icon size={16} className={currentTier === id ? "" : "text-muted-foreground"} />
              )}
              <span className={currentTier === id ? "font-bold" : "text-muted-foreground"}>
                {label.split(" (")[0]}
              </span>
              {currentTier === id && (
                <span className="text-[9px] bg-background/50 px-1.5 py-0.5 rounded-full">פעיל</span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPlanSwitcher;

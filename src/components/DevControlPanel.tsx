import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Shield, Loader2, Plus, BadgeCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionTier } from "@/contexts/AuthContext";

interface DevControlPanelProps {
  businessId: string;
  currentTier: string;
  onTierChanged: (newTier: string) => void;
  onDataChanged: () => void;
}

const TIERS = [
  { id: "free", label: "סטארטר (Basic)", icon: Shield, color: "border-border bg-secondary text-foreground" },
  { id: "pro", label: "מקצועי (Professional)", icon: Sparkles, color: "border-accent bg-accent/10 text-accent" },
  { id: "premium", label: "פרימיום (Premium)", icon: Crown, color: "border-primary bg-primary/10 text-primary" },
] as const;

const DevControlPanel = ({ businessId, currentTier, onTierChanged, onDataChanged }: DevControlPanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSwitch = async (tier: string) => {
    if (tier === currentTier || loading) return;
    setLoading("tier-" + tier);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ subscription_tier: tier })
        .eq("id", businessId);
      if (error) throw error;
      onTierChanged(tier);
      toast({
        title: "✅ החבילה שונתה",
        description: `שונה ל-${TIERS.find(t => t.id === tier)?.label}. הפיצ׳רים עודכנו מיידית.`,
      });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
    setLoading(null);
  };

  const handleAdd10Reviews = async () => {
    if (loading) return;
    setLoading("reviews");
    try {
      // Get a course for this business
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("business_id", businessId)
        .limit(1);

      if (!courses || courses.length === 0) {
        toast({ title: "שגיאה", description: "אין קורסים בעסק הזה. הוסיפו קורס קודם.", variant: "destructive" });
        setLoading(null);
        return;
      }

      const courseId = courses[0].id;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const reviews = Array.from({ length: 10 }, (_, i) => ({
        business_id: businessId,
        course_id: courseId,
        user_id: userData.user!.id,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
        text: `ביקורת בדיקה #${i + 1} — נוצרה אוטומטית לבדיקת מגבלת חבילת סטארטר.`,
        verified: false,
        anonymous: false,
      }));

      const { error } = await supabase.from("reviews").insert(reviews);
      if (error) throw error;

      toast({
        title: "🎯 10 ביקורות נוספו!",
        description: "בדקו את מגבלת הביקורות בחבילת הסטארטר.",
      });
      onDataChanged();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
    setLoading(null);
  };

  const handleToggleVerified = async () => {
    if (loading) return;
    setLoading("verified");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get last review by this user
      const { data: lastReview } = await supabase
        .from("reviews")
        .select("id, verified")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!lastReview) {
        toast({ title: "שגיאה", description: "אין ביקורות למשתמש הזה.", variant: "destructive" });
        setLoading(null);
        return;
      }

      const newStatus = !lastReview.verified;
      const { error } = await supabase
        .from("reviews")
        .update({ verified: newStatus })
        .eq("id", lastReview.id);

      if (error) throw error;

      toast({
        title: newStatus ? "✅ ביקורת אומתה!" : "❌ אימות הוסר",
        description: newStatus
          ? "🔥 המשתמש קיבל 2X נקודות! בדקו את הלידרבורד."
          : "הנקודות חושבו מחדש.",
      });
      onDataChanged();
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
          <p className="text-xs font-bold text-destructive uppercase tracking-wider">🔧 Dev Control Panel — בדיקות בלבד</p>
        </div>

        {/* Plan Switcher */}
        <p className="text-[11px] text-muted-foreground mb-2 font-semibold">החלפת חבילה</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TIERS.map(({ id, label, icon: Icon, color }) => (
            <Button
              key={id}
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => handleSwitch(id)}
              className={`flex flex-col items-center gap-1 h-auto py-3 text-xs transition-all ${
                currentTier === id ? `${color} ring-2 ring-offset-1 ring-offset-background ring-primary/50` : "border-border/50"
              }`}
            >
              {loading === "tier-" + id ? (
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

        {/* Action Buttons */}
        <p className="text-[11px] text-muted-foreground mb-2 font-semibold">פעולות בדיקה</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!!loading}
            onClick={handleAdd10Reviews}
            className="flex items-center gap-2 text-xs h-auto py-2.5"
          >
            {loading === "reviews" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            הוסף 10 ביקורות
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!!loading}
            onClick={handleToggleVerified}
            className="flex items-center gap-2 text-xs h-auto py-2.5"
          >
            {loading === "verified" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            שנה סטטוס אימות
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
          ⚠️ פאנל זה נראה רק למנהלים. שינויים משפיעים מיידית על חוויית הדאשבורד.
        </p>
      </CardContent>
    </Card>
  );
};

export default DevControlPanel;

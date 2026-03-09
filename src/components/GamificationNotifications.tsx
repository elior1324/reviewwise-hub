import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Invisible component that listens for gamification events 
 * and shows high-energy toast notifications.
 */
const GamificationNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!user || initialized) return;
    setInitialized(true);

    // Listen for new leaderboard point changes via realtime
    const channel = supabase
      .channel("gamification-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leaderboard_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldPoints = (payload.old as any)?.points || 0;
          const newPoints = (payload.new as any)?.points || 0;
          const diff = newPoints - oldPoints;

          if (diff > 100) {
            // Verified review bonus
            toast({
              title: "🔥 מאומת! קיבלת 2X נקודות!",
              description: `+${diff} נקודות נוספו לחשבונך! המשיכ/י לאמת ביקורות כדי לטפס בדירוג.`,
            });
          } else if (diff > 0) {
            toast({
              title: "⭐ נקודות חדשות!",
              description: `+${diff} נקודות! סך הנקודות שלך: ${newPoints}`,
            });
          }

          // Check proximity to prizes
          checkPrizeProximity(newPoints);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialized, toast]);

  const checkPrizeProximity = async (currentPoints: number) => {
    // Get the 3rd place threshold
    const { data: season } = await supabase
      .from("leaderboard_seasons")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!season) return;

    const { data: top3 } = await supabase
      .from("leaderboard_entries")
      .select("points")
      .eq("season_id", season.id)
      .order("points", { ascending: false })
      .limit(3);

    if (!top3 || top3.length < 3) return;

    const thirdPlace = top3[2].points;
    const gap = thirdPlace - currentPoints;

    if (gap > 0 && gap <= 50) {
      setTimeout(() => {
        toast({
          title: "🏆 כמעט שם!",
          description: `חסרות לך רק ${gap} נקודות להנחה של 15%! אמת/י ביקורת אחת נוספת!`,
        });
      }, 2000);
    }
  };

  return null;
};

export default GamificationNotifications;

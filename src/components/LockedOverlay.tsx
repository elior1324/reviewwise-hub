import { Lock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LockedOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  tier?: "pro" | "premium";
  onUpgrade?: () => void;
}

const LockedOverlay = ({ children, isLocked, tier = "premium", onUpgrade }: LockedOverlayProps) => {
  if (!isLocked) return <>{children}</>;

  const isPro = tier === "pro";

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[3px] rounded-lg" />
        <div className="relative z-20 flex flex-col items-center gap-4 p-8 rounded-xl border border-primary/20 bg-card/90 shadow-xl max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={24} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPro ? <Sparkles size={16} className="text-primary" /> : <Crown size={16} className="text-primary" />}
              <span className="text-sm font-bold text-primary font-display">
                {isPro ? "פיצ׳ר מקצועי" : "פיצ׳ר פרימיום"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isPro
                ? <>פיצ׳ר זה זמין מתוכנית מקצועי ומעלה.<br />שדרגו כדי לקבל גישה לכלים מתקדמים.</>
                : <>פיצ׳ר זה זמין למנויי תוכנית פרימיום בלבד.<br />שדרגו כדי לקבל גישה מלאה לכל הכלים המתקדמים.</>
              }
            </p>
          </div>
          <Button
            onClick={onUpgrade}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary gap-2"
          >
            {isPro ? <><Sparkles size={14} /> שדרגו למקצועי</> : <><Crown size={14} /> שדרגו לפרימיום</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LockedOverlay;

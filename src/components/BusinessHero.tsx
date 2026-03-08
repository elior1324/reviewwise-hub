import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import StarRating from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Globe, Mail, Phone, Youtube, Instagram, Linkedin, Twitter, Facebook } from "lucide-react";
import type { Business } from "@/data/mockData";
import { useRef } from "react";

// TikTok icon (not in lucide)
const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/>
  </svg>
);

interface BusinessHeroProps {
  business: Business;
}

const SOCIAL_ICONS = [
  { key: "youtube" as const, Icon: Youtube, label: "YouTube" },
  { key: "instagram" as const, Icon: Instagram, label: "Instagram" },
  { key: "tiktok" as const, Icon: TikTokIcon, label: "TikTok" },
  { key: "linkedin" as const, Icon: Linkedin, label: "LinkedIn" },
  { key: "twitter" as const, Icon: Twitter, label: "X" },
  { key: "facebook" as const, Icon: Facebook, label: "Facebook" },
];

const BusinessHero = ({ business }: BusinessHeroProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 30 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const socialLinks = business.socialLinks || {};
  const hasSocials = Object.values(socialLinks).some(Boolean);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-float" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px] animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1200,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative p-8 md:p-10 shadow-card animated-border bg-card rounded-2xl"
      >
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.07]"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, hsl(var(--primary)), transparent 60%)`
            ),
          }}
        />

        <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative shrink-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {business.logo ? (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-sm" />
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/50 bg-card">
                  <img src={business.logo} alt={business.name} className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-3 left-2 right-2 h-6 bg-primary/10 blur-xl rounded-full" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-4xl relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-transparent blur-sm" />
                <span className="relative z-10">{business.name.charAt(0)}</span>
              </div>
            )}
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <motion.h1 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="font-display font-bold text-2xl md:text-3xl text-foreground">
                {business.name}
              </motion.h1>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <Badge className="bg-trust-green-light text-trust-green border-0 gap-1">
                  <ShieldCheck size={14} /> מאומת
                </Badge>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mb-4">
              <StarRating rating={business.rating} size={20} showValue />
              <span className="text-muted-foreground text-sm">מבוסס על {business.reviewCount} ביקורות</span>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-4 max-w-2xl">
              {business.description}
            </motion.p>

            {/* Contact info */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              {business.website && (
                <a href={business.website.startsWith("http") ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Globe size={14} /> {business.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {business.email && <span className="flex items-center gap-1"><Mail size={14} /> {business.email}</span>}
              {business.phone && <span className="flex items-center gap-1"><Phone size={14} /> {business.phone}</span>}
            </motion.div>

            {/* Social links */}
            {hasSocials && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-2 flex-wrap">
                {SOCIAL_ICONS.map(({ key, Icon, label }) => {
                  const url = socialLinks[key];
                  if (!url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200"
                    >
                      <Icon size={15} />
                    </a>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessHero;

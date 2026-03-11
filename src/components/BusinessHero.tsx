import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import StarRating from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Globe, Mail, Phone, Youtube, Instagram, Linkedin, Twitter, Facebook, MessageCircle } from "lucide-react";
import type { Business } from "@/data/mockData";
import { useRef } from "react";
import { sanitizeUrl } from "@/lib/sanitize";

// TikTok icon (not in lucide)
const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/>
  </svg>
);

// Telegram icon (not in lucide)
const TelegramIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// WhatsApp icon (not in lucide)
const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface BusinessHeroProps {
  business: Business;
}

const SOCIAL_ICONS = [
  { key: "instagram" as const, Icon: Instagram, label: "Instagram" },
  { key: "whatsapp" as const, Icon: WhatsAppIcon, label: "WhatsApp" },
  { key: "facebook" as const, Icon: Facebook, label: "Facebook" },
  { key: "twitter" as const, Icon: Twitter, label: "X" },
  { key: "linkedin" as const, Icon: Linkedin, label: "LinkedIn" },
  { key: "telegram" as const, Icon: TelegramIcon, label: "Telegram" },
  { key: "youtube" as const, Icon: Youtube, label: "YouTube" },
  { key: "tiktok" as const, Icon: TikTokIcon, label: "TikTok" },
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
              {business.website && sanitizeUrl(business.website) && (
                <a href={sanitizeUrl(business.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
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
                  const raw = socialLinks[key];
                  const safeUrl = sanitizeUrl(raw);
                  if (!safeUrl) return null;
                  return (
                    <a
                      key={key}
                      href={safeUrl}
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

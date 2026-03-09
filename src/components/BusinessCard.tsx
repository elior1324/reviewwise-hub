import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";
import { ArrowLeft, Instagram, Linkedin, Twitter, Facebook } from "lucide-react";
import { motion } from "framer-motion";
import type { SocialLinks } from "@/data/mockData";

const TelegramIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SOCIAL_ICON_MAP: Record<string, { Icon: any; label: string }> = {
  instagram: { Icon: Instagram, label: "Instagram" },
  whatsapp: { Icon: WhatsAppIcon, label: "WhatsApp" },
  facebook: { Icon: Facebook, label: "Facebook" },
  twitter: { Icon: Twitter, label: "X" },
  linkedin: { Icon: Linkedin, label: "LinkedIn" },
  telegram: { Icon: TelegramIcon, label: "Telegram" },
};

interface BusinessCardProps {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  description: string;
  logo?: string;
  socialLinks?: SocialLinks;
}

const BusinessCard = ({ slug, name, category, subcategory, rating, reviewCount, description, logo, socialLinks }: BusinessCardProps) => {
  const activeSocials = socialLinks
    ? Object.entries(socialLinks).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim() !== "")
    : [];

  return (
    <Link to={`/biz/${slug}`}>
      <Card className="shadow-card hover:shadow-card-hover transition-all duration-500 group cursor-pointer h-full animated-border bg-card overflow-hidden relative">
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)" }}
        />
        <CardContent className="p-6 flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            {/* Logo with 3D float effect */}
            <motion.div
              whileHover={{ rotateY: 12, rotateX: -8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
              style={{ perspective: "600px", transformStyle: "preserve-3d" }}
            >
              {logo ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden relative group-hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] transition-shadow duration-500">
                  <img src={logo} alt={name} className="w-full h-full object-contain bg-white/5 p-1.5" />
                  {/* Shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-xl group-hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] transition-shadow duration-500">
                  {name.charAt(0)}
                </div>
              )}
            </motion.div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">{category}</span>
              {subcategory && (
                <span className="text-[10px] text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">{subcategory}</span>
              )}
            </div>
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">{name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={rating} size={14} />
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{description}</p>

          {/* Social links — only those the business owner added */}
          {activeSocials.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3" onClick={(e) => e.preventDefault()}>
              {activeSocials.map(([key, url]) => {
                const social = SOCIAL_ICON_MAP[key];
                if (!social) return null;
                const { Icon, label } = social;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-md bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200"
                  >
                    <Icon size={13} />
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
            צפו בביקורות <ArrowLeft size={14} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BusinessCard;

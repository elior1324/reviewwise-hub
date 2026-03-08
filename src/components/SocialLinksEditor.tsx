import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube, Instagram, Linkedin, Twitter, Facebook, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/>
  </svg>
);

export interface SocialLinksData {
  website?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

const SOCIAL_FIELDS = [
  { key: "website" as const, icon: Globe, label: "אתר אינטרנט", placeholder: "https://yoursite.co.il" },
  { key: "youtube" as const, icon: Youtube, label: "YouTube", placeholder: "https://youtube.com/@yourChannel" },
  { key: "instagram" as const, icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/yourProfile" },
  { key: "tiktok" as const, icon: TikTokIcon, label: "TikTok", placeholder: "https://tiktok.com/@yourProfile" },
  { key: "linkedin" as const, icon: Linkedin, label: "LinkedIn", placeholder: "https://linkedin.com/company/yourCompany" },
  { key: "twitter" as const, icon: Twitter, label: "X (Twitter)", placeholder: "https://x.com/yourProfile" },
  { key: "facebook" as const, icon: Facebook, label: "Facebook", placeholder: "https://facebook.com/yourPage" },
];

interface SocialLinksEditorProps {
  values: SocialLinksData;
  onChange: (key: keyof SocialLinksData, value: string) => void;
  locked?: boolean;
}

const SocialLinksEditor = ({ values, onChange, locked = false }: SocialLinksEditorProps) => {
  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-muted/30 p-6 text-center"
      >
        <Lock size={24} className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-display font-semibold text-foreground mb-1">קישורי רשתות חברתיות</p>
        <p className="text-sm text-muted-foreground mb-3">
          חברו את הרשתות החברתיות, אתר האינטרנט וכל הפלטפורמות שלכם לפרופיל העסקי.
        </p>
        <p className="text-xs text-primary font-medium">
          זמין בחבילת מקצועי (₪189/חו׳) ומעלה
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {SOCIAL_FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-0.5 block">{label}</Label>
            <Input
              placeholder={placeholder}
              value={values[key] || ""}
              onChange={e => onChange(key, e.target.value)}
              className="glass border-border/50 h-9 text-sm"
            />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default SocialLinksEditor;

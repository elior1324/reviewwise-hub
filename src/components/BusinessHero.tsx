import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import StarRating from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Globe, Mail, Phone, Youtube, Instagram, Linkedin, Twitter, Facebook, MessageCircle, BarChart2, Cpu, User, ExternalLink, Tag } from "lucide-react";
import type { Business } from "@/data/mockData";
import { PRICING_MODEL_LABELS } from "@/data/mockData";
import { useRef } from "react";
import { sanitizeUrl } from "@/lib/sanitize";
import { PrestigeBadge, computeEligibleBadges } from "./PrestigeBadge";

// ── Trust tier computation ───────────────────────────────────────────────────
// Verification depth indicator — based solely on verified review count.
// grade is internal only (used by PrestigeBadge); never shown in the UI.
// label is what the user sees — progressive and non-punitive.
function computeTrustGrade(_rating: number, verifiedCount: number): {
  grade: string; color: string; bgColor: string; label: string;
} {
  if (verifiedCount === 0)  return { grade: "—",  color: "text-muted-foreground", bgColor: "bg-muted/60",                          label: ""               };
  if (verifiedCount >= 20)  return { grade: "A+", color: "text-emerald-600",      bgColor: "bg-emerald-50 dark:bg-emerald-950/40", label: "אימות מעמיק"    };
  if (verifiedCount >= 10)  return { grade: "A",  color: "text-emerald-500",      bgColor: "bg-emerald-50 dark:bg-emerald-950/40", label: "אימות גבוה"     };
  if (verifiedCount >= 5)   return { grade: "B",  color: "text-blue-500",         bgColor: "bg-blue-50 dark:bg-blue-950/40",       label: "אימות מתקדם"    };
  if (verifiedCount >= 2)   return { grade: "C",  color: "text-blue-400",         bgColor: "bg-blue-50 dark:bg-blue-950/40",       label: "אימות בתהליך"   };
  return                           { grade: "D",  color: "text-primary",          bgColor: "bg-primary/10",                        label: "התחלת אימות"    };
}

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
  verifiedReviewCount?: number;
  affiliateMode?: "reviewhub_model" | "personal_affiliate" | "none";
  affiliateSlug?: string;
  personalAffiliateUrls?: string[];
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

const BusinessHero = ({ business, verifiedReviewCount, affiliateMode = "none", affiliateSlug, personalAffiliateUrls = [] }: BusinessHeroProps) => {
  const verifiedCount = verifiedReviewCount ?? business.verifiedReviewCount ?? 0;
  const grade = computeTrustGrade(business.rating, verifiedCount).grade;

  const eligibleBadges = computeEligibleBadges({
    rating: business.rating,
    verifiedCount,
    type: business.type || "",
    category: business.category || "",
  });
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
        className="relative shadow-card animated-border bg-card rounded-2xl overflow-hidden"
      >
        {/* Cover image — blended into card background */}
        {business.coverUrl && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={business.coverUrl}
              alt=""
              className="w-full h-48 sm:h-56 md:h-64 object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card from-40% via-card/90 via-65% to-card/50" />
          </div>
        )}

        <div className={`relative ${business.coverUrl ? "pt-24 sm:pt-32 md:pt-40 px-6 pb-6 md:px-8 md:pb-8" : "p-8 md:p-10"}`}
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
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2 flex-wrap">
                {/* Trust tier badge — verification depth only, no letter grade shown */}
                {(() => {
                  const t = computeTrustGrade(business.rating, verifiedCount);
                  if (verifiedCount === 0) {
                    return (
                      <span className="text-xs text-muted-foreground">
                        אין עדיין ביקורות מאומתות
                      </span>
                    );
                  }
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold ${t.bgColor} ${t.color}`}
                    >
                      <ShieldCheck size={11} aria-hidden="true" />
                      {t.label}
                    </span>
                  );
                })()}
                <Badge className="bg-trust-green-light text-trust-green border-0 gap-1">
                  <ShieldCheck size={14} /> מאומת
                </Badge>
                {business.type === "saas" && (
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px]">
                    <Cpu size={11} /> מוצר דיגיטלי
                  </Badge>
                )}
                {/* ── Tenure badge — shown when the business has been on the platform 1+ year ── */}
                {(() => {
                  if (!business.createdAt) return null;
                  const joined = new Date(business.createdAt);
                  const now = new Date();
                  const years = Math.floor((now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                  if (years < 1) return null;
                  return (
                    <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-[10px]">
                      ★ פעיל {years}+ שנים
                    </Badge>
                  );
                })()}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mb-3 flex-wrap">
              <StarRating rating={business.rating} size={20} showValue />
              <span className="text-muted-foreground text-sm">
                {business.reviewCount} ביקורות
                {verifiedCount > 0 && (
                  <> · <span className="text-primary font-medium">{verifiedCount} מאומתות</span></>
                )}
              </span>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-4 max-w-2xl">
              {business.description}
            </motion.p>

            {/* Contact info + SaaS-specific metadata */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              {business.website && sanitizeUrl(business.website) && (
                <a href={sanitizeUrl(business.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Globe size={14} /> {business.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {business.email && <span className="flex items-center gap-1"><Mail size={14} /> {business.email}</span>}
              {business.phone && <span className="flex items-center gap-1"><Phone size={14} /> {business.phone}</span>}
              {/* SaaS-specific: pricing model */}
              {business.pricingModel && (
                <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/40 text-xs">
                  {PRICING_MODEL_LABELS[business.pricingModel]}
                </span>
              )}
              {/* SaaS-specific: founder */}
              {business.founderName && (
                <span className="flex items-center gap-1 text-xs">
                  <User size={12} aria-hidden="true" /> מייסד: {business.founderName}
                </span>
              )}
            </motion.div>

            {/* ── Affiliate / purchase strip ─────────────────────────────── */}
            {affiliateMode !== "none" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex items-center gap-3 flex-wrap mt-1 mb-1"
              >
                {affiliateMode === "reviewhub_model" && affiliateSlug && (
                  <>
                    <a
                      href={`/go/${affiliateSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/40 bg-primary/8 hover:bg-primary/15 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <ExternalLink size={13} />
                      כניסה לאתר
                    </a>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-400/40 text-amber-700 dark:text-amber-400 rounded-lg px-2.5 py-1.5">
                      <Tag size={11} />
                      קוד: <code className="font-mono font-bold tracking-wider">RH5</code>
                      <span className="text-amber-600/70 dark:text-amber-400/60">· 5% הנחה</span>
                    </span>
                  </>
                )}
                {affiliateMode === "personal_affiliate" && personalAffiliateUrls.length > 0 && (() => {
                  const safe = sanitizeUrl(personalAffiliateUrls[0]);
                  if (!safe) return null;
                  return (
                    <>
                      <a
                        href={safe}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/40 bg-primary/8 hover:bg-primary/15 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <ExternalLink size={13} />
                        קנו דרך הקישור
                      </a>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-400/40 text-amber-700 dark:text-amber-400 rounded-lg px-2.5 py-1.5">
                        <Tag size={11} />
                        רכישה דרך הקישור מקנה 5% הנחה
                      </span>
                    </>
                  );
                })()}
              </motion.div>
            )}

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

          {/* ── Prestige badges — left column (desktop) / bottom strip (mobile) ── */}
          {eligibleBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="flex flex-row flex-wrap md:flex-col gap-2 md:shrink-0 md:self-center"
            >
              {eligibleBadges.map(badgeType => (
                <PrestigeBadge
                  key={badgeType}
                  type={badgeType}
                  slug={business.slug}
                  name={business.name}
                  grade={grade}
                  rating={business.rating}
                  size="sm"
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Trust stats strip ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-5 pt-4 border-t border-border/40 relative z-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-primary" />
            <strong className="text-foreground">{verifiedCount}</strong> ביקורות מאומתות
          </span>
          {business.reviewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <BarChart2 size={13} className="text-muted-foreground" />
              <strong className="text-foreground">{business.reviewCount}</strong> סך הכל
              {verifiedCount > 0 && (
                <span className="text-xs text-primary">
                  · {Math.round((verifiedCount / business.reviewCount) * 100)}% מאומת
                </span>
              )}
            </span>
          )}
          {business.pricingModel && (
            <span className="flex items-center gap-1.5">
              <Cpu size={13} className="text-primary" />
              {PRICING_MODEL_LABELS[business.pricingModel]}
            </span>
          )}
        </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default BusinessHero;

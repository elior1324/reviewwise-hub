// src/components/ReviewsMarquee.tsx
//
// Scrolling testimonial strip for ReviewHub — continuous marquee social-proof wall.
// Two rows of review cards scroll in opposite directions (LTR / RTL-neutral),
// creating a social-proof "wall of trust" effect.
//
// Props:
//   reviews     – override the built-in sample data
//   title       – section heading (default: "מה אומרים עלינו?")
//   subtitle    – section sub-heading (default: "ביקורות אמיתיות ממשתמשים מאומתים")
//   pauseOnHover – pause marquee on mouse-over (default: true)
//   speed       – "slow" | "normal" (default: "normal")
//
// Design tokens used:
//   --star / --star-empty     – star fill colours (defined in index.css)
//   --trust-green             – verified badge colour
//   --card / --border         – card surface & outline
//   --card-shadow / --card-shadow-hover

import { Star, ShieldCheck, MessageCircle, Facebook, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const SOURCE_TAG_CONFIG = {
  verified_purchase: { label: "רכישה מאומתת", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40", Icon: ShieldCheck },
  whatsapp:          { label: "WhatsApp", className: "text-green-500 bg-green-50 dark:bg-green-950/30", Icon: MessageCircle },
  facebook:          { label: "Facebook", className: "text-blue-500 bg-blue-50 dark:bg-blue-950/30", Icon: Facebook },
  website:           { label: "אתר ReviewHub", className: "text-muted-foreground bg-muted/50", Icon: Globe },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewTestimonial {
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  rating: number; // 1–5
  text: string;
  verified?: boolean;
  date?: string;
  business?: string;
  /** If provided, business name becomes a clickable link to the profile */
  businessSlug?: string;
  /** Source platform tag shown below business name */
  sourceTag?: "verified_purchase" | "whatsapp" | "facebook" | "website";
}

interface ReviewsMarqueeProps {
  reviews?: ReviewTestimonial[];
  title?: string;
  subtitle?: string;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal";
  className?: string;
}

// ─── Default showcase data — all reviews reference the real demo business ─────

const DEFAULT_REVIEWS: ReviewTestimonial[] = [
  // Row 1
  {
    author: { name: "רונן ב.", handle: "@ronenb", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "עבדתי עם מיטב דיגיטל על קמפיין Meta Ads לחנות האונליין שלי. תוך חודש ראשון הכפלנו את המכירות. הצוות מקצועי, זמין ומסביר כל שלב.",
    verified: true,
    date: "נובמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "verified_purchase",
  },
  {
    author: { name: "שירה מ.", handle: "@shira_m", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "הכינו לנו אסטרטגיית SEO מאפס — בתוך 3 חודשים עלינו לעמוד ראשון בגוגל על 4 ביטויים מרכזיים. שירות ברמה גבוהה מאוד.",
    verified: true,
    date: "ספטמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "verified_purchase",
  },
  {
    author: { name: "ג׳ולי א.", handle: "@julieA", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "שלחתי הודעה בשעה 11 בלילה עם שאלה, קיבלתי תשובה מלאה תוך 20 דקות 😮 שירות כזה לא פגשתי בשום מקום!",
    verified: true,
    date: "דצמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "whatsapp",
  },
  {
    author: { name: "נדב כ.", handle: "@nadavk", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "ניהול הסושיאל שלנו השתפר דרמטית. העמוד שלנו צמח מ-500 עוקבים ל-4,200 תוך 5 חודשים. כל הקרדיט למיטב דיגיטל.",
    verified: true,
    date: "ספטמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "verified_purchase",
  },
  {
    author: { name: "דנה פ.", handle: "@dana_p", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "שיתוף פעולה מעולה! מיטב דיגיטל הצליחו לתרגם את החזון שלנו לשפה שגוגל מבינה. המכירות עלו ב-60% תוך רבעון.",
    verified: true,
    date: "דצמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "facebook",
  },
  {
    author: { name: "מיכל ר.", handle: "@michalr", avatar: "https://images.unsplash.com/photo-1520813819077-7f2ee9e60aae?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "פגשתי את הצוות בכנס שיווקי ועברתי אליהם. הם מבינים את העסק שלי כאילו הם חלק ממנו. מאוד שמחה שעברתי.",
    verified: false,
    date: "יוני 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "website",
  },

  // Row 2
  {
    author: { name: "אמיר ד.", handle: "@amird", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "בנינו יחד את כל הנוכחות הדיגיטלית של העסק — אתר, גוגל, רשתות חברתיות. הכל עובד כמו מכונה.",
    verified: true,
    date: "יולי 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "verified_purchase",
  },
  {
    author: { name: "בועז ט.", handle: "@boazT", avatar: "https://images.unsplash.com/photo-1570295999897-c9c4c55e7839?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "הם לא רק מבצעים — הם חושבים יחד איתך. כל פגישה מסתיימת עם תוכנית ברורה וצעדים מדויקים. כבר שנה שעובד איתם.",
    verified: true,
    date: "נובמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "whatsapp",
  },
  {
    author: { name: "יעל ש.", handle: "@yaelsh", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&q=80" },
    rating: 4,
    text: "קיבלנו תוצאות טובות בקמפיינים הממומנים, הצוות מגיב מהר ומסביר בצורה ברורה. בסה\"כ ממליצה.",
    verified: true,
    date: "אוקטובר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "verified_purchase",
  },
  {
    author: { name: "אורי ג.", handle: "@urig", avatar: "https://images.unsplash.com/photo-1504257426329-14daa0f0a5e7?w=80&h=80&fit=crop&q=80" },
    rating: 5,
    text: "פשוט הכי טובים בעניין. הכי שקופים, הכי ישרים ועם הכי הרבה ידע. מחכה לפרויקט הבא.",
    verified: true,
    date: "נובמבר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "facebook",
  },
  {
    author: { name: "לינוי ה.", handle: "@linoyh", avatar: "https://images.unsplash.com/photo-1517365830279-8d4dead2e554?w=80&h=80&fit=crop&q=80" },
    rating: 4,
    text: "הצוות של מיטב עזר לי להוציא את הקמפיין הראשון שלי בפייסבוק. הכל הסתדר מהר ובלי כאב ראש.",
    verified: true,
    date: "אוקטובר 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "whatsapp",
  },
  {
    author: { name: "ורד ל.", handle: "@verdl", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&q=80" },
    rating: 4,
    text: "שירות טוב מאוד, אנשים נחמדים ומקצועיים. לוקח קצת זמן עד שהתוצאות מגיעות אבל שווה להמתין.",
    verified: false,
    date: "מאי 2025",
    business: "מיטב דיגיטל",
    businessSlug: "mitav-digital",
    sourceTag: "website",
  },
];

// ─── Star rating sub-component ────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`דירוג ${rating} מתוך 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? "fill-star text-star"
              : "fill-star-empty text-star-empty opacity-30"
          }
        />
      ))}
    </div>
  );
}

// ─── Single testimonial card ───────────────────────────────────────────────────

function TestimonialCard({ review }: { review: ReviewTestimonial }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex-shrink-0 w-72 rounded-2xl p-5 mx-3",
        "border border-border/40 bg-card",
        "shadow-card hover:shadow-card-hover hover:border-primary/30",
        "transition-colors duration-300 cursor-default select-none",
      )}
    >
      {/* Top: stars + verified badge */}
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} />
        {review.verified && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-trust-green shrink-0">
            <ShieldCheck size={12} strokeWidth={2.5} />
            מאומת
          </span>
        )}
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 mb-3 font-body">
        {review.text}
      </p>

      {/* Business tag — clickable link if businessSlug is provided */}
      {review.business && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {review.businessSlug ? (
            <Link
              to={`/business/${review.businessSlug}`}
              className="text-[11px] text-primary/80 font-semibold hover:text-primary transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              ★ {review.business}
            </Link>
          ) : (
            <p className="text-[11px] text-primary/70 font-medium truncate">★ {review.business}</p>
          )}
          {review.sourceTag && (() => {
            const cfg = SOURCE_TAG_CONFIG[review.sourceTag];
            return (
              <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.className}`}>
                <cfg.Icon size={9} />
                {cfg.label}
              </span>
            );
          })()}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/30 pt-3">
        <div className="flex items-center gap-2.5">
          <img
            src={review.author.avatar}
            alt={review.author.name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-border/50 bg-muted flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              // Fallback to initials-based colour block on load failure
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate font-display">
              {review.author.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {review.author.handle}
            </p>
          </div>
          {review.date && (
            <p className="text-[11px] text-muted-foreground/60 flex-shrink-0">
              {review.date}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Marquee row ──────────────────────────────────────────────────────────────

interface MarqueeRowProps {
  reviews: ReviewTestimonial[];
  reverse?: boolean;
  pauseOnHover?: boolean;
  animClass: string;
}

function MarqueeRow({
  reviews,
  reverse = false,
  pauseOnHover = true,
  animClass,
}: MarqueeRowProps) {
  // Duplicate for seamless loop
  const items = [...reviews, ...reviews];

  return (
    <div
      className="overflow-hidden w-full"
      dir="ltr" // force LTR scroll direction for visual consistency
    >
      <div
        className={cn(
          "flex w-max",
          animClass,
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{ direction: "rtl" }} // keep text RTL inside each card
      >
        {items.map((review, idx) => (
          <TestimonialCard key={`${review.author.handle}-${idx}`} review={review} />
        ))}
      </div>
    </div>
  );
}

// ─── Section fade-in animation ────────────────────────────────────────────────

const sectionFade = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReviewsMarquee({
  reviews,
  title = "מה אומרים עלינו?",
  subtitle = "ביקורות אמיתיות ממשתמשים מאומתים",
  pauseOnHover = true,
  speed = "normal",
  className,
}: ReviewsMarqueeProps) {
  const allReviews = reviews ?? DEFAULT_REVIEWS;

  // Split into two rows of equal size; if odd total, first row gets extra
  const mid = Math.ceil(allReviews.length / 2);
  const row1 = allReviews.slice(0, mid);
  const row2 = allReviews.slice(mid);

  const fwdAnim = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";
  const revAnim =
    speed === "slow" ? "animate-marquee-reverse-slow" : "animate-marquee-reverse";

  return (
    <section className={cn("py-16 md:py-20 overflow-hidden", className)}>
      {/* Gradient edge fades */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 md:w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 md:w-32 bg-gradient-to-l from-background to-transparent" />

        {/* Heading */}
        <motion.div
          className="container mb-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={sectionFade}
        >
          {/* Trust badge row */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={20}
                  className="fill-star text-star"
                />
              ))}
            </span>
            <span className="text-sm font-semibold text-foreground">
              4.9 / 5
            </span>
            <span className="text-xs text-muted-foreground">
              מבוסס על ביקורות מאומתות
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Row 1 — scrolls right to left */}
        <div className="mb-4">
          <MarqueeRow
            reviews={row1}
            reverse={false}
            pauseOnHover={pauseOnHover}
            animClass={fwdAnim}
          />
        </div>

        {/* Row 2 — scrolls left to right */}
        {row2.length > 0 && (
          <MarqueeRow
            reviews={row2}
            reverse={true}
            pauseOnHover={pauseOnHover}
            animClass={revAnim}
          />
        )}
      </div>
    </section>
  );
}

export default ReviewsMarquee;

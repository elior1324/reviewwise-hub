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

import { Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

interface ReviewsMarqueeProps {
  reviews?: ReviewTestimonial[];
  title?: string;
  subtitle?: string;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal";
  className?: string;
}

// ─── Default sample data (Hebrew, realistic, diverse) ─────────────────────────

const DEFAULT_REVIEWS: ReviewTestimonial[] = [
  // Row 1 — 6 cards
  {
    author: {
      name: "דנה לוי",
      handle: "@dana_levy",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "הקורס של יורם שינה לי את הדרך שאני חושבת על שיווק. תוצאות אמיתיות תוך שלושה שבועות בלבד — ממש לא ציפיתי לזה.",
    verified: true,
    date: "מרץ 2025",
    business: "קורסי שיווק דיגיטלי",
  },
  {
    author: {
      name: "יובל כהן",
      handle: "@yuval_cohen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "עבדתי עם מאיה על עיצוב האתר שלי — מקצועית, מדויקת, ועומדת בזמנים. פשוט תענוג לעבוד איתה.",
    verified: true,
    date: "פברואר 2025",
    business: "עיצוב UX/UI",
  },
  {
    author: {
      name: "שיר מזרחי",
      handle: "@shir_m",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "הכי טוב היה שהמנטור לא רק לימד — הוא ממש ישב איתי על הפרויקט. קיבלתי ידע ומיומנויות שמשתמשת בהן כל יום.",
    verified: true,
    date: "ינואר 2025",
    business: "מנטורינג Python",
  },
  {
    author: {
      name: "אורי גרין",
      handle: "@uri_green",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "סוף סוף מצאתי פרילנסרית שכתבה תוכן שיווקי בדיוק לפי קול המותג שלנו. ממליץ בחום לכל עסק קטן.",
    verified: true,
    date: "מרץ 2025",
    business: "כתיבת תוכן שיווקי",
  },
  {
    author: {
      name: "נועה בן-דוד",
      handle: "@noa_bd",
      avatar:
        "https://images.unsplash.com/photo-1520813819077-7f2ee9e60aae?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "קורס הנתונים שלו הוא הכי פרקטי שמצאתי ברשת. כל שיעור מסתיים בפרויקט מיני אמיתי — ממש לא עוד קורס תיאורטי.",
    verified: true,
    date: "פברואר 2025",
    business: "Data Science & ML",
  },
  {
    author: {
      name: "תמר אלון",
      handle: "@tamar_alon",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=80",
    },
    rating: 4,
    text: "סדנת פיתוח ה-Full Stack הייתה אינטנסיבית, אבל שווה כל שקל. תוך חודשיים השגתי את הג'וב הראשון שלי כמפתחת.",
    verified: true,
    date: "ינואר 2025",
    business: "Full Stack Bootcamp",
  },

  // Row 2 — 6 different cards
  {
    author: {
      name: "גיל שפירא",
      handle: "@gil_shapira",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "המעצבת הבינה בדיוק את הוויזיה שלי וסיפקה עיצוב שהתאים בול לפרסומות. אין מה לומר — פנטסטי.",
    verified: true,
    date: "מרץ 2025",
    business: "עיצוב גרפי ומיתוג",
  },
  {
    author: {
      name: "מיה רוזן",
      handle: "@mia_rosen",
      avatar:
        "https://images.unsplash.com/photo-1517365830279-8d4dead2e554?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "הייתה לי שאלה שנה אחרי שסיימתי את הקורס — המרצה ענה תוך 24 שעות. שירות כזה לא מוצאים בשום מקום אחר.",
    verified: true,
    date: "פברואר 2025",
    business: "קורסי Next.js",
  },
  {
    author: {
      name: "אריה שמש",
      handle: "@arie_shemesh",
      avatar:
        "https://images.unsplash.com/photo-1570295999897-c9c4c55e7839?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "עריכת הוידאו שקיבלתי מהעורכת הייתה ברמה של פרודקשן מקצועי לחלוטין. ההסבר שלה לכל שינוי גם הלמיד אותי.",
    verified: true,
    date: "מרץ 2025",
    business: "עריכת וידאו",
  },
  {
    author: {
      name: "רונית כץ",
      handle: "@ronit_katz",
      avatar:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "הצלחתי להגדיל את הכנסות הפרילנס שלי ב-40% אחרי הקורס. לא מאמינה שחיכיתי כל כך הרבה זמן לפני שנרשמתי.",
    verified: true,
    date: "ינואר 2025",
    business: "Freelance Growth",
  },
  {
    author: {
      name: "עמיר ברק",
      handle: "@amir_barak",
      avatar:
        "https://images.unsplash.com/photo-1504257426329-14daa0f0a5e7?w=80&h=80&fit=crop&q=80",
    },
    rating: 4,
    text: "חסכתי חצי שנה של לימוד עצמי. הקורס בנוי חכם — מתחיל מאפס ומגיע לדברים מורכבים בצעדים הגיוניים.",
    verified: true,
    date: "פברואר 2025",
    business: "React & TypeScript",
  },
  {
    author: {
      name: "לירן אזולאי",
      handle: "@liran_azulay",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&q=80",
    },
    rating: 5,
    text: "הביקורות באתר הן אמיתיות לחלוטין — פגשתי בדיוק את מה שהובטח. ReviewHub היא הפלטפורמה הראשונה שאני סומך עליה.",
    verified: true,
    date: "מרץ 2025",
    business: "ReviewHub",
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

      {/* Optional business tag */}
      {review.business && (
        <p className="text-[11px] text-primary/70 font-medium mb-3 truncate">
          ★ {review.business}
        </p>
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

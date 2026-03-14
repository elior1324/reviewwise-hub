/**
 * PrestigeBadgesPage.tsx
 *
 * Unified "trust tools for your website" page — combines:
 *   Tab A: תגי פרסטיז'  — static prestige trust marks (earned by TrustScore grade)
 *   Tab B: ווידג'טים    — live embeddable review widgets (iframe / script)
 *
 * Route: /partners/prestige-badges
 * Direct widget deep-link: /partners/prestige-badges?tab=widgets
 *
 * Personalisation:
 *   When a business owner is logged in, the embed code is automatically
 *   pre-filled with their business slug — no manual editing needed.
 *   The live preview updates to show their own business name, rating and
 *   review count so they see exactly what visitors will see on their site.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Copy, CheckCheck, ExternalLink,
  ArrowLeft, Award, Link2, BarChart2,
  Layers, Minimize2, PanelRight, Star, Code2,
  Layout, Monitor, Zap, UserCheck, LogIn, AlertCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import { TrustWidget, FixedMiniBadge } from "@/components/TrustWidget";
import type { TrustWidgetProps } from "@/components/TrustWidget";
import {
  PrestigeBadge,
  buildBadgeEmbedCode,
  BADGE_CONFIG,
  computeEligibleBadges,
  type PrestigeBadgeType,
} from "@/components/PrestigeBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerBusiness {
  id:                string;
  slug:              string;
  name:              string;
  rating:            number | null;
  review_count:      number | null;
  category:          string;
  verified:          boolean | null;
  subscription_tier: string;
  logo_url:          string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: fetch the business that belongs to the currently logged-in user
// ─────────────────────────────────────────────────────────────────────────────

function useOwnerBusiness() {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<OwnerBusiness | null>(null);
  const [bLoading, setBLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      return;
    }
    setBLoading(true);
    supabase
      .from("businesses")
      .select("id, slug, name, rating, review_count, category, verified, subscription_tier, logo_url")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setBusiness((data as OwnerBusiness | null) ?? null);
        setBLoading(false);
      });
  }, [user?.id]);

  return { user, authLoading, business, bLoading };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: compute trust grade from aggregate numbers
// ─────────────────────────────────────────────────────────────────────────────

function computeGrade(rating: number | null, reviewCount: number | null): string {
  const r = rating    ?? 0;
  const c = reviewCount ?? 0;
  if (r >= 4.7 && c >= 10) return "A+";
  if (r >= 4.3 && c >= 5)  return "A";
  if (r >= 3.8 && c >= 1)  return "B";
  if (r >= 3.0)             return "C";
  if (r >= 2.0)             return "D";
  return "F";
}

const SAAS_CATS = ["כלי AI", "כלי שיווק", "אוטומציה", "כלי פיתוח", "No-code", "פרודקטיביטי", "תוכנה עסקית", "כלי סטארטאפ"];

// ─────────────────────────────────────────────────────────────────────────────
// AccountStatusBanner
// ─────────────────────────────────────────────────────────────────────────────

interface AccountStatusBannerProps {
  user:        ReturnType<typeof useOwnerBusiness>["user"];
  authLoading: boolean;
  business:    OwnerBusiness | null;
  bLoading:    boolean;
}

function AccountStatusBanner({ user, authLoading, business, bLoading }: AccountStatusBannerProps) {
  if (authLoading || bLoading) return null;

  // Logged in + has business — green banner
  if (user && business) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-4 mb-6"
      >
        <div className="mx-auto max-w-3xl flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 shrink-0">
            <UserCheck size={15} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300 leading-snug">
              מחובר לחשבון: <span className="text-white">{business.name}</span>
            </p>
            <p className="text-xs text-emerald-400/60 mt-0.5">
              קוד ההטמעה מוגדר אוטומטית לעסק שלכם — אין צורך לערוך אותו
            </p>
          </div>
          <Link
            to={`/biz/${business.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-emerald-400/60 hover:text-emerald-300 transition-colors shrink-0"
          >
            <span>פרופיל</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Logged in but no business yet
  if (user && !business) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-4 mb-6"
      >
        <div className="mx-auto max-w-3xl flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/8">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300/80 flex-1">
            פרופיל עסקי עדיין לא נוצר — קוד ההטמעה מוצג לדוגמה בלבד.{" "}
            <Link to="/business/signup" className="underline underline-offset-2 font-medium hover:text-amber-200">
              צרו פרופיל עסקי ←
            </Link>
          </p>
        </div>
      </motion.div>
    );
  }

  // Not logged in
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-4 mb-6"
    >
      <div className="mx-auto max-w-3xl flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-white/10 bg-white/3">
        <LogIn size={15} className="text-white/40 shrink-0" />
        <p className="text-sm text-white/50 flex-1">
          כדי לקבל קוד הטמעה מותאם אישית לעסק שלכם —{" "}
          <Link to="/business/login" className="text-primary/80 hover:text-primary underline underline-offset-2 font-medium">
            כניסה לחשבון
          </Link>
          {" "}או{" "}
          <Link to="/business/signup" className="text-primary/80 hover:text-primary underline underline-offset-2 font-medium">
            רישום חינם
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/6 hover:bg-white/10 text-white/60 hover:text-white transition-all"
    >
      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copied ? "הועתק!" : "העתק קוד"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB A: PRESTIGE BADGES ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CATALOGUE: Array<{
  type: PrestigeBadgeType;
  eligibility: string;
  criteria: string[];
  who: string;
}> = [
  {
    type: "verified",
    eligibility: "כל עסק עם ביקורת מאומתת אחת לפחות",
    criteria: [
      "נמצא במאגר ReviewHub",
      "לפחות ביקורת אחת עם הוכחת רכישה",
      "לא פעיל נגד כללי הקהילה",
    ],
    who: "מיועד לכל ישות דיגיטלית — כלי SaaS, מומחה דיגיטלי או ספק חינוך — שכבר קיבל ביקורת מאומתת ראשונה.",
  },
  {
    type: "highly-trusted",
    eligibility: "ציון אמון A או A+ — חמש ביקורות מאומתות ומעלה",
    criteria: [
      "דירוג ממוצע ≥ 4.3",
      "לפחות 5 ביקורות מאומתות (Tier-1)",
      "ציון אמון = A או A+ בחישוב ReviewHub",
    ],
    who: "ניתן לעסקים עם היסטוריית ביקורות מוכחת — אומת מול מערכות תשלום, לא הצהרה עצמית.",
  },
  {
    type: "top-saas",
    eligibility: "Top Trusted SaaS in Israel — מוצר SaaS מדורג A/A+",
    criteria: [
      "סוג הישות: SaaS / מוצר דיגיטלי",
      "מייסד / חברה ישראלית",
      "ציון אמון = A+ (עשר ביקורות מאומתות ומעלה, דירוג ≥ 4.7)",
    ],
    who: "תג עילית לכלי SaaS ישראליים שהוכיחו אמינות גבוהה. מוצג ב-ReviewHub SaaS Registry ומשמש כתג מוצר.",
  },
  {
    type: "top-ai-tool",
    eligibility: "Top AI Tool — כלי AI מדורג A/A+",
    criteria: [
      "קטגוריה: כלי AI",
      "ציון אמון = A+ (עשר ביקורות מאומתות ומעלה, דירוג ≥ 4.7)",
      "פעיל בשוק לפחות 6 חודשים",
    ],
    who: "תג מיוחד לכלי AI ישראליים. בעידן ה-AI Hype — תג שמבוסס על ביקורות מאומתות שווה יותר.",
  },
];

interface BadgeCardProps {
  item:         typeof BADGE_CATALOGUE[0];
  ownerBusiness: OwnerBusiness | null;
}

function BadgeCard({ item, ownerBusiness }: BadgeCardProps) {
  const [open, setOpen] = useState(false);
  const cfg = BADGE_CONFIG[item.type];

  // Use owner's real data if available, otherwise show demo
  const slug   = ownerBusiness?.slug  ?? "your-business-slug";
  const grade  = ownerBusiness
    ? computeGrade(ownerBusiness.rating, ownerBusiness.review_count)
    : (item.type === "verified" ? "B" : "A+");
  const rating = ownerBusiness?.rating ?? (item.type === "verified" ? 3.9 : 4.8);
  const name   = ownerBusiness?.name  ?? "Your Business";

  const snippet = buildBadgeEmbedCode(item.type, slug, grade);
  const isPersonalised = !!ownerBusiness;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${cfg.accent}30`, background: `linear-gradient(160deg, ${cfg.accentBg}90, hsl(0 0% 6%))` }}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="mb-5">
          <p className="text-xs font-medium mb-1" style={{ color: `${cfg.accent}90` }}>{item.eligibility}</p>
          <h3 className="text-lg font-bold text-white">{cfg.label}</h3>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">{cfg.sublabel}</p>
        </div>
        <div className="flex items-center justify-center py-6 rounded-xl border" style={{ background: "hsl(0 0% 8%)", borderColor: "hsl(0 0% 12%)" }}>
          <PrestigeBadge type={item.type} slug={slug} name={name} grade={grade} rating={rating} size="md" noLink />
        </div>
      </div>

      <div className="px-6 pb-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">תנאי זכאות</p>
        <ul className="space-y-1.5">
          {item.criteria.map(c => (
            <li key={c} className="flex items-start gap-2 text-xs text-white/60">
              <ShieldCheck size={11} className="shrink-0 mt-0.5" style={{ color: cfg.accent }} />
              {c}
            </li>
          ))}
        </ul>
        <p className="text-xs text-white/35 leading-relaxed mt-3">{item.who}</p>
      </div>

      <div className="px-6 pb-6">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-xs font-medium transition-colors" style={{ color: open ? cfg.accent : `${cfg.accent}70` }}>
          <Link2 size={12} />
          {open ? "הסתר קוד הטמעה" : "הצג קוד הטמעה"}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden mt-3">
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-white/3">
                  <span className="text-[10px] font-mono text-white/30">embed.html</span>
                  <CopyButton text={snippet} />
                </div>
                <pre className="p-4 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap" style={{ color: `${cfg.accent}cc`, background: "hsl(0 0% 5%)" }}>
                  <code>{snippet}</code>
                </pre>
              </div>
              {isPersonalised ? (
                <p className="text-[10px] text-emerald-400/60 mt-2 flex items-center gap-1.5">
                  <UserCheck size={10} />
                  הקוד כבר מוגדר לעסק שלכם — הדביקו ישירות באתר
                </p>
              ) : (
                <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                  החליפו <code className="text-white/50">your-business-slug</code> בכתובת הפרופיל שלכם ב-ReviewHub.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const HOW_STEPS = [
  { num: "01", title: "הכנסו למאגר", body: "רשמו את העסק שלכם ב-ReviewHub והתחילו לאסוף ביקורות מאומתות מלקוחות ששילמו בפועל.", icon: ShieldCheck },
  { num: "02", title: "צברו ציון אמון", body: "ככל שאספתם יותר ביקורות מאומתות עם ציון גבוה, הציון שלכם עולה — ופותחים תגי יוקרה גבוהים יותר.", icon: BarChart2 },
  { num: "03", title: "הטמיעו את התג", body: "העתיקו את קוד ה-HTML, הדביקו באתר שלכם. הלינק מתחת לתג מוביל חזרה לפרופיל האמון שלכם — ומייצר לכם backlink.", icon: Link2 },
];

interface BadgesTabProps {
  ownerBusiness: OwnerBusiness | null;
}

function BadgesTab({ ownerBusiness }: BadgesTabProps) {
  // Show which badges the owner has actually earned
  const earnedBadges = useMemo(() => {
    if (!ownerBusiness) return [] as PrestigeBadgeType[];
    return computeEligibleBadges({
      rating:        ownerBusiness.rating ?? 0,
      verifiedCount: ownerBusiness.review_count ?? 0,
      type:          SAAS_CATS.includes(ownerBusiness.category) ? "saas" : "other",
      category:      ownerBusiness.category,
    });
  }, [ownerBusiness]);

  return (
    <div className="space-y-20">
      {/* Earned badges highlight (only when owner is connected) */}
      {ownerBusiness && earnedBadges.length > 0 && (
        <section className="px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={15} className="text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-300">
                  {ownerBusiness.name} — תגים שהרווחתם
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map(type => (
                  <PrestigeBadge
                    key={type}
                    type={type}
                    slug={ownerBusiness.slug}
                    name={ownerBusiness.name}
                    grade={computeGrade(ownerBusiness.rating, ownerBusiness.review_count)}
                    rating={ownerBusiness.rating ?? 0}
                    size="sm"
                    noLink
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Badge gallery */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">ארבעת תגי הפרסטיז׳</h2>
            <p className="text-sm text-white/40 max-w-lg mx-auto">כל תג מבוסס על נתונים אמיתיים — ניתן לאימות בלחיצה. ככל שהציון גבוה יותר, כך התג מרשים יותר.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BADGE_CATALOGUE.map(item => (
              <BadgeCard key={item.type} item={item} ownerBusiness={ownerBusiness} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">איך זה עובד</h2>
            <p className="text-sm text-white/40">שלושה שלבים מהרישום להצגת התג</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }} className="flex flex-col gap-4 p-6 rounded-2xl border border-white/8 bg-white/3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center"><Icon size={18} className="text-primary" /></div>
                    <span className="text-3xl font-black text-white/8">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1.5">{step.title}</h3>
                    <p className="text-xs text-white/45 leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Distribution loop */}
      <section className="px-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-violet-500/20 p-8 md:p-10" style={{ background: "linear-gradient(135deg, hsl(270 40% 8%), hsl(0 0% 6%))" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25"><Link2 size={18} className="text-violet-400" /></div>
              <h2 className="text-xl font-bold text-white">לולאת הפצה — Trust Distribution Loop</h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">כל תג שמוטמע באתר של עסק מכיל לינק חזרה לפרופיל האמון שלו ב-ReviewHub. כך נוצרת לולאה שמחזקת את שני הצדדים:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: "🏢", title: "ליזמים", body: "תגי האמון מגבירים המרות — לקוחות רואים הוכחה חיצונית ניטרלית, לא שיווק עצמי." },
                { icon: "👥", title: "ללקוחות", body: "לחיצה על התג מובילה לפרופיל שניתן לאמת בעצמאות — ביקורות אמיתיות, נוסחה פתוחה." },
                { icon: "🔗", title: "ל-ReviewHub", body: "כל הטמעה מייצרת backlink איכותי ומגדילה את סמכות הפלטפורמה — ללא תשלום פרסומי." },
              ].map(p => (
                <div key={p.title} className="rounded-xl border border-white/8 bg-white/3 p-4">
                  <span className="text-2xl mb-3 block">{p.icon}</span>
                  <p className="font-semibold text-white/80 text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 leading-relaxed border-t border-white/8 pt-5">
              חשוב: תגי הפרסטיז׳ אינם למכירה ואינם ניתנים לרכישה. ציון האמון מחושב אוטומטית — בעל עסק לא יכול לשנות אותו על ידי תשלום.
              <Link to="/about" className="text-violet-400/70 hover:text-violet-400 underline underline-offset-2 mr-1">קראו את המתודולוגיה המלאה ←</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Size variants */}
      <section className="px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-bold text-white text-center mb-8">גדלים זמינים</h2>
          <div className="rounded-2xl border border-white/8 bg-white/2 p-8 flex flex-col gap-6 items-center">
            {(["sm", "md", "lg"] as const).map(sz => (
              <div key={sz} className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{sz.toUpperCase()}</p>
                <PrestigeBadge
                  type="highly-trusted"
                  slug={ownerBusiness?.slug ?? "demo"}
                  name={ownerBusiness?.name ?? "Demo Business"}
                  grade={ownerBusiness ? computeGrade(ownerBusiness.rating, ownerBusiness.review_count) : "A+"}
                  rating={ownerBusiness?.rating ?? 4.9}
                  size={sz}
                  noLink
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB B: LIVE WIDGETS ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** Fallback demo data used when no owner business is available */
const DEMO_WIDGET_PROPS: Omit<TrustWidgetProps, "variant"> = {
  businessName: "אקדמיה לשיווק דיגיטלי",
  slug:         "demo",
  rating:       4.8,
  reviewCount:  318,
  profileUrl:   "#",
  reviews: [
    { id: "d1", rating: 5, text: "הקורס שינה לי את הדרך שבה אני מסתכל על שיווק. כלים מעשיים שאני משתמש בהם כבר ביום הראשון.", reviewerName: "שרה ל.", anonymous: false, verified: true, courseName: "שיווק דיגיטלי מאסטרקלאס", date: "5 במרץ 2026" },
    { id: "d2", rating: 5, text: "המרצה מסביר בצורה ברורה ומעניינת, הדוגמאות מהעולם האמיתי עוזרות להבין כל מושג.", reviewerName: "דני א.", anonymous: false, verified: true, courseName: "יסודות SEO", date: "28 בפברואר 2026" },
    { id: "d3", rating: 5, text: "ממליץ בחום! קורס מקצועי ומקיף. שווה כל שקל.", reviewerName: "מיכל כ.", anonymous: false, verified: true, courseName: "Google Ads מוסמך", date: "20 בפברואר 2026" },
    { id: "d4", rating: 4, text: "תוכן מעולה ועדכני. קצת קשה להתחיל למתחילים אבל ברגע שנכנסים לקצב זה מדהים.", reviewerName: "יוסי מ.", anonymous: false, verified: false, courseName: "אנליטיקס מתקדם", date: "14 בפברואר 2026" },
    { id: "d5", rating: 5, text: "לא ציפיתי שאלמד כל כך הרבה. כבר הרגשתי את ההבדל אחרי השיעור הראשון.", reviewerName: "נועה ב.", anonymous: false, verified: true, courseName: "TikTok לעסקים", date: "8 בפברואר 2026" },
    { id: "d6", rating: 5, text: "קורס מצוין, שינה את הדרך שאני מנהל את הקמפיינים שלי. תודה!", reviewerName: "אנונימי", anonymous: true, verified: true, courseName: "שיווק דיגיטלי מאסטרקלאס", date: "1 בפברואר 2026" },
  ],
};

const WIDGET_VARIANTS = [
  { id: "full"    as const, label: "קרוסלה מלאה", icon: Layers,    desc: "ווידג׳ט רחב ל-Hero Section ולדפי נחיתה" },
  { id: "mini"    as const, label: "תג מינימלי",   icon: Minimize2, desc: "תג קומפקטי לסרגל הניווט או לכותרת" },
  { id: "sidebar" as const, label: "עמודת צד",     icon: PanelRight, desc: "רשימה אנכית מפורטת לסידבר או ל-Sticky panel" },
];

const WIDGET_FEATURES = [
  { icon: "⚡", title: "עדכון בזמן אמת",    body: "ביקורות חדשות מופיעות אוטומטית — ללא עדכוני קוד." },
  { icon: "🔒", title: "ביקורות מאומתות",  body: "רק לקוחות שרכשו בפועל יכולים לכתוב ביקורת." },
  { icon: "📱", title: "100% רספונסיבי",    body: "נראה מושלם בדסקטופ, טאבלט ומובייל." },
  { icon: "🌙", title: "Dark Mode מובנה",  body: "מתאים אוטומטית לערכת הנושא של האתר." },
  { icon: "🚀", title: "טעינה מהירה",       body: "Lazy load אסינכרוני — אפס השפעה על ה-Core Web Vitals." },
  { icon: "🌐", title: "SEO Schema",         body: "כולל AggregateRating JSON-LD לשיפור הציון בגוגל." },
];

function buildEmbedSnippet(slug: string, variant: "full" | "mini" | "sidebar") {
  const base   = "https://reviewhub.co.il";
  const width  = variant === "sidebar" ? "320" : variant === "mini" ? "280" : "100%";
  const height = variant === "sidebar" ? "520" : variant === "mini" ? "68"  : "224";

  // allow="popups" lets target="_blank" links inside the iframe open a new
  // browser tab pointing to reviewhub.co.il/biz/{slug} — the business profile.
  return `<!-- ReviewHub Widget (${variant}) -->
<!-- לחיצה על הווידג'ט תפתח את דף הביקורות של העסק ב-ReviewHub -->
<iframe
  src="${base}/widget/${slug}?v=${variant}"
  width="${width}"
  height="${height}"
  frameborder="0"
  scrolling="no"
  allow="popups"
  title="ReviewHub — ביקורות מאומתות של ${slug}"
  style="border:none;overflow:hidden;border-radius:16px;"
></iframe>`;
}

interface WidgetsTabProps {
  ownerBusiness: OwnerBusiness | null;
}

function WidgetsTab({ ownerBusiness }: WidgetsTabProps) {
  const [activeVariant, setActiveVariant] = useState<"full" | "mini" | "sidebar">("full");
  const [showFixed, setShowFixed] = useState(false);

  // Use real slug in embed code when owner is connected
  const embedSlug = ownerBusiness?.slug ?? "your-business-slug";
  const isPersonalised = !!ownerBusiness;
  const snippet = buildEmbedSnippet(embedSlug, activeVariant);

  // Widget preview: real metadata when available, demo reviews as placeholder
  const previewProps: Omit<TrustWidgetProps, "variant"> = ownerBusiness
    ? {
        businessName: ownerBusiness.name,
        slug:         ownerBusiness.slug,
        rating:       ownerBusiness.rating    ?? 0,
        reviewCount:  ownerBusiness.review_count ?? 0,
        profileUrl:   `/biz/${ownerBusiness.slug}`,
        reviews:      DEMO_WIDGET_PROPS.reviews, // demo review cards (real ones load via iframe on their site)
      }
    : DEMO_WIDGET_PROPS;

  return (
    <div className="space-y-16">

      {/* Variant switcher */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
            {WIDGET_VARIANTS.map(v => {
              const Icon = v.icon;
              const active = activeVariant === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveVariant(v.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${active ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:text-white hover:bg-white/8"}`}
                >
                  <Icon size={15} />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-white/35">{WIDGET_VARIANTS.find(v => v.id === activeVariant)?.desc}</p>
        </div>
      </section>

      {/* Live preview */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "repeating-linear-gradient(45deg, hsl(0 0% 8%), hsl(0 0% 8%) 10px, hsl(0 0% 7%) 10px, hsl(0 0% 7%) 20px)" }}>
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-400/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded bg-white/5 text-xs text-white/25 text-right">
                {ownerBusiness?.slug ? `yourwebsite.co.il — /${ownerBusiness.slug}` : "yourwebsite.co.il"}
              </div>
            </div>
            {/* Preview */}
            <div className="min-h-64 flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVariant}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className={activeVariant === "full" ? "w-full" : activeVariant === "sidebar" ? "w-full max-w-sm" : "w-full max-w-xs"}
                >
                  <TrustWidget variant={activeVariant} {...previewProps} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {isPersonalised ? (
            <p className="text-center text-xs text-emerald-400/60 mt-3 flex items-center justify-center gap-1.5">
              <UserCheck size={11} />
              מציג נתונים של {ownerBusiness!.name} — ביקורות חיות יופיעו כשהווידג'ט יוטמע באתר שלכם
            </p>
          ) : (
            <p className="text-center text-xs text-white/30 mt-3">* מוצג דאטה לדוגמה — לאחר כניסה לחשבון ייטענו נתוני העסק שלכם</p>
          )}
        </div>
      </section>

      {/* Fixed badge demo */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-white/8 bg-white/3">
          <div>
            <p className="text-sm font-medium text-white/80">תג פינה קבוע (Fixed)</p>
            <p className="text-xs text-white/40 mt-0.5">מציף בפינת המסך — מושלם לדפי נחיתה ארוכים</p>
          </div>
          <button
            onClick={() => setShowFixed(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${showFixed ? "bg-primary/30 border-primary/50" : "bg-white/8 border-white/15"}`}
          >
            <motion.span animate={{ x: showFixed ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className={`inline-block h-4 w-4 rounded-full transition-colors ${showFixed ? "bg-primary" : "bg-white/40"}`} />
          </button>
        </div>
        <AnimatePresence>
          {showFixed && <FixedMiniBadge position="bottom-left" {...previewProps} />}
        </AnimatePresence>
      </section>

      {/* Embed code */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/15 border border-primary/25"><Code2 size={16} className="text-primary" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">קוד ההטמעה</h2>
              <p className="text-xs text-white/40">
                {isPersonalised
                  ? `מוגדר אוטומטית לחשבון ${ownerBusiness!.name} — הדביקו ישירות ב-HTML של האתר שלכם`
                  : "העתיקו את הקוד והדביקו ב-HTML של האתר שלכם"}
              </p>
            </div>
            {isPersonalised && (
              <div className="mr-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/8">
                <UserCheck size={11} className="text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">מחובר</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3">
              <div className="flex items-center gap-2">
                {WIDGET_VARIANTS.map(v => (
                  <button key={v.id} onClick={() => setActiveVariant(v.id)} className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${activeVariant === v.id ? "bg-primary/15 text-primary" : "text-white/35 hover:text-white/60"}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <CopyButton text={snippet} />
            </div>
            <pre className="p-5 text-xs leading-relaxed overflow-x-auto" style={{ color: "hsl(168 60% 65%)", background: "hsl(0 0% 6%)" }}>
              <code>{snippet}</code>
            </pre>
          </div>
          <p className="text-xs text-white/30 mt-3 leading-relaxed">
            {isPersonalised ? (
              <>הביקורות והדירוג מתעדכנים אוטומטית — אין צורך לשנות את הקוד. יש שאלות?{" "}</>
            ) : (
              <>הביקורות והדירוג מתעדכנים אוטומטית — אין צורך לשנות את הקוד לאחר ההטמעה. יש שאלות?{" "}</>
            )}
            <a href="mailto:support@reviewshub.info" className="text-primary/60 hover:text-primary underline underline-offset-2">צרו קשר עם התמיכה</a>.
          </p>
        </div>
      </section>

      {/* Widget types grid */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-white text-center mb-8">למה ווידג'ט האמון של ReviewHub?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WIDGET_FEATURES.map(f => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className="flex flex-col gap-2 p-5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
                <span className="text-2xl">{f.icon}</span>
                <p className="font-semibold text-white/90 text-sm">{f.title}</p>
                <p className="text-xs text-white/45 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── PAGE ──────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "badges" | "widgets";

export default function PrestigeBadgesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return t === "widgets" ? "widgets" : "badges";
  });

  const { user, authLoading, business, bLoading } = useOwnerBusiness();

  // Keep URL in sync
  useEffect(() => {
    setSearchParams(activeTab === "widgets" ? { tab: "widgets" } : {}, { replace: true });
  }, [activeTab, setSearchParams]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 5%)" }}>
      <BusinessNavbar />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-20 pb-12 text-center">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(270 50% 15% / 0.35), transparent)" }} />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-6">
              <Award size={12} strokeWidth={2.5} />
              <span>כלי אמון לאתר שלכם — Trust Tools</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              הציגו אמון{" "}
              <span className="text-violet-400">בכל מקום</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed max-w-lg mx-auto">
              תגי פרסטיז׳ סטטיים שמרוויחים עם ציון האמון, וווידג'טים חיים שמציגים ביקורות מאומתות — שניהם עם קוד הטמעה לאתר שלכם.
            </p>
          </motion.div>
        </section>

        {/* ── Tab switcher ──────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 px-4 pb-6" style={{ background: "hsl(0 0% 5%)" }}>
          <div className="mx-auto max-w-md">
            <div className="flex rounded-2xl border border-white/10 bg-white/4 p-1 gap-1">
              {([
                { id: "badges"  as Tab, label: "תגי פרסטיז׳",    icon: Award },
                { id: "widgets" as Tab, label: "ווידג'טים לאתר", icon: Layout },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === id
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Account status banner ─────────────────────────────────────────── */}
        <AccountStatusBanner
          user={user}
          authLoading={authLoading}
          business={business}
          bLoading={bLoading}
        />

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        <div className="pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === "badges"
                ? <BadgesTab  ownerBusiness={business} />
                : <WidgetsTab ownerBusiness={business} />
              }
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Shared CTA ────────────────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="rounded-2xl border border-primary/25 px-8 py-12" style={{ background: "linear-gradient(135deg, hsl(168 45% 8% / 0.6), hsl(0 0% 5%))" }}>
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-3">מוכנים לרשום את העסק שלכם?</h2>
              <p className="text-white/45 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                הצעד הראשון הוא להיכנס למאגר ReviewHub. לאחר שתאספו ביקורות מאומתות — תגי הפרסטיז׳ והווידג'טים נפתחים אוטומטית.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                  <Link to="/business/signup">רשמו את העסק</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/15 text-white/60 hover:text-white hover:bg-white/5">
                  <Link to="/search" className="flex items-center gap-1.5">
                    <span>חפשו במאגר</span>
                    <ArrowLeft size={13} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>

      <BusinessFooter />
    </div>
  );
}

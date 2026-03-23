/**
 * TrustBadgePage.tsx
 *
 * Business partner page that showcases all three TrustWidget variants and
 * lets owners copy the embed snippet for their own website.
 *
 * Route: /partners/trust-badge
 *
 * Sections:
 *   1. Hero — headline + live variant switcher
 *   2. Live Preview — interactive demo with the 3 variants
 *   3. Embed Code — copy-paste iframe / script tags
 *   4. FAQ accordion
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Copy, CheckCheck, ExternalLink, ChevronDown,
  Layers, Minimize2, PanelRight, Star, Lock, Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import { TrustWidget, FixedMiniBadge } from "@/components/TrustWidget";
import type { TrustWidgetProps } from "@/components/TrustWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useWidgetData } from "@/hooks/useWidgetData";
import { supabase } from "@/integrations/supabase/client";

// ─── Widget preview props — no fake data, shows the widget in its empty state ──

const DEMO_PROPS: Omit<TrustWidgetProps, "variant"> = {
  businessName: "שם העסק שלך",
  slug: "your-business-slug",
  rating: 0,
  reviewCount: 0,
  profileUrl: "#",
  reviews: [],
};

// ─── Variants config ──────────────────────────────────────────────────────────

const VARIANTS = [
  {
    id: "full" as const,
    label: "קרוסלה מלאה",
    icon: Layers,
    desc: "ווידג׳ט רחב ל-Hero Section ולדפי נחיתה",
  },
  {
    id: "mini" as const,
    label: "תג מינימלי",
    icon: Minimize2,
    desc: "תג קומפקטי לסרגל הניווט או לכותרת",
  },
  {
    id: "sidebar" as const,
    label: "עמודת צד",
    icon: PanelRight,
    desc: "רשימה אנכית מפורטת לסידבר או ל-Sticky panel",
  },
];

// ─── Embed snippet builder ────────────────────────────────────────────────────

function buildEmbedSnippet(slug: string, variant: "full" | "mini" | "sidebar") {
  const base = "https://reviewhub.co.il";
  return `<!-- ReviewWise Trust Badge (${variant}) -->
<iframe
  src="${base}/widget/${slug}?v=${variant}"
  width="${variant === "sidebar" ? "320" : variant === "mini" ? "260" : "100%"}"
  height="${variant === "sidebar" ? "520" : variant === "mini" ? "68" : "220"}"
  frameborder="0"
  scrolling="no"
  title="ReviewWise — ביקורות מאומתות"
  style="border:none;overflow:hidden;"
></iframe>`;
}

// ─── FAQ items ────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "באיזה תכנית זמין ווידג׳ט האמון?",
    a: "ווידג׳ט האמון זמין לעסקים בתכנית Pro ו-Premium. תכנית הבסיס כוללת תג מינימלי בלבד.",
  },
  {
    q: "האם הווידג׳ט יאט את האתר שלי?",
    a: "לא. הווידג׳ט נטען באופן אסינכרוני (lazy) ואינו חוסם את רינדור הדף. הוא קל ומאוחסן ב-CDN מהיר.",
  },
  {
    q: "האם הביקורות מתעדכנות אוטומטית?",
    a: "כן. הווידג׳ט מציג תמיד את הביקורות האחרונות והדירוג העדכני ביותר. אין צורך לשנות את הקוד שהטמעתם.",
  },
  {
    q: "האם אפשר לעצב את הווידג׳ט לפי המותג שלי?",
    a: "בתכנית Premium ניתן לבחור בין ערכת נושא בהירה לכהה, וכן לציין צבע מותג מותאם. תמיכה ב-CSS מותאם אישית בתכנית Enterprise.",
  },
  {
    q: "האם זה עובד על מובייל?",
    a: "בהחלט. כל הווריאנטים רספונסיביים ומותאמים למסכי מובייל וטאבלט. הקרוסלה המלאה מתאימה את מספר הכרטיסיות לרוחב המסך.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-right text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="shrink-0 text-white/40" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-white/50 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrustBadgePage() {
  const { user } = useAuth();
  const [activeVariant, setActiveVariant] = useState<"full" | "mini" | "sidebar">("full");
  const [showFixed, setShowFixed] = useState(false);
  const [realSlug, setRealSlug] = useState<string | null>(null);

  // Fetch the authenticated user's business slug
  useEffect(() => {
    if (!user) { setRealSlug(null); return; }
    supabase
      .from("businesses")
      .select("slug")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => setRealSlug(data?.slug ?? null));
  }, [user]);

  // Use demo data (no businessProfile in auth context)
  const widgetProps = DEMO_PROPS;

  const PLACEHOLDER_SLUG = "your-business-slug";
  const snippetSlug = realSlug ?? PLACEHOLDER_SLUG;

  const snippet = buildEmbedSnippet(snippetSlug, activeVariant);
  const placeholderSnippet = buildEmbedSnippet(PLACEHOLDER_SLUG, activeVariant);

  const isPro = false;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(0 0% 5%)" }}
    >
      <BusinessNavbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-20 pb-16 text-center">
          {/* Background glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 40% at 50% -10%, hsl(168 45% 20% / 0.3), transparent)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <Star size={12} strokeWidth={2.5} />
              <span>ווידג׳ט אמון לעסקים</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              הציגו ביקורות אמיתיות{" "}
              <span className="text-primary">בכל מקום</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed mb-8">
              הטמיעו את ווידג׳ט האמון של ReviewWise באתר שלכם ותנו לביקורות
              המאומתות לעבוד בשבילכם — אפס קוד, תמיד עדכני.
            </p>

            {!isPro && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm mb-6"
              >
                <Lock size={14} />
                <span>
                  הווידג׳ט זמין לתכניות Pro ו-Premium.{" "}
                  <a href="/business/pricing" className="underline underline-offset-2 hover:text-amber-300">
                    שדרגו עכשיו
                  </a>
                </span>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* ── Variant Tabs ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {VARIANTS.map(v => {
                const Icon = v.icon;
                const active = activeVariant === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariant(v.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-white/4 border-white/8 text-white/50 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-white/35 mt-3">
              {VARIANTS.find(v => v.id === activeVariant)?.desc}
            </p>
          </div>
        </section>

        {/* ── Live Preview ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-5xl">
            <div
              className="rounded-2xl border border-white/8 overflow-hidden"
              style={{
                background:
                  "repeating-linear-gradient(45deg, hsl(0 0% 8%), hsl(0 0% 8%) 10px, hsl(0 0% 7%) 10px, hsl(0 0% 7%) 20px)",
              }}
            >
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
                </div>
                <div className="flex-1 mx-4 px-3 py-1 rounded bg-white/5 text-xs text-white/25 text-right">
                  yourwebsite.co.il
                </div>
              </div>

              {/* Preview area */}
              <div className="min-h-64 flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeVariant}
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className={
                      activeVariant === "full"
                        ? "w-full"
                        : activeVariant === "sidebar"
                        ? "w-full max-w-sm"
                        : "w-full max-w-xs"
                    }
                  >
                    <TrustWidget variant={activeVariant} {...widgetProps} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Demo note */}
            <p className="text-center text-xs text-white/30 mt-3">
              * מוצג דאטה לדוגמה — לאחר כניסה לחשבון ייטענו נתוני העסק שלכם
            </p>
          </div>
        </section>

        {/* ── Fixed badge demo toggle ───────────────────────────────────────── */}
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-white/8 bg-white/3">
            <div>
              <p className="text-sm font-medium text-white/80">תג פינה קבוע (Fixed)</p>
              <p className="text-xs text-white/40 mt-0.5">
                מציף בפינת המסך — מושלם לדפי נחיתה ארוכים
              </p>
            </div>
            <button
              onClick={() => setShowFixed(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${
                showFixed
                  ? "bg-primary/30 border-primary/50"
                  : "bg-white/8 border-white/15"
              }`}
            >
              <motion.span
                animate={{ x: showFixed ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`inline-block h-4 w-4 rounded-full transition-colors ${
                  showFixed ? "bg-primary" : "bg-white/40"
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── Embed Code ───────────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/15 border border-primary/25">
                <Code2 size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">קוד ההטמעה</h2>
                <p className="text-xs text-white/40">
                  {user
                    ? "קוד ההטמעה מותאם לעסק שלכם"
                    : "העתיקו את הקוד והדביקו ב-HTML של האתר שלכם"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 overflow-hidden">
              {/* Tab bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3">
                <div className="flex items-center gap-2">
                  {VARIANTS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariant(v.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        activeVariant === v.id
                          ? "bg-primary/15 text-primary"
                          : "text-white/35 hover:text-white/60"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                {user && <CopyButton text={snippet} />}
              </div>

              {/* Code block — gated for logged-out users */}
              <div className="relative">
                <pre
                  className="p-5 text-xs leading-relaxed overflow-x-auto"
                  style={{
                    color: "hsl(168 60% 65%)",
                    background: "hsl(0 0% 6%)",
                    filter: user ? "none" : "blur(4px)",
                    userSelect: user ? "auto" : "none",
                    pointerEvents: user ? "auto" : "none",
                  }}
                  aria-hidden={!user}
                >
                  <code>{user ? snippet : placeholderSnippet}</code>
                </pre>

                {/* Logged-out overlay */}
                {!user && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-b-2xl"
                    style={{ background: "hsl(0 0% 6% / 0.85)", backdropFilter: "blur(2px)" }}
                  >
                    <div className="flex flex-col items-center gap-3 text-center px-6">
                      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                        <Lock size={16} className="text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-white/90">
                        קוד ההטמעה מותאם לעסק שלך
                      </p>
                      <p className="text-xs text-white/45 max-w-xs leading-relaxed">
                        התחברו כדי לצפות בקוד ההטמעה המלא והמותאם לעסק שלכם
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-1"
                      >
                        <Link to="/auth">התחברו</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-white/30 mt-3 leading-relaxed">
              הביקורות והדירוג מתעדכנים אוטומטית — אין צורך לשנות את הקוד לאחר ההטמעה.
              יש שאלות?{" "}
              <a
                href="mailto:support@reviewshub.info"
                className="text-primary/60 hover:text-primary underline underline-offset-2"
              >
                צרו קשר עם התמיכה
              </a>
              .
            </p>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────────────────── */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold text-white text-center mb-8">
              למה ווידג׳ט האמון של ReviewWise?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: "⚡",
                  title: "עדכון בזמן אמת",
                  body: "ביקורות חדשות מופיעות אוטומטית — ללא עדכוני קוד.",
                },
                {
                  icon: "🔒",
                  title: "ביקורות מאומתות",
                  body: "רק לקוחות שרכשו בפועל יכולים לכתוב ביקורת.",
                },
                {
                  icon: "📱",
                  title: "100% רספונסיבי",
                  body: "נראה מושלם בדסקטופ, טאבלט ומובייל.",
                },
                {
                  icon: "🌙",
                  title: "Dark Mode מובנה",
                  body: "מתאים אוטומטית לערכת הנושא של האתר.",
                },
                {
                  icon: "🚀",
                  title: "טעינה מהירה",
                  body: "Lazy load אסינכרוני — אפס השפעה על ה-Core Web Vitals.",
                },
                {
                  icon: "🌐",
                  title: "SEO Schema",
                  body: "כולל AggregateRating JSON-LD לשיפור הציון בגוגל.",
                },
              ].map(f => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-2 p-5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <p className="font-semibold text-white/90 text-sm">{f.title}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        {!isPro && (
          <section className="px-4 pb-16">
            <div className="mx-auto max-w-3xl text-center">
              <div
                className="rounded-2xl border border-primary/25 px-8 py-12"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(168 45% 10% / 0.5), hsl(0 0% 6%))",
                }}
              >
                <div className="text-4xl mb-4">⭐</div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  מוכנים להציג את הביקורות שלכם?
                </h2>
                <p className="text-white/50 mb-8 max-w-md mx-auto">
                  שדרגו לתכנית Pro וקבלו גישה מלאה לווידג׳ט האמון, ניתוח AI,
                  ואינטגרציות עם HubSpot וגוגל שיטס.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                  >
                    <a href="/business/pricing">שדרגו לPro</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/15 text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <a href="/business/pricing" className="flex items-center gap-1.5">
                      <span>ראו את כל התכניות</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl font-bold text-white text-center mb-8">שאלות נפוצות</h2>
            <div className="rounded-2xl border border-white/8 px-6 bg-white/2">
              {FAQ.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <BusinessFooter />

      {/* ── Fixed badge (demo) ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFixed && (
          <FixedMiniBadge
            position="bottom-left"
            {...widgetProps}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

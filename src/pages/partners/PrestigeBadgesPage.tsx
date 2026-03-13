/**
 * PrestigeBadgesPage.tsx
 *
 * Public-facing gallery page that explains the ReviewHub prestige badge system.
 *
 * Route: /partners/prestige-badges
 *
 * Sections:
 *   1. Hero — headline, positioning, value prop
 *   2. Badge gallery — live previews + eligibility criteria + embed code
 *   3. How it works — 3-step process (get verified → earn grade → embed badge)
 *   4. Distribution loop explainer — why badges create backlinks / trust signal
 *   5. CTA — register / claim your badge
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Copy, CheckCheck, ExternalLink,
  ArrowLeft, Cpu, Zap, Award, Link2, BarChart2,
} from "lucide-react";
import { Link } from "react-router-dom";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { Button } from "@/components/ui/button";
import {
  PrestigeBadge,
  buildBadgeEmbedCode,
  BADGE_CONFIG,
  type PrestigeBadgeType,
} from "@/components/PrestigeBadge";

// ── Badge catalogue ────────────────────────────────────────────────────────────

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
    who: "מיועד לכל עסק, פרילנסר, ספק קורסים או SaaS שכבר קיבל ביקורת מאומתת ראשונה.",
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

// ── Copy button ────────────────────────────────────────────────────────────────

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

// ── Badge card ─────────────────────────────────────────────────────────────────

function BadgeCard({ item }: { item: typeof BADGE_CATALOGUE[0] }) {
  const [open, setOpen] = useState(false);
  const cfg = BADGE_CONFIG[item.type];
  const demoSlug = "your-business-slug";
  const demoGrade = item.type === "verified" ? "B" : "A+";
  const demoRating = item.type === "verified" ? 3.9 : 4.8;
  const snippet = buildBadgeEmbedCode(item.type, demoSlug, demoGrade);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${cfg.accent}30`, background: `linear-gradient(160deg, ${cfg.accentBg}90, hsl(0 0% 6%))` }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: `${cfg.accent}90` }}>
              {item.eligibility}
            </p>
            <h3 className="text-lg font-bold text-white">{cfg.label}</h3>
            <p className="text-xs text-white/45 mt-1 leading-relaxed">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Live badge preview */}
        <div
          className="flex items-center justify-center py-6 rounded-xl border"
          style={{ background: "hsl(0 0% 8%)", borderColor: "hsl(0 0% 12%)" }}
        >
          <PrestigeBadge
            type={item.type}
            slug={demoSlug}
            name="Your Business"
            grade={demoGrade}
            rating={demoRating}
            size="md"
            noLink
          />
        </div>
      </div>

      {/* Eligibility criteria */}
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

      {/* Embed code toggle */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-xs font-medium transition-colors"
          style={{ color: open ? cfg.accent : `${cfg.accent}70` }}
        >
          <Link2 size={12} />
          {open ? "הסתר קוד הטמעה" : "הצג קוד הטמעה"}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3"
            >
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-white/3">
                  <span className="text-[10px] font-mono text-white/30">embed.html</span>
                  <CopyButton text={snippet} />
                </div>
                <pre
                  className="p-4 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap"
                  style={{ color: `${cfg.accent}cc`, background: "hsl(0 0% 5%)" }}
                >
                  <code>{snippet}</code>
                </pre>
              </div>
              <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                החליפו <code className="text-white/50">your-business-slug</code> בכתובת הפרופיל שלכם ב-ReviewHub.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: "01",
    title: "הכנסו למאגר",
    body: "רשמו את העסק שלכם ב-ReviewHub והתחילו לאסוף ביקורות מאומתות מלקוחות ששילמו בפועל.",
    icon: ShieldCheck,
  },
  {
    num: "02",
    title: "צברו ציון אמון",
    body: "ככל שאספתם יותר ביקורות מאומתות עם ציון גבוה, הציון שלכם עולה — ופותחים תגי יוקרה גבוהים יותר.",
    icon: BarChart2,
  },
  {
    num: "03",
    title: "הטמיעו את התג",
    body: "העתיקו את קוד ה-HTML, הדביקו באתר שלכם. הלינק מתחת לתג מוביל חזרה לפרופיל האמון שלכם — ומייצר לכם backlink.",
    icon: Link2,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PrestigeBadgesPage() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 5%)" }}>
      <BusinessNavbar />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-20 pb-16 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(270 50% 15% / 0.4), transparent)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative mx-auto max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-6">
              <Award size={12} strokeWidth={2.5} />
              <span>מערכת תגי יוקרה — Trust Prestige System</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              תגי אמון שמייצרים{" "}
              <span className="text-violet-400">מוניטין</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed mb-6 max-w-lg mx-auto">
              תגי הפרסטיז׳ של ReviewHub הם אישורי אמון שמבוססים על נתוני ביקורות מאומתות — לא על תשלום.
              הציגו אותם באתר שלכם ותנו ללקוחות לבדוק את הציון שלכם בעצמם.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6">
                <Link to="/business/signup">קבלו את התג שלכם</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 text-white/60 hover:text-white hover:bg-white/5">
                <Link to="/search" className="flex items-center gap-1.5">
                  <span>ראו את המאגר</span>
                  <ExternalLink size={13} />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ── Badge gallery ─────────────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">ארבעת תגי הפרסטיז׳</h2>
              <p className="text-sm text-white/40 max-w-lg mx-auto">
                כל תג מבוסס על נתונים אמיתיים — ניתן לאימות בלחיצה. ככל שהציון גבוה יותר, כך התג מרשים יותר.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {BADGE_CATALOGUE.map(item => (
                <BadgeCard key={item.type} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">איך זה עובד</h2>
              <p className="text-sm text-white/40">שלושה שלבים מהרישום להצגת התג</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex flex-col gap-4 p-6 rounded-2xl border border-white/8 bg-white/3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                        <Icon size={18} className="text-primary" />
                      </div>
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

        {/* ── Distribution loop explainer ───────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-3xl">
            <div
              className="rounded-2xl border border-violet-500/20 p-8 md:p-10"
              style={{ background: "linear-gradient(135deg, hsl(270 40% 8%), hsl(0 0% 6%))" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25">
                  <Link2 size={18} className="text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">לולאת הפצה — Trust Distribution Loop</h2>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                כל תג שמוטמע באתר של עסק מכיל לינק חזרה לפרופיל האמון שלו ב-ReviewHub.
                כך נוצרת לולאה שמחזקת את שני הצדדים:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    icon: "🏢",
                    title: "ליזמים",
                    body: "תגי האמון מגבירים המרות — לקוחות רואים הוכחה חיצונית ניטרלית, לא שיווק עצמי.",
                  },
                  {
                    icon: "👥",
                    title: "ללקוחות",
                    body: "לחיצה על התג מובילה לפרופיל שניתן לאמת בעצמאות — ביקורות אמיתיות, נוסחה פתוחה.",
                  },
                  {
                    icon: "🔗",
                    title: "ל-ReviewHub",
                    body: "כל הטמעה מייצרת backlink איכותי ומגדילה את סמכות הפלטפורמה — ללא תשלום פרסומי.",
                  },
                ].map(p => (
                  <div key={p.title} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <span className="text-2xl mb-3 block">{p.icon}</span>
                    <p className="font-semibold text-white/80 text-sm mb-1">{p.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30 leading-relaxed border-t border-white/8 pt-5">
                חשוב: תגי הפרסטיז׳ אינם למכירה ואינם ניתנים לרכישה.
                ציון האמון מחושב אוטומטית — בעל עסק לא יכול לשנות אותו על ידי תשלום.
                <Link to="/about" className="text-violet-400/70 hover:text-violet-400 underline underline-offset-2 mr-1">
                  קראו את המתודולוגיה המלאה ←
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ── Size variants showcase ────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-bold text-white text-center mb-8">גדלים זמינים</h2>
            <div className="rounded-2xl border border-white/8 bg-white/2 p-8 flex flex-col gap-6 items-center">
              {(["sm", "md", "lg"] as const).map(sz => (
                <div key={sz} className="flex flex-col items-center gap-2">
                  <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{sz.toUpperCase()}</p>
                  <PrestigeBadge
                    type="highly-trusted"
                    slug="demo"
                    name="Demo Business"
                    grade="A+"
                    rating={4.9}
                    size={sz}
                    noLink
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="rounded-2xl border border-primary/25 px-8 py-12"
              style={{ background: "linear-gradient(135deg, hsl(168 45% 8% / 0.6), hsl(0 0% 5%))" }}
            >
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-3">מוכנים לרשום את העסק שלכם?</h2>
              <p className="text-white/45 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                הצעד הראשון הוא להיכנס למאגר ReviewHub. לאחר שתאספו ביקורות מאומתות — תג הפרסטיז׳ נפתח אוטומטית.
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

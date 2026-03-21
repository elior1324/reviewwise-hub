import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BusinessNavbar from "@/components/BusinessNavbar";
import {
  MessageCircle,
  Instagram,
  Mail,
  QrCode,
  ShieldCheck,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Users,
  TrendingUp,
  Link2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const CHANNELS = [
  { icon: MessageCircle, label: "WhatsApp", desc: "שיעור פתיחה גבוה, ישיר" },
  { icon: Instagram,     label: "Instagram DM", desc: "אוטומטי" },
  { icon: Mail,          label: "אימייל", desc: "עם תבנית מותאמת" },
  { icon: QrCode,        label: "QR Code", desc: "לדלפק, למוצר, לחשבונית" },
];

const STEPS = [
  {
    num: "01",
    title: "שלח קישור ייחודי",
    body: "מלוח הבקרה שלך, שניות. הקישור יוצא דרך WhatsApp, Instagram DM, אימייל, או QR Code.",
  },
  {
    num: "02",
    title: "הלקוח כותב, ללא חיכוך",
    body: "טופס נקי. ללא הרשמה. כל קישור חד-פעמי — לא ניתן לשיתוף, לא ניתן לזיוף.",
  },
  {
    num: "03",
    title: "AI בודק לפני פרסום",
    body: "ניתוח sentiment, זיהוי ספאם, תיוג נושאים. ביקורת חשודה עוברת לבדיקה אנושית. AI עוזר — לא מחליט.",
  },
  {
    num: "04",
    title: "ביקורת עולה, Trust Score מתעדכן",
    body: "הכול אוטומטי. אתה מקבל התראה. הפרופיל שלך חי.",
  },
];

const SCORE_PARAMS = [
  { label: "ממוצע דירוג כוכבים", weight: "50%" },
  { label: "אחוז ביקורות מאומתות", weight: "25%" },
  { label: "עדכניות — 90 ימים אחרונים", weight: "15%" },
  { label: "מגוון מבקרים ייחודיים", weight: "10%" },
];

const DASHBOARD_FEATURES = [
  {
    icon: CheckCircle2,
    title: "ביקורות",
    badge: "כל תוכנית",
    badgeVariant: "secondary" as const,
    body: "קרא, הגב, דווח על ביקורת חשודה. תגובה שלך מופיעה ציבורית — לקוחות רואים עסק שמקשיב.",
  },
  {
    icon: BarChart3,
    title: "אנליטיקה",
    badge: "Pro",
    badgeVariant: "default" as const,
    body: "גרפי מגמה, פילוח לפי ערוץ, ניתוח sentiment. תדע בדיוק מה עובד ומה לא.",
  },
  {
    icon: Users,
    title: "השוואה תחרותית",
    badge: "Pro",
    badgeVariant: "default" as const,
    body: "ראה איפה אתה עומד מול עסקים באותה קטגוריה. מידע, לא לחץ.",
  },
  {
    icon: TrendingUp,
    title: "ווידג׳טים",
    badge: "Pro",
    badgeVariant: "default" as const,
    body: "Embed code לאתר שלך. הביקורות מגיעות ישירות לנקודת ההחלטה של הלקוח.",
  },
  {
    icon: Sparkles,
    title: "עוזר תגובה AI",
    badge: "Pro",
    badgeVariant: "default" as const,
    body: "ביקורת קשה? AI מציע טיוטה. אתה עורך ומאשר — תמיד.",
  },
];

const PLANS = [
  {
    name: "Free",
    tagline: "להתחיל",
    features: [
      { label: "פרופיל ציבורי", has: true },
      { label: "עד 50 ביקורות", has: true },
      { label: "תגובות לביקורות", has: true },
      { label: "Trust Score", has: true },
      { label: "ערוצי איסוף (WA, IG, Email, QR)", has: false },
      { label: "אנליטיקה מלאה", has: false },
      { label: "תג מאומת", has: false },
      { label: "ווידג׳טים", has: false },
      { label: "API", has: false },
    ],
    cta: "התחל בחינם",
    highlight: false,
  },
  {
    name: "Pro",
    tagline: "לניהול פעיל",
    features: [
      { label: "פרופיל ציבורי", has: true },
      { label: "ביקורות ללא הגבלה", has: true },
      { label: "תגובות לביקורות", has: true },
      { label: "Trust Score", has: true },
      { label: "ערוצי איסוף (WA, IG, Email, QR)", has: true },
      { label: "אנליטיקה מלאה", has: true },
      { label: "תג מאומת", has: true },
      { label: "ווידג׳טים", has: true },
      { label: "API", has: false },
    ],
    cta: "שדרג ל-Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    tagline: "לארגונים ורשתות",
    features: [
      { label: "פרופיל ציבורי", has: true },
      { label: "ביקורות ללא הגבלה", has: true },
      { label: "תגובות לביקורות", has: true },
      { label: "Trust Score", has: true },
      { label: "ערוצי איסוף (WA, IG, Email, QR)", has: true },
      { label: "אנליטיקה מותאמת אישית", has: true },
      { label: "תג מאומת", has: true },
      { label: "ווידג׳טים", has: true },
      { label: "API + מנהל חשבון + SLA", has: true },
    ],
    cta: "צור קשר",
    highlight: false,
  },
];

export default function BusinessAboutPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <BusinessNavbar />

      <main className="pt-20">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-zinc-900 text-white py-20 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-semibold">
              לעסקים
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              לקוחות מחפשים סיבה לסמוך עליך.
              <br />
              <span className="text-amber-400">ReviewHub נותנת להם אחת.</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              לא כלי שיווקי. לא "ניהול מוניטין" בסגנון ישן. תשתית — כי האמון נבנה לפני ששיחת המכירה מתחילה.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/business/signup">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-8">
                  התחל בחינם
                  <ArrowLeft size={16} className="mr-2" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/business/faq">
                <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
                  שאלות נפוצות
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Problem ──────────────────────────────────────────── */}
        <section className="py-16 px-4 bg-zinc-50 dark:bg-zinc-950">
          <div className="container max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              הבעיה שעסקים מכירים
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              לקוח מצא אותך. ראה ביקורת שלילית אחת מלפני שנתיים. עזב.
              <br />
              לא כי אתה לא טוב — כי לא הייתה תמונה שלמה.
            </p>
            <p className="mt-4 text-foreground font-medium">
              ReviewHub בונה את התמונה הזו: ביקורות אמיתיות, מאומתות, מעודכנות — שגורמות ללקוח הבא להישאר.
            </p>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                איך זה עובד — 4 שלבים
              </h2>
            </div>

            {/* Channels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {CHANNELS.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-card gap-2"
                >
                  <Icon size={24} className="text-primary" aria-hidden="true" />
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {STEPS.map(({ num, title, body }) => (
                <div key={num} className="flex gap-5 items-start">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Score ──────────────────────────────────────── */}
        <section className="py-16 px-4 bg-zinc-50 dark:bg-zinc-950">
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Trust Score — מספר שאי אפשר לקנות
              </h2>
              <p className="text-muted-foreground">
                כל עסק מקבל ציון 0–100, מחושב מנתוני ביקורות בלבד.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
              <table className="w-full text-sm" aria-label="פרמטרי Trust Score">
                <thead>
                  <tr className="bg-zinc-900 text-white">
                    <th className="text-right px-5 py-3 font-semibold">פרמטר</th>
                    <th className="text-left px-5 py-3 font-semibold">משקל</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_PARAMS.map(({ label, weight }, i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-background" : "bg-zinc-50 dark:bg-zinc-900/40"}>
                      <td className="px-5 py-3 text-foreground">{label}</td>
                      <td className="px-5 py-3 font-bold text-primary text-left">{weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-sm text-foreground">
                <strong>מה לא משפיע:</strong> תוכנית המנוי שלך. כמה שילמת. כמה ותיק אתה.
              </p>
              <p className="text-sm text-foreground mt-2">
                ציון גבוה יש רק לעסק שנותן שירות טוב. זה לא באג — זו הסיבה שלקוחות סומכים עליו.
              </p>
            </div>
          </div>
        </section>

        {/* ── Dashboard features ───────────────────────────────── */}
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                מה שולט בלוח הבקרה שלך
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {DASHBOARD_FEATURES.map(({ icon: Icon, title, badge, badgeVariant, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 flex gap-4 items-start"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                      <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
                        {badge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Affiliate ────────────────────────────────────────── */}
        <section className="py-14 px-4 bg-zinc-50 dark:bg-zinc-950">
          <div className="container max-w-2xl mx-auto text-center">
            <Link2 size={28} className="text-primary mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              הפרופיל שלך גם מרוויח
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              צרף קישור אפיליאייט לקורס, שירות, או מוצר. כל לקוח שמגיע לפרופיל שלך ולוחץ — הקליק נרשם, הוא מועבר ליעד. האמון שבנית הופך לתנועה שמכניסה.
            </p>
          </div>
        </section>

        {/* ── Plans ────────────────────────────────────────────── */}
        <section className="py-16 px-4">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                בחר לפי שלב העסק שלך
              </h2>
              <p className="text-muted-foreground text-sm">התחל בחינם. שדרג כשאתה מוכן.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map(({ name, tagline, features, cta, highlight }) => (
                <div
                  key={name}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    highlight
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  {highlight && (
                    <div className="mb-3">
                      <Badge className="bg-primary text-white text-[10px]">מומלץ</Badge>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground">{name}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{tagline}</p>

                  <ul className="space-y-2.5 flex-1 mb-6" role="list">
                    {features.map(({ label, has }) => (
                      <li key={label} className="flex items-center gap-2 text-sm">
                        {has ? (
                          <CheckCircle2 size={15} className="text-primary shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle size={15} className="text-muted-foreground/40 shrink-0" aria-hidden="true" />
                        )}
                        <span className={has ? "text-foreground" : "text-muted-foreground/50"}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to={name === "Enterprise" ? "/business" : "/business/signup"}>
                    <Button
                      className="w-full"
                      variant={highlight ? "default" : "outline"}
                    >
                      {cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────── */}
        <section className="py-16 px-4 bg-zinc-900 text-white text-center">
          <div className="container max-w-2xl mx-auto">
            <ShieldCheck size={36} className="text-amber-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              הלקוח שלך לא רוצה שיווק.
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              הוא רוצה לדעת מה חשבו עליך אנשים שכבר שילמו.
              ReviewHub נותנת לו את זה. ונותנת לך שליטה על הסיפור.
            </p>
            <Link to="/business/signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-10">
                הצטרף בחינם
                <ArrowLeft size={16} className="mr-2" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * TrustBadgeDashboard.tsx
 *
 * "הצגו זאת באתר שלכם" — the full embeddable widget section shown in the
 * BusinessDashboard's "widget" tab.
 *
 * Replaces the previous EmbedWidgetGenerator with:
 *  • Live visual preview of all 3 badge variants inside a faux-browser frame
 *  • Per-variant copy-embed-code button
 *  • Step-by-step instructions
 *  • Anti-fake + tier gating explanation
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCheck, Code2, Layers, Minimize2, PanelRight,
  Globe, ExternalLink, ShieldCheck, Zap, RefreshCw, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CompactBadge }   from "@/components/TrustWidget/CompactBadge";
import { StandardBadge }  from "@/components/TrustWidget/StandardBadge";
import { ExpandedWidget } from "@/components/TrustWidget/ExpandedWidget";
import type { TrustWidgetProps, WidgetReview } from "@/components/TrustWidget/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrustBadgeDashboardProps {
  businessSlug: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  /** Optional reviews used to populate the ExpandedWidget snippet. */
  reviews?: WidgetReview[];
}

type BadgeSize = "compact" | "standard" | "expanded";

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_VARIANTS: {
  id: BadgeSize;
  label: string;
  labelHe: string;
  icon: React.ElementType;
  size: string;
  desc: string;
  useCases: string[];
}[] = [
  {
    id: "compact",
    label: "Compact Badge",
    labelHe: "תג קומפקטי",
    icon: Minimize2,
    size: "~260 × 48 px",
    desc: "שורה אחת מינימלית — מתאים לפוטר, חתימת אימייל, ובר ניווט.",
    useCases: ["פוטר אתר", "חתימת מייל", "Header קטן"],
  },
  {
    id: "standard",
    label: "Standard Badge",
    labelHe: "תג סטנדרטי",
    icon: Layers,
    size: "~290 × 110 px",
    desc: "כרטיס בגודל בינוני — אידיאלי לסידבר, דפי נחיתה וסקשן אמון.",
    useCases: ["Sidebar", "דף נחיתה", "עמוד מכירות"],
  },
  {
    id: "expanded",
    label: "Expanded Widget",
    labelHe: "ווידג׳ט מורחב",
    icon: PanelRight,
    size: "~340 × auto",
    desc: "ווידג׳ט מלא עם קטע ביקורת — לדפי Hero ובלוקים שיווקיים.",
    useCases: ["Hero Section", "בלוק שיווקי", "עמוד הבית"],
  },
];

// ─── Embed code builders ──────────────────────────────────────────────────────

function buildScriptEmbed(slug: string, size: BadgeSize): string {
  return `<!-- ReviewWise Trust Badge — ${size} -->
<div class="reviewhub-widget"
     data-slug="${slug}"
     data-size="${size}">
</div>
<script src="https://reviewhub.co.il/reviewhub-widget.js" async></script>`;
}

function buildIframeEmbed(slug: string, size: BadgeSize): string {
  const supaUrl = import.meta.env.VITE_SUPABASE_URL;
  const w = size === "compact" ? 300 : size === "standard" ? 310 : 360;
  const h = size === "compact" ? 68  : size === "standard" ? 130 : 220;
  return `<iframe
  src="${supaUrl}/functions/v1/widget-data?slug=${slug}&format=html"
  width="${w}"
  height="${h}"
  frameborder="0"
  scrolling="no"
  title="ReviewWise — ביקורות מאומתות"
  style="border:none;overflow:hidden;border-radius:16px;">
</iframe>`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CopyBtn = ({
  text,
  label = "העתק קוד",
}: {
  text: string;
  label?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "הקוד הועתק! 📋", description: "הדביקו אותו באתר שלכם." });
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="gap-1.5 text-xs h-7 px-3"
    >
      {copied ? (
        <CheckCheck size={12} className="text-primary" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? "הועתק!" : label}
    </Button>
  );
};

// Faux browser chrome wrapping a badge preview
const BrowserFrame = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <div className="rounded-xl border border-border/40 overflow-hidden bg-secondary/30">
    {/* Chrome bar */}
    <div className="flex items-center gap-1.5 px-3 py-2 bg-secondary/60 border-b border-border/40">
      <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
      <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
      <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
      <div
        className="flex-1 mx-2 px-2.5 py-0.5 rounded bg-background/50 text-[10px] text-muted-foreground/50 text-right"
      >
        {label}
      </div>
    </div>
    {/* Page content */}
    <div
      className="flex items-center justify-center p-6 min-h-24"
      style={{
        background:
          "repeating-linear-gradient(45deg, hsl(var(--background)), hsl(var(--background)) 8px, hsl(var(--secondary)/0.4) 8px, hsl(var(--secondary)/0.4) 16px)",
      }}
    >
      {children}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TrustBadgeDashboard = ({
  businessSlug,
  businessName,
  rating,
  reviewCount,
  reviews = [],
}: TrustBadgeDashboardProps) => {
  const [selectedSize, setSelectedSize]   = useState<BadgeSize>("standard");
  const [embedType, setEmbedType]         = useState<"script" | "iframe">("script");

  const activeVariant = BADGE_VARIANTS.find(v => v.id === selectedSize)!;

  const widgetProps: TrustWidgetProps = {
    businessName,
    slug: businessSlug,
    rating: rating || 4.8,
    reviewCount: reviewCount || 0,
    reviews,
    profileUrl: `${window.location.origin}/biz/${businessSlug}`,
  };

  const embedCode =
    embedType === "script"
      ? buildScriptEmbed(businessSlug, selectedSize)
      : buildIframeEmbed(businessSlug, selectedSize);

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            הצגו זאת באתר שלכם
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            הטמיעו תג אמון ב-ReviewWise באתר שלכם ותנו לביקורות המאומתות לעבוד בשבילכם.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs shrink-0">
          <ShieldCheck size={11} className="text-primary" />
          נתונים חיים · מתעדכן אוטומטית
        </Badge>
      </div>

      {/* ── 3-column badge gallery ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BADGE_VARIANTS.map(v => {
          const Icon    = v.icon;
          const active  = selectedSize === v.id;

          return (
            <motion.div
              key={v.id}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <Card
                onClick={() => setSelectedSize(v.id)}
                className={`cursor-pointer transition-all shadow-card overflow-hidden ${
                  active
                    ? "border-primary/50 ring-1 ring-primary/30 bg-card"
                    : "border-border/40 bg-card/60 hover:border-border"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                      <Icon size={14} className={active ? "text-primary" : "text-muted-foreground"} />
                      {v.labelHe}
                    </CardTitle>
                    <Badge
                      variant={active ? "default" : "secondary"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {v.size}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{v.desc}</p>
                </CardHeader>

                <CardContent className="pb-4 space-y-3">
                  {/* Live badge preview inside faux browser */}
                  <BrowserFrame label={`yourwebsite.co.il · ${v.labelHe}`}>
                    {v.id === "compact"  && <CompactBadge  {...widgetProps} />}
                    {v.id === "standard" && <StandardBadge {...widgetProps} />}
                    {v.id === "expanded" && <ExpandedWidget {...widgetProps} />}
                  </BrowserFrame>

                  {/* Use cases */}
                  <div className="flex flex-wrap gap-1">
                    {v.useCases.map(uc => (
                      <span
                        key={uc}
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/8 text-primary/80"
                      >
                        {uc}
                      </span>
                    ))}
                  </div>

                  {/* Quick copy button */}
                  <CopyBtn
                    text={buildScriptEmbed(businessSlug, v.id)}
                    label="העתק קוד מהיר"
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Full embed code panel ───────────────────────────────────────── */}
      <Card className="shadow-card bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 size={16} className="text-primary" />
              קוד הטמעה —{" "}
              <span className="text-primary">{activeVariant.labelHe}</span>
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Embed type toggle */}
              <div className="flex rounded-lg border border-border/50 overflow-hidden">
                {(["script", "iframe"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setEmbedType(t)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      embedType === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {t === "script" ? "סקריפט JS" : "iFrame"}
                  </button>
                ))}
              </div>

              <CopyBtn text={embedCode} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {embedType === "script"
              ? "מומלץ — נטען באופן אסינכרוני, מתעדכן אוטומטית, תומך במספר תגים בעמוד."
              : "פשוט ויעיל — עובד בכל פלטפורמה שמאפשרת iFrame."}
          </p>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.pre
              key={embedCode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              dir="ltr"
              className="bg-secondary rounded-lg p-4 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed"
            >
              {embedCode}
            </motion.pre>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ── Instructions + trust signals grid ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* How-to */}
        <Card className="shadow-card bg-card">
          <CardContent className="pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Zap size={14} className="text-accent" />
              איך להטמיע — 3 שלבים
            </h3>
            {[
              {
                n: "1",
                title: "בחרו גודל",
                body: "לחצו על אחד מ-3 הווריאנטים למעלה כדי לראות תצוגה מקדימה חיה.",
              },
              {
                n: "2",
                title: "העתיקו את הקוד",
                body: 'לחצו "העתק קוד" והדביקו לתוך ה-HTML של האתר — בפוטר, בדף נחיתה או בכל מקום שרוצים.',
              },
              {
                n: "3",
                title: "הכל עובד אוטומטית",
                body: "הדירוג והביקורות מתעדכנים בזמן אמת. אין צורך לשנות את הקוד לאחר ההטמעה.",
              },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary mt-0.5">
                  {s.n}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trust / anti-fake signals */}
        <Card className="shadow-card bg-card">
          <CardContent className="pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              מערכת אנטי-פייק
            </h3>
            {[
              {
                icon: RefreshCw,
                title: "נתונים חיים",
                body: "הווידג׳ט מציג תמיד את הדירוג האמיתי מהמסד שלנו — לא ערכים סטטיים.",
              },
              {
                icon: ShieldCheck,
                title: "בדיקת זהות",
                body: "הטמעה עם slug שגוי מציגה כלום — לא ניתן להשתמש בתג של עסק אחר.",
              },
              {
                icon: ExternalLink,
                title: "קישור מאומת",
                body: "לחיצה על הווידג׳ט תמיד מובילה לפרופיל האמיתי שלכם ב-ReviewWise.",
              },
              {
                icon: Info,
                title: "כיבוי אוטומטי",
                body: "אם העסק מאבד אימות או עובר לתכנית חינמית, הווידג׳ט מוסתר אוטומטית.",
              },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={12} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrustBadgeDashboard;

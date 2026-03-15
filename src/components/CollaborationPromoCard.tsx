import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Handshake, TrendingUp, Users, Tag, ArrowUpRight, Settings, CheckCircle2,
  MousePointerClick, Copy, Check,
} from "lucide-react";
import { type CollabConfig } from "./CollaborationSetupModal";
import CollaborationSetupModal from "./CollaborationSetupModal";
import { motion } from "framer-motion";

interface Props {
  businessId: string;
  businessSlug: string;
  config: CollabConfig;
  onConfigChange: (cfg: CollabConfig) => void;
  referralClickCount: number;
}

const BASE_URL = "https://reviewhub.co.il";

const CollaborationPromoCard = ({
  businessId,
  businessSlug,
  config,
  onConfigChange,
  referralClickCount,
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = `${BASE_URL}/go/${businessSlug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        {/* ── INACTIVE: Large promotional banner ─────────────────────────── */}
        {!config.active && (
          <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-l from-primary/8 via-background to-background p-6">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Handshake size={12} /> תוכנית שיתוף פעולה — חדש
                </div>

                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-2">
                  הצטרפו לתשתית האימות של ReviewHub
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mb-4">
                  הפעילו את תוכנית האימות ואפשרו לגולשי ReviewHub לרכוש בתנאי קהילה מסונכרנים —{" "}
                  <strong className="text-foreground">10% הנחה לקהילת ReviewHub</strong> הנגזרת
                  מכוח הקנייה הקולקטיבי. רכישות דרך ReviewHub עוברות אימות אוטומטי ומקנות סטטוס ״קונה מאומת״ לגולש. עמלת תפעול עשויה להיווצר — אינה משפיעה על ציון האמון שלכם.
                </p>

                {/* Benefits row */}
                <div className="flex flex-wrap gap-4 mb-5">
                  {[
                    { icon: Users,            text: "גולשים ממאגר ReviewHub" },
                    { icon: Tag,              text: "10% הנחה לקהילה — עמלת תפעול" },
                    { icon: TrendingUp,       text: "ניתוח קליקים בלוח הבקרה" },
                    { icon: ArrowUpRight,     text: "השתתפות אופציונלית תמיד" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon size={13} className="text-primary shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-primary"
                >
                  <Handshake size={15} /> הפעלת שיתוף פעולה
                </Button>
              </div>

              {/* Visual: mock offer badge */}
              <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
                <div className="w-36 h-36 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-2 p-4">
                  <Handshake size={32} className="text-primary" />
                  <p className="text-center text-xs font-semibold text-foreground leading-tight">
                    תנאי רכישה מסונכרנים
                  </p>
                  <div className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1 rounded-lg">
                    -10%
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-center max-w-[140px]">
                  כך ייראה בפרופיל הציבורי שלכם
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVE: Compact status card ────────────────────────────────── */}
        {config.active && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Status */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">שיתוף פעולה פעיל</p>
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      פעיל
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.method === "link" && "שיטה: קישור הפניה"}
                    {config.method === "coupon" && `שיטה: קופון — ${config.coupon}`}
                    {config.method === "both" && `שיטה: קישור + קופון ${config.coupon}`}
                  </p>
                </div>
              </div>

              {/* Stat */}
              <div className="flex items-center gap-1.5 text-sm shrink-0">
                <MousePointerClick size={14} className="text-primary" />
                <span className="font-bold text-foreground">{referralClickCount}</span>
                <span className="text-xs text-muted-foreground">קליקי הפניה</span>
              </div>

              {/* Referral link quick-copy */}
              {(config.method === "link" || config.method === "both") && (
                <div className="flex items-center gap-2 shrink-0">
                  <code className="text-xs bg-muted/60 border border-border/40 px-2 py-1 rounded font-mono hidden lg:block max-w-[180px] truncate">
                    {referralUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="gap-1 text-xs h-7"
                  >
                    {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                    {copied ? "הועתק" : "העתקה"}
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1 text-xs h-7 shrink-0"
              >
                <Settings size={12} /> הגדרות
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <CollaborationSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        businessId={businessId}
        businessSlug={businessSlug}
        initial={config}
        onSaved={(cfg) => {
          onConfigChange(cfg);
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default CollaborationPromoCard;

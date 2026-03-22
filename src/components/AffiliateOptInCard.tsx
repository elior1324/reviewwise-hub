/**
 * AffiliateOptInCard
 *
 * Shown at the end of the business registration form.
 * Lets the owner choose one of three affiliate modes:
 *
 *   reviewhub_model    → ReviewHub 5/5 split (recommended)
 *   personal_affiliate → Business provides own affiliate/tracking URL
 *   none               → No affiliate program
 *
 * Parent (BusinessRegister) owns state and receives changes via onChange.
 */

import { Input }  from "@/components/ui/input";
import { Badge }  from "@/components/ui/badge";
import {
  TrendingUp,
  Tag,
  ShieldCheck,
  Info,
  ExternalLink,
  Users,
  Percent,
  BadgeDollarSign,
  Link2,
  XCircle,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AffiliateMode = "reviewhub_model" | "personal_affiliate" | "none";

interface Props {
  mode:                  AffiliateMode;
  personalAffiliateUrls: string[];
  onChange:              (mode: AffiliateMode) => void;
  onUrlsChange:          (urls: string[]) => void;
  businessSlug?:         string;
}

// ── Split rows (for ReviewHub model explanation) ──────────────────────────────

const SPLIT_ROWS = [
  {
    icon:  <Tag size={14} className="text-emerald-500" />,
    label: "לקוח (הקונה)",
    share: "−5%",
    color: "text-emerald-600",
    bg:    "bg-emerald-50 border-emerald-200",
    note:  "הנחה בקופה עם קוד RH5",
  },
  {
    icon:  <BadgeDollarSign size={14} className="text-primary" />,
    label: "ReviewHub",
    share: "5%",
    color: "text-primary",
    bg:    "bg-primary/[0.06] border-primary/20",
    note:  "עמלת פלטפורם — מממנת את תשתית האימות",
  },
  {
    icon:  <TrendingUp size={14} className="text-primary" />,
    label: "העסק שלכם",
    share: "90%",
    color: "text-primary",
    bg:    "bg-primary/5 border-primary/20",
    note:  "הסכום הנותר — מועבר לעסק לאחר כל עסקה",
  },
];

// ── Option card ───────────────────────────────────────────────────────────────

const OptionCard = ({
  optionMode,
  current,
  onSelect,
  title,
  description,
  badge,
  children,
}: {
  optionMode:  AffiliateMode;
  current:     AffiliateMode;
  onSelect:    (m: AffiliateMode) => void;
  title:       string;
  description: string;
  badge?:      string;
  children?:   React.ReactNode;
}) => {
  const isActive = current === optionMode;
  return (
    <button
      type="button"
      onClick={() => onSelect(optionMode)}
      className={`w-full text-right rounded-xl border-2 transition-all duration-200 p-4 ${
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          isActive ? "border-primary" : "border-border/60"
        }`}>
          {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
              {title}
            </span>
            {badge && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                isActive ? "border-primary/40 text-primary bg-primary/5" : "border-border/60"
              }`}>
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-right">{description}</p>
          {isActive && children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AffiliateOptInCard = ({
  mode,
  personalAffiliateUrls,
  onChange,
  onUrlsChange,
  businessSlug,
}: Props) => {
  const previewLink = businessSlug
    ? `reviewshub.info/go/${businessSlug}`
    : "reviewshub.info/go/שם-העסק-שלכם";

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      mode !== "none"
        ? "border-primary/40 bg-primary/3 shadow-md shadow-primary/10"
        : "border-border/60 bg-card"
    }`}>
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-bold text-base text-foreground leading-tight">
                הגדרות שותפים — Affiliate
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold border-border/60 text-muted-foreground px-1.5 py-0">
                אופציונלי
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">בחרו כיצד לקוחות מגיעים אליכם דרך ReviewHub</p>
          </div>
        </div>
      </div>

      {/* Three option cards */}
      <div className="px-5 pb-4 space-y-2">

        {/* Option 1 — ReviewHub 5/5 model */}
        <OptionCard
          optionMode="reviewhub_model"
          current={mode}
          onSelect={onChange}
          title="מודל עמלה של ReviewHub (5% / 5%)"
          description="ReviewHub מייצר קישור ייחודי. לקוחות מקבלים 5% הנחה, ReviewHub גובה 5%, העסק שומר 90%."
          badge="מומלץ"
        >
          {/* Revenue split visual */}
          <div className="space-y-1.5">
            <div className="flex rounded-lg overflow-hidden h-3 mb-2 border border-border/40">
              <div className="bg-emerald-400" style={{ width: "5%" }} title="5% הנחה ללקוח" />
              <div className="bg-primary/70"  style={{ width: "5%" }} title="5% עמלת ReviewHub" />
              <div className="bg-primary flex items-center justify-center text-[8px] font-bold text-white flex-1" title="90% לעסק">90%</div>
            </div>
            {SPLIT_ROWS.map(row => (
              <div key={row.label} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${row.bg}`}>
                <div className="flex items-center gap-2">
                  {row.icon}
                  <span className="text-xs font-medium text-foreground">{row.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={10} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">{row.note}</TooltipContent>
                  </Tooltip>
                </div>
                <span className={`text-sm font-bold ${row.color}`}>{row.share}</span>
              </div>
            ))}
          </div>

          {/* Preview link */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/40 px-3 py-2 mt-2">
            <ExternalLink size={12} className="text-primary shrink-0" />
            <code className="text-xs text-primary font-mono truncate">{previewLink}</code>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">הקישור יופעל מיד לאחר ההרשמה · ניתן לשינוי בכל עת מלוח הבקרה</p>
        </OptionCard>

        {/* Option 2 — Personal affiliate */}
        <OptionCard
          optionMode="personal_affiliate"
          current={mode}
          onSelect={onChange}
          title="קישור שותפים אישי"
          description="יש לכם מערכת שותפים משלכם? הדביקו את הקישור — ReviewHub יפנה אליו ישירות ללא גביית עמלה."
        >
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Link2 size={13} className="text-primary shrink-0" />
              <p className="text-xs font-bold text-foreground">קישורי שותפים אישיים</p>
            </div>

            {/* Dynamic URL rows */}
            {personalAffiliateUrls.map((url, index) => (
              <div key={index} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {/* "ראשי" badge on first entry */}
                  <div className="relative flex-1">
                    {index === 0 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded z-10 pointer-events-none">
                        ראשי
                      </span>
                    )}
                    <Input
                      placeholder="https://your-affiliate-system.com/track?ref=XYZ"
                      value={url}
                      onChange={e => {
                        const updated = [...personalAffiliateUrls];
                        updated[index] = e.target.value;
                        onUrlsChange(updated);
                      }}
                      className={`text-sm font-mono ${index === 0 ? "pr-14" : ""}`}
                      dir="ltr"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  {/* Remove button — only when more than one row */}
                  {personalAffiliateUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onUrlsChange(personalAffiliateUrls.filter((_, i) => i !== index));
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {/* Per-row validation */}
                {url && (() => {
                  try {
                    new URL(url);
                    return (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Check size={10} />
                        <span className="text-[9px] font-semibold">כתובת URL תקינה</span>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle size={10} />
                        <span className="text-[9px] font-semibold">לא תקינה — הזינו https://...</span>
                      </div>
                    );
                  }
                })()}
              </div>
            ))}

            {/* Add URL button */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onUrlsChange([...personalAffiliateUrls, ""]);
              }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold mt-1"
            >
              <Plus size={12} />
              הוסף קישור
            </button>

            <p className="text-[10px] text-muted-foreground">
              לחיצה על "לרכישה" ב-ReviewHub תפנה לקישור הראשי · ניתן להוסיף קישורים ללא הגבלה · ללא עמלת ReviewHub
            </p>
          </div>
        </OptionCard>

        {/* Option 3 — None */}
        <OptionCard
          optionMode="none"
          current={mode}
          onSelect={onChange}
          title="ללא תוכנית שותפים"
          description="כפתור הרכישה יפנה ישירות לאתרכם, ללא מעקב ייחוס ועמלות. ניתן להפעיל תוכנית שותפים בכל עת מלוח הבקרה."
        />

      </div>

      {/* Active confirmation footer */}
      {mode === "reviewhub_model" && (
        <div className="border-t border-primary/20 bg-primary/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            <p className="text-xs font-medium text-primary">
              הצטרפתם למודל 5/5 — הקישור יהיה פעיל מיד לאחר ההרשמה
            </p>
          </div>
        </div>
      )}

      {mode === "personal_affiliate" && (
        <div className="border-t border-border/40 bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <Link2 size={14} className="text-primary" />
            <p className="text-xs font-medium text-foreground">
              {personalAffiliateUrls.some(u => u.trim()) ? "קישורי שותפים אישיים יוגדרו מיד לאחר ההרשמה" : "הזינו לפחות קישור שותפים אחד למעלה"}
            </p>
          </div>
        </div>
      )}

      {/* Legal note */}
      <div className="px-5 pb-4 pt-2">
        <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
          הגדרות תוכנית השותפים אופציונליות לחלוטין ואינן משפיעות על ציון האמון של העסק.
          ניתן לשנות את הבחירה בכל עת מלוח הבקרה תחת "הגדרות שותפים".
          במודל ReviewHub, עמלת 5% מחושבת מהמחיר ברוטו ומנוכית לאחר אישור הרכישה.
        </p>
      </div>
    </div>
  );
};

export default AffiliateOptInCard;

/**
 * AffiliateOptInCard
 *
 * Shown at the end of the business registration form.
 * Explains the ReviewHub Affiliate Program and lets the owner opt in.
 *
 * Business model (5 / 5 split):
 *   • Customer gets  5% discount (coupon RH5)
 *   • ReviewHub gets 5% commission
 *   • Business keeps the remaining 90%
 *
 * This component is purely presentational — the parent (BusinessRegister)
 * owns the `enrolled` boolean state and passes an `onChange` callback.
 */

import { Switch } from "@/components/ui/switch";
import { Label }  from "@/components/ui/label";
import { Badge }  from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Tag,
  ShieldCheck,
  Info,
  ExternalLink,
  Users,
  Percent,
  BadgeDollarSign,
} from "lucide-react";

interface Props {
  enrolled: boolean;
  onChange:  (enrolled: boolean) => void;
  businessSlug?: string; // shown as preview link (optional — not yet saved)
}

// The three parties and their share
const SPLIT_ROWS = [
  {
    icon:  <Tag size={14} className="text-emerald-500" />,
    label: "לקוח (הקונה)",
    share: "−5%",
    color: "text-emerald-600",
    bg:    "bg-emerald-50 border-emerald-200",
    note:  "הנחה מיידית בקופה עם קוד RH5",
  },
  {
    icon:  <BadgeDollarSign size={14} className="text-blue-500" />,
    label: "ReviewHub",
    share: "5%",
    color: "text-blue-600",
    bg:    "bg-blue-50 border-blue-200",
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

const BENEFITS = [
  {
    icon: <Users size={13} className="text-primary" />,
    text: "לקוחות חדשים מגיעים דרך דף העסק שלכם ב-ReviewHub",
  },
  {
    icon: <ShieldCheck size={13} className="text-primary" />,
    text: "כל רכישה דרך הקישור מסומנת אוטומטית כ\"קנייה מאומתת\"",
  },
  {
    icon: <Percent size={13} className="text-primary" />,
    text: "אין עלות כניסה — שילמו רק כשיש המרה בפועל",
  },
  {
    icon: <TrendingUp size={13} className="text-primary" />,
    text: "לוח בקרה עם נתוני קליקים, המרות ועמלות בזמן אמת",
  },
];

const AffiliateOptInCard = ({ enrolled, onChange, businessSlug }: Props) => {
  const previewLink = businessSlug
    ? `reviewshub.info/go/${businessSlug}`
    : "reviewshub.info/go/שם-העסק-שלכם";

  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        enrolled
          ? "border-primary/40 bg-primary/3 shadow-md shadow-primary/10"
          : "border-border/60 bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-bold text-base text-foreground leading-tight">
                תוכנית שותפים — ReviewHub Affiliate
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-primary/40 text-primary bg-primary/5 px-1.5 py-0"
              >
                אופציונלי
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              הגדילו את החשיפה — ReviewHub מביא לקוחות, אתם שומרים 90%
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <Switch
            id="affiliate-toggle"
            checked={enrolled}
            onCheckedChange={onChange}
            className="data-[state=checked]:bg-primary"
          />
          <Label
            htmlFor="affiliate-toggle"
            className={`text-[10px] font-bold cursor-pointer transition-colors ${
              enrolled ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {enrolled ? "פעיל ✓" : "כבוי"}
          </Label>
        </div>
      </div>

      {/* Revenue split visual */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          חלוקת הכנסות — כל עסקה
        </p>

        {/* Visual bar */}
        <div className="flex rounded-lg overflow-hidden h-4 mb-3 border border-border/40">
          <div
            className="bg-emerald-400 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            style={{ width: "5%" }}
            title="5% הנחה ללקוח"
          />
          <div
            className="bg-blue-400 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            style={{ width: "5%" }}
            title="5% עמלת ReviewHub"
          />
          <div
            className="bg-primary flex items-center justify-center text-[9px] font-bold text-white flex-1 transition-all"
            title="90% לעסק"
          >
            90% לעסק
          </div>
        </div>

        {/* Split rows */}
        <div className="space-y-1.5">
          {SPLIT_ROWS.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${row.bg}`}
            >
              <div className="flex items-center gap-2">
                {row.icon}
                <span className="text-xs font-medium text-foreground">{row.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={10} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    {row.note}
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`text-sm font-bold ${row.color}`}>{row.share}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div className="px-5 pb-4">
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
          <p className="text-[10px] font-bold text-muted-foreground mb-2">
            דוגמה — רכישה ב-₪1,000:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "לקוח משלם",   amount: "₪950",  sub: "חסך ₪50",       color: "text-emerald-600" },
              { label: "ReviewHub",    amount: "₪50",   sub: "עמלת פלטפורם",  color: "text-blue-600"   },
              { label: "העסק מקבל",  amount: "₪900",  sub: "90% מהעסקה",    color: "text-primary"    },
            ].map((item) => (
              <div key={item.label} className="bg-background rounded-lg p-2 border border-border/30">
                <div className={`font-bold text-base leading-none ${item.color}`}>
                  {item.amount}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">{item.label}</div>
                <div className="text-[9px] text-muted-foreground/60">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          מה תקבלו?
        </p>
        <ul className="space-y-1.5">
          {BENEFITS.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
              <span className="shrink-0 mt-0.5">{b.icon}</span>
              {b.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Preview link */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          הקישור הייחודי שלכם
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/40 px-3 py-2">
          <ExternalLink size={12} className="text-primary shrink-0" />
          <code className="text-xs text-primary font-mono truncate">{previewLink}</code>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1">
          הקישור יופעל מיד לאחר השלמת ההרשמה
        </p>
      </div>

      {/* Active confirmation banner */}
      {enrolled && (
        <div className="border-t border-primary/20 bg-primary/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            <p className="text-xs font-medium text-primary">
              הצטרפתם לתוכנית השותפים — הקישור שלכם יהיה פעיל מיד לאחר ההרשמה
            </p>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 mr-6">
            ניתן לבטל את ההשתתפות בכל עת דרך לוח הבקרה ← תוכנית שותפים
          </p>
        </div>
      )}

      {/* Legal note */}
      <div className="px-5 pb-4 pt-2">
        <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
          ההצטרפות לתוכנית השותפים אופציונלית לחלוטין ואינה משפיעה על ציון האמון של העסק.
          עמלת 5% מחושבת מהמחיר ברוטו ומנוכית לאחר אישור הרכישה.
          ReviewHub שומרת לעצמה את הזכות לעדכן את תנאי התוכנית עם הודעה מראש.
        </p>
      </div>
    </div>
  );
};

export default AffiliateOptInCard;

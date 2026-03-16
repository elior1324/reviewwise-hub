/**
 * AffiliateProgramPanel
 *
 * Full-featured affiliate program management panel shown inside BusinessDashboard
 * under the "affiliate" tab.
 *
 * Lifecycle-aware: reads affiliate_program_status from the DB to deliver the right
 * UX for each state:
 *
 *   enrolled  → full stats + referral link + toggle to pause
 *   paused    → minimal re-activate CTA with stats still visible
 *   declined  → personalised "you said no at registration — change your mind?" re-engagement
 *   not_set   → generic "join the programme" empty state
 *
 * Duplicate-activation guard: optimistic state update is rolled back on DB error;
 * the server-side column constraint (CHECK ... IN ('not_set','declined','enrolled','paused'))
 * prevents any out-of-band corruption.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Switch }  from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  MousePointerClick,
  ShoppingCart,
  BadgeDollarSign,
  Tag,
  Info,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Percent,
  Sparkles,
  RotateCcw,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import {
  LEARNER_DISCOUNT_RATE,
  PLATFORM_FEE_RATE,
  AFFILIATE_COUPON_CODE,
  formatPrice,
} from "@/lib/affiliate";

// ── Types ────────────────────────────────────────────────────────────────────
type AffiliateProgramStatus = "not_set" | "declined" | "enrolled" | "paused";

interface AffiliateStats {
  total_clicks:        number;
  clicks_30d:          number;
  total_conversions:   number;
  conversions_30d:     number;
  total_revenue:       number;
  platform_commission: number;
  customer_discount:   number;
  conversion_rate:     number;
}

interface Conversion {
  id:                  string;
  transaction_amount:  number | null;
  customer_discount:   number | null;
  platform_commission: number | null;
  business_net:        number | null;
  coupon_code:         string | null;
  status:              "pending" | "confirmed" | "cancelled";
  created_at:          string;
}

interface Props {
  businessId:        string | null;
  businessSlug:      string;
  isDemo:            boolean;
  /** Called whenever enrollment state changes so the parent can sync its own UI (e.g. to dismiss the promo banner) */
  onEnrolledChange?: (enrolled: boolean, status: AffiliateProgramStatus) => void;
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_STATS: AffiliateStats = {
  total_clicks:        248,
  clicks_30d:          73,
  total_conversions:   31,
  conversions_30d:     9,
  total_revenue:       62000,
  platform_commission: 3100,
  customer_discount:   3100,
  conversion_rate:     12.5,
};

const DEMO_CONVERSIONS: Conversion[] = [
  { id: "d1", transaction_amount: 2490, customer_discount: 124, platform_commission: 124, business_net: 2242, coupon_code: "RH5", status: "confirmed", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "d2", transaction_amount: 990,  customer_discount:  49, platform_commission:  49, business_net:  892, coupon_code: "RH5", status: "confirmed", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "d3", transaction_amount: 1790, customer_discount:  89, platform_commission:  89, business_net: 1612, coupon_code: "RH5", status: "confirmed", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "d4", transaction_amount: 490,  customer_discount:  24, platform_commission:  24, business_net:  442, coupon_code: "RH5", status: "pending",   created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, sub, color = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) => (
  <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className={`font-bold text-2xl leading-none ${color}`}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

// ── Revenue split mini-grid (reused in both empty states) ──────────────────────
const SplitGrid = () => (
  <div className="flex justify-center gap-3 flex-wrap">
    {[
      { label: "לקוח חוסך", value: "5%",  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
      { label: "ReviewHub", value: "5%",  color: "text-blue-600",    bg: "bg-blue-50 border-blue-200"       },
      { label: "העסק מקבל", value: "90%", color: "text-primary",    bg: "bg-primary/5 border-primary/20"   },
    ].map(item => (
      <div key={item.label} className={`rounded-xl border px-4 py-2 text-center ${item.bg}`}>
        <div className={`font-bold text-xl ${item.color}`}>{item.value}</div>
        <div className="text-[10px] text-muted-foreground">{item.label}</div>
      </div>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AffiliateProgramPanel = ({ businessId, businessSlug, isDemo, onEnrolledChange }: Props) => {
  const [enrolled,         setEnrolled]         = useState(false);
  const [programStatus,    setProgramStatus]    = useState<AffiliateProgramStatus>("not_set");
  const [loading,          setLoading]          = useState(true);
  const [toggling,         setToggling]         = useState(false);
  const [stats,            setStats]            = useState<AffiliateStats | null>(null);
  const [conversions,      setConversions]      = useState<Conversion[]>([]);
  const [copied,           setCopied]           = useState(false);

  const referralLink = `reviewshub.info/go/${businessSlug}`;
  const fullLink     = `https://reviewshub.info/go/${businessSlug}`;

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (isDemo) {
      setEnrolled(true);
      setProgramStatus("enrolled");
      setStats(DEMO_STATS);
      setConversions(DEMO_CONVERSIONS);
      setLoading(false);
      return;
    }

    if (!businessId) { setLoading(false); return; }

    setLoading(true);
    try {
      // 1. Enrollment status + lifecycle status
      const { data: biz } = await supabase
        .from("businesses")
        .select("affiliate_enrolled, affiliate_program_status")
        .eq("id", businessId)
        .single();

      if (biz) {
        const enrolled = !!biz.affiliate_enrolled;
        const status   = (biz.affiliate_program_status as AffiliateProgramStatus) || "not_set";
        setEnrolled(enrolled);
        setProgramStatus(status);
      }

      // 2. Stats via RPC (always fetch even when not enrolled, so paused users can still see history)
      const { data: statsData } = await supabase.rpc("get_affiliate_stats", { p_business_id: businessId });
      if (statsData) setStats(statsData as AffiliateStats);

      // 3. Recent conversions
      const { data: convData } = await supabase
        .from("business_affiliate_conversions")
        .select("id, transaction_amount, customer_discount, platform_commission, business_net, coupon_code, status, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (convData) setConversions(convData as Conversion[]);
    } catch (err) {
      console.error("[AffiliateProgramPanel] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toggle enrollment ─────────────────────────────────────────────────────
  const handleToggleEnrollment = async (requestedValue: boolean) => {
    if (isDemo) {
      const newStatus: AffiliateProgramStatus = requestedValue ? "enrolled" : "paused";
      setEnrolled(requestedValue);
      setProgramStatus(newStatus);
      toast.success(requestedValue
        ? "הצטרפתם לתוכנית השותפים! (דמו)"
        : "עזבתם את תוכנית השותפים (דמו)"
      );
      return;
    }

    if (!businessId) return;

    // ── Idempotency guard: if already in the desired state, do nothing ──────
    if (requestedValue && enrolled) {
      toast.info("תוכנית השותפים כבר פעילה — הקישור שלכם פעיל.");
      return;
    }
    if (!requestedValue && !enrolled) {
      toast.info("תוכנית השותפים כבר כבויה.");
      return;
    }

    // ── Optimistic update ───────────────────────────────────────────────────
    const prevEnrolled = enrolled;
    const prevStatus   = programStatus;
    const newStatus: AffiliateProgramStatus = requestedValue ? "enrolled" : "paused";

    setToggling(true);
    setEnrolled(requestedValue);
    setProgramStatus(newStatus);

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          affiliate_enrolled:        requestedValue,
          affiliate_enrolled_at:     requestedValue ? new Date().toISOString() : null,
          affiliate_program_status:  newStatus,
        } as any)
        .eq("id", businessId);

      if (error) throw error;

      onEnrolledChange?.(requestedValue, newStatus);

      toast.success(
        requestedValue
          ? "הצטרפתם לתוכנית השותפים — הקישור שלכם פעיל!"
          : "תוכנית השותפים הושהתה. הקישור הושבת."
      );
    } catch (err: any) {
      // ── Rollback optimistic update on error ──────────────────────────────
      setEnrolled(prevEnrolled);
      setProgramStatus(prevStatus);
      toast.error("שגיאה בעדכון הגדרות: " + err.message);
    } finally {
      setToggling(false);
    }
  };

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast.success("הקישור הועתק ללוח");
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (s: string) => {
    if (s === "confirmed") return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">אושרה</Badge>;
    if (s === "cancelled") return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold">בוטלה</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">ממתינה</Badge>;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">טוען נתוני תוכנית השותפים...</span>
      </div>
    );
  }

  // ── Empty state: DECLINED during onboarding ────────────────────────────────
  if (!enrolled && programStatus === "declined") {
    return (
      <div className="space-y-6 pb-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">תוכנית שותפים — Affiliate</h2>
        </div>

        {/* Re-engagement card */}
        <div className="rounded-2xl border-2 border-dashed border-amber-300/60 bg-amber-50/30 dark:bg-amber-900/10 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <RotateCcw size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs mb-3">דחיתם את ההצעה בהרשמה</Badge>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            עדיין לא מאוחר להצטרף
          </h3>
          <p className="text-sm text-muted-foreground mb-1 max-w-sm mx-auto">
            בחרתם לא להצטרף לתוכנית השותפים בעת ההרשמה — אבל ניתן להפעיל אותה בכל רגע.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            ההפעלה מיידית · אין עלות כניסה · משלמים רק כשיש המרה בפועל
          </p>

          <SplitGrid />

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => handleToggleEnrollment(true)}
              className="glow-primary gap-2"
              disabled={toggling}
            >
              {toggling
                ? <Loader2 size={14} className="animate-spin" />
                : <PlayCircle size={14} />
              }
              הפעל תוכנית שותפים עכשיו
            </Button>
          </div>

          {/* What you get */}
          <div className="mt-6 text-right max-w-sm mx-auto space-y-2">
            {[
              "קישור ייחודי reviewshub.info/go/" + businessSlug,
              "לקוחות מקבלים 5% הנחה אוטומטית עם קוד " + AFFILIATE_COUPON_CODE,
              "מעקב קליקים והמרות בזמן אמת",
              "דוח עמלות ורכישות ישירות בלוח הבקרה",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={13} className="text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state: PAUSED (was enrolled, then disabled) ─────────────────────
  if (!enrolled && programStatus === "paused") {
    return (
      <div className="space-y-6 pb-4" dir="rtl">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">תוכנית שותפים — Affiliate</h2>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">מושהה</Badge>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/20 dark:bg-amber-900/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <PauseCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">התוכנית מושהית כרגע</p>
              <p className="text-xs text-muted-foreground">הקישור כבוי. קליקים חדשים לא נרשמים. המרות קודמות נשמרות.</p>
            </div>
          </div>

          <Button
            onClick={() => handleToggleEnrollment(true)}
            className="gap-2"
            disabled={toggling}
            variant="outline"
          >
            {toggling
              ? <Loader2 size={14} className="animate-spin" />
              : <PlayCircle size={14} className="text-emerald-600" />
            }
            הפעל שוב את תוכנית השותפים
          </Button>
        </div>

        {/* Historical stats still visible even while paused */}
        {stats && (stats.total_conversions > 0 || stats.total_clicks > 0) && (
          <>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">היסטוריה</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-70">
              <StatCard icon={<MousePointerClick size={13} />} label="קליקים סה״כ"      value={stats.total_clicks.toLocaleString("he-IL")} />
              <StatCard icon={<ShoppingCart size={13} />}      label="המרות סה״כ"       value={stats.total_conversions.toLocaleString("he-IL")} color="text-emerald-600" />
              <StatCard icon={<Percent size={13} />}           label="אחוז המרה"         value={`${stats.conversion_rate}%`} color="text-amber-600" />
              <StatCard icon={<BadgeDollarSign size={13} />}   label="הכנסה גולמית סה״כ" value={formatPrice(stats.total_revenue)} color="text-blue-600" />
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Empty state: NOT_SET (never made a decision) ───────────────────────────
  if (!enrolled && (programStatus === "not_set")) {
    return (
      <div className="space-y-6 pb-4" dir="rtl">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">תוכנית שותפים — Affiliate</h2>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            הצטרפו לתוכנית השותפים
          </h3>
          <p className="text-sm text-muted-foreground mb-1 max-w-sm mx-auto">
            קבלו קישור ייחודי — כל לקוח שיגיע דרכו יקבל הנחה של 5%, ואתם שומרים 90% מהעסקה.
          </p>
          <p className="text-xs text-muted-foreground mb-6">ללא עלות כניסה — שילמו רק כשיש המרה בפועל</p>

          <SplitGrid />

          <Button onClick={() => handleToggleEnrollment(true)} className="mt-6 glow-primary gap-2" disabled={toggling}>
            {toggling ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            הצטרף לתוכנית השותפים
          </Button>
        </div>
      </div>
    );
  }

  // ── ENROLLED — full panel ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-4" dir="rtl">

      {/* Header + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="font-display font-bold text-xl text-foreground">תוכנית שותפים — Affiliate</h2>
            {isDemo && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50">דמו</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            לקוחות מגיעים דרך ReviewHub · אתם שומרים 90% · הם מקבלים 5% הנחה
          </p>
        </div>

        {/* Enrollment toggle */}
        <div className="flex items-center gap-3 bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">תוכנית פעילה</p>
            <p className="text-[10px] text-muted-foreground">לחצו להשהיה זמנית</p>
          </div>
          {toggling ? (
            <Loader2 size={18} className="animate-spin text-primary" />
          ) : (
            <Switch
              checked={enrolled}
              onCheckedChange={handleToggleEnrollment}
              className="data-[state=checked]:bg-primary"
            />
          )}
        </div>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ExternalLink size={14} className="text-primary" />
          <p className="text-xs font-bold text-primary uppercase tracking-wide">הקישור הייחודי שלכם</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-2.5">
            <code className="text-sm text-primary font-mono">{referralLink}</code>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "הועתק!" : "העתק"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(fullLink, "_blank")}
                className="shrink-0 border-border/60"
              >
                <ArrowUpRight size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>פתח בכרטיסייה חדשה</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          שתפו קישור זה בכל ערוץ — לקוחות שיגיעו דרכו יקבלו 5% הנחה אוטומטית עם קוד{" "}
          <code className="font-mono font-bold text-primary">{AFFILIATE_COUPON_CODE}</code>
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">סטטיסטיקות</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadData}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={12} className="mr-1" />
                <span className="text-xs">רענן</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={<MousePointerClick size={13} />}
                label="קליקים (30 יום)"
                value={stats.clicks_30d.toLocaleString("he-IL")}
                sub={`סה״כ: ${stats.total_clicks.toLocaleString("he-IL")}`}
              />
              <StatCard
                icon={<ShoppingCart size={13} />}
                label="המרות (30 יום)"
                value={stats.conversions_30d.toLocaleString("he-IL")}
                sub={`סה״כ: ${stats.total_conversions.toLocaleString("he-IL")}`}
                color="text-emerald-600"
              />
              <StatCard
                icon={<Percent size={13} />}
                label="אחוז המרה"
                value={`${stats.conversion_rate}%`}
                sub="מקליק לרכישה"
                color={stats.conversion_rate >= 10 ? "text-emerald-600" : "text-amber-600"}
              />
              <StatCard
                icon={<BadgeDollarSign size={13} />}
                label="עמלות (סה״כ)"
                value={formatPrice(stats.platform_commission)}
                sub={`הנחות ללקוחות: ${formatPrice(stats.customer_discount)}`}
                color="text-blue-600"
              />
            </div>
          </div>

          {/* Revenue visual */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              פירוט הכנסות מאומתות — עסקאות מאושרות
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon:  <Tag size={14} className="text-emerald-500" />,
                  label: "חסכון ללקוחות",
                  value: formatPrice(stats.customer_discount),
                  sub:   `${LEARNER_DISCOUNT_RATE * 100}% הנחה`,
                  color: "text-emerald-600",
                },
                {
                  icon:  <BadgeDollarSign size={14} className="text-blue-500" />,
                  label: "עמלת ReviewHub",
                  value: formatPrice(stats.platform_commission),
                  sub:   `${PLATFORM_FEE_RATE * 100}% עמלת פלטפורם`,
                  color: "text-blue-600",
                },
                {
                  icon:  <TrendingUp size={14} className="text-primary" />,
                  label: "הכנסה גולמית",
                  value: formatPrice(stats.total_revenue),
                  sub:   "לפני ניכוי עמלה",
                  color: "text-primary",
                },
              ].map(item => (
                <div key={item.label} className="text-center rounded-lg bg-muted/30 border border-border/40 p-3">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                  <div className={`font-bold text-xl ${item.color}`}>{item.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recent conversions table */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">המרות אחרונות</p>

        {conversions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
            <BarChart3 size={32} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">עדיין אין המרות</p>
            <p className="text-xs text-muted-foreground mt-1">
              שתפו את הקישור שלכם — כל רכישה דרכו תופיע כאן
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  {["תאריך", "סכום", "הנחה ללקוח", "עמלה", "לעסק", "סטטוס"].map(h => (
                    <th key={h} className="text-right text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {conversions.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium">
                      {c.transaction_amount ? formatPrice(c.transaction_amount) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-emerald-600 font-medium">
                      {c.customer_discount ? `−${formatPrice(c.customer_discount)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-blue-600 font-medium">
                      {c.platform_commission ? formatPrice(c.platform_commission) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-primary font-bold">
                      {c.business_net ? formatPrice(c.business_net) : "—"}
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-primary" />
          <p className="text-xs font-bold text-foreground">איך זה עובד?</p>
        </div>
        <ol className="space-y-2">
          {[
            `שתפו את הקישור reviewshub.info/go/${businessSlug} בכל ערוץ — אתר, אימייל, WhatsApp, רשתות חברתיות.`,
            `לקוח שמגיע דרך הקישור רואה דף עם הסבר על ה-5% הנחה וקוד RH5. הוא מועבר לאתר שלכם.`,
            `לאחר רכישה — ReviewHub מקבלת אות המרה (דרך הפרמטר ?ref=reviewhub בקישור) ומתעדת את העסקה.`,
            `העסקה מוצגת כ"ממתינה" עד לאישור. לאחר 14 יום מבוצע ניכוי עמלת 5% ממה שהעסק קיבל.`,
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-start gap-2">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              ניתן להשהות את התוכנית בכל עת. השהיה מפסיקה מעקב קליקים חדש אך אינה משפיעה על המרות שכבר תועדו.
              עמלות מאושרות אינן ניתנות להחזר. ReviewHub שומרת את הזכות לעדכן את תנאי התוכנית עם הודעה מראש של 30 יום.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProgramPanel;

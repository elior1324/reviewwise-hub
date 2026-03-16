/**
 * AffiliateProgramPanel
 *
 * Full affiliate management panel inside BusinessDashboard → "affiliate" tab.
 *
 * Supports three affiliate modes (affiliate_mode column on businesses):
 *
 *   reviewhub_model    → ReviewHub 5/5 split. Platform generates the referral
 *                        link, tracks clicks & conversions, shows stats.
 *   personal_affiliate → Business uses its own affiliate/tracking URL. We
 *                        redirect /go/:slug → personal_affiliate_url. No RH
 *                        commission tracking.
 *   none               → No affiliate program. /go/:slug redirects directly
 *                        to the business website without tracking.
 *
 * The legacy affiliate_program_status lifecycle (enrolled/paused/declined/not_set)
 * is still used to power the ReviewHub model stats history & toggle semantics.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Switch }  from "@/components/ui/switch";
import { Input }   from "@/components/ui/input";
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
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Link2,
  XCircle,
  CheckCircle2,
  Settings2,
  Save,
} from "lucide-react";
import {
  LEARNER_DISCOUNT_RATE,
  PLATFORM_FEE_RATE,
  AFFILIATE_COUPON_CODE,
  formatPrice,
} from "@/lib/affiliate";

// ── Types ────────────────────────────────────────────────────────────────────

type AffiliateMode         = "reviewhub_model" | "personal_affiliate" | "none";
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

// ── Sub-components ─────────────────────────────────────────────────────────────

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

// ── Affiliate Status Banner ─────────────────────────────────────────────────
// Shows the currently active affiliate mode at a glance.

const AffiliatStatusBanner = ({
  mode,
  personalUrl,
}: {
  mode: AffiliateMode;
  personalUrl: string | null;
}) => {
  const CONFIG: Record<AffiliateMode, {
    label: string;
    sub:   string;
    color: string;
    bg:    string;
    dot:   string;
  }> = {
    reviewhub_model: {
      label: "מודל עמלה של ReviewHub (5% / 5%)",
      sub:   "לקוחות מקבלים 5% הנחה · ReviewHub גובה 5% עמלה · העסק שומר 90%",
      color: "text-emerald-700 dark:text-emerald-400",
      bg:    "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
      dot:   "bg-emerald-500",
    },
    personal_affiliate: {
      label: "קישור שותפים אישי",
      sub:   personalUrl ? `מפנה דרך: ${personalUrl.substring(0, 50)}${personalUrl.length > 50 ? "…" : ""}` : "טרם הוגדר קישור אישי",
      color: "text-blue-700 dark:text-blue-400",
      bg:    "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      dot:   personalUrl ? "bg-blue-500" : "bg-amber-500",
    },
    none: {
      label: "תוכנית שותפים לא פעילה",
      sub:   "לקוחות מגיעים לאתרכם ישירות ללא מעקב",
      color: "text-muted-foreground",
      bg:    "bg-muted/30 border-border/40",
      dot:   "bg-muted-foreground/50",
    },
  };

  const cfg = CONFIG[mode];

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${cfg.bg}`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
      <div className="min-w-0">
        <p className={`text-sm font-bold ${cfg.color}`}>
          סטטוס שותפים: {cfg.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{cfg.sub}</p>
      </div>
    </div>
  );
};

// ── Mode Selector ─────────────────────────────────────────────────────────────
// Three-card selector for choosing affiliate mode in the dashboard.

const ModeCard = ({
  mode,
  selected,
  onSelect,
  title,
  description,
  badge,
  children,
}: {
  mode:        AffiliateMode;
  selected:    AffiliateMode;
  onSelect:    (m: AffiliateMode) => void;
  title:       string;
  description: string;
  badge?:      string;
  children?:   React.ReactNode;
}) => {
  const isActive = selected === mode;
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={`w-full text-right rounded-xl border-2 transition-all duration-200 p-4 ${
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-3">
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
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          {isActive && children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AffiliateProgramPanel = ({ businessId, businessSlug, isDemo, onEnrolledChange }: Props) => {
  const [affiliateMode,        setAffiliateMode]        = useState<AffiliateMode>("none");
  const [personalAffiliateUrl, setPersonalAffiliateUrl] = useState("");
  const [urlInputDraft,        setUrlInputDraft]        = useState("");
  const [enrolled,             setEnrolled]             = useState(false);
  const [programStatus,        setProgramStatus]        = useState<AffiliateProgramStatus>("not_set");
  const [loading,              setLoading]              = useState(true);
  const [saving,               setSaving]              = useState(false);
  const [stats,                setStats]               = useState<AffiliateStats | null>(null);
  const [conversions,          setConversions]          = useState<Conversion[]>([]);
  const [copied,               setCopied]              = useState(false);
  const [settingsOpen,         setSettingsOpen]        = useState(false);
  const [draftMode,            setDraftMode]           = useState<AffiliateMode>("none");

  const referralLink = `reviewshub.info/go/${businessSlug}`;
  const fullLink     = `https://reviewshub.info/go/${businessSlug}`;

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (isDemo) {
      setAffiliateMode("reviewhub_model");
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
      const { data: biz } = await supabase
        .from("businesses")
        .select("affiliate_enrolled, affiliate_program_status, affiliate_mode, personal_affiliate_url")
        .eq("id", businessId)
        .single();

      if (biz) {
        const mode    = (biz.affiliate_mode as AffiliateMode) || "none";
        const status  = (biz.affiliate_program_status as AffiliateProgramStatus) || "not_set";
        const url     = (biz.personal_affiliate_url as string) || "";
        setAffiliateMode(mode);
        setDraftMode(mode);
        setEnrolled(!!biz.affiliate_enrolled);
        setProgramStatus(status);
        setPersonalAffiliateUrl(url);
        setUrlInputDraft(url);
      }

      // Stats only relevant for reviewhub_model
      const { data: statsData } = await supabase.rpc("get_affiliate_stats", { p_business_id: businessId });
      if (statsData) setStats(statsData as AffiliateStats);

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

  // ── Save affiliate mode change ─────────────────────────────────────────────
  const handleSaveMode = async () => {
    if (isDemo) {
      setAffiliateMode(draftMode);
      toast.success("הגדרות עודכנו (דמו)");
      setSettingsOpen(false);
      return;
    }

    if (!businessId) return;

    // Validate personal URL if that mode is selected
    if (draftMode === "personal_affiliate" && urlInputDraft.trim()) {
      try {
        new URL(urlInputDraft.trim());
      } catch {
        toast.error("כתובת URL לא תקינה — הזינו כתובת מלאה (לדוגמה: https://example.com/track)");
        return;
      }
    }

    setSaving(true);

    // Derive the legacy affiliate_enrolled + affiliate_program_status from the new mode
    const isEnrolled  = draftMode === "reviewhub_model";
    const newStatus: AffiliateProgramStatus =
      draftMode === "reviewhub_model"    ? "enrolled" :
      draftMode === "personal_affiliate" ? "enrolled" :  // still "active" in intent
      programStatus === "enrolled" || programStatus === "paused" ? "paused" : programStatus;

    const updatePayload: Record<string, unknown> = {
      affiliate_mode:          draftMode,
      personal_affiliate_url:  draftMode === "personal_affiliate" ? (urlInputDraft.trim() || null) : null,
      affiliate_enrolled:      isEnrolled,
      affiliate_enrolled_at:   isEnrolled ? new Date().toISOString() : null,
      affiliate_program_status: newStatus,
    };

    try {
      const { error } = await supabase
        .from("businesses")
        .update(updatePayload as any)
        .eq("id", businessId);

      if (error) throw error;

      setAffiliateMode(draftMode);
      setPersonalAffiliateUrl(draftMode === "personal_affiliate" ? urlInputDraft.trim() : "");
      setEnrolled(isEnrolled);
      setProgramStatus(newStatus);
      onEnrolledChange?.(isEnrolled, newStatus);

      setSettingsOpen(false);

      const modeLabels: Record<AffiliateMode, string> = {
        reviewhub_model:    "מודל ReviewHub (5%/5%) הופעל",
        personal_affiliate: "קישור שותפים אישי נשמר",
        none:               "תוכנית השותפים הושבתה",
      };
      toast.success(modeLabels[draftMode]);
    } catch (err: any) {
      toast.error("שגיאה בשמירת הגדרות: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── ReviewHub model toggle (pause / resume) ────────────────────────────────
  const handleToggleReviewhubModel = async (requestedValue: boolean) => {
    if (isDemo) {
      const newStatus: AffiliateProgramStatus = requestedValue ? "enrolled" : "paused";
      setEnrolled(requestedValue);
      setProgramStatus(newStatus);
      toast.success(requestedValue ? "הצטרפתם לתוכנית השותפים! (דמו)" : "עזבתם את תוכנית השותפים (דמו)");
      return;
    }

    if (!businessId) return;
    if (requestedValue && enrolled) { toast.info("תוכנית השותפים כבר פעילה — הקישור שלכם פעיל."); return; }
    if (!requestedValue && !enrolled) { toast.info("תוכנית השותפים כבר כבויה."); return; }

    const prevEnrolled = enrolled;
    const prevStatus   = programStatus;
    const newStatus: AffiliateProgramStatus = requestedValue ? "enrolled" : "paused";

    setEnrolled(requestedValue);
    setProgramStatus(newStatus);

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          affiliate_enrolled:       requestedValue,
          affiliate_enrolled_at:    requestedValue ? new Date().toISOString() : null,
          affiliate_program_status: newStatus,
          affiliate_mode:           requestedValue ? "reviewhub_model" : "none",
        } as any)
        .eq("id", businessId);

      if (error) throw error;
      if (!requestedValue) setAffiliateMode("none");
      onEnrolledChange?.(requestedValue, newStatus);
      toast.success(requestedValue ? "הצטרפתם לתוכנית השותפים — הקישור שלכם פעיל!" : "תוכנית השותפים הושהתה. הקישור הושבת.");
    } catch (err: any) {
      setEnrolled(prevEnrolled);
      setProgramStatus(prevStatus);
      toast.error("שגיאה בעדכון הגדרות: " + err.message);
    }
  };

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast.success("הקישור הועתק ללוח");
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Status badge helper ────────────────────────────────────────────────────
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
        <span className="text-sm">טוען הגדרות שותפים...</span>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-4" dir="rtl">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="font-display font-bold text-xl text-foreground">הגדרות שותפים — Affiliate</h2>
            {isDemo && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50">דמו</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            בחרו כיצד ReviewHub ישלח לכם לקוחות וכיצד ייוחסו הרכישות
          </p>
        </div>

        {/* Settings toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSettingsOpen(o => !o); setDraftMode(affiliateMode); setUrlInputDraft(personalAffiliateUrl); }}
          className="gap-1.5 shrink-0"
        >
          <Settings2 size={13} />
          {settingsOpen ? "סגור הגדרות" : "ערוך הגדרות"}
        </Button>
      </div>

      {/* ── Status banner — always visible ────────────────────────────────── */}
      <AffiliatStatusBanner mode={affiliateMode} personalUrl={personalAffiliateUrl || null} />

      {/* ── Settings panel — shown when editing ───────────────────────────── */}
      {settingsOpen && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/3 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 size={14} className="text-primary" />
            <p className="text-sm font-bold text-foreground">הגדרות תוכנית שותפים</p>
          </div>

          {/* Three mode cards */}
          <div className="space-y-3">

            {/* Option 1 — ReviewHub model */}
            <ModeCard
              mode="reviewhub_model"
              selected={draftMode}
              onSelect={setDraftMode}
              title="מודל עמלה של ReviewHub (5% / 5%)"
              description="ReviewHub מייצר קישור ייחודי עבורכם. כל רכישה שמגיעה דרכו מעניקה ללקוח 5% הנחה, ו-ReviewHub גובה 5% עמלה. העסק שומר 90%."
              badge="מומלץ"
            >
              <SplitGrid />
              <p className="text-[11px] text-muted-foreground mt-2">
                קישורכם: <code className="text-primary font-mono">{referralLink}</code>
              </p>
            </ModeCard>

            {/* Option 2 — Personal affiliate */}
            <ModeCard
              mode="personal_affiliate"
              selected={draftMode}
              onSelect={setDraftMode}
              title="קישור שותפים אישי"
              description="יש לכם מערכת שותפים משלכם? הדביקו את קישור המעקב שלכם כאן. כל לחיצה על /go/שם-העסק תפנה ישירות לקישור שלכם — ללא עמלת ReviewHub."
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 size={13} className="text-primary shrink-0" />
                  <p className="text-xs font-bold text-foreground">קישור שותפים אישי</p>
                </div>
                <Input
                  placeholder="https://your-affiliate-system.com/track?ref=XYZ"
                  value={urlInputDraft}
                  onChange={e => setUrlInputDraft(e.target.value)}
                  className="text-sm font-mono"
                  dir="ltr"
                  onClick={e => e.stopPropagation()}
                />
                <p className="text-[10px] text-muted-foreground">
                  כל לחיצה על הקישור ב-ReviewHub תפנה ישירות לכתובת זו · ללא גביית עמלה על ידי ReviewHub
                </p>
              </div>
            </ModeCard>

            {/* Option 3 — None */}
            <ModeCard
              mode="none"
              selected={draftMode}
              onSelect={setDraftMode}
              title="ללא תוכנית שותפים"
              description="כפתור הרכישה בדף העסק יפנה ישירות לאתרכם — ללא מעקב ייחוס, ללא הנחות לקוחות, וללא עמלות."
            />

          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(false)}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMode}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              שמור הגדרות
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODE-SPECIFIC CONTENT
          ════════════════════════════════════════════════════════════════════ */}

      {/* ── NONE mode ─────────────────────────────────────────────────────── */}
      {affiliateMode === "none" && !settingsOpen && (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            תוכנית שותפים לא מוגדרת
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            לחצו על "ערוך הגדרות" כדי לבחור מודל שותפים — ReviewHub 5/5, או קישור שותפים אישי.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSettingsOpen(true); setDraftMode("reviewhub_model"); }}
            className="gap-1.5"
          >
            <Settings2 size={13} />
            הגדר תוכנית שותפים
          </Button>
        </div>
      )}

      {/* ── PERSONAL AFFILIATE mode ───────────────────────────────────────── */}
      {affiliateMode === "personal_affiliate" && !settingsOpen && (
        <div className="space-y-4">
          {/* Personal URL card */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={14} className="text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">קישור שותפים אישי — פעיל</p>
            </div>
            {personalAffiliateUrl ? (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-2.5 overflow-hidden">
                    <code className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">{personalAffiliateUrl}</code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(personalAffiliateUrl, "_blank")}
                    className="shrink-0"
                  >
                    <ExternalLink size={13} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  כל לחיצה על "לרכישה" בדף העסק שלכם ב-ReviewHub תפנה ישירות לקישור זה.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mt-1">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-xs">לא הוגדר קישור אישי — לחצו "ערוך הגדרות" להוספה.</p>
              </div>
            )}
          </div>

          {/* ReviewHub referral link — still works as the entry point */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={14} className="text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-wide">קישור כניסה ב-ReviewHub</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-2.5">
                <code className="text-sm text-primary font-mono">{referralLink}</code>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "הועתק!" : "העתק"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              לקוחות המגיעים דרך קישור זה יופנו אוטומטית לקישור השותפים האישי שלכם.
            </p>
          </div>

          {/* Info callout */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">כיצד זה עובד?</p>
                <p>כל לחיצה על הקישור ReviewHub ({referralLink}) תפנה ישירות לקישור השותפים שהגדרתם.</p>
                <p>המעקב, הניתוח, ועמלות השותפים מנוהלים במלואם במערכת השותפים שלכם — ReviewHub אינה גובה עמלה.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEWHUB MODEL — full panel ──────────────────────────────────── */}
      {affiliateMode === "reviewhub_model" && (
        <>
          {/* Active/Paused toggle — only for reviewhub_model */}
          {!settingsOpen && (
            <div className="flex items-center justify-between gap-4 bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {enrolled ? "תוכנית פעילה — הקישור שלכם פעיל" : "תוכנית מושהית"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {enrolled ? "לחצו להשהיה זמנית" : "לחצו להפעלה מחדש"}
                </p>
              </div>
              <Switch
                checked={enrolled}
                onCheckedChange={handleToggleReviewhubModel}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          )}

          {/* PAUSED sub-state */}
          {!enrolled && programStatus === "paused" && !settingsOpen && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/20 dark:bg-amber-900/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <PauseCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">התוכנית מושהית כרגע</p>
                  <p className="text-xs text-muted-foreground">הקישור כבוי. קליקים חדשים לא נרשמים. המרות קודמות נשמרות.</p>
                </div>
              </div>
              <Button onClick={() => handleToggleReviewhubModel(true)} className="gap-2" variant="outline">
                <PlayCircle size={14} className="text-emerald-600" />
                הפעל שוב
              </Button>
            </div>
          )}

          {/* Referral link — always show when mode is reviewhub */}
          {enrolled && !settingsOpen && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink size={14} className="text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wide">הקישור הייחודי שלכם</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-2.5">
                  <code className="text-sm text-primary font-mono">{referralLink}</code>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "הועתק!" : "העתק"}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => window.open(fullLink, "_blank")} className="shrink-0 border-border/60">
                      <ArrowUpRight size={13} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>פתח בכרטיסייה חדשה</TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                שתפו קישור זה — לקוחות שיגיעו דרכו יקבלו 5% הנחה אוטומטית עם קוד{" "}
                <code className="font-mono font-bold text-primary">{AFFILIATE_COUPON_CODE}</code>
              </p>
            </div>
          )}

          {/* Stats */}
          {stats && enrolled && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">סטטיסטיקות</p>
                  <Button size="sm" variant="ghost" onClick={loadData} className="h-7 px-2 text-muted-foreground hover:text-foreground">
                    <RefreshCw size={12} className="mr-1" />
                    <span className="text-xs">רענן</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={<MousePointerClick size={13} />} label="קליקים (30 יום)"    value={stats.clicks_30d.toLocaleString("he-IL")}       sub={`סה״כ: ${stats.total_clicks.toLocaleString("he-IL")}`} />
                  <StatCard icon={<ShoppingCart size={13} />}      label="המרות (30 יום)"     value={stats.conversions_30d.toLocaleString("he-IL")}   sub={`סה״כ: ${stats.total_conversions.toLocaleString("he-IL")}`} color="text-emerald-600" />
                  <StatCard icon={<Percent size={13} />}           label="אחוז המרה"           value={`${stats.conversion_rate}%`}                     sub="מקליק לרכישה" color={stats.conversion_rate >= 10 ? "text-emerald-600" : "text-amber-600"} />
                  <StatCard icon={<BadgeDollarSign size={13} />}   label="עמלות (סה״כ)"        value={formatPrice(stats.platform_commission)}          sub={`הנחות ללקוחות: ${formatPrice(stats.customer_discount)}`} color="text-blue-600" />
                </div>
              </div>

              {/* Revenue visual */}
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">פירוט הכנסות מאומתות — עסקאות מאושרות</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Tag size={14} className="text-emerald-500" />,           label: "חסכון ללקוחות",   value: formatPrice(stats.customer_discount),   sub: `${LEARNER_DISCOUNT_RATE * 100}% הנחה`,           color: "text-emerald-600" },
                    { icon: <BadgeDollarSign size={14} className="text-blue-500" />,  label: "עמלת ReviewHub",   value: formatPrice(stats.platform_commission), sub: `${PLATFORM_FEE_RATE * 100}% עמלת פלטפורם`,     color: "text-blue-600"    },
                    { icon: <TrendingUp size={14} className="text-primary" />,         label: "הכנסה גולמית",    value: formatPrice(stats.total_revenue),       sub: "לפני ניכוי עמלה",                                color: "text-primary"     },
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

          {/* Historical stats when paused */}
          {!enrolled && stats && (stats.total_conversions > 0 || stats.total_clicks > 0) && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">היסטוריה</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-70">
                <StatCard icon={<MousePointerClick size={13} />} label="קליקים סה״כ"       value={stats.total_clicks.toLocaleString("he-IL")} />
                <StatCard icon={<ShoppingCart size={13} />}      label="המרות סה״כ"         value={stats.total_conversions.toLocaleString("he-IL")} color="text-emerald-600" />
                <StatCard icon={<Percent size={13} />}           label="אחוז המרה"           value={`${stats.conversion_rate}%`}                color="text-amber-600" />
                <StatCard icon={<BadgeDollarSign size={13} />}   label="הכנסה גולמית סה״כ"  value={formatPrice(stats.total_revenue)}            color="text-blue-600" />
              </div>
            </>
          )}

          {/* Conversions table */}
          {enrolled && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">המרות אחרונות</p>
              {conversions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
                  <BarChart3 size={32} className="text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">עדיין אין המרות</p>
                  <p className="text-xs text-muted-foreground mt-1">שתפו את הקישור שלכם — כל רכישה דרכו תופיע כאן</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border/60">
                      <tr>
                        {["תאריך", "סכום", "הנחה ללקוח", "עמלה", "לעסק", "סטטוס"].map(h => (
                          <th key={h} className="text-right text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {conversions.map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("he-IL")}</td>
                          <td className="px-3 py-2.5 text-xs font-medium">{c.transaction_amount ? formatPrice(c.transaction_amount) : "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-emerald-600 font-medium">{c.customer_discount ? `−${formatPrice(c.customer_discount)}` : "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-blue-600 font-medium">{c.platform_commission ? formatPrice(c.platform_commission) : "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-primary font-bold">{c.business_net ? formatPrice(c.business_net) : "—"}</td>
                          <td className="px-3 py-2.5">{statusBadge(c.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          {enrolled && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-primary" />
                <p className="text-xs font-bold text-foreground">איך זה עובד?</p>
              </div>
              <ol className="space-y-2">
                {[
                  `שתפו את הקישור reviewshub.info/go/${businessSlug} בכל ערוץ — אתר, אימייל, WhatsApp, רשתות חברתיות.`,
                  `לקוח שמגיע דרך הקישור רואה דף עם הסבר על ה-5% הנחה וקוד RH5. הוא מועבר לאתר שלכם.`,
                  `לאחר רכישה — ReviewHub מקבלת אות המרה ומתעדת את העסקה.`,
                  `העסקה מוצגת כ"ממתינה" עד לאישור. לאחר 14 יום מבוצע ניכוי עמלת 5%.`,
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">{i + 1}</span>
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
          )}
        </>
      )}
    </div>
  );
};

export default AffiliateProgramPanel;

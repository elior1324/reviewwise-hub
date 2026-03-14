import ReactMarkdown from "react-markdown";
import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import InvoiceTemplateUploader from "@/components/InvoiceTemplateUploader";
import TestimonialMediaUploader from "@/components/TestimonialMediaUploader";
import LockedOverlay from "@/components/LockedOverlay";
import DevControlPanel from "@/components/DevControlPanel";
import UpgradeModal from "@/components/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, TrendingUp, Users, MousePointerClick, DollarSign,
  Bell, Brain, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, FileText, Video, HelpCircle,
  Crown, Lock, Webhook, Contact, CalendarClock, Sparkles, Eye, Code2, Link2, Handshake,
  ExternalLink, Tag, BarChart2, Shield, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Briefcase
} from "lucide-react";
import TrustBadgeDashboard from "@/components/TrustBadgeDashboard";
import ModerationCaseTracker from "@/components/ModerationCaseTracker";
import IntegrationsTab from "@/components/IntegrationsTab";
import CollaborationPromoCard from "@/components/CollaborationPromoCard";
import { type CollabConfig } from "@/components/CollaborationSetupModal";
import GoogleLinkingPanel from "@/components/GoogleLinkingPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Review, type Course } from "@/data/mockData";
import { useState, useEffect } from "react";
import { useAuth, SubscriptionTier } from "@/contexts/AuthContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─── Demo sample data (shown to visitors) ────────────────
const DEMO_BUSINESS = { name: "העסק שלכם", email: "you@example.com" };

const DEMO_STATS = [
  { icon: Star, label: "דירוג ממוצע", value: "4.8", change: "+0.2", up: true, tooltip: "הציון הממוצע שלקוחות נתנו לכל הקורסים שלכם." },
  { icon: MessageSquare, label: "סה״כ ביקורות", value: "124", change: "+12", up: true, tooltip: "מספר הביקורות שנכתבו על הקורסים שלכם." },
  { icon: MousePointerClick, label: "קליקים לאתר", value: "94", change: "+23%", up: true, tooltip: "כמה אנשים לחצו על הקישור לאתר שלכם." },
  { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: "₪48,850", change: "+18%", up: true, tooltip: "סך ההכנסות מרכישות שהגיעו דרך קישורי האפיליאט." },
];

const DEMO_REVIEWS: Review[] = [
  { id: "d1", reviewerName: "שרה ל.", rating: 5, text: "קורס מעולה! למדתי המון דברים חדשים שיישמתי מיד בעבודה.", courseName: "שיווק דיגיטלי מאסטרקלאס", courseId: "dc1", businessSlug: "demo", date: "היום", purchaseDate: "2026-01-01", verified: true, anonymous: false },
  { id: "d2", reviewerName: "דני א.", rating: 4, text: "תוכן מצוין, היה נהדר אם היו יותר תרגולים מעשיים.", courseName: "יסודות SEO", courseId: "dc2", businessSlug: "demo", date: "אתמול", purchaseDate: "2026-02-01", verified: true, anonymous: false },
  { id: "d3", reviewerName: "מיכל כ.", rating: 5, text: "המרצה מעולה, הסברים ברורים ודוגמאות מהעולם האמיתי.", courseName: "הסמכת Google Ads", courseId: "dc3", businessSlug: "demo", date: "לפני 3 ימים", purchaseDate: "2026-01-15", verified: true, anonymous: false },
  { id: "d4", reviewerName: "יוסי מ.", rating: 3, text: "הקורס טוב אבל הקצב מהיר מדי למתחילים.", courseName: "אנליטיקס מתקדם", courseId: "dc4", businessSlug: "demo", date: "לפני שבוע", purchaseDate: "2025-12-01", verified: false, anonymous: false },
];

const DEMO_COURSES: Course[] = [
  { id: "dc1", businessSlug: "demo", name: "שיווק דיגיטלי מאסטרקלאס", price: 2490, description: "", affiliateUrl: "", category: "", rating: 4.9, reviewCount: 67, verifiedPurchases: 234 },
  { id: "dc2", businessSlug: "demo", name: "יסודות SEO", price: 990, description: "", affiliateUrl: "", category: "", rating: 4.6, reviewCount: 34, verifiedPurchases: 156 },
  { id: "dc3", businessSlug: "demo", name: "הסמכת Google Ads", price: 1790, description: "", affiliateUrl: "", category: "", rating: 4.8, reviewCount: 23, verifiedPurchases: 89 },
];

const DEMO_CLICKS = [
  { course: "שיווק דיגיטלי מאסטרקלאס", clicks: 45, conversions: 12, revenue: 29880 },
  { course: "יסודות SEO", clicks: 23, conversions: 5, revenue: 4950 },
  { course: "הסמכת Google Ads", clicks: 18, conversions: 7, revenue: 12530 },
  { course: "אנליטיקס מתקדם", clicks: 8, conversions: 1, revenue: 1490 },
];

const DEMO_NOTIFICATIONS = [
  { id: 1, type: "review", text: "שרה ל. השאירה ביקורת של 5 כוכבים על שיווק דיגיטלי מאסטרקלאס", time: "לפני שעתיים" },
  { id: 2, type: "review", text: "ביקורת חדשה של 3 כוכבים על אנליטיקס מתקדם מחכה לתגובתכם", time: "לפני 5 שעות" },
  { id: 3, type: "conversion", text: "רכישה חדשה דרך קישור אפיליאט — הכנסה של ₪2,490", time: "אתמול" },
  { id: 4, type: "alert", text: "מערכת ה-AI זיהתה ביקורת חשודה על יסודות SEO", time: "אתמול" },
  { id: 5, type: "report", text: "דוח ה-AI השבועי מוכן לצפייה", time: "לפני יומיים" },
];

const DEMO_AI_REPORT = {
  date: "1-7 במרץ 2026",
  strengths: [
    "שביעות רצון הלקוחות עלתה ב-12% השבוע",
    "זמן התגובה לביקורות השתפר — ממוצע 4 שעות",
    "הקורס ״שיווק דיגיטלי מאסטרקלאס״ קיבל 5 ביקורות חדשות של 5 כוכבים",
  ],
  weaknesses: [
    "הקורס ״אנליטיקס מתקדם״ ראה ירידה של 15% בהרשמות",
    "2 ביקורות שליליות מציינות שהקצב מהיר מדי למתחילים",
    "אחוז הקליקים באפיליאט ירד ב-8% לעומת השבוע הקודם",
  ],
  recommendations: [
    "שקלו להוסיף מסלול למתחילים בקורס האנליטיקס",
    "הגיבו ל-2 הביקורות השליליות הממתינות תוך 24 שעות",
    "עדכנו את דף הנחיתה של האפיליאט — אחוז הנטישה הנוכחי הוא 45%",
  ],
};

type DemoTier = "free" | "pro" | "enterprise";

// ── Compliance helper components ──────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string; bg: string; icon: any }> = {
  pending:      { label: "ממתין לאימות", cls: "text-muted-foreground", bg: "bg-muted/40", icon: Clock },
  verified:     { label: "מאומת", cls: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  flagged:      { label: "מסומן לבדיקה", cls: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle },
  under_review: { label: "בחקירה", cls: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", icon: Eye },
  removed:      { label: "הוסר", cls: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
};

const ReviewStatusRow = ({
  text, course, status, reason, aiDecision, date,
}: { text: string; course: string; status: string; reason?: string | null; aiDecision?: string | null; date?: string }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className={`w-7 h-7 rounded-md ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={13} className={meta.cls} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80 truncate">{text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{course}{date ? ` · ${date}` : ""}</p>
        {reason && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono bg-muted/30 rounded px-2 py-1 leading-snug">
            {reason}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.cls} border-current/20`}>
        {meta.label}
      </span>
    </div>
  );
};

const REPORT_STATUS_META: Record<string, { label: string; cls: string }> = {
  open:         { label: "פתוח", cls: "text-amber-600 dark:text-amber-400" },
  investigating: { label: "בחקירה", cls: "text-blue-600 dark:text-blue-400" },
  resolved:     { label: "נסגר", cls: "text-green-600 dark:text-green-400" },
  rejected:     { label: "נדחה", cls: "text-muted-foreground" },
};

const ReportRow = ({
  reason, status, aiDecision, aiReason, date,
}: { reason: string; status: string; aiDecision?: string | null; aiReason?: string | null; date?: string }) => {
  const meta = REPORT_STATUS_META[status] || REPORT_STATUS_META.open;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={13} className="text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80">{reason}</p>
        {date && <p className="text-xs text-muted-foreground mt-0.5">{date}</p>}
        {aiReason && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono bg-muted/30 rounded px-2 py-1 leading-snug">
            AI: {aiReason}
          </p>
        )}
        {aiDecision && (
          <p className="text-[10px] text-primary/70 mt-1">החלטה: <span className="font-semibold">{aiDecision}</span></p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/30 ${meta.cls}`}>
        {meta.label}
      </span>
    </div>
  );
};

// ── Purchase Verification helper components ────────────────────────────────

const PV_STATUS: Record<string, { label: string; cls: string; bg: string }> = {
  pending:  { label: "ממתין",   cls: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10" },
  approved: { label: "מאושר",   cls: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10" },
  rejected: { label: "נדחה",   cls: "text-destructive",                    bg: "bg-destructive/10" },
};

/** KPI strip — verified / pending / rejected counts */
const PurchaseVerificationStats = ({ businessId, isDemo }: { businessId: string | null; isDemo: boolean }) => {
  const [counts, setCounts] = useState({ approved: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    if (isDemo || !businessId) {
      setCounts({ approved: 18, pending: 4, rejected: 2 });
      return;
    }
    supabase
      .from("purchase_verifications")
      .select("status")
      .eq("business_id", businessId)
      .then(({ data }) => {
        if (!data) return;
        const c = { approved: 0, pending: 0, rejected: 0 };
        data.forEach((r: any) => { if (r.status in c) c[r.status as keyof typeof c]++; });
        setCounts(c);
      });
  }, [businessId, isDemo]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {([
        { key: "approved", label: "הוכחות מאושרות", icon: CheckCircle2 },
        { key: "pending",  label: "ממתינות לבדיקה",  icon: Clock },
        { key: "rejected", label: "נדחו",            icon: XCircle },
      ] as const).map(({ key, label, icon: Icon }) => (
        <Card key={key} className="shadow-card bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${PV_STATUS[key].bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={PV_STATUS[key].cls} />
            </div>
            <div>
              <p className="font-display font-bold text-xl">{counts[key]}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/** Queue card — lists purchase_verifications with approve / reject actions */
const PurchaseVerificationQueue = ({ businessId, isDemo }: { businessId: string | null; isDemo: boolean }) => {
  const [rows, setRows]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo || !businessId) {
      setRows([
        { id: "d1", proof_type: "receipt", status: "pending",  submitted_at: new Date().toISOString(), reviews: { review_text: "קורס מצוין!", reviewer_name: "יוסי כ." } },
        { id: "d2", proof_type: "receipt", status: "approved", submitted_at: new Date(Date.now() - 86400000).toISOString(), reviews: { review_text: "שירות מעולה.", reviewer_name: "שרה מ." } },
        { id: "d3", proof_type: "invoice", status: "rejected", submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(), rejection_reason: "המסמך לא תואם", reviews: { review_text: "חוויה טובה.", reviewer_name: "דני א." } },
      ]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("purchase_verifications")
      .select("*, reviews(review_text, reviewer_name)")
      .eq("business_id", businessId)
      .order("submitted_at", { ascending: false })
      .limit(30);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [businessId, isDemo]);

  const handleAction = async (id: string, newStatus: "approved" | "rejected") => {
    if (isDemo) return;
    setActioning(id);
    // Capture state for rollback before optimistic update
    const snapshot = rows;
    setRows(r => r.map(x => x.id === id ? { ...x, status: newStatus } : x));
    const row = rows.find(r => r.id === id);
    const { error } = await supabase
      .from("purchase_verifications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      // Rollback on failure (e.g. RLS rejection)
      setRows(snapshot);
      console.error("[PurchaseVerificationQueue] update failed:", error.message);
    } else {
      // ── Trust moderation log ────────────────────────────────────────────
      // Fire-and-forget; log the manual moderation decision for audit trail.
      supabase.from("trust_moderation_log").insert({
        decision_type: newStatus === "approved" ? "verify_purchase_approved" : "verify_purchase_rejected",
        reason:        newStatus === "approved"
          ? "הוכחת הרכישה אומתה ידנית על-ידי הבעלים"
          : "הוכחת הרכישה נדחתה ידנית על-ידי הבעלים",
        source:        "owner_manual",
        review_id:     row?.review_id ?? null,
        business_id:   businessId ?? null,
        metadata:      { purchase_verification_id: id, proof_type: row?.proof_type ?? null },
      }).then(({ error: logErr }) => {
        if (logErr) console.warn("[trust_moderation_log] write failed:", logErr.message);
      });
    }
    setActioning(null);
  };

  const proofTypeLabel: Record<string, string> = {
    receipt: "קבלה",
    invoice: "חשבונית",
    crm:     "CRM",
  };

  return (
    <Card className="shadow-card bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText size={16} className="text-primary" /> תור אימות רכישות
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          הגשות של הוכחות רכישה מלקוחות. אשרו ידנית כל פריט שה-AI לא אישר אוטומטית.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">טוען...</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">אין הגשות ממתינות.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header — desktop only */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[11px] text-muted-foreground font-semibold px-2 pb-1 border-b border-border/30">
              <span>ביקורת</span>
              <span>סוג</span>
              <span>תאריך</span>
              <span>סטטוס / פעולה</span>
            </div>
            {rows.map((row) => {
              const meta = PV_STATUS[row.status] || PV_STATUS.pending;
              return (
                /* Desktop: 4-col grid  |  Mobile: stacked card */
                <div key={row.id} className="sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2.5 border-b border-border/20 last:border-0 px-2 flex flex-col sm:flex-none">
                  <div className="min-w-0 w-full sm:w-auto">
                    <p className="text-sm truncate">{row.reviews?.review_text || "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.reviews?.reviewer_name || "—"}</p>
                    {row.rejection_reason && (
                      <p className="text-[10px] text-destructive/70 mt-0.5">{row.rejection_reason}</p>
                    )}
                  </div>
                  {/* On mobile: show meta inline below review text */}
                  <div className="flex items-center gap-2 sm:contents text-xs text-muted-foreground">
                    <span className="shrink-0">{proofTypeLabel[row.proof_type] || row.proof_type}</span>
                    <span className="shrink-0">{new Date(row.submitted_at).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 sm:justify-end">
                    {row.status === "pending" && !isDemo ? (
                      <>
                        <button
                          onClick={() => handleAction(row.id, "approved")}
                          disabled={actioning === row.id}
                          className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors font-medium disabled:opacity-50"
                        >
                          אשר
                        </button>
                        <button
                          onClick={() => handleAction(row.id, "rejected")}
                          disabled={actioning === row.id}
                          className="text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium disabled:opacity-50"
                        >
                          דחה
                        </button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.cls}`}>
                        {meta.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();

  // Demo tier selector
  const [demoTier, setDemoTier] = useState<DemoTier>("pro");

  // Real data state
  const [isDemo, setIsDemo] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string>("");
  const [businessInfo, setBusinessInfo] = useState<{ name: string; email: string } | null>(null);
  const [realReviews, setRealReviews] = useState<Review[]>([]);
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [realStats, setRealStats] = useState<typeof DEMO_STATS | null>(null);
  const [realClicks, setRealClicks] = useState<typeof DEMO_CLICKS>([]);
  const [realNotifications, setRealNotifications] = useState<typeof DEMO_NOTIFICATIONS>([]);
  const [realLeads, setRealLeads] = useState<any[]>([]);
  const [realWebhooks, setRealWebhooks] = useState<any[]>([]);
  const [realApiKeys, setRealApiKeys] = useState<any[]>([]);
  const [realAiReports, setRealAiReports] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbTier, setDbTier] = useState<SubscriptionTier>("free");
  const [monthlyReviewCount, setMonthlyReviewCount] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalTier, setUpgradeModalTier] = useState<"pro" | "enterprise">("pro");
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | undefined>();

  // Collaboration program state
  const [collabConfig, setCollabConfig] = useState<CollabConfig>({ active: false, method: null, coupon: null });
  const [referralClickCount, setReferralClickCount] = useState(0);
  const [referralClicksData, setReferralClicksData] = useState<{ date: string; clicks: number }[]>([]);

  // Compliance panel state
  const [complianceReviews, setComplianceReviews] = useState<any[]>([]);
  const [openReports, setOpenReports] = useState<any[]>([]);

  // AI report period filter
  const [aiReportPeriod, setAiReportPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Notification strip state
  const [notifStripExpanded, setNotifStripExpanded] = useState(false);

  // Determine tier — use DB tier for real users, demo tier for demo mode
  const currentTier: SubscriptionTier = !isDemo ? dbTier : demoTier;
  const isEnterprise = currentTier === "enterprise";
  const isPro = currentTier === "pro" || currentTier === "enterprise";
  const isFree = currentTier === "free";

  const handleUpgradeWithModal = (tier: "pro" | "enterprise" = "pro", featureName?: string) => {
    setUpgradeModalTier(tier);
    setUpgradeModalFeature(featureName);
    setUpgradeModalOpen(true);
  };

  // Fetch real data if user is logged in and owns a business
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user) {
        setIsDemo(true);
        setLoadingData(false);
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (roleData?.some((r: any) => r.role === "admin")) {
        setIsAdmin(true);
      }

      // Check if user owns a business
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!biz) {
        setIsDemo(true);
        setLoadingData(false);
        return;
      }

      // User has a business — switch to real mode
      setIsDemo(false);
      setBusinessId(biz.id);
      setBusinessSlug(biz.slug);
      setBusinessInfo({ name: biz.name, email: biz.email || user.email || "" });
      setDbTier((biz.subscription_tier || "free") as SubscriptionTier);

      // Fetch monthly review count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: reviewCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("created_at", startOfMonth.toISOString());
      setMonthlyReviewCount(reviewCount || 0);

      // Fetch reviews
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, courses(name)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (reviewData) {
        setRealReviews(reviewData.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : "משתמש",
          rating: r.rating,
          text: r.text,
          courseName: r.courses?.name || "",
          courseId: r.course_id,
          businessSlug: biz.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified || false,
          anonymous: r.anonymous || false,
        })));
      }

      // Fetch courses
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("business_id", biz.id);

      if (courseData) {
        setRealCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: biz.slug,
          name: c.name,
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
          category: c.category || "",
          rating: Number(c.rating) || 0,
          reviewCount: c.review_count || 0,
          verifiedPurchases: c.verified_purchases || 0,
        })));
      }

      // Fetch affiliate clicks
      const { data: clickData } = await supabase
        .from("affiliate_clicks")
        .select("*, courses(name)")
        .eq("courses.business_id", biz.id);

      // Aggregate clicks by course
      if (clickData && clickData.length > 0) {
        const clickMap: Record<string, { course: string; clicks: number; conversions: number; revenue: number }> = {};
        clickData.forEach((c: any) => {
          const name = c.courses?.name || "קורס";
          if (!clickMap[name]) clickMap[name] = { course: name, clicks: 0, conversions: 0, revenue: 0 };
          clickMap[name].clicks++;
          if (c.converted) {
            clickMap[name].conversions++;
            clickMap[name].revenue += Number(c.revenue) || 0;
          }
        });
        setRealClicks(Object.values(clickMap));
      }

      // Build real stats
      const totalClicks = clickData?.length || 0;
      const totalConversions = clickData?.filter((c: any) => c.converted).length || 0;
      const totalRevenue = clickData?.filter((c: any) => c.converted).reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0) || 0;

      setRealStats([
        { icon: Star, label: "דירוג ממוצע", value: (Number(biz.rating) || 0).toFixed(1), change: "", up: true, tooltip: "הציון הממוצע שלקוחות נתנו לכל הקורסים שלכם." },
        { icon: MessageSquare, label: "סה״כ ביקורות", value: String(biz.review_count || 0), change: "", up: true, tooltip: "מספר הביקורות שנכתבו על הקורסים שלכם." },
        { icon: MousePointerClick, label: "קליקים לאתר", value: String(totalClicks), change: "", up: true, tooltip: "כמה אנשים לחצו על הקישור לאתר שלכם." },
        { icon: DollarSign, label: "הכנסות דרך ReviewHub", value: `₪${totalRevenue.toLocaleString()}`, change: "", up: true, tooltip: "סך ההכנסות מרכישות שהגיעו דרך קישורי האפיליאט." },
      ]);

      // Fetch leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (leadsData) setRealLeads(leadsData);

      // Fetch webhooks
      const { data: webhooksData } = await supabase
        .from("business_webhooks")
        .select("*")
        .eq("business_id", biz.id);
      if (webhooksData) setRealWebhooks(webhooksData);

      // Fetch API keys
      const { data: apiKeysData } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, active, last_used_at, created_at")
        .eq("business_id", biz.id);
      if (apiKeysData) setRealApiKeys(apiKeysData);

      // Fetch AI reports
      const { data: aiReportsData } = await supabase
        .from("ai_reports")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (aiReportsData) setRealAiReports(aiReportsData);

      // Fetch collaboration config from business row
      setCollabConfig({
        active: biz.collaboration_active || false,
        method: biz.collaboration_method || null,
        coupon: biz.collaboration_coupon || null,
      });

      // Fetch referral clicks count
      const { count: rclickCount } = await supabase
        .from("referral_clicks")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id);
      setReferralClickCount(rclickCount || 0);

      // Fetch referral clicks by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: rclickRows } = await supabase
        .from("referral_clicks")
        .select("created_at")
        .eq("business_id", biz.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (rclickRows && rclickRows.length > 0) {
        const byDay: Record<string, number> = {};
        rclickRows.forEach((row: any) => {
          const day = new Date(row.created_at).toLocaleDateString("he-IL");
          byDay[day] = (byDay[day] || 0) + 1;
        });
        setReferralClicksData(Object.entries(byDay).map(([date, clicks]) => ({ date, clicks })));
      }

      // Fetch compliance reviews (flagged / under_review / removed)
      const { data: compReviewData } = await supabase
        .from("reviews")
        .select("id, text, rating, status, ai_decision, ai_reason, created_at, courses(name)")
        .eq("business_id", biz.id)
        .in("status", ["flagged", "under_review", "removed", "pending"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (compReviewData) setComplianceReviews(compReviewData);

      // Fetch open reports against this business
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, reason, moderation_status, ai_decision, ai_reason, created_at, review_id")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (reportsData) setOpenReports(reportsData);

      setLoadingData(false);
    };

    fetchBusinessData();
  }, [user]);

  // Choose data source
  const displayBusiness = isDemo ? DEMO_BUSINESS : (businessInfo || DEMO_BUSINESS);
  const displayReviews = isDemo ? DEMO_REVIEWS : realReviews;
  const displayCourses = isDemo ? DEMO_COURSES : realCourses;
  const displayStats = isDemo ? DEMO_STATS : (realStats || DEMO_STATS);
  const displayClicks = isDemo ? DEMO_CLICKS : realClicks;
  const displayNotifications = isDemo ? DEMO_NOTIFICATIONS : realNotifications;
  const aiReport = DEMO_AI_REPORT;

  // Generate real AI report
  const handleGenerateReport = async (type: "weekly" | "daily") => {
    if (!businessId || generatingReport) return;
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-report", {
        body: { business_id: businessId, report_type: type },
      });
      if (error) throw error;
      if (data?.skipped) {
        alert("אין ביקורות חדשות בתקופה הנבחרת.");
      } else {
        // Refresh reports
        const { data: updated } = await supabase
          .from("ai_reports")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (updated) setRealAiReports(updated);
      }
    } catch (e: any) {
      console.error("Report generation error:", e);
      alert("שגיאה ביצירת הדוח. נסו שוב מאוחר יותר.");
    }
    setGeneratingReport(false);
  };

  // Generate API key
  const handleGenerateApiKey = async () => {
    if (!businessId || generatingApiKey) return;
    setGeneratingApiKey(true);
    try {
      // Generate random key
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const rawKey = "rh_live_" + Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
      const prefix = rawKey.substring(0, 8);

      // Hash it
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase.from("api_keys").insert({
        business_id: businessId,
        key_hash: keyHash,
        key_prefix: prefix,
        name: `מפתח ${(realApiKeys.length || 0) + 1}`,
      });
      if (error) throw error;

      // Show key to user (only time they see full key)
      navigator.clipboard.writeText(rawKey);
      alert(`מפתח ה-API שלכם הועתק ללוח:\n${rawKey}\n\nשימרו אותו — לא ניתן יהיה לראות אותו שוב!`);

      // Refresh
      const { data: updated } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, active, last_used_at, created_at")
        .eq("business_id", businessId);
      if (updated) setRealApiKeys(updated);
    } catch (e: any) {
      console.error("API key generation error:", e);
      alert("שגיאה ביצירת מפתח API.");
    }
    setGeneratingApiKey(false);
  };

  const totalClicks = isDemo ? 94 : displayClicks.reduce((s, c) => s + c.clicks, 0);
  const conversions = isDemo ? 25 : displayClicks.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue = isDemo ? 48850 : displayClicks.reduce((s, c) => s + c.revenue, 0);

  const handleUpgrade = () => {
    setUpgradeModalOpen(true);
  };

  const EnterpriseBadge = () => (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold mr-1">
      <Crown size={10} /> אנטרפרייז
    </span>
  );

  const ProBadge = () => (
    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-bold mr-1">
      <Sparkles size={10} /> מקצועי
    </span>
  );

  if (loadingData && user) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <BusinessNavbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <BusinessNavbar />
      <div className="container pt-20 pb-10">

        {/* Demo Banner */}
        {isDemo && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye size={20} className="text-primary" />
              <p className="font-display font-semibold text-foreground">🎯 מצב דמו — כך ייראה לוח הבקרה שלכם אחרי ההרשמה</p>
            </div>
            <p className="text-sm text-muted-foreground mb-3">כל הנתונים כאן הם לדוגמה בלבד. הירשמו כדי לראות את הנתונים האמיתיים שלכם.</p>
            <Button onClick={() => navigate("/business/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              הירשמו עכשיו — חינם
            </Button>
          </div>
        )}

        {/* Real mode: Business Mode identity band */}
        {!isDemo && (
          <div className="mb-6 rounded-xl border border-zinc-700/40 bg-zinc-900/90 px-4 py-3 flex items-center gap-3 shadow-sm">
            {/* Mode badge */}
            <span className="flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0">
              <Briefcase size={11} />
              מצב עסקי
            </span>
            {/* Avatar + identity */}
            <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-100 font-bold text-xs shrink-0">
              {displayBusiness.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{displayBusiness.name}</p>
              <p className="text-xs text-zinc-400 truncate">{displayBusiness.email}</p>
            </div>
            {/* Tier chip */}
            <span className="text-[10px] font-semibold bg-zinc-800 border border-zinc-600/50 text-zinc-300 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">
              {currentTier === "enterprise" ? "Enterprise" : currentTier === "pro" ? "Pro" : "Free"}
            </span>
            {/* Pricing shortcut — hidden for Enterprise (already on top tier) */}
            {currentTier !== "enterprise" && (
              <button
                onClick={() => navigate("/business/pricing")}
                className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-primary/80 hover:text-primary border border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full shrink-0 transition-all"
              >
                <Tag size={10} aria-hidden="true" />
                שדרג
              </button>
            )}
          </div>
        )}

        {/* Admin Plan Switcher — dev/admin only; hidden in production for non-admin users */}
        {import.meta.env.DEV && !isDemo && isAdmin && businessId && (
          <div className="mb-6">
            <DevControlPanel
              businessId={businessId}
              currentTier={currentTier}
              onTierChanged={(newTier) => setDbTier(newTier as SubscriptionTier)}
              onDataChanged={() => window.location.reload()}
            />
          </div>
        )}

        {/* Review Limit Warning for Free tier */}
        {isFree && monthlyReviewCount >= 8 && (
          <div className={`mb-6 rounded-lg border px-5 py-4 ${
            monthlyReviewCount >= 10
              ? "border-destructive/30 bg-destructive/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className={monthlyReviewCount >= 10 ? "text-destructive" : "text-yellow-500"} />
              <div className="flex-1">
                {monthlyReviewCount >= 10 ? (
                  <>
                    <p className="font-display font-semibold text-destructive text-sm">הגעתם למגבלת הביקורות החודשית (10/10)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      העסק שלכם הגיע למגבלת 10 ביקורות בחודש בחבילת הסטארטר. שדרגו למקצועי כדי לקבל ביקורות ללא הגבלה!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-semibold text-yellow-600 text-sm">קרובים למגבלה ({monthlyReviewCount}/10 ביקורות החודש)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      נותרו {10 - monthlyReviewCount} ביקורות בחבילת הסטארטר. שדרגו למקצועי כדי לקבל ביקורות ללא הגבלה.
                    </p>
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgradeWithModal("pro", "ביקורות ללא הגבלה")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Sparkles size={14} className="ml-1" /> שדרגו עכשיו
              </Button>
            </div>
          </div>
        )}

        {/* ── Collaboration Program Card (real users only) ──────────── */}
        {!isDemo && businessId && (
          <CollaborationPromoCard
            businessId={businessId}
            businessSlug={businessSlug}
            config={collabConfig}
            onConfigChange={setCollabConfig}
            referralClickCount={referralClickCount}
          />
        )}

        {/* Demo Tier Selector */}
        {isDemo && (
          <div className="mb-6 rounded-xl border border-border/50 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground font-medium mb-3 text-center">🎯 סימולציית חבילה — בחרו חבילה לצפייה בפיצ׳רים</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "free", label: "סטארטר", sublabel: "חינם", icon: null, desc: "פיצ׳רים בסיסיים" },
                { id: "pro", label: "מקצועי", sublabel: "Pro", icon: Sparkles, desc: "כלים מתקדמים" },
                { id: "enterprise", label: "אנטרפרייז", sublabel: "Enterprise", icon: Crown, desc: "גישה מלאה" },
              ] as { id: DemoTier; label: string; sublabel: string; icon: any; desc: string }[]).map(({ id, label, sublabel, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setDemoTier(id)}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center transition-all ${
                    demoTier === id
                      ? id === "enterprise"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : id === "pro"
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-border bg-secondary shadow-sm"
                      : "border-border/30 hover:border-border hover:bg-muted/50"
                  }`}
                >
                  {Icon && <Icon size={14} className={demoTier === id ? (id === "enterprise" ? "text-primary" : "text-accent") : "text-muted-foreground"} />}
                  <span className={`text-xs font-bold ${demoTier === id ? (id === "enterprise" ? "text-primary" : id === "pro" ? "text-accent" : "text-foreground") : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] ${demoTier === id ? "text-muted-foreground" : "text-muted-foreground/60"}`}>{desc}</span>
                </button>
              ))}
            </div>
            {/* Shortcut to full pricing page */}
            <div className="mt-3 text-center">
              <button
                onClick={() => navigate("/business/pricing")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
              >
                <Tag size={12} aria-hidden="true" />
                ראו את כל החבילות והמחירים ←
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">לוח בקרה עסקי</h1>
            <p className="text-muted-foreground text-sm">עקבו אחר ביקורות, קליקים, המרות ותובנות AI.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary self-start sm:self-auto shrink-0">
            <BarChart3 size={16} className="ml-2" /> ייצוא דוח
          </Button>
        </div>

        {/* Stats Grid */}
        <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {displayStats.map(({ icon: Icon, label, value, change, up, tooltip }) => (
            <Card key={label} className="shadow-card animated-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                    {change && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
                        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {change}
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-display font-bold text-2xl">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </TooltipProvider>

        {/* ── Persistent Notifications Strip ─────────────────────────────────── */}
        {displayNotifications.length > 0 && (
          <div className="mb-4 rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            <button
              onClick={() => setNotifStripExpanded(e => !e)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Bell size={14} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">התראות</span>
                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {displayNotifications.length}
                </span>
                {!notifStripExpanded && (
                  <span className="text-xs text-muted-foreground truncate mr-2">
                    {displayNotifications[0].text}
                  </span>
                )}
              </div>
              {notifStripExpanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
            </button>
            {notifStripExpanded && (
              <div className="border-t border-border/30 divide-y divide-border/20">
                {displayNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === "review" ? "bg-primary/10" :
                      n.type === "conversion" ? "bg-accent/10" :
                      n.type === "alert" ? "bg-destructive/10" :
                      "bg-secondary"
                    }`}>
                      {n.type === "review" && <MessageSquare size={12} className="text-primary" />}
                      {n.type === "conversion" && <DollarSign size={12} className="text-accent" />}
                      {n.type === "alert" && <AlertTriangle size={12} className="text-destructive" />}
                      {n.type === "report" && <Brain size={12} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80">{n.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="analytics" className="space-y-6">
          {/* ── 4-Module Tab Navigation ──────────────────────────────────────────── */}
          <div className="rounded-xl border border-border/40 bg-card/50 p-3 space-y-3">

            {/* Module 1: Analytics (merged overview + clicks) */}
            <div>
              <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <BarChart3 size={10} /> אנליטיקס
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="analytics" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <BarChart3 size={13} className="ml-1" /> אנליטיקס
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Module 2: AI Insights & Reports */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <Brain size={10} className="text-primary" />
                <span className="text-primary/80">תובנות AI ודוחות</span>
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="ai-insights" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Brain size={13} className="ml-1" /> תובנות AI ודוחות
                  {!isEnterprise && <EnterpriseBadge />}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Module 3: Trust Center */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <Shield size={10} className="text-amber-500" />
                <span className="text-amber-600/80 dark:text-amber-400/80">מרכז האמון</span>
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="trust-compliance" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Shield size={13} className="ml-1" /> ציות ומודרציה
                  {!isDemo && complianceReviews.filter(r => r.status === "flagged" || r.status === "under_review").length > 0 && (
                    <span className="mr-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                      {complianceReviews.filter(r => r.status === "flagged" || r.status === "under_review").length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="trust-verification" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <FileText size={13} className="ml-1" /> אימות רכישה
                  {isFree && <ProBadge />}
                </TabsTrigger>
                <TabsTrigger value="trust-google" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <svg width={13} height={13} viewBox="0 0 24 24" className="ml-1">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  ביקורות Google
                </TabsTrigger>
                <TabsTrigger value="trust-social" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                  <Video size={13} className="ml-1" /> הוכחה חברתית
                  {isFree && <ProBadge />}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Module 4: Integrations */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                <Link2 size={10} className="text-accent" />
                <span className="text-accent/80">אינטגרציות</span>
              </p>
              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="integrations-hub" className="rounded-lg text-xs px-3 py-1.5 h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1">
                  <Link2 size={13} className="ml-1" /> מרכז אינטגרציות
                  {!isEnterprise && <EnterpriseBadge />}
                </TabsTrigger>
              </TabsList>
            </div>

          </div>

          {/* Analytics — merged overview + clicks */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-card bg-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare size={18} /> ביקורות אחרונות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {displayReviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין ביקורות. שתפו את הפרופיל שלכם כדי להתחיל לקבל ביקורות!</p>
                    ) : (
                      displayReviews.slice(0, 4).map((r) => (
                        <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                          <div className="flex gap-0.5 shrink-0 mt-0.5">
                            {Array.from({ length: r.rating }, (_, i) => (
                              <Star key={i} size={10} className="fill-star text-star" />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{r.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{r.reviewerName} · {r.courseName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp size={18} /> ביצועי קורסים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {displayCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין קורסים. הוסיפו קורס ראשון בהגדרות הפרופיל.</p>
                    ) : (
                      displayCourses.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.reviewCount} ביקורות · {c.verifiedPurchases} רכישות</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-star text-star" />
                            <span className="text-sm font-display font-bold">{c.rating}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Leaderboard Sidebar */}
              <div>
              </div>
            </div>

            {/* ── Clicks & Conversions ──────────────────────────────────────────── */}
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2">
              {[
                { icon: MousePointerClick, value: totalClicks, label: "סה״כ קליקים", tip: "מספר הפעמים שמשתמשים לחצו על קישור האפיליאט שלכם." },
                { icon: TrendingUp, value: conversions, label: `המרות (${totalClicks > 0 ? Math.round(conversions / totalClicks * 100) : 0}%)`, tip: "כמה מהקליקים הפכו לרכישה בפועל." },
                { icon: DollarSign, value: `₪${totalRevenue.toLocaleString()}`, label: "סה״כ הכנסות", tip: "סך ההכנסות שנוצרו מרכישות דרך ReviewHub." },
              ].map(({ icon: Icon, value, label, tip }, i) => (
                <Card key={`click-kpi-${i}`} className="shadow-card bg-card">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-bold text-xl">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">{tip}</TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              ))}
            </div>
            </TooltipProvider>
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MousePointerClick size={16} /> קליקים לפי קורס
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium py-2 border-b border-border/30">
                    <span>קורס</span>
                    <span className="text-center">קליקים</span>
                    <span className="text-center">המרות</span>
                    <span className="text-left">הכנסות</span>
                  </div>
                  {displayClicks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין קליקים. שתפו קישורי אפיליאט כדי להתחיל.</p>
                  ) : (
                    displayClicks.map((row, i) => (
                      <div key={`click-row-${i}`} className="grid grid-cols-4 text-sm py-3 border-b border-border/20 last:border-0 items-center">
                        <span className="truncate">{row.course}</span>
                        <span className="text-center font-display font-bold">{row.clicks}</span>
                        <span className="text-center">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                            {row.conversions} ({row.clicks > 0 ? Math.round(row.conversions / row.clicks * 100) : 0}%)
                          </span>
                        </span>
                        <span className="text-left font-display font-bold">₪{row.revenue.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            </LockedOverlay>
          </TabsContent>

          {/* Purchase Verification */}
          <TabsContent value="trust-verification">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <div className="space-y-6">

              {/* ── KPI strip ───────────────────────────────────────────── */}
              <PurchaseVerificationStats businessId={businessId} isDemo={isDemo} />

              {/* ── Setup + How-it-works ─────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InvoiceTemplateUploader businessId={businessId || "demo"} />
                <Card className="shadow-card bg-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain size={18} className="text-primary" /> איך זה עובד?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      {[
                        "העלו דוגמאות של חשבוניות/קבלות שלכם (PDF, תמונה או CSV)",
                        "ה-AI ינתח את המבנה ויזהה פרטים מזהים (לוגו, שם העסק, מספרי מסמך)",
                        "כשלקוח מעלה קבלה בטופס הביקורת, ה-AI ישווה אותה מול התבניות שלכם",
                        "רוב הקבלות יאומתו אוטומטית. מקרים חריגים יועברו לבדיקה ידנית",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</div>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                    {/* Credibility rule note */}
                    <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <Shield size={13} className="mt-0.5 shrink-0" />
                      <span>
                        <strong>כלל אמינות:</strong> תג "מאומת" מוצג אך ורק על ביקורות שנסגרו עם הוכחת רכישה מאושרת — גם ביקורות של בעלי עסקים אינן מאומתות אוטומטית.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Verification Queue ────────────────────────────────── */}
              <PurchaseVerificationQueue businessId={businessId} isDemo={isDemo} />

            </div>
            </LockedOverlay>
          </TabsContent>

          {/* AI Insights & Reports — renamed from ai-system */}
          <TabsContent value="ai-insights">
            <LockedOverlay isLocked={!isEnterprise} onUpgrade={handleUpgrade}>
            <div className="space-y-4">
              {/* Period filter header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-primary" />
                  <h2 className="font-display font-semibold text-base">תובנות AI ודוחות</h2>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
                  {(["daily", "weekly", "monthly"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setAiReportPeriod(period)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                        aiReportPeriod === period
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {period === "daily" ? "יומי" : period === "weekly" ? "שבועי" : "חודשי"}
                    </button>
                  ))}
                </div>
                {!isDemo && businessId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleGenerateReport(aiReportPeriod === "daily" ? "daily" : "weekly")}
                    disabled={generatingReport}
                  >
                    {generatingReport ? "מייצר..." : "צור דוח"}
                  </Button>
                )}
              </div>

              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {aiReportPeriod === "daily"
                      ? <><CalendarClock size={16} className="text-primary" /> דוחות יומיים</>
                      : aiReportPeriod === "weekly"
                      ? <><Brain size={16} className="text-primary" /> דוח שבועי</>
                      : <><BarChart2 size={16} className="text-primary" /> סיכום חודשי</>
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiReportPeriod === "daily" && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        קבלו כל בוקר דוח AI מפורט עם ניתוח הביצועים של אתמול, שינויים במגמות, וצעדים מומלצים.
                      </p>
                      <div className="space-y-3">
                        {(() => {
                          const dailyReports = isDemo ? [
                            { id: "d1", created_at: "2026-03-08", content: "3 ביקורות חדשות, 2 המרות, עלייה של 5% בדירוג" },
                            { id: "d2", created_at: "2026-03-07", content: "ביקורת שלילית זוהתה, 4 קליקים חדשים" },
                            { id: "d3", created_at: "2026-03-06", content: "יום שיא — 8 המרות, הכנסות של ₪19,920" },
                          ] : realAiReports.filter(r => r.report_type === "daily");
                          if (dailyReports.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין דוחות יומיים. לחצו "צור דוח" כדי להתחיל.</p>;
                          return dailyReports.map((report: any) => (
                            <div key={report.id} className="border border-border/20 rounded-lg p-4">
                              <p className="text-xs text-muted-foreground mb-2">{new Date(report.created_at).toLocaleDateString("he-IL")}</p>
                              {isDemo ? (
                                <p className="text-sm text-foreground/80">{report.content}</p>
                              ) : (
                                <div className="prose prose-sm prose-invert max-w-none text-foreground/80">
                                  <ReactMarkdown>{report.content}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                        הדוחות נשלחים גם במייל כל בוקר בשעה 08:00.
                      </p>
                    </>
                  )}

                  {(aiReportPeriod === "weekly" || aiReportPeriod === "monthly") && (
                    <>
                      {!isDemo && realAiReports.filter(r => r.report_type === "weekly").length > 0 ? (
                        <div className="space-y-4">
                          {realAiReports.filter(r => r.report_type === "weekly").map((report: any) => (
                            <div key={report.id} className="border border-border/30 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString("he-IL")} | {report.period_start} — {report.period_end}</span>
                              </div>
                              <div className="prose prose-sm prose-invert max-w-none text-foreground/80" dir="rtl">
                                <ReactMarkdown>{report.content}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isDemo ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-display font-semibold text-primary flex items-center gap-2 mb-3">
                              <ArrowUpRight size={16} /> חוזקות
                            </h3>
                            <ul className="space-y-2">
                              {aiReport.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-sm font-display font-semibold text-destructive flex items-center gap-2 mb-3">
                              <ArrowDownRight size={16} /> נקודות לשיפור
                            </h3>
                            <ul className="space-y-2">
                              {aiReport.weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-sm font-display font-semibold text-accent flex items-center gap-2 mb-3">
                              <Brain size={16} /> המלצות AI
                            </h3>
                            <ul className="space-y-2">
                              {aiReport.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין דוחות. לחצו "צור דוח" כדי לייצר את הדוח הראשון.</p>
                      )}
                      <div className="pt-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                          דוח זה נוצר על ידי AI על בסיס נתוני הביקורות, אנליטיקת הקליקים ומגמות ההמרה שלכם.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            </LockedOverlay>
          </TabsContent>

          {/* Social Proof */}
          <TabsContent value="trust-social">
            <LockedOverlay isLocked={isFree} tier="pro" onUpgrade={handleUpgrade}>
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm mb-4">
                העלו עד 5 סרטונים או תמונות של לקוחות מרוצים. ניתן להעלות קבצים ישירות או להוסיף קישורי YouTube / TikTok.
                <br />
                <span className="text-xs text-primary">זמין למנויי Professional ו-Enterprise בלבד.</span>
              </p>
              <TestimonialMediaUploader businessId={businessId || "demo"} maxItems={5} />
            </div>
            </LockedOverlay>
          </TabsContent>

          {/* ── Integrations Hub — CRM + Webhooks + Widget + Integrations + Collaboration ── */}
          <TabsContent value="integrations-hub">
            <LockedOverlay isLocked={!isEnterprise} onUpgrade={handleUpgrade}>
            <div className="space-y-6">

              {/* ─── CRM & Leads ─────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Contact size={15} className="text-primary" /> CRM ולידים
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="shadow-card bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Contact size={15} className="text-primary" /> ניהול לידים
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(() => {
                        const leadsToShow = isDemo ? [
                          { id: "d1", customer_name: "יוסי כהן", customer_email: "yossi@gmail.com", source: "positive_review", status: "new", created_at: new Date().toISOString() },
                          { id: "d2", customer_name: "מיכל לוי", customer_email: "michal@company.co.il", source: "positive_review", status: "new", created_at: new Date(Date.now() - 86400000).toISOString() },
                          { id: "d3", customer_name: "דני אברהם", customer_email: "dani@startup.io", source: "positive_review", status: "contacted", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
                        ] : realLeads;
                        if (leadsToShow.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין לידים.</p>;
                        const statusMap: Record<string, { label: string; cls: string }> = {
                          new: { label: "חדש", cls: "bg-accent/10 text-accent" },
                          contacted: { label: "בטיפול", cls: "bg-secondary text-muted-foreground" },
                          converted: { label: "הומר", cls: "bg-primary/10 text-primary" },
                        };
                        return leadsToShow.map((lead: any) => (
                          <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                            <div>
                              <p className="text-sm font-medium">{lead.customer_name || "אנונימי"}</p>
                              <p className="text-xs text-muted-foreground">{lead.customer_email || lead.source}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusMap[lead.status]?.cls || "bg-secondary text-muted-foreground"}`}>
                                {statusMap[lead.status]?.label || lead.status}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>
                  <Card className="shadow-card bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users size={15} className="text-primary" /> סטטיסטיקת לידים
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-primary/5">
                          <p className="font-display font-bold text-2xl text-primary">{isDemo ? "47" : realLeads.filter(l => l.status === "new").length}</p>
                          <p className="text-xs text-muted-foreground">לידים חדשים</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/5">
                          <p className="font-display font-bold text-2xl text-accent">{isDemo ? "23%" : (realLeads.length > 0 ? Math.round(realLeads.filter(l => l.status === "converted").length / realLeads.length * 100) : 0) + "%"}</p>
                          <p className="text-xs text-muted-foreground">אחוז המרה</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="border-t border-border/30" />

              {/* ─── Webhooks & API ───────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Webhook size={15} className="text-primary" /> Webhooks & API
                </h3>
                <Card className="shadow-card bg-card">
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold">מפתחות API</p>
                        {!isDemo && businessId && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={handleGenerateApiKey} disabled={generatingApiKey}>
                            {generatingApiKey ? "מייצר..." : "צור מפתח חדש"}
                          </Button>
                        )}
                      </div>
                      {!isDemo && realApiKeys.length > 0 ? (
                        <div className="space-y-2">
                          {realApiKeys.map((k: any) => (
                            <div key={k.id} className="bg-secondary rounded-lg p-3 flex items-center justify-between" dir="ltr">
                              <code className="text-xs text-foreground/70">{k.key_prefix}••••••••••••</code>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${k.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                {k.active ? "פעיל" : "מושבת"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-secondary rounded-lg p-4" dir="ltr">
                          <code className="text-xs text-foreground/70">{isDemo ? "rh_live_sk_••••••••••••••••••••3f8a" : "אין מפתחות עדיין"}</code>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-3">Webhooks פעילים</p>
                      {(() => {
                        const whList = isDemo ? [
                          { id: "d1", url: "https://your-crm.com/webhooks/review", events: ["new_review"], active: true },
                          { id: "d2", url: "https://zapier.com/hooks/catch/123", events: ["affiliate_conversion"], active: true },
                        ] : realWebhooks;
                        if (whList.length === 0) return <p className="text-sm text-muted-foreground py-2 text-center">אין webhooks מוגדרים.</p>;
                        return (
                          <div className="space-y-2">
                            {whList.map((wh: any) => (
                              <div key={wh.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                                <div>
                                  <p className="text-xs font-mono text-foreground/70" dir="ltr">{wh.url}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{(wh.events || []).join(", ")}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${wh.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                  {wh.active ? "פעיל" : "מושבת"}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">פלטפורמות נתמכות</p>
                      <div className="flex flex-wrap gap-2">
                        {["Zapier", "Make", "HubSpot", "Salesforce", "Slack", "Google Sheets"].map(name => (
                          <span key={name} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground">{name}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t border-border/30" />

              {/* ─── Widget Embed ─────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Code2 size={15} className="text-accent" /> ווידג׳ט להטמעה
                </h3>
                <TrustBadgeDashboard
                  businessSlug={isDemo ? "demo-business" : (businessId ? businessSlug : "demo-business")}
                  businessName={isDemo ? "העסק שלכם" : displayBusiness.name}
                  rating={isDemo ? 4.8 : (Number(displayStats[0]?.value) || 0)}
                  reviewCount={isDemo ? 124 : (Number(displayStats[1]?.value) || 0)}
                  reviews={isDemo ? DEMO_REVIEWS.map(r => ({
                    id: r.id, rating: r.rating, text: r.text, reviewerName: r.reviewerName,
                    anonymous: r.anonymous, verified: r.verified, courseName: r.courseName, date: r.date,
                  })) : realReviews.map(r => ({
                    id: r.id, rating: r.rating, text: r.text, reviewerName: r.reviewerName,
                    anonymous: r.anonymous, verified: r.verified, courseName: r.courseName, date: r.date,
                  }))}
                />
              </div>

              <div className="border-t border-border/30" />

              {/* ─── Third-party Integrations ─────────────────────────── */}
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Link2 size={15} className="text-accent" /> אינטגרציות חיצוניות
                </h3>
                <IntegrationsTab
                  businessId={businessId || "demo"}
                  isEnterprise={isEnterprise}
                  isDemo={isDemo}
                  onUpgrade={() => handleUpgradeWithModal("enterprise", "אינטגרציות")}
                />
              </div>

              <div className="border-t border-border/30" />

              {/* ─── Collaboration Program ────────────────────────────── */}
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Handshake size={15} className="text-primary" /> תוכנית שיתוף הפעולה
                  {collabConfig.active && !isDemo && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full mr-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> פעיל
                    </span>
                  )}
                </h3>
                <Card className="shadow-card bg-card">
                  <CardContent className="p-5">
                    {isDemo ? (
                      <div className="text-center py-4 space-y-3">
                        <p className="font-display font-semibold text-foreground">תוכנית שיתוף הפעולה</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          הפעילו את תוכנית שיתוף הפעולה ואפשרו ל-ReviewHub לשלוח לקוחות חדשים לעסק שלכם.
                          הלקוח מקבל 10% הנחה — ReviewHub מרוויחה עמלת שיווק — אתם מקבלים לקוח.
                        </p>
                        <Button onClick={() => navigate("/business/signup")} className="gap-2">
                          הירשמו להפעלת התוכנית
                        </Button>
                      </div>
                    ) : !collabConfig.active ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        תוכנית שיתוף הפעולה אינה פעילה. הפעילו אותה מכרטיס "שיתוף פעולה" בראש הדף.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">שיטה</p>
                            <p className="font-semibold text-foreground text-sm">
                              {collabConfig.method === "link" && "קישור הפניה"}
                              {collabConfig.method === "coupon" && "קופון הנחה"}
                              {collabConfig.method === "both" && "קישור + קופון"}
                            </p>
                          </div>
                          {(collabConfig.method === "coupon" || collabConfig.method === "both") && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">קוד קופון</p>
                              <p className="font-mono font-bold text-primary text-base tracking-widest">
                                {collabConfig.coupon || "REVIEWHUB10"}
                              </p>
                            </div>
                          )}
                          <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">קליקי הפניה</p>
                            <p className="font-bold text-2xl text-foreground">{referralClickCount}</p>
                          </div>
                        </div>
                        {(collabConfig.method === "link" || collabConfig.method === "both") && (
                          <div className="rounded-lg border border-border/40 bg-muted/10 p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">קישור הפניה שלכם</p>
                            <div className="flex gap-2">
                              <code className="flex-1 text-xs font-mono bg-muted/40 border border-border/40 px-3 py-2 rounded-lg truncate">
                                https://reviewhub.co.il/go/{businessSlug}
                              </code>
                              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`https://reviewhub.co.il/go/${businessSlug}`); }}>
                                העתקה
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/biz/${businessSlug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /></a>
                              </Button>
                            </div>
                          </div>
                        )}
                        {referralClicksData.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-3">קליקים לפי תאריך (30 ימים)</p>
                            <div className="space-y-1.5">
                              {referralClicksData.slice(-8).map(({ date, clicks }) => (
                                <div key={date} className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground w-20 shrink-0">{date}</span>
                                  <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                    <div className="bg-primary h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(100, (clicks / Math.max(...referralClicksData.map(d => d.clicks), 1)) * 100)}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground w-6 text-left">{clicks}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
            </LockedOverlay>
          </TabsContent>

          {/* ── Compliance & Moderation Panel ─────────────────────────── */}
          <TabsContent value="trust-compliance">
            <div className="space-y-6">

              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: CheckCircle2, label: "מאומתות",
                    value: isDemo ? 12 : complianceReviews.filter(r => r.status === "verified").length + (isDemo ? 0 : 0),
                    cls: "text-green-600 dark:text-green-400", bg: "bg-green-500/10",
                  },
                  {
                    icon: Clock, label: "ממתינות",
                    value: isDemo ? 3 : complianceReviews.filter(r => r.status === "pending").length,
                    cls: "text-muted-foreground", bg: "bg-muted/40",
                  },
                  {
                    icon: AlertTriangle, label: "מסומנות לבדיקה",
                    value: isDemo ? 2 : complianceReviews.filter(r => r.status === "flagged").length,
                    cls: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10",
                  },
                  {
                    icon: XCircle, label: "הוסרו",
                    value: isDemo ? 1 : complianceReviews.filter(r => r.status === "removed").length,
                    cls: "text-destructive", bg: "bg-destructive/10",
                  },
                ].map(({ icon: Icon, label, value, cls, bg }) => (
                  <Card key={label} className="shadow-card bg-card">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={cls} />
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Review status list */}
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield size={16} /> סטטוס ביקורות — מערכת ציות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isDemo ? (
                    <div className="space-y-3">
                      {[
                        { text: "קורס מצוין! ממליץ בחום.", course: "שיווק דיגיטלי מאסטרקלאס", status: "verified", reason: null },
                        { text: "המרצה אמר שקורסים אחרים גרועים ממנו.", course: "יסודות SEO", status: "flagged", reason: "RULE_2: opinion_disagreement — המשפט מבטא דעה ולא עובדה." },
                        { text: "buy now click here limited offer discount", course: "הסמכת Google Ads", status: "removed", reason: "RULE_4: spam_pattern — תבנית ספאם זוהתה ב-AI." },
                        { text: "המחיר שרשמת לא נכון — ₪500 ולא ₪1000.", course: "אנליטיקס מתקדם", status: "under_review", reason: "RULE_3: factual_falsehood — נטען מידע עובדתי שנוי במחלוקת. ממתין לראיות." },
                      ].map((r, i) => (
                        <ReviewStatusRow key={i} text={r.text} course={r.course} status={r.status} reason={r.reason} />
                      ))}
                    </div>
                  ) : complianceReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">כל הביקורות תקינות — אין פריטים הדורשים תשומת לב.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {complianceReviews.map((r: any) => (
                        <ReviewStatusRow
                          key={r.id}
                          text={r.text}
                          course={r.courses?.name || ""}
                          status={r.status}
                          reason={r.ai_reason}
                          aiDecision={r.ai_decision}
                          date={r.created_at ? new Date(r.created_at).toLocaleDateString("he-IL") : undefined}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Open reports */}
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle size={16} /> תלונות פתוחות על ביקורות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isDemo ? (
                    <div className="space-y-3">
                      {[
                        { reason: "המידע בביקורת לא נכון", status: "open", aiDecision: "freeze_request_proof", aiReason: "RULE_3: נטען מידע עובדתי — הכותב התבקש לספק ראיות תוך 72 שעות." },
                        { reason: "ביקורת שנכתבה מחשבון מזויף", status: "rejected", aiDecision: "reject_report", aiReason: "RULE_2: התלונה מבוססת על חוסר הסכמה ולא על עובדה." },
                      ].map((rp, i) => (
                        <ReportRow key={i} reason={rp.reason} status={rp.status} aiDecision={rp.aiDecision} aiReason={rp.aiReason} />
                      ))}
                    </div>
                  ) : openReports.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">אין תלונות פתוחות כרגע.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openReports.map((rp: any) => (
                        <ReportRow
                          key={rp.id}
                          reason={rp.reason}
                          status={rp.moderation_status}
                          aiDecision={rp.ai_decision}
                          aiReason={rp.ai_reason}
                          date={rp.created_at ? new Date(rp.created_at).toLocaleDateString("he-IL") : undefined}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Explainer card */}
              <Card className="shadow-card bg-card border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">כיצד עובדת מערכת ה-AI לציות?</p>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">שלב 1:</span> כל ביקורת חדשה עוברת סריקת כללים אוטומטית: גסויות, PII, ספאם.</p>
                        <p><span className="font-medium text-foreground">שלב 2:</span> תלונות עסקים נבדקות — ביקורות דעה נשמרות, מידע עובדתי שנוי נשלח לבדיקה.</p>
                        <p><span className="font-medium text-foreground">שלב 3:</span> GPT-4o מסווג מקרים שלא זוהו בכללים.</p>
                        <p><span className="font-medium text-foreground">שלב 4:</span> כל החלטה נרשמת ב-Audit Log בלתי-ניתן-לשינוי.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Moderation Case Tracker — structured workflow per flagged review ── */}
              <ModerationCaseTracker
                businessId={isDemo ? "demo" : (businessId ?? "demo")}
                isDemo={isDemo}
              />

            </div>
          </TabsContent>

          {/* ── Google Reviews Linking Tab ────────────────────────────────── */}
          <TabsContent value="trust-google">
            <div className="space-y-6 max-w-xl">
              <Card className="shadow-card bg-card border-primary/10">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width={18} height={18} viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">ביקורות Google — הוסף הקשר חיצוני</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      קשרו את הפרופיל ב-Google לעמוד הפרופיל שלכם ב-ReviewHub.
                      ביקורות Google יוצגו <strong className="text-foreground">בסעיף נפרד</strong> מתחת לביקורות ReviewHub —
                      מסומנות בבירור כמקורן ב-Google ואינן משפיעות על ציון האמון הרשמי.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {isDemo ? (
                <Card className="shadow-card bg-card opacity-60">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">חיבור פרופיל Google זמין לעסקים רשומים בלבד.</p>
                    <p className="text-xs text-muted-foreground mt-1">צרו חשבון עסקי כדי לחבר את הפרופיל שלכם ב-Google.</p>
                  </CardContent>
                </Card>
              ) : businessId ? (
                <GoogleLinkingPanel businessId={businessId} />
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BusinessFooter />
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        requiredTier={upgradeModalTier}
        featureName={upgradeModalFeature}
      />
    </div>
  );
};

export default BusinessDashboard;

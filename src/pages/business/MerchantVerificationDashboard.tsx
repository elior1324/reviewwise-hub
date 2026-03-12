/**
 * MerchantVerificationDashboard — The "Merchant Verification Loop" UI
 *
 * Pro/Business tier: business owners see a queue of pending invoice verifications.
 * They can Confirm (genuine purchase) or Reject (fraud) each one.
 *
 * On Reject → the platform auto-locks the reviewer's account for fraud investigation.
 * On Confirm → the review gets the highest-tier "Verified by Merchant" badge.
 *
 * Also handles the token-based confirm/reject link flow from email notifications.
 *
 * Route:
 *   /business/verify-invoice          — full dashboard (requires auth)
 *   /business/verify-invoice?token=X  — token decision page (no auth needed)
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
ShieldX,
Clock,
AlertTriangle,
CheckCircle2,
XCircle,
Hash,
CalendarDays,
Banknote,
FileText,
Loader2,
RefreshCw,
Info,
Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  review_id: string;
  user_id: string;
  invoice_hash: string;
  invoice_amount: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  status: "pending" | "confirmed" | "rejected" | "expired";
  expires_at: string;
  created_at: string;
  confirm_token: string;
  // joined
  reviewer_name?: string;
  review_text?: string;
  review_rating?: number;
}

// ─── Token decision page (no auth required) ───────────────────────────────────

function TokenDecisionPage({ token }: { token: string }) {
  const [decision, setDecision] = useState<"confirmed" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; action?: string; error?: string } | null>(null);

  async function handleDecide(d: "confirmed" | "rejected") {
    setDecision(d);
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afve-check/merchant_decide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, decision: d, note: note.trim() || null }),
        }
      );
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "network_error" });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const isConfirm = decision === "confirmed";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl"
        >
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isConfirm ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
            {isConfirm
              ? <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              : <XCircle      className="w-8 h-8 text-red-500" />
            }
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isConfirm ? "תודה — האישור נרשם" : "הביקורת סומנה לבדיקה"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isConfirm
              ? "הביקורת קיבלה את תג 'אומת ע\"י העסק' — הרמה הגבוהה ביותר של אמינות."
              : "החשבון של המשתמש נעול לחקירה. צוות ReviewHub יטפל במקרה בתוך 24 שעות."
            }
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">אימות חשבונית</h1>
          <p className="text-sm text-muted-foreground mt-1">
            האם הרכישה המתוארת בביקורת אכן בוצעה אצלך?
          </p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>שים לב:</strong> אם תסמן כ"לא קיים", חשבון המשתמש יינעל אוטומטית לחקירת הונאה.
              פעל בכנות — פעולה שגויה עלולה לפגוע במשתמש תמים.
            </p>
          </div>
        </div>

        {/* Note field */}
        <div className="mb-5">
          <Label className="text-sm font-medium mb-1.5 block">
            הערה (אופציונלי)
          </Label>
          <Textarea
            placeholder="לדוגמה: 'מספר חשבונית לא קיים במערכת שלנו' או 'אישרתי — לקוח מ-15.2.2026'"
            className="text-right resize-none h-20 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Decision buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleDecide("rejected")}
            disabled={loading}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 gap-2"
          >
            {loading && decision === "rejected" ? <Loader2 size={15} className="animate-spin" /> : <ShieldX size={15} />}
            לא קיים — זיוף
          </Button>
          <Button
            onClick={() => handleDecide("confirmed")}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading && decision === "confirmed" ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            אישור — אמיתי
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function MerchantVerificationDashboard() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [items, setItems]       = useState<QueueItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null); // queue item id
  const [note, setNote]         = useState<Record<string, string>>({});
  const [filter, setFilter]     = useState<"pending" | "all">("pending");
  const [businessId, setBusinessId] = useState<string | null>(null);

  // ── All hooks must appear unconditionally before any early return ──

  // Redirect if not logged in (skip when using email-token flow)
  useEffect(() => {
    if (token) return;
    if (!user) navigate("/auth");
  }, [token, user, navigate]);

  // Load user's business id (skip when using email-token flow)
  useEffect(() => {
    if (token || !user) return;
    supabase
      .from("businesses")
      .select("id, subscription_tier")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBusinessId(data.id);
      });
  }, [token, user]);

  // Load queue items
  const loadQueue = useCallback(async () => {
    if (!businessId || token) return;
    setLoading(true);

    const query = supabase
      .from("merchant_verif_queue")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (filter === "pending") query.eq("status", "pending");

    const { data } = await query;
    setItems((data as QueueItem[]) ?? []);
    setLoading(false);
  }, [businessId, filter, token]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // If token param is present, show the token decision UI (no auth needed)
  if (token) return <TokenDecisionPage token={token} />;

  async function decide(item: QueueItem, d: "confirmed" | "rejected") {
    setDeciding(item.id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afve-check/merchant_decide`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            token:    item.confirm_token,
            decision: d,
            note:     note[item.id] ?? null,
          }),
        }
      );
      if (res.ok) {
        setItems((prev) => prev.map((it) =>
          it.id === item.id ? { ...it, status: d } : it
        ));
      }
    } finally {
      setDeciding(null);
    }
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-primary/10 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">אימות חשבוניות</h1>
              <p className="text-sm text-muted-foreground">Merchant Verification Loop — Pro Feature</p>
            </div>
            {pendingCount > 0 && (
              <span className="mr-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg">
            ביקורות חדשות שהועלו עם קבלה מבוססות על עסק שלך מחכות לאישורך.
            אשר לתגמל מאמת, דחה כדי להגן על המוניטין שלך.
          </p>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Filter + refresh */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2">
              {(["pending", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filter === f
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {f === "pending" ? `ממתין לאישור (${pendingCount})` : "כל הבקשות"}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={loadQueue} className="gap-1.5">
              <RefreshCw size={13} />
              רענן
            </Button>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-5 flex items-start gap-2">
            <Info size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Safe Harbor:</strong> הקובץ המקורי אינו נשמר בשרתינו. מוצגת רק טביעת אצבע SHA-256 של החשבונית.
              המידע מוגן ומוצפן בהתאם לתקנות אבטחת מידע 2017.
            </p>
          </div>

          {/* Queue list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {filter === "pending" ? "אין ביקורות ממתינות לאישור" : "אין רשומות"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`bg-card border rounded-2xl overflow-hidden shadow-sm ${
                      item.status === "pending"  ? "border-amber-200 dark:border-amber-800"
                    : item.status === "confirmed" ? "border-emerald-200 dark:border-emerald-800"
                    : item.status === "rejected"  ? "border-red-200 dark:border-red-800"
                    :                              "border-border"
                    }`}
                  >
                    {/* Status stripe */}
                    <div className={`h-1 ${
                      item.status === "pending"   ? "bg-amber-400"
                    : item.status === "confirmed" ? "bg-emerald-500"
                    : item.status === "rejected"  ? "bg-red-500"
                    :                              "bg-muted"
                    }`} />

                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              item.status === "pending"   ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : item.status === "confirmed" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : item.status === "rejected"  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            :                              "bg-muted text-muted-foreground"
                            }`}>
                              {item.status === "pending"   ? "ממתין לאישורך"
                             : item.status === "confirmed" ? "✓ אושר"
                             : item.status === "rejected"  ? "✗ נדחה — הוגשה תלונת הונאה"
                             :                              "פג תוקף"
                            }
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={11} />
                            הוגש: {new Date(item.created_at).toLocaleDateString("he-IL")}
                            {item.status === "pending" && (
                              <span className="text-amber-600 dark:text-amber-400 mr-2 flex items-center gap-1">
                                <Clock size={11} />
                                פג תוקף: {new Date(item.expires_at).toLocaleDateString("he-IL")}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Status icon */}
                        {item.status === "confirmed" && <ShieldCheck className="text-emerald-500 flex-shrink-0" size={22} />}
                        {item.status === "rejected"  && <Lock         className="text-red-500 flex-shrink-0"     size={22} />}
                        {item.status === "pending"   && <AlertTriangle className="text-amber-500 flex-shrink-0" size={22} />}
                      </div>

                      {/* Invoice details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <FileHash size={12} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">Hash</span>
                          </div>
                          <p className="text-xs font-mono text-foreground truncate" title={item.invoice_hash}>
                            {item.invoice_hash.slice(0, 16)}…
                          </p>
                        </div>

                        {item.invoice_number && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <FileText size={12} />
                              <span className="text-[10px] font-semibold uppercase tracking-wide">מספר</span>
                            </div>
                            <p className="text-xs font-semibold text-foreground">{item.invoice_number}</p>
                          </div>
                        )}

                        {item.invoice_amount != null && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <Banknote size={12} />
                              <span className="text-[10px] font-semibold uppercase tracking-wide">סכום</span>
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                              ₪{item.invoice_amount.toLocaleString("he-IL")}
                            </p>
                          </div>
                        )}

                        {item.invoice_date && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <CalendarDays size={12} />
                              <span className="text-[10px] font-semibold uppercase tracking-wide">תאריך</span>
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                              {new Date(item.invoice_date).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Decision area (pending only) */}
                      {item.status === "pending" && (
                        <>
                          <div className="mb-3">
                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                              הערה לצוות (אופציונלי)
                            </Label>
                            <textarea
                              rows={2}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-right resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="לדוגמה: 'לקוח קנה ב-XX/XX, מספר הזמנה #1234'"
                              value={note[item.id] ?? ""}
                              onChange={(e) => setNote((n) => ({ ...n, [item.id]: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deciding === item.id}
                              onClick={() => decide(item, "rejected")}
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 gap-1.5"
                            >
                              {deciding === item.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <ShieldX size={13} />
                              )}
                              לא קיים — הונאה
                            </Button>
                            <Button
                              size="sm"
                              disabled={deciding === item.id}
                              onClick={() => decide(item, "confirmed")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                              {deciding === item.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <ShieldCheck size={13} />
                              )}
                              אישור — אמיתי
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

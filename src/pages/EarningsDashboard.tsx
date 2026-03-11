/**
 * EarningsDashboard — "My Earnings" page for community reviewers.
 *
 * Shows:
 *   • Locked Points (with 72h countdown per review)
 *   • Available Points (unlocked, active)
 *   • Estimated Monthly Payout from the Community Vault
 *   • Point transaction history
 *   • Progress toward 70% seasonal discount
 *
 * Route: /earnings
 * Auth: required
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock, Unlock, TrendingUp, Zap, Clock, Sparkles,
  ChevronRight, Award, Info, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PointTx {
  id: string;
  transaction_type: string;
  points: number;
  status: string;
  locked_until: string | null;
  description: string | null;
  created_at: string;
}

interface VaultInfo {
  month_year: string;
  total_pool_ils: number;
  status: string;
}

interface PayoutEstimate {
  reviewer_points: number;
  global_points: number;
  estimated_payout_ils: number;
  share_pct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const monthYearNow = () => new Date().toISOString().slice(0, 7);

const formatILS = (n: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2 }).format(n);

const txTypeLabel: Record<string, string> = {
  earned:       "ביקורת שאושרה",
  bonus:        "בונוס קאשבק",
  deducted:     "קנס / הסרת ביקורת",
  locked:       "נעול — חלון Dispute",
  unlocked:     "שוחרר",
  paid_out:     "שולם",
  admin_adjust: "התאמה אדמין",
};

const txTypeColor: Record<string, string> = {
  earned:       "text-emerald-400",
  bonus:        "text-blue-400",
  deducted:     "text-destructive",
  locked:       "text-amber-400",
  unlocked:     "text-emerald-400",
  paid_out:     "text-primary",
  admin_adjust: "text-muted-foreground",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent = "emerald",
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "emerald" | "amber" | "blue" | "primary";
  loading?: boolean;
}) => {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber:   "bg-amber-500/10  text-amber-400  border-amber-500/20",
    blue:    "bg-blue-500/10   text-blue-400   border-blue-500/20",
    primary: "bg-primary/10    text-primary    border-primary/20",
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[accent]} flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
      ) : (
        <p className="text-3xl font-black leading-none">{value}</p>
      )}
      {sub && <p className="text-xs opacity-60 leading-snug">{sub}</p>}
    </div>
  );
};

const CountdownBadge = ({ lockedUntil }: { lockedUntil: string }) => {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(lockedUntil).getTime() - Date.now();
      if (diff <= 0) { setRemaining("משוחרר"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}ש ${m}ד`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      <Clock size={9} />
      {remaining}
    </span>
  );
};

// ─── SEASONAL DISCOUNT PROGRESS ───────────────────────────────────────────────
const SEASON_TARGET_POINTS = 5000; // points needed for 70% discount
const DISCOUNT_PCT = 70;

const SeasonProgress = ({ points }: { points: number }) => {
  const pct = Math.min((points / SEASON_TARGET_POINTS) * 100, 100);
  const remaining = Math.max(SEASON_TARGET_POINTS - points, 0);

  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-primary" />
          <p className="font-bold text-foreground text-sm">פרס עונת {new Date().getFullYear()}</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
          {DISCOUNT_PCT}% הנחה
        </span>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-primary to-primary/60 rounded-full"
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-white/10"
            style={{ right: `${mark}%` }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {points >= SEASON_TARGET_POINTS
            ? "🎉 הגעת לפרס!"
            : `נותרו ${remaining.toLocaleString("he-IL")} נקודות`}
        </span>
        <span className="text-muted-foreground font-medium">
          {points.toLocaleString("he-IL")} / {SEASON_TARGET_POINTS.toLocaleString("he-IL")}
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
        3 התורמים המובילים של העונה מקבלים {DISCOUNT_PCT}% הנחה על מנוי ReviewHub Pro לשנה הבאה.{" "}
        <a href="/leaderboard" className="text-primary hover:underline">לוח התוצאות</a>
      </p>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EarningsDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [loading, setLoading]         = useState(true);
  const [txs, setTxs]                 = useState<PointTx[]>([]);
  const [vault, setVault]             = useState<VaultInfo | null>(null);
  const [estimate, setEstimate]       = useState<PayoutEstimate | null>(null);

  const lockedPts    = txs.filter(t => t.status === "locked").reduce((s, t) => s + t.points, 0);
  const availablePts = txs.filter(t => t.status === "active").reduce((s, t) => s + t.points, 0);
  const totalPts     = lockedPts + availablePts;

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [txRes, vaultRes, estimateRes] = await Promise.all([
      supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("community_vault")
        .select("month_year, total_pool_ils, status")
        .eq("month_year", monthYearNow())
        .is("category", null)
        .single(),

      supabase
        .rpc("calculate_reviewer_payout", {
          p_month_year: monthYearNow(),
          p_category: null,
        })
        .eq("reviewer_id", user.id)
        .single(),
    ]);

    if (txRes.data)      setTxs(txRes.data as PointTx[]);
    if (vaultRes.data)   setVault(vaultRes.data as VaultInfo);
    if (estimateRes.data) setEstimate(estimateRes.data as unknown as PayoutEstimate);

    setLoading(false);
  };

  const estimatedPayout = estimate?.estimated_payout_ils ?? 0;
  const vaultTotal      = vault?.total_pool_ils ?? 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="container max-w-3xl py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles size={11} /> הרווחים שלי
              </div>
              <h1 className="text-3xl font-black text-foreground">לוח הרווחים</h1>
              <p className="text-muted-foreground text-sm mt-1">
                נקודות, קאשבק ותחזית חלוקת הקהילה לחודש{" "}
                <span className="text-foreground font-medium">
                  {new Date().toLocaleString("he-IL", { month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <StatCard
            icon={Lock}
            label="נקודות נעולות"
            value={lockedPts.toLocaleString("he-IL")}
            sub="ישוחררו עד 72 שעות"
            accent="amber"
            loading={loading}
          />
          <StatCard
            icon={Unlock}
            label="נקודות זמינות"
            value={availablePts.toLocaleString("he-IL")}
            sub="מוכן לחלוקה חודשית"
            accent="emerald"
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="סה״כ נקודות"
            value={totalPts.toLocaleString("he-IL")}
            sub="העונה הנוכחית"
            accent="primary"
            loading={loading}
          />
          <StatCard
            icon={Zap}
            label="תחזית חודשית"
            value={loading ? "…" : formatILS(estimatedPayout)}
            sub={loading ? "" : `מקופה של ${formatILS(vaultTotal)}`}
            accent="blue"
            loading={loading}
          />
        </motion.div>

        {/* Estimated payout info box */}
        {!loading && estimatedPayout > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-3"
          >
            <Info size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">
                תחזית תשלום: {formatILS(estimatedPayout)}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                מבוסס על{" "}
                <span className="text-foreground font-medium">
                  {estimate?.reviewer_points?.toLocaleString("he-IL")}
                </span>{" "}
                נקודותיך מתוך{" "}
                <span className="text-foreground font-medium">
                  {estimate?.global_points?.toLocaleString("he-IL")}
                </span>{" "}
                נקודות קהילתיות ({((estimate?.share_pct ?? 0) * 100).toFixed(3)}% מהקופה).
                הסכום הסופי יחושב ב-1 לחודש הבא.
              </p>
            </div>
          </motion.div>
        )}

        {/* Season discount progress */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <SeasonProgress points={totalPts} />
        </motion.div>

        {/* Transaction history */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">היסטוריית נקודות</h2>
            <a href="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-1">
              לוח תוצאות עונתי <ChevronRight size={12} />
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">עדיין אין נקודות. כתוב ביקורת ראשונה כדי להתחיל!</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                גלה עסקים
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      tx.status === "locked" ? "bg-amber-400" :
                      tx.status === "active" ? "bg-emerald-400" :
                      tx.status === "paid_out" ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.description ?? txTypeLabel[tx.transaction_type] ?? tx.transaction_type}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("he-IL")}
                        </span>
                        {tx.locked_until && tx.status === "locked" && (
                          <CountdownBadge lockedUntil={tx.locked_until} />
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${txTypeColor[tx.transaction_type] ?? "text-foreground"}`}>
                    {["deducted","locked"].includes(tx.transaction_type) ? "−" : "+"}{tx.points.toLocaleString("he-IL")}
                    <span className="text-[10px] font-normal text-muted-foreground mr-0.5">נק׳</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </main>
      <Footer />
    </div>
  );
}

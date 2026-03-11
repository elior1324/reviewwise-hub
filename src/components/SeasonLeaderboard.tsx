/**
 * SeasonLeaderboard — Public ranking of top season contributors.
 *
 * Shows top 3 reviewers + their progress toward the 70% discount prize.
 * Embeddable on the homepage or standalone at /leaderboard.
 *
 * Props:
 *   compact — slim card mode for embedding
 *   limit   — how many rows to show (default 10)
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Award, Zap, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderRow {
  reviewer_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  review_count: number;
  rank: number;
}

interface Props {
  compact?: boolean;
  limit?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEASON_TARGET = 5000;
const PRIZE_DISCOUNT = 70;
const PRIZE_SLOTS    = 3;

const RANK_CONFIG = [
  { icon: Crown,  color: "text-yellow-400",  bg: "bg-yellow-400/10  border-yellow-400/25",  label: "מקום ראשון"  },
  { icon: Trophy, color: "text-slate-300",   bg: "bg-slate-400/10   border-slate-400/25",   label: "מקום שני"   },
  { icon: Medal,  color: "text-amber-600",   bg: "bg-amber-700/10   border-amber-700/25",   label: "מקום שלישי" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const progressPct = (pts: number) =>
  Math.min(Math.round((pts / SEASON_TARGET) * 100), 100);

// ─── Top-3 Podium card ────────────────────────────────────────────────────────

const PodiumCard = ({ row, cfg }: { row: LeaderRow; cfg: typeof RANK_CONFIG[0] }) => {
  const Icon   = cfg.icon;
  const pct    = progressPct(row.total_points);
  const earned = row.rank <= PRIZE_SLOTS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (row.rank - 1) * 0.1 }}
      className={`flex flex-col items-center p-4 rounded-2xl border ${cfg.bg} relative overflow-hidden`}
    >
      {/* Prize badge */}
      {earned && (
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Sparkles size={7} />
            {PRIZE_DISCOUNT}% הנחה
          </span>
        </div>
      )}

      {/* Rank icon */}
      <Icon size={26} className={`${cfg.color} mb-2`} />

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 mb-2 overflow-hidden ${cfg.bg} ${cfg.color}`}>
        {row.avatar_url
          ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials(row.display_name)}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-foreground text-center leading-tight truncate max-w-full px-1">
        {row.display_name}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {row.review_count} ביקורות
      </p>

      {/* Points */}
      <p className={`text-xl font-black mt-2 ${cfg.color}`}>
        {row.total_points.toLocaleString("he-IL")}
      </p>
      <p className="text-[9px] text-muted-foreground">נקודות</p>

      {/* Progress bar to target */}
      <div className="w-full mt-3">
        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: (row.rank - 1) * 0.1 + 0.3 }}
            className={`absolute inset-y-0 right-0 rounded-full ${
              pct >= 100 ? "bg-emerald-400" : "bg-primary"
            }`}
          />
        </div>
        <p className="text-[9px] text-muted-foreground mt-1 text-center">{pct}% ממטרת הפרס</p>
      </div>
    </motion.div>
  );
};

// ─── Table row ────────────────────────────────────────────────────────────────

const LeaderTableRow = ({
  row,
  myId,
  delay,
}: {
  row: LeaderRow;
  myId: string | undefined;
  delay: number;
}) => {
  const isMe   = row.reviewer_id === myId;
  const earned = row.rank <= PRIZE_SLOTS;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isMe
          ? "border-primary/40 bg-primary/8"
          : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
      dir="rtl"
    >
      {/* Rank */}
      <span className="text-sm font-bold text-muted-foreground w-6 text-center shrink-0">
        {row.rank <= 3 ? ["🥇","🥈","🥉"][row.rank - 1] : row.rank}
      </span>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
        {row.avatar_url
          ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials(row.display_name)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{row.display_name}</span>
          {isMe    && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">אני</span>}
          {earned  && <span className="text-[9px] bg-yellow-400/15 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">🏆 {PRIZE_DISCOUNT}% הנחה</span>}
        </div>
        <p className="text-[10px] text-muted-foreground">{row.review_count} ביקורות</p>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{row.total_points.toLocaleString("he-IL")}</p>
        <p className="text-[9px] text-muted-foreground">נקודות</p>
      </div>
    </motion.div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const SeasonLeaderboard = ({ compact = false, limit = 10 }: Props) => {
  const { user } = useAuth();
  const [rows, setRows]       = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const monthYear = new Date().toISOString().slice(0, 7);

    // Aggregate points from point_transactions, join with profiles
    const { data, error } = await supabase
      .from("point_transactions")
      .select(`
        user_id,
        points,
        profiles!inner(display_name, avatar_url)
      `)
      .eq("status", "active")
      .eq("transaction_type", "earned")
      .eq("month_year", monthYear) as any;

    if (error || !data) { setLoading(false); return; }

    // Aggregate by user
    const agg: Record<string, { pts: number; count: number; name: string; avatar: string | null }> = {};
    for (const row of data) {
      const id = row.user_id;
      if (!agg[id]) {
        agg[id] = {
          pts: 0, count: 0,
          name: row.profiles?.display_name ?? "Anonymous",
          avatar: row.profiles?.avatar_url ?? null,
        };
      }
      agg[id].pts += row.points;
      agg[id].count += 1;
    }

    const sorted: LeaderRow[] = Object.entries(agg)
      .map(([reviewer_id, v]) => ({
        reviewer_id,
        display_name: v.name,
        avatar_url:   v.avatar,
        total_points: v.pts,
        review_count: v.count,
        rank: 0,
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((r, i) => ({ ...r, rank: i + 1 }))
      .slice(0, limit);

    setRows(sorted);
    setLoading(false);
  };

  const top3   = rows.slice(0, 3);
  const rest   = rows.slice(3);

  // ── Compact mode ────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]" dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-yellow-400" />
            <span className="text-sm font-bold text-foreground">לוח תוצאות עונתי</span>
          </div>
          <a href="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            כל התוצאות <ChevronRight size={11} />
          </a>
        </div>
        {loading
          ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />)}</div>
          : rows.slice(0, 5).map((r, i) => (
              <LeaderTableRow key={r.reviewer_id} row={r} myId={user?.id} delay={i * 0.05} />
            ))
        }
      </div>
    );
  }

  // ── Full page mode ───────────────────────────────────────────────────────────
  return (
    <div dir="rtl">
      {/* Prize explanation banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 flex items-start gap-4"
      >
        <Award size={28} className="text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-foreground mb-1">
            פרס העונה — {PRIZE_DISCOUNT}% הנחה על ReviewHub Pro
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {PRIZE_SLOTS} התורמים המובילים של העונה (לפי נקודות מצטברות מביקורות מאומתות)
            מקבלים <strong className="text-yellow-400">{PRIZE_DISCOUNT}% הנחה</strong> על מנוי Pro
            לשנת {new Date().getFullYear() + 1}. הנקודות מאופסות ב-1 בינואר.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Zap size={11} className="text-primary" /> 100 נק׳ לביקורת רגילה</span>
            <span className="flex items-center gap-1"><Sparkles size={11} className="text-emerald-400" /> 200 נק׳ לביקורת מאומתת</span>
            <span className="flex items-center gap-1">⚡ ×2 עד ×10 על לייקים</span>
          </div>
        </div>
      </motion.div>

      {/* Podium — top 3 */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {top3.map((r, i) => (
            <PodiumCard key={r.reviewer_id} row={r} cfg={RANK_CONFIG[i]} />
          ))}
          {/* Placeholders if fewer than 3 */}
          {[...Array(Math.max(0, 3 - top3.length))].map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-muted-foreground text-sm">
              {RANK_CONFIG[top3.length + i].label}
              <span className="text-xs mt-1 opacity-50">ממתין לכותב</span>
            </div>
          ))}
        </div>
      )}

      {/* Ranks 4+ */}
      {!loading && rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((r, i) => (
            <LeaderTableRow key={r.reviewer_id} row={r} myId={user?.id} delay={i * 0.04} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy size={36} className="mx-auto mb-3 opacity-20" />
          <p>אין עדיין תוצאות לחודש זה. כתוב ביקורת ראשונה!</p>
        </div>
      )}
    </div>
  );
};

export default SeasonLeaderboard;

/**
 * SeasonLeaderboard — Public ranking of top community contributors.
 *
 * Reputation-only (no monetary incentives):
 * - Points are Trust Points (status points) with zero cash value.
 * - Verified reviews receive more points and stronger weight in ranking.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, BadgeCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  review_count: number;
  verified_count: number;
  rank: number;
}

interface Props {
  compact?: boolean;
  limit?: number;
}

const RANK_CONFIG = [
  { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/25", label: "מקום ראשון" },
  { icon: Trophy, color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/25", label: "מקום שני" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-700/10 border-amber-700/25", label: "מקום שלישי" },
] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const PodiumCard = ({ row, cfg }: { row: LeaderRow; cfg: (typeof RANK_CONFIG)[number] }) => {
  const Icon = cfg.icon;
  const isVerified = row.verified_count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (row.rank - 1) * 0.1 }}
      className={`flex flex-col items-center p-4 rounded-2xl border ${cfg.bg} relative overflow-hidden`}
      dir="rtl"
    >
      <Icon size={26} className={`${cfg.color} mb-2`} aria-hidden="true" />

      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 mb-2 overflow-hidden ${cfg.bg} ${cfg.color}`}
      >
        {row.avatar_url ? (
          <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials(row.display_name)
        )}
      </div>

      <p className="text-sm font-bold text-foreground text-center leading-tight truncate max-w-full px-1">
        {row.display_name}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <p className="text-[10px] text-muted-foreground">{row.review_count} ביקורות</p>
        {isVerified && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500">
            <BadgeCheck size={10} aria-hidden="true" />
            Verified
          </span>
        )}
      </div>

      <p className={`text-xl font-black mt-3 ${cfg.color}`}>{row.points.toLocaleString("he-IL")}</p>
      <p className="text-[9px] text-muted-foreground">נקודות אמון</p>
    </motion.div>
  );
};

const LeaderTableRow = ({ row, myId, delay }: { row: LeaderRow; myId: string | undefined; delay: number }) => {
  const isMe = row.user_id === myId;
  const isVerified = row.verified_count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isMe ? "border-primary/40 bg-primary/8" : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
      dir="rtl"
    >
      <span className="text-sm font-bold text-muted-foreground w-6 text-center shrink-0">
        {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
      </span>

      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
        {row.avatar_url ? (
          <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials(row.display_name)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{row.display_name}</span>
          {isMe && (
            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">אני</span>
          )}
          {isVerified && (
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">
              <BadgeCheck size={10} className="inline ml-1" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">{row.review_count} ביקורות</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{row.points.toLocaleString("he-IL")}</p>
        <p className="text-[9px] text-muted-foreground">נקודות אמון</p>
      </div>
    </motion.div>
  );
};

const SeasonLeaderboard = ({ compact = false, limit = 10 }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    setLoading(true);

    const { data: season } = await supabase
      .from("leaderboard_seasons")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!season?.id) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: entries, error: entriesErr } = await supabase
      .from("leaderboard_entries")
      .select("user_id, points, review_count, verified_count")
      .eq("season_id", season.id)
      .order("points", { ascending: false })
      .limit(limit);

    if (entriesErr || !entries || entries.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = entries.map((e: any) => e.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const mapped: LeaderRow[] = entries
      .map((e: any, idx: number) => {
        const p = profileMap.get(e.user_id);
        return {
          user_id: e.user_id,
          display_name: p?.display_name || "משתמש",
          avatar_url: p?.avatar_url || null,
          points: Number(e.points) || 0,
          review_count: Number(e.review_count) || 0,
          verified_count: Number(e.verified_count) || 0,
          rank: idx + 1,
        };
      })
      .sort((a, b) => b.points - a.points)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    setRows(mapped);
    setLoading(false);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  if (compact) {
    return (
      <div className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]" dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-yellow-400" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground">לוח תוצאות</span>
          </div>
          <a href="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            כל התוצאות <ChevronRight size={11} aria-hidden="true" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">עדיין אין דירוג. היו הראשונים לתרום.</p>
        ) : (
          rows.slice(0, Math.min(5, rows.length)).map((r, i) => (
            <LeaderTableRow key={r.user_id} row={r} myId={user?.id} delay={i * 0.05} />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-[220px] rounded-2xl bg-white/[0.04] animate-pulse" />)
        ) : top3.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">עדיין אין דירוג. היו הראשונים לתרום.</div>
        ) : (
          top3.map((row, i) => <PodiumCard key={row.user_id} row={row} cfg={RANK_CONFIG[i]} />)
        )}
      </div>

      {/* Table */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          rest.map((row, i) => (
            <LeaderTableRow key={row.user_id} row={row} myId={user?.id} delay={i * 0.03} />
          ))
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
        נקודות אמון הן מדד מוניטין בלבד. אין להן ערך כספי ואי אפשר להמיר/למשוך/להעביר אותן.
      </p>
    </div>
  );
};

export default SeasonLeaderboard;

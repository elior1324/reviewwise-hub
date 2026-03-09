import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Timer, Gift, Crown, Medal, Award, Flame, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SeasonData {
  id: string;
  season_name: string;
  starts_at: string;
  ends_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  points: number;
  review_count: number;
  verified_count: number;
  display_name?: string;
}

const PRIZES = [
  { rank: 1, icon: Crown, label: "מקום ראשון", discount: "70%", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { rank: 2, icon: Medal, label: "מקום שני", discount: "30%", color: "text-slate-400", bg: "bg-slate-400/10" },
  { rank: 3, icon: Award, label: "מקום שלישי", discount: "15%", color: "text-amber-600", bg: "bg-amber-600/10" },
];

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

const LeaderboardWidget = () => {
  const { user } = useAuth();
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get active season
      const { data: seasonData } = await supabase
        .from("leaderboard_seasons")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!seasonData) { setLoading(false); return; }
      setSeason(seasonData);

      // Get top entries
      const { data: entryData } = await supabase
        .from("leaderboard_entries")
        .select("user_id, points, review_count, verified_count")
        .eq("season_id", seasonData.id)
        .order("points", { ascending: false })
        .limit(10);

      if (entryData && entryData.length > 0) {
        // Get display names
        const userIds = entryData.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
        setEntries(entryData.map(e => ({
          ...e,
          display_name: profileMap.get(e.user_id) || "משתמש",
        })));
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const countdown = useCountdown(season?.ends_at || new Date().toISOString());
  const myEntry = entries.find(e => e.user_id === user?.id);
  const myRank = entries.findIndex(e => e.user_id === user?.id) + 1;

  // Calculate points to next prize
  const pointsToNextPrize = useMemo(() => {
    if (!myEntry || myRank <= 0) return null;
    if (myRank <= 3) return null;
    const thirdPlacePoints = entries[2]?.points || 0;
    return thirdPlacePoints - myEntry.points;
  }, [myEntry, myRank, entries]);

  if (loading) return null;
  if (!season) return null;

  return (
    <Card className="shadow-card bg-card overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-l from-primary/20 via-primary/10 to-transparent p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            <CardTitle className="text-base font-display">🏆 לידרבורד — {season.season_name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
            <Timer size={10} />
            {countdown.days}d {countdown.hours}h {countdown.minutes}m
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Prizes */}
        <div className="grid grid-cols-3 gap-2">
          {PRIZES.map(({ rank, icon: Icon, label, discount, color, bg }) => (
            <div key={rank} className={`rounded-lg ${bg} p-3 text-center`}>
              <Icon size={20} className={`${color} mx-auto mb-1`} />
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`font-display font-bold text-lg ${color}`}>{discount}</p>
              <p className="text-[9px] text-muted-foreground">הנחה</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-1">
          {entries.slice(0, 5).map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const rank = i + 1;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isMe ? "bg-primary/10 ring-1 ring-primary/30" : rank <= 3 ? "bg-muted/30" : ""
                }`}
              >
                <span className={`w-6 text-center font-display font-bold text-sm ${
                  rank === 1 ? "text-yellow-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? "text-primary font-bold" : ""}`}>
                    {entry.display_name} {isMe && <span className="text-[10px]">(את/ה)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.review_count} ביקורות · {entry.verified_count} מאומתות
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {entry.verified_count > 0 && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Flame size={8} /> 2X
                    </span>
                  )}
                  <span className="font-display font-bold text-sm">{entry.points}</span>
                  <Star size={10} className="text-primary" />
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              עדיין אין משתתפים בעונה הזו. כתבו ביקורת כדי להתחיל!
            </p>
          )}
        </div>

        {/* My Status */}
        {myEntry && myRank > 3 && pointsToNextPrize && pointsToNextPrize > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
            <p className="text-sm font-medium">
              🔥 חסרות לך רק <span className="font-bold text-primary">{pointsToNextPrize}</span> נקודות להנחה של 15%!
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              אמת/י ביקורות כדי לקבל 2X נקודות ולטפס בדירוג!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;

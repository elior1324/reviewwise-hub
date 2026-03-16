/**
 * UserReferralDashboard
 *
 * Consumer-facing "Invite Friends" page at /user/referrals.
 *
 * Shows:
 *   - The user's personal invite link (reviewhub.com/invite/<code>)
 *   - Copy-to-clipboard + share buttons
 *   - Referral stats: total invites, confirmed, points earned
 *   - Tier progress bar (150 / 300 / 600 point thresholds)
 *   - Reward catalog with Redeem buttons
 *
 * Requires login — protected by AuthProtectedRoute in App.tsx.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Gift, Copy, Check, Users, Star, Trophy,
  Zap, BadgeDollarSign, TrendingUp, ExternalLink,
  BarChart3, Sparkles, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferralStats {
  invite_code:     string;
  total_referrals: number;
  confirmed_refs:  number;
  total_points:    number;
  pending_points:  number;
}

interface RewardItem {
  id:              string;
  name:            string;
  description:     string;
  points_required: number;
  reward_type:     string;
  reward_value:    string | null;
  active:          boolean;
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIERS = [
  { label: "Starter",      min: 0,   max: 149,  color: "text-muted-foreground", bg: "bg-muted/40",        border: "border-border/40"       },
  { label: "Explorer",     min: 150, max: 299,  color: "text-primary",          bg: "bg-primary/10",      border: "border-primary/30"      },
  { label: "Influencer",   min: 300, max: 599,  color: "text-emerald-600",      bg: "bg-emerald-500/10",  border: "border-emerald-500/30"  },
  { label: "Ambassador",   min: 600, max: Infinity, color: "text-amber-600",    bg: "bg-amber-500/10",    border: "border-amber-500/30"    },
];

function getTier(points: number) {
  return TIERS.slice().reverse().find((t) => points >= t.min) ?? TIERS[0];
}

function nextTierPoints(points: number): number | null {
  const thresholds = [150, 300, 600];
  return thresholds.find((t) => t > points) ?? null;
}

// ── Reward icon by type ───────────────────────────────────────────────────────

const REWARD_ICONS: Record<string, React.ReactNode> = {
  pro_credit:    <Zap size={18} className="text-primary" />,
  coupon:        <BadgeDollarSign size={18} className="text-emerald-600" />,
  profile_boost: <TrendingUp size={18} className="text-amber-500" />,
  cash:          <Star size={18} className="text-amber-500" />,
};

// ── Main Component ─────────────────────────────────────────────────────────────

const UserReferralDashboard = () => {
  const { user } = useAuth();

  const [stats,        setStats]        = useState<ReferralStats | null>(null);
  const [rewards,      setRewards]      = useState<RewardItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState(false);
  const [redeeming,    setRedeeming]    = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, rewardsRes] = await Promise.all([
        supabase.rpc("get_my_referral_stats"),
        supabase.from("reward_catalog").select("*").eq("active", true).order("points_required"),
      ]);

      if (statsRes.data && Array.isArray(statsRes.data) && statsRes.data.length > 0) {
        setStats(statsRes.data[0] as ReferralStats);
      } else if (statsRes.data && !Array.isArray(statsRes.data)) {
        setStats(statsRes.data as unknown as ReferralStats);
      }
      if (rewardsRes.data) setRewards(rewardsRes.data as RewardItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Ensure invite code exists ──────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_or_create_my_invite_code").then(({ data }) => {
      if (data && !stats?.invite_code) {
        setStats((prev) => prev ? { ...prev, invite_code: data as string } : {
          invite_code:     data as string,
          total_referrals: 0,
          confirmed_refs:  0,
          total_points:    0,
          pending_points:  0,
        });
      }
    });
  }, [user, stats?.invite_code]);

  // ── Copy invite link ───────────────────────────────────────────────────────

  const inviteUrl = stats?.invite_code
    ? `${window.location.origin}/invite/${stats.invite_code}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("הקישור הועתק ללוח!");
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Redeem reward ──────────────────────────────────────────────────────────

  const handleRedeem = async (rewardId: string, pointsRequired: number) => {
    if (!stats || stats.total_points < pointsRequired) {
      toast.error("אין מספיק נקודות למימוש פרס זה");
      return;
    }
    setRedeeming(rewardId);
    try {
      const { error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
      if (error) {
        toast.error(error.message ?? "שגיאה במימוש הפרס");
      } else {
        toast.success("הפרס נמחש בהצלחה! נציגנו יצרו אתכם קשר.");
        await loadData();
      }
    } finally {
      setRedeeming(null);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const points   = stats?.total_points ?? 0;
  const tier     = getTier(points);
  const nextPts  = nextTierPoints(points);
  const tierPct  = nextPts
    ? Math.min(100, ((points - tier.min) / (nextPts - tier.min)) * 100)
    : 100;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-28 space-y-8">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gift size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">הזמינו חברים</h1>
            <p className="text-sm text-muted-foreground">צברו נקודות על כל הרשמה מוצלחת</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Invite link card ─────────────────────────────────────────── */}
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/3 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-primary" />
                <span className="font-bold text-sm text-foreground">קישור ההזמנה האישי שלכם</span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-2.5 font-mono text-sm text-primary truncate">
                  {inviteUrl || "טוען..."}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!inviteUrl}
                  className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span className="mr-1.5 text-xs">{copied ? "הועתק!" : "העתק"}</span>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                שתפו את הקישור עם חברים — כל הרשמה מוצלחת תעניק לכם{" "}
                <span className="font-bold text-primary">150 נקודות</span>.
              </p>
            </div>

            {/* ── Stats row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Users size={18} />,     label: "הוזמנו",     value: stats?.total_referrals ?? 0, color: "text-primary"      },
                { icon: <Check size={18} />,      label: "אושרו",      value: stats?.confirmed_refs  ?? 0, color: "text-emerald-600"  },
                { icon: <Trophy size={18} />,     label: "נקודות",     value: stats?.total_points    ?? 0, color: "text-amber-500"    },
                { icon: <BarChart3 size={18} />,  label: "ממתין",      value: stats?.pending_points  ?? 0, color: "text-muted-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-4 text-center space-y-1">
                  <div className={`flex justify-center ${stat.color}`}>{stat.icon}</div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ── Tier progress ────────────────────────────────────────────── */}
            <div className={`rounded-2xl border-2 ${tier.border} ${tier.bg} p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className={tier.color} />
                  <span className={`font-bold text-sm ${tier.color}`}>רמה: {tier.label}</span>
                </div>
                <Badge variant="outline" className={`text-[11px] ${tier.color} border-current`}>
                  {points} נקודות
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-background/60 border border-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${tierPct}%` }}
                  />
                </div>
                {nextPts ? (
                  <p className="text-xs text-muted-foreground text-left">
                    עוד <span className="font-bold text-foreground">{nextPts - points}</span> נקודות לרמה הבאה
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">השגתם את הרמה הגבוהה ביותר! 🎉</p>
                )}
              </div>

              {/* Tier milestones */}
              <div className="flex gap-2 flex-wrap">
                {TIERS.filter((t) => t.min > 0).map((t) => (
                  <div
                    key={t.label}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${
                      points >= t.min
                        ? `${t.color} ${t.bg} ${t.border} font-semibold`
                        : "text-muted-foreground border-border/30 bg-muted/20"
                    }`}
                  >
                    {points >= t.min && <Check size={10} />}
                    {t.label} ({t.min}+)
                  </div>
                ))}
              </div>
            </div>

            {/* ── Rewards catalog ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-primary" />
                <h2 className="font-bold text-base text-foreground">פרסים לפידיון</h2>
              </div>

              {rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  אין פרסים זמינים כרגע
                </p>
              ) : (
                <div className="space-y-2">
                  {rewards.map((reward) => {
                    const canRedeem    = points >= reward.points_required;
                    const isRedeeming  = redeeming === reward.id;

                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                          canRedeem
                            ? "border-primary/30 bg-primary/3 hover:border-primary/50"
                            : "border-border/40 bg-card opacity-70"
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          canRedeem ? "bg-primary/10" : "bg-muted/50"
                        }`}>
                          {REWARD_ICONS[reward.reward_type] ?? <Gift size={18} className="text-muted-foreground" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">{reward.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                canRedeem
                                  ? "border-primary/40 text-primary bg-primary/5"
                                  : "border-border/50 text-muted-foreground"
                              }`}
                            >
                              {reward.points_required} נקודות
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {reward.description}
                          </p>
                        </div>

                        {/* Redeem */}
                        <Button
                          size="sm"
                          variant={canRedeem ? "default" : "outline"}
                          disabled={!canRedeem || isRedeeming}
                          onClick={() => handleRedeem(reward.id, reward.points_required)}
                          className="shrink-0 text-xs"
                        >
                          {isRedeeming ? (
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              ממש...
                            </span>
                          ) : canRedeem ? (
                            <span className="flex items-center gap-1">
                              מממש
                              <ChevronRight size={12} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              חסרות {reward.points_required - points} נקודות
                            </span>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── How it works ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                איך זה עובד?
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-none">
                {[
                  "שתפו את קישור ההזמנה האישי שלכם עם חברים",
                  "החבר לוחץ על הקישור ונרשם לחשבון חדש",
                  "לאחר אישור ההרשמה — מתווספות לכם 150 נקודות אוטומטית",
                  "אין הגבלה על מספר ההזמנות — כל הזמנה = 150 נקודות",
                  "מממשים נקודות לפרסים מהקטלוג למעלה",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserReferralDashboard;

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Trophy, Star, ThumbsUp, Wallet, Users,
  Award, Crown, Sparkles, Timer, Gift, Zap, Shield, Info, Mail,
  Flame, Target, ArrowUp, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useSeasonInfo } from "@/hooks/useSeasonInfo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface RewardEntry {
  reviewId: string;
  reviewText: string;
  courseName: string;
  basePoints: number;
  likeCount: number;
  multiplier: number;
  totalPoints: number;
  isEarlyBird: boolean;
  isVerified: boolean;
  helpfulBonus: number;
}

interface LeaderboardEntry {
  displayName: string;
  totalPoints: number;
  badge: string | null;
  rank: number;
  isExpert: boolean;
  userId: string;
}

const PRIZES = [
  { rank: 1, discount: "70%", emoji: "👑", color: "text-yellow-500", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  { rank: 2, discount: "30%", emoji: "🥈", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30" },
  { rank: 3, discount: "15%", emoji: "🥉", color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30" },
];

const PartnerDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const season = useSeasonInfo();

  const [rewards, setRewards] = useState<RewardEntry[]>([]);
  const [poolData, setPoolData] = useState({ communityPool: 0, totalPoints: 0, myPoints: 0 });
  const [myEarnings, setMyEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [expertCategories, setExpertCategories] = useState<string[]>([]);
  const [earlyBirdCount, setEarlyBirdCount] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [pointsToTop3, setPointsToTop3] = useState<number>(0);

  // Live countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: season.daysLeft, hours: season.hoursLeft, minutes: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const msLeft = Math.max(0, season.seasonEnd.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(msLeft / (1000 * 60 * 60 * 24)),
        hours: Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [season.seasonEnd]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch rewards for ALL months in the current season
    const { data: rewardsData } = await supabase
      .from("rewards_log")
      .select("*")
      .eq("user_id", user.id)
      .in("month_year", season.seasonMonths);

    if (rewardsData) {
      const reviewIds = rewardsData.map((r: any) => r.review_id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, text, course_id, business_id, verified, courses(name)")
        .in("id", reviewIds.length > 0 ? reviewIds : ["none"]);

      const reviewMap = new Map((reviews || []).map((r: any) => [r.id, r]));

      const businessIds = [...new Set((reviews || []).map((r: any) => r.business_id))];
      let earlyBirdSet = new Set<string>();
      let ebCount = 0;

      for (const bizId of businessIds) {
        const { data: bizReviews } = await supabase
          .from("reviews")
          .select("id")
          .eq("business_id", bizId)
          .order("created_at", { ascending: true })
          .limit(5);
        if (bizReviews) {
          bizReviews.forEach((br: any) => earlyBirdSet.add(br.id));
        }
      }

      const mapped: RewardEntry[] = rewardsData.map((r: any) => {
        const review = reviewMap.get(r.review_id);
        const isEB = earlyBirdSet.has(r.review_id);
        const isVerified = review?.verified === true;
        if (isEB) ebCount++;
        const ebMultiplier = isEB ? 1.5 : 1;
        const verifiedMultiplier = isVerified ? 2 : 1;
        return {
          reviewId: r.review_id,
          reviewText: review?.text?.slice(0, 80) || "ביקורת",
          courseName: review?.courses?.name || "קורס",
          basePoints: Number(r.base_points),
          likeCount: r.like_count,
          multiplier: Number(r.multiplier),
          totalPoints: Number(r.total_points) * ebMultiplier * verifiedMultiplier,
          isEarlyBird: isEB,
          isVerified,
          helpfulBonus: 0,
        };
      });
      setRewards(mapped);
      setEarlyBirdCount(ebCount);
    }

    // Pool data aggregated across season months
    const { data: poolRows } = await supabase
      .from("rewards_pool")
      .select("*")
      .in("month_year", season.seasonMonths);

    const communityPool = (poolRows || []).reduce((s: number, p: any) => s + Number(p.community_pool), 0);
    const totalPlatformPoints = (poolRows || []).reduce((s: number, p: any) => s + Number(p.total_points), 0);
    const myTotalPoints = (rewardsData || []).reduce((s: number, r: any) => s + Number(r.total_points), 0);

    setPoolData({ communityPool, totalPoints: totalPlatformPoints, myPoints: myTotalPoints });

    const earnings = totalPlatformPoints > 0 ? (myTotalPoints / totalPlatformPoints) * communityPool : 0;
    setMyEarnings(earnings);

    // Total historical earnings
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_earnings")
      .eq("user_id", user.id)
      .maybeSingle();
    setTotalEarnings(Number(profile?.total_earnings) || 0);

    // Check Category Expert
    const { data: userReviews } = await supabase
      .from("reviews")
      .select("id, rating, course_id, courses(category)")
      .eq("user_id", user.id)
      .gte("rating", 4);

    if (userReviews) {
      const catCounts: Record<string, number> = {};
      userReviews.forEach((r: any) => {
        const cat = r.courses?.category;
        if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      setExpertCategories(Object.entries(catCounts).filter(([, c]) => c >= 3).map(([cat]) => cat));
    }

    // Payouts
    const { data: payoutsData } = await supabase
      .from("reward_payouts")
      .select("*")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false });
    setPayouts(payoutsData || []);

    // Leaderboard for current season
    const { data: allRewards } = await supabase
      .from("rewards_log")
      .select("user_id, total_points")
      .in("month_year", season.seasonMonths);

    if (allRewards) {
      const userPoints: Record<string, number> = {};
      allRewards.forEach((r: any) => {
        userPoints[r.user_id] = (userPoints[r.user_id] || 0) + Number(r.total_points);
      });

      const sortedUsers = Object.entries(userPoints)
        .sort(([, a], [, b]) => b - a);

      // Find my rank
      const myIndex = sortedUsers.findIndex(([uid]) => uid === user.id);
      setMyRank(myIndex >= 0 ? myIndex + 1 : null);

      // Points to top 3
      if (sortedUsers.length >= 3 && myIndex >= 3) {
        setPointsToTop3(sortedUsers[2][1] - (myTotalPoints || 0) + 1);
      } else {
        setPointsToTop3(0);
      }

      const top10 = sortedUsers.slice(0, 10);
      const userIds = top10.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, partner_badge")
        .in("user_id", userIds.length > 0 ? userIds : ["none"]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setLeaderboard(top10.map(([uid, pts], i) => ({
        displayName: profileMap.get(uid)?.display_name || "משתמש",
        totalPoints: pts,
        badge: profileMap.get(uid)?.partner_badge || null,
        rank: i + 1,
        isExpert: false,
        userId: uid,
      })));
    }
  }, [user, season.seasonMonths]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdraw = async () => {
    if (myEarnings < 100) {
      toast({ title: "לא ניתן למשוך", description: "הסכום המינימלי למשיכה הוא ₪100.", variant: "destructive" });
      return;
    }
    setWithdrawLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { error } = await supabase.from("reward_payouts").insert({
        user_id: user!.id,
        month_year: currentMonth,
        points: poolData.myPoints,
        amount: myEarnings,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "בקשת המשיכה נשלחה!", description: `₪${myEarnings.toFixed(2)} ממתינים לאישור.` });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background noise-overlay" dir="rtl">
        <Navbar />
        <div className="container py-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Crown size={64} className="mx-auto mb-6 text-primary" />
            <h1 className="font-display font-bold text-4xl mb-4">המרתון של 6 חודשים 🏆</h1>
            <p className="text-muted-foreground text-lg mb-2">כתבו ביקורות. טפסו בדירוג. זכו בפרסים!</p>
            <p className="text-muted-foreground mb-8">יש להתחבר כדי לצפות ברווחים שלכם</p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold gap-2">
                <Sparkles size={18} /> התחברו ותתחילו להרוויח
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // Multiplier progress
  const bestReview = rewards.length > 0 ? rewards.reduce((a, b) => a.likeCount > b.likeCount ? a : b) : null;
  const nextMultiplierLikes = bestReview ? (Math.floor(bestReview.likeCount / 10) + 1) * 10 : 10;
  const likesToNext = bestReview ? nextMultiplierLikes - bestReview.likeCount : 10;
  const progressToNext = bestReview ? ((bestReview.likeCount % 10) / 10) * 100 : 0;
  const currentMultiplier = bestReview ? bestReview.multiplier : 1;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const pendingPayout = payouts.find(p => p.month_year === currentMonth && p.status === "pending");

  // Progress to 1st place
  const firstPlacePoints = leaderboard.length > 0 ? leaderboard[0].totalPoints : 0;
  const progressTo1st = firstPlacePoints > 0 ? Math.min(100, (poolData.myPoints / firstPlacePoints) * 100) : 0;

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero - Marketing Voice */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(45 100% 51% / 0.1), hsl(35 100% 50% / 0.05), hsl(160 84% 39% / 0.08))" }} />
        <div className="container py-12 md:py-16 relative">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Flame size={16} /> המרתון של 6 חודשים
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-display font-bold text-3xl md:text-5xl text-foreground mb-3">
              כתבו. דרגו. זכו בגדול! 🏆
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg md:text-xl">
              המרתון הגדול רץ 6 חודשים — 3 הזוכים הראשונים מקבלים הנחות מטורפות על כל קורס שירצו.
              <br />
              <span className="text-primary font-semibold">מקום 1 = 70% הנחה</span> · <span className="font-medium">מקום 2 = 30%</span> · <span className="font-medium">מקום 3 = 15%</span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        {/* Season Banner + Live Countdown */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
          <Card className="shadow-card bg-card border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), transparent 60%)" }} />
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Timer size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-foreground">{season.seasonLabel}</h2>
                    <p className="text-sm text-muted-foreground">
                      ⏰ רק {timeLeft.days} ימים נותרו לאבטח את הפרס שלכם!
                    </p>
                  </div>
                </div>
                {/* Live countdown digits */}
                <div className="flex items-center gap-3">
                  {[
                    { value: timeLeft.days, label: "ימים" },
                    { value: timeLeft.hours, label: "שעות" },
                    { value: timeLeft.minutes, label: "דקות" },
                  ].map((unit, i) => (
                    <div key={i} className="text-center">
                      <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="font-display font-bold text-2xl text-foreground">{unit.value}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Progress value={season.progressPercent} className="h-2 mt-4" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Prize Podium Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5} className="mb-6">
          <Card className="shadow-card bg-card overflow-hidden">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-lg text-foreground text-center mb-6 flex items-center justify-center gap-2">
                <Trophy size={22} className="text-primary" /> הפרסים למובילי העונה
              </h3>
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {PRIZES.map((prize) => (
                  <motion.div
                    key={prize.rank}
                    whileHover={{ scale: 1.04, y: -4 }}
                    className={`text-center p-4 md:p-6 rounded-xl border ${prize.border} ${prize.bg} transition-colors relative`}
                  >
                    <div className="text-3xl md:text-5xl mb-2">{prize.emoji}</div>
                    {prize.rank === 1 && (
                      <Crown size={20} className="absolute top-2 right-2 text-yellow-500 animate-pulse" />
                    )}
                    <p className={`font-display font-bold text-2xl md:text-4xl ${prize.color}`}>
                      {prize.discount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">הנחה על כל קורס</p>
                    <p className="font-display font-semibold text-sm text-foreground mt-2">מקום {prize.rank}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Rank & Progress to Top */}
        {myRank && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.7} className="mb-6">
            <Card className={`shadow-card bg-card ${myRank <= 3 ? "border-primary/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${
                      myRank === 1 ? "bg-yellow-500/15 text-yellow-500" :
                      myRank === 2 ? "bg-slate-400/10 text-slate-400" :
                      myRank === 3 ? "bg-amber-600/10 text-amber-600" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {myRank <= 3 ? ["👑", "🥈", "🥉"][myRank - 1] : `#${myRank}`}
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg text-foreground">
                        {myRank <= 3
                          ? `🎉 אתם במקום ${myRank}! ${myRank === 1 ? "ה-70% הנחה כמעט שלכם!" : myRank === 2 ? "30% הנחה ממתינה לכם!" : "15% הנחה בהישג יד!"}`
                          : `אתם במקום #${myRank} — הטופ 3 קרוב!`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {poolData.myPoints.toLocaleString()} נקודות עונתיות
                        {pointsToTop3 > 0 && ` · עוד ${pointsToTop3.toLocaleString()} נק׳ לטופ 3`}
                      </p>
                    </div>
                  </div>
                  {myRank > 3 && (
                    <Link to="/search">
                      <Button className="bg-primary text-primary-foreground gap-2">
                        <ArrowUp size={16} /> כתבו ביקורת וטפסו!
                      </Button>
                    </Link>
                  )}
                </div>
                {/* Progress bar to 1st place */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>ההתקדמות שלכם למקום הראשון</span>
                    <span className="font-medium text-foreground">{progressTo1st.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressTo1st} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bonus Indicators Row */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.9} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Early Bird Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border/30 cursor-help">
                  <Zap size={16} className="text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Early Bird</p>
                    <p className="text-[10px] text-muted-foreground">{earlyBirdCount > 0 ? `${earlyBirdCount} ביקורות עם בונוס 1.5x` : "כתבו מ-5 הראשונים!"}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                5 הביקורות הראשונות על כל עסק מקבלות אוטומטית בונוס 1.5x לנקודות הבסיס. תהיו מהראשונים!
              </TooltipContent>
            </Tooltip>

            {/* Expert Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border/30 cursor-help">
                  <Shield size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">מומחה קטגוריה</p>
                    <p className="text-[10px] text-muted-foreground">
                      {expertCategories.length > 0 ? `מומחה ב: ${expertCategories.join(", ")}` : "3+ ביקורות טובות = מומחה"}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                כתבו 3+ ביקורות עם דירוג 4+ באותה קטגוריה ותקבלו תג "מומחה". לייקים ממומחים שווים כפול!
              </TooltipContent>
            </Tooltip>

            {/* Helpful Reply Bonus */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border/30 cursor-help">
                  <ThumbsUp size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">בונוס תגובה מועילה</p>
                    <p className="text-[10px] text-muted-foreground">+20 נק׳ כשתגובת בעל עסק מסומנת כמועילה</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                כשמישהו מסמן את תגובת בעל העסק על הביקורת שלכם כ"מועילה", אתם מקבלים +20 נקודות בונוס.
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Live Earnings Estimate */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <Card className="shadow-card bg-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet size={16} className="text-primary" /> הערכת רווח עונתי
                  <Tooltip>
                    <TooltipTrigger><Info size={12} className="text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent className="text-xs max-w-[200px]">
                      הנוסחה: (הנקודות שלכם / סה"כ נקודות) × 50% מהעמלות
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display font-bold text-4xl text-primary">
                  ₪{myEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {poolData.myPoints.toLocaleString()} נקודות מתוך {poolData.totalPoints.toLocaleString()} בפלטפורמה
                </p>
                {poolData.totalPoints > 0 && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    הנתח שלכם: {((poolData.myPoints / poolData.totalPoints) * 100).toFixed(2)}%
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Pool Status */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <Card className="shadow-card bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users size={16} className="text-primary" /> קופת העונה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display font-bold text-4xl text-foreground">
                  ₪{poolData.communityPool.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  50% מכלל העמלות הולכים לקהילה
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: poolData.totalPoints > 0 ? `${(poolData.myPoints / poolData.totalPoints) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">הנתח שלכם</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goal Tracker - Likes to Next Multiplier */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Card className="shadow-card bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> מטרה הבאה
                  <Tooltip>
                    <TooltipTrigger><Info size={12} className="text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent className="text-xs max-w-[200px]">
                      כל 10 לייקים = מכפיל 2x נוסף. 10→2x, 20→4x, 30→6x... עד 10x מקסימום.
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display font-bold text-xl text-foreground">
                  {currentMultiplier < 10
                    ? `עוד ${likesToNext} לייקים להכפיל (${Math.min(currentMultiplier + 2, 10)}x) את הנקודות!`
                    : "מכפיל מקסימלי! 🏆"}
                </p>
                <Progress value={currentMultiplier >= 10 ? 100 : progressToNext} className="h-3 mt-3" />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    מכפיל נוכחי: <span className="text-primary font-bold">{currentMultiplier}x</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">מקסימום 10x</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Withdraw Button */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mb-8">
          <Card className="shadow-card bg-card">
            <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-display font-semibold text-foreground">משיכת רווחים</p>
                <p className="text-sm text-muted-foreground">
                  {myEarnings >= 100 ? "הסכום שלכם זמין למשיכה!" : `נדרש מינימום ₪100 למשיכה (חסר ₪${(100 - myEarnings).toFixed(2)})`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {pendingPayout && (
                  <Badge variant="secondary" className="text-xs">בקשה ממתינה — ₪{Number(pendingPayout.amount).toFixed(2)}</Badge>
                )}
                <Button
                  onClick={handleWithdraw}
                  disabled={myEarnings < 100 || !!pendingPayout || withdrawLoading}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  <DollarSign size={16} />
                  {withdrawLoading ? "שולח..." : "בקשת משיכה"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Reviews & Points */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Star size={20} className="text-primary" /> הביקורות שלי בעונה
            </h2>
            {rewards.length === 0 ? (
              <Card className="shadow-card bg-card">
                <CardContent className="p-10 text-center">
                  <Target size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">המרתון חם — ואתם עוד לא בפנים? 🔥</h3>
                  <p className="text-muted-foreground mb-4">כתבו את הביקורת הראשונה שלכם וצברו 100 נקודות מיידית!</p>
                  <Link to="/search">
                    <Button className="bg-primary text-primary-foreground gap-2">
                      <Sparkles size={14} /> מצאו קורס והתחילו לרוץ
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              rewards.map((r, i) => (
                <motion.div key={r.reviewId} initial="hidden" animate="visible" variants={fadeUp} custom={i + 5}>
                  <Card className="shadow-card bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-display font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
                            {r.courseName}
                            {r.isVerified && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] gap-0.5">
                                    <BadgeCheck size={9} /> 2x מאומת
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">ביקורת מאומתת — נקודות כפולות!</TooltipContent>
                              </Tooltip>
                            )}
                            {r.isEarlyBird && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-accent/15 text-accent border-0 text-[10px] gap-0.5">
                                    <Zap size={9} /> 1.5x
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">בונוס Early Bird — מ-5 הביקורות הראשונות!</TooltipContent>
                              </Tooltip>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.reviewText}...</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary shrink-0">
                          {r.totalPoints.toLocaleString()} נק׳
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-primary" /> בסיס: {r.basePoints}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className="text-primary" /> {r.likeCount} לייקים
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-primary" /> מכפיל: {r.multiplier}x
                        </span>
                        {r.isVerified && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <BadgeCheck size={12} /> מאומת 2x
                          </span>
                        )}
                        {r.isEarlyBird && (
                          <span className="flex items-center gap-1 text-accent">
                            <Zap size={12} /> EB 1.5x
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Leaderboard with Podium */}
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy size={20} className="text-primary" /> 🏅 מובילי המרתון
            </h2>
            <Card className="shadow-card bg-card overflow-hidden">
              {/* Top 3 Podium Visual */}
              {leaderboard.length >= 3 && (
                <div className="p-5 pb-3 border-b border-border/30" style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.06), transparent)" }}>
                  <div className="flex items-end justify-center gap-2 h-32">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">🥈</span>
                      <div className="bg-slate-400/10 border border-slate-400/20 rounded-t-lg w-20 h-16 flex flex-col items-center justify-center">
                        <p className="font-display font-bold text-xs text-foreground truncate w-full text-center px-1">{leaderboard[1].displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{leaderboard[1].totalPoints.toLocaleString()}</p>
                        <Badge className="text-[8px] bg-slate-400/15 text-slate-500 border-0 mt-0.5">30% OFF</Badge>
                      </div>
                    </div>
                    {/* 1st place */}
                    <div className="flex flex-col items-center">
                      <Crown size={24} className="text-yellow-500 mb-1 animate-pulse" />
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-t-lg w-24 h-24 flex flex-col items-center justify-center">
                        <p className="font-display font-bold text-sm text-foreground truncate w-full text-center px-1">{leaderboard[0].displayName}</p>
                        <p className="text-xs text-primary font-semibold">{leaderboard[0].totalPoints.toLocaleString()}</p>
                        <Badge className="text-[8px] bg-yellow-500/15 text-yellow-600 border-0 mt-0.5">👑 70% OFF</Badge>
                      </div>
                    </div>
                    {/* 3rd place */}
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">🥉</span>
                      <div className="bg-amber-600/10 border border-amber-600/20 rounded-t-lg w-20 h-12 flex flex-col items-center justify-center">
                        <p className="font-display font-bold text-xs text-foreground truncate w-full text-center px-1">{leaderboard[2].displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{leaderboard[2].totalPoints.toLocaleString()}</p>
                        <Badge className="text-[8px] bg-amber-600/15 text-amber-600 border-0 mt-0.5">15% OFF</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <CardContent className="p-5">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">עוד אין נתוני לידרבורד — תהיו הראשונים! 🚀</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(3).map((entry, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors bg-secondary/30 ${entry.userId === user.id ? "ring-1 ring-primary/30 bg-primary/5" : ""}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs bg-secondary text-muted-foreground">
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-foreground truncate flex items-center gap-1">
                            {entry.displayName}
                            {entry.userId === user.id && <span className="text-[10px] text-primary">(אתם)</span>}
                            {entry.badge === "elite" && <Crown size={12} className="text-accent" />}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-primary">{entry.totalPoints.toLocaleString()} נק׳</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="shadow-card bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award size={16} className="text-primary" /> איך זה עובד?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>כל ביקורת מאומתת = <strong className="text-foreground">100 נקודות בסיס</strong></span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>כל 10 לייקים = <strong className="text-foreground">מכפיל x2</strong> (עד 10x)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span><strong className="text-foreground">50%</strong> מכלל העמלות הולכים לקופה משותפת</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent font-bold">⚡</span>
                  <span><strong className="text-foreground">Early Bird:</strong> 5 ביקורות ראשונות = <strong className="text-accent">1.5x בונוס</strong></span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">🛡️</span>
                  <span><strong className="text-foreground">מומחה:</strong> 3+ ביקורות טובות בקטגוריה = לייקים x2</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">💬</span>
                  <span><strong className="text-foreground">תגובה מועילה:</strong> +20 נקודות בונוס</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">🔄</span>
                  <span>הנקודות <strong className="text-foreground">מתאפסות כל 6 חודשים</strong> — הלייקים נשארים!</span>
                </div>
                <div className="pt-3 border-t border-border/30 space-y-2">
                  <p className="text-primary font-medium">🏆 הפרסים:</p>
                  <p>מקום 1 = <strong className="text-yellow-500">70% הנחה</strong> על כל קורס</p>
                  <p>מקום 2 = <strong className="text-foreground">30% הנחה</strong> על כל קורס</p>
                  <p>מקום 3 = <strong className="text-foreground">15% הנחה</strong> על כל קורס</p>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-primary font-medium">ככל שהביקורת שלכם טובה יותר — אתם מרוויחים יותר! 🚀</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact for winners */}
            <Card className="shadow-card bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">זכיתם? פנו אלינו!</p>
                  <a href="mailto:support@reviewshub.info" className="text-xs text-primary hover:underline">
                    support@reviewshub.info
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Payout History */}
            {payouts.length > 0 && (
              <Card className="shadow-card bg-card">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign size={16} className="text-primary" /> היסטוריית משיכות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {payouts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">{p.month_year}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">₪{Number(p.amount).toFixed(2)}</span>
                        <Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                          {p.status === "paid" ? "שולם" : p.status === "approved" ? "מאושר" : p.status === "pending" ? "ממתין" : "נדחה"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-2xl p-10 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(45 100% 51% / 0.12), hsl(35 100% 50% / 0.06), hsl(160 84% 39% / 0.08))" }}
        >
          <div className="absolute inset-0 noise-overlay opacity-30" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
              המרתון של 6 חודשים: כתבו. דרגו. זכו בגדול! 🔥
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-4">
              70% הנחה למקום ראשון, 30% למקום שני, 15% למקום שלישי.
              <br />
              בנוסף — 50% מהעמלות מחולקות לכל הקהילה לפי נקודות.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              ⏰ רק <strong className="text-foreground">{timeLeft.days} ימים</strong> נותרו בעונה הנוכחית!
            </p>
            <Link to="/search">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold glow-primary px-10 gap-2">
                <Flame size={18} /> כתבו ביקורת והתחילו לרוץ
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default PartnerDashboard;

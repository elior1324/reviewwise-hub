import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Trophy, Star, ThumbsUp, Wallet, Users,
  Award, Crown, Sparkles, Timer, Gift, Zap, Shield, Info,
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
  helpfulBonus: number;
}

interface LeaderboardEntry {
  displayName: string;
  totalPoints: number;
  badge: string | null;
  rank: number;
  isExpert: boolean;
}

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
  const [helpfulBonusTotal, setHelpfulBonusTotal] = useState(0);

  // Live countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: season.daysLeft, hours: season.hoursLeft, minutes: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const msLeft = Math.max(0, season.seasonEnd.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(msLeft / (1000 * 60 * 60 * 24)),
        hours: Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)),
      });
    }, 60000);
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
        .select("id, text, course_id, business_id, courses(name)")
        .in("id", reviewIds.length > 0 ? reviewIds : ["none"]);

      const reviewMap = new Map((reviews || []).map((r: any) => [r.id, r]));

      // Check Early Bird: count reviews per business to see if this was in first 5
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
        if (isEB) ebCount++;
        return {
          reviewId: r.review_id,
          reviewText: review?.text?.slice(0, 80) || "ביקורת",
          courseName: review?.courses?.name || "קורס",
          basePoints: Number(r.base_points),
          likeCount: r.like_count,
          multiplier: Number(r.multiplier),
          totalPoints: Number(r.total_points) * (isEB ? 1.5 : 1),
          isEarlyBird: isEB,
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

    // Check Category Expert: 3+ high-rated reviews in same category
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
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const userIds = sortedUsers.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, partner_badge")
        .in("user_id", userIds.length > 0 ? userIds : ["none"]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setLeaderboard(sortedUsers.map(([uid, pts], i) => ({
        displayName: profileMap.get(uid)?.display_name || "משתמש",
        totalPoints: pts,
        badge: profileMap.get(uid)?.partner_badge || null,
        rank: i + 1,
        isExpert: false,
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
          <h1 className="font-display font-bold text-3xl mb-4">תוכנית השותפים</h1>
          <p className="text-muted-foreground mb-6">יש להתחבר כדי לצפות ברווחים שלכם</p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground">התחברו עכשיו</Button>
          </Link>
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

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(45 100% 51% / 0.08), hsl(35 100% 50% / 0.04), hsl(160 84% 39% / 0.06))" }} />
        <div className="container py-12 md:py-16 relative">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles size={16} /> תוכנית שותפים 50/50
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              הרווחים שלכם 💰
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg">
              אנחנו מחלקים 50% מהעמלות שלנו עם הקהילה. כתבו ביקורות, צברו לייקים, והרוויחו — עונה אחר עונה.
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
                      הנקודות מתאפסות בסוף העונה — הלייקים נשארים!
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

        {/* Prize Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5} className="mb-6">
          <div className="rounded-xl p-5 border border-accent/20" style={{ background: "linear-gradient(135deg, hsl(var(--accent) / 0.1), hsl(var(--accent) / 0.03))" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                <Gift size={20} className="text-accent" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">
                  🏆 השותף המוביל בעונה זוכה ב-40% הנחה על כל קורס!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  צברו הכי הרבה נקודות העונה ותזכו בפרס הגדול. כל עונה — הזדמנות חדשה!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bonus Indicators Row */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.7} className="mb-8">
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
                  <Star size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">עדיין אין ביקורות בעונה הנוכחית. כתבו ביקורת מאומתת כדי להתחיל לצבור נקודות!</p>
                  <Link to="/search">
                    <Button variant="outline" className="gap-2">
                      <Star size={14} /> מצאו קורס לכתוב עליו ביקורת
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
                          <p className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                            {r.courseName}
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
            {/* Leaderboard */}
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy size={20} className="text-primary" /> מובילי העונה
            </h2>
            <Card className="shadow-card bg-card">
              <CardContent className="p-5">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">עוד אין נתוני לידרבורד לעונה הנוכחית</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${entry.rank <= 3 ? "bg-primary/5" : "bg-secondary/50"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                          entry.rank === 1 ? "bg-accent/20 text-accent" :
                          entry.rank === 2 ? "bg-muted text-muted-foreground" :
                          entry.rank === 3 ? "bg-accent/10 text-accent/70" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-foreground truncate flex items-center gap-1">
                            {entry.displayName}
                            {entry.badge === "elite" && (
                              <Crown size={12} className="text-accent" />
                            )}
                            {entry.rank === 1 && (
                              <Badge className="bg-accent/15 text-accent border-0 text-[9px] px-1">
                                🏆 40% OFF
                              </Badge>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-primary">{entry.totalPoints.toLocaleString()} נק׳</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How it works - Enhanced */}
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
                  <span>הנקודות <strong className="text-foreground">מתאפסות כל עונה</strong> (4 חודשים) — הלייקים נשארים!</span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-primary font-medium">ככל שהביקורת שלכם טובה יותר — אתם מרוויחים יותר! 🚀</p>
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

        {/* Aggressive Partner CTA */}
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
              ההשפעה שלכם = ההכנסה שלכם 💪
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              אנחנו מחלקים את הרווחים שלנו 50/50 עם הקהילה. ביקורת איכותית אחת יכולה להניב לכם הכנסה פאסיבית עונה אחר עונה.
            </p>
            <Link to="/search">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold glow-primary px-10">
                כתבו ביקורת והתחילו להרוויח
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

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Trophy, Star, ThumbsUp, Wallet, Users, Award, ArrowLeft, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

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
}

interface LeaderboardEntry {
  displayName: string;
  totalPoints: number;
  badge: string | null;
  rank: number;
}

const PartnerDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [rewards, setRewards] = useState<RewardEntry[]>([]);
  const [poolData, setPoolData] = useState({ communityPool: 0, totalPoints: 0, myPoints: 0 });
  const [myEarnings, setMyEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-03'

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Fetch user's rewards for current month
      const { data: rewardsData } = await supabase
        .from("rewards_log")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", currentMonth);

      if (rewardsData) {
        // Get review details
        const reviewIds = rewardsData.map((r: any) => r.review_id);
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, text, course_id, courses(name)")
          .in("id", reviewIds.length > 0 ? reviewIds : ["none"]);

        const reviewMap = new Map((reviews || []).map((r: any) => [r.id, r]));

        const mapped: RewardEntry[] = rewardsData.map((r: any) => {
          const review = reviewMap.get(r.review_id);
          return {
            reviewId: r.review_id,
            reviewText: review?.text?.slice(0, 80) || "ביקורת",
            courseName: review?.courses?.name || "קורס",
            basePoints: Number(r.base_points),
            likeCount: r.like_count,
            multiplier: Number(r.multiplier),
            totalPoints: Number(r.total_points),
          };
        });
        setRewards(mapped);
      }

      // 2. Fetch pool data
      const { data: pool } = await supabase
        .from("rewards_pool")
        .select("*")
        .eq("month_year", currentMonth)
        .maybeSingle();

      const communityPool = pool ? Number(pool.community_pool) : 0;
      const totalPlatformPoints = pool ? Number(pool.total_points) : 0;
      const myTotalPoints = (rewardsData || []).reduce((s: number, r: any) => s + Number(r.total_points), 0);

      setPoolData({ communityPool, totalPoints: totalPlatformPoints, myPoints: myTotalPoints });

      // Calculate earnings
      const earnings = totalPlatformPoints > 0 ? (myTotalPoints / totalPlatformPoints) * communityPool : 0;
      setMyEarnings(earnings);

      // 3. Fetch total historical earnings
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_earnings")
        .eq("user_id", user.id)
        .maybeSingle();
      setTotalEarnings(Number(profile?.total_earnings) || 0);

      // 4. Fetch payouts
      const { data: payoutsData } = await supabase
        .from("reward_payouts")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });
      setPayouts(payoutsData || []);

      // 5. Fetch leaderboard (top earners this month)
      const { data: allRewards } = await supabase
        .from("rewards_log")
        .select("user_id, total_points")
        .eq("month_year", currentMonth);

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
        })));
      }
    };

    fetchData();
  }, [user, currentMonth]);

  const handleWithdraw = async () => {
    if (myEarnings < 100) {
      toast({ title: "לא ניתן למשוך", description: "הסכום המינימלי למשיכה הוא ₪100.", variant: "destructive" });
      return;
    }
    setWithdrawLoading(true);
    try {
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

  // Calculate next multiplier progress
  const bestReview = rewards.length > 0 ? rewards.reduce((a, b) => a.likeCount > b.likeCount ? a : b) : null;
  const nextMultiplierLikes = bestReview ? (Math.floor(bestReview.likeCount / 10) + 1) * 10 : 10;
  const likesToNext = bestReview ? nextMultiplierLikes - bestReview.likeCount : 10;
  const progressToNext = bestReview ? ((bestReview.likeCount % 10) / 10) * 100 : 0;
  const currentMultiplier = bestReview ? bestReview.multiplier : 1;

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
              אנחנו מחלקים 50% מהעמלות שלנו עם הקהילה. כתבו ביקורות איכותיות, צברו לייקים, והרוויחו.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Live Earnings Estimate */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Card className="shadow-card bg-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet size={16} className="text-primary" /> הערכת רווח חודשי
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
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <Card className="shadow-card bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users size={16} className="text-primary" /> קופת הקהילה
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

          {/* Likes to Next Multiplier */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <Card className="shadow-card bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <ThumbsUp size={16} className="text-primary" /> מכפיל הבא
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display font-bold text-2xl text-foreground">
                  {currentMultiplier < 10 ? `עוד ${likesToNext} לייקים ל-${Math.min(currentMultiplier + 1, 10)}x` : "מקסימום! 🏆"}
                </p>
                <Progress value={currentMultiplier >= 10 ? 100 : progressToNext} className="h-3 mt-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  מכפיל נוכחי: <span className="text-primary font-bold">{currentMultiplier}x</span> (מקסימום 10x)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Withdraw Button */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mb-8">
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
              <Star size={20} className="text-primary" /> הביקורות שלי החודש
            </h2>
            {rewards.length === 0 ? (
              <Card className="shadow-card bg-card">
                <CardContent className="p-10 text-center">
                  <Star size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">עדיין אין ביקורות החודש. כתבו ביקורת מאומתת כדי להתחיל לצבור נקודות!</p>
                  <Link to="/search">
                    <Button variant="outline" className="gap-2">
                      <Star size={14} /> מצאו קורס לכתוב עליו ביקורת
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              rewards.map((r, i) => (
                <motion.div key={r.reviewId} initial="hidden" animate="visible" variants={fadeUp} custom={i + 4}>
                  <Card className="shadow-card bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-display font-semibold text-foreground text-sm">{r.courseName}</p>
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy size={20} className="text-primary" /> מובילי החודש
            </h2>
            <Card className="shadow-card bg-card">
              <CardContent className="p-5">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">עוד אין נתוני לידרבורד החודש</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${entry.rank <= 3 ? "bg-primary/5" : "bg-secondary/50"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                          entry.rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                          entry.rank === 2 ? "bg-gray-300/30 text-gray-500" :
                          entry.rank === 3 ? "bg-orange-400/20 text-orange-500" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-foreground truncate flex items-center gap-1">
                            {entry.displayName}
                            {entry.badge === "elite" && (
                              <Crown size={12} className="text-yellow-500" />
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
                  <span><strong className="text-foreground">50%</strong> מכלל העמלות של האתר הולכים לקופה משותפת</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>הרווח שלכם = <strong className="text-foreground">(הנקודות שלכם / סה״כ נקודות) × הקופה</strong></span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-primary font-medium">ככל שהביקורת שלכם טובה יותר ומקבלת יותר לייקים — אתם מרוויחים יותר! 🚀</p>
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
              אנחנו מחלקים את הרווחים שלנו 50/50 עם הקהילה. ביקורת איכותית אחת יכולה להניב לכם הכנסה פאסיבית חודש אחרי חודש.
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

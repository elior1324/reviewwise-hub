/**
 * LeaderboardPage — Public ranking of top reviewers by Community Points.
 *
 * Reputation-only (no monetary incentives):
 * - Community Points are reputation status points with zero cash value.
 * - They are SEPARATE from Activity Points (redeemable for platform rewards via /user/referrals).
 * - Verified reviews receive more Community Points and stronger weight in ranking.
 */

import { motion } from "framer-motion";
import { Trophy, Info, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero — pt-24 clears the fixed navbar */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border/50 pt-24 pb-10 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-yellow-400 w-6 h-6" aria-hidden="true" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Community Leaderboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">טבלת המובילים</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            דירוג הכותבים נקבע לפי <strong className="text-foreground">נקודות קהילה</strong> ותרומה לקהילה.
            ביקורות מאומתות מקבלות יותר נקודות ומשקל גבוה יותר.
          </p>
        </motion.div>
      </div>

      {/* Info strip */}
      <div className="bg-muted/25 border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Info size={12} aria-hidden="true" />
            נקודות קהילה הן מוניטין בלבד — ללא ערך כספי ואי אפשר להמיר אותן.
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground/70">
            <Info size={12} aria-hidden="true" />
            לנקודות הניתנות למימוש להטבות פלטפורמה, ראו{" "}
            <a href="/user/referrals" className="text-primary hover:underline">לוח ההזמנות</a>.
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <SeasonLeaderboard compact={false} limit={20} />
        </div>
      </main>

      {/* Earn CTA — points explained in referrals page */}
      <section className="bg-muted/30 border-t border-border py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex flex-col sm:flex-row items-center gap-3"
          >
            <p className="text-sm text-muted-foreground">
              רוצים לראות כיצד לצבור נקודות ולממש פרסים?
            </p>
            <Link
              to="/user/referrals"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Gift size={14} aria-hidden="true" />
              כל הדרכים לצבור נקודות
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

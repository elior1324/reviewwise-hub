/**
 * LeaderboardPage — Public ranking of top reviewers by Trust Points.
 *
 * Reputation-only (no monetary incentives):
 * - Trust Points have zero cash value.
 * - Verified reviews receive more points and stronger weight.
 */

import { motion } from "framer-motion";
import { Trophy, Sparkles, Info, BadgeCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border/50 py-10 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-yellow-400 w-6 h-6" aria-hidden="true" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Community Leaderboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">טבלת המובילים</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            דירוג הכותבים נקבע לפי <strong className="text-foreground">נקודות אמון</strong> ותרומה לקהילה.
            ביקורות מאומתות מקבלות יותר נקודות ומשקל גבוה יותר.
          </p>
        </motion.div>
      </div>

      {/* Info strip */}
      <div className="bg-muted/25 border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Info size={12} aria-hidden="true" />
            נקודות אמון הן מוניטין בלבד. אין להן ערך כספי ואי אפשר להמיר/למשוך/להעביר אותן.
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <SeasonLeaderboard compact={false} limit={20} />
        </div>
      </main>

      {/* How it works */}
      <section className="bg-muted/30 border-t border-border py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-primary" aria-hidden="true" />
            איך לצבור נקודות אמון?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "כתבו ביקורת",
                desc: "ביקורת רגילה מעניקה 100 נקודות אמון.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "2",
                title: "אמתו רכישה",
                desc: "ביקורת מאומתת מעניקה סה\"כ 200 נקודות אמון.",
                color: "bg-emerald-500/10 text-emerald-600",
              },
              {
                step: "3",
                title: "קבלו תג",
                desc: "איספו תג Verified Reviewer ודרגות מומחיות בקהילה.",
                color: "bg-amber-500/10 text-amber-600",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Number(item.step) * 0.08 }}
                className="rounded-xl border border-border/50 bg-card/40 p-5 text-right"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.step}</span>
                  <BadgeCheck size={16} className="text-primary" aria-hidden="true" />
                </div>
                <p className="font-display font-bold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

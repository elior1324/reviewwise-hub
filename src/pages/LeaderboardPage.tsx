/**
 * LeaderboardPage — Full-page wrapper for the Season Leaderboard.
 *
 * Wraps the SeasonLeaderboard component with Navbar + Footer
 * and adds a season-context banner above it.
 *
 * Route: /leaderboard
 * Auth: not required (public ranking)
 */

import { motion } from "framer-motion";
import { Trophy, Sparkles, Calendar, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

// ─── Season metadata (update each season) ────────────────────────────────────

const SEASON = {
  name: "עונה 1 — אביב 2026",
  start: "01/03/2026",
  end: "31/05/2026",
  prize: "70% הנחה על כל הקורסים",
  target: 5000,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-background border-b border-amber-200/30 dark:border-amber-800/20 py-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-amber-500 w-6 h-6" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Season Leaderboard
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            טבלת המובילים
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
            ה-3 המובילים בסוף העונה זוכים בפרס הגדול.
            <br />
            כתוב ביקורות, צבור נקודות, תופיע כאן.
          </p>
        </motion.div>
      </div>

      {/* Season info strip */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
            <Sparkles size={13} />
            {SEASON.name}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar size={12} />
            {SEASON.start} — {SEASON.end}
          </div>
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            🏆 פרס: {SEASON.prize}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Info size={12} />
            יעד: {SEASON.target.toLocaleString("he-IL")} נקודות
          </div>
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
            <Sparkles size={18} className="text-primary" />
            איך לצבור נקודות?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "כתוב ביקורת",
                desc: "כל ביקורת מאומתת שווה 100+ נקודות בסיס",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "2",
                title: "קבל לייקים",
                desc: "כל 10 לייקים מוסיפים 100% על הנקודות (עד ×10)",
                color: "bg-amber-500/10 text-amber-600",
              },
              {
                step: "3",
                title: "אמת את הקנייה",
                desc: "ביקורת מאומתת עם קבלה מכפילה ×2 את הנקודות",
                color: "bg-emerald-500/10 text-emerald-600",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Number(item.step) * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 text-right"
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-2 ${item.color}`}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

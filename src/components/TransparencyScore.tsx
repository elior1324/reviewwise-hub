/**
 * TransparencyScore
 *
 * Displays a business's trust transparency score out of 10 with a visual
 * progress bar and a breakdown of the three contributing factors:
 *
 *   • Verified review ratio  (40 % weight)
 *   • Owner response rate    (30 % weight)
 *   • Responsiveness         (30 % weight — based on avg_response_hours)
 *
 * The composite score is read from `businesses.transparency_score` (0-100,
 * stored by the DB migration).  The individual sub-scores are derived from
 * `verified_review_ratio`, `response_rate`, and `avg_response_hours` so that
 * each pillar can be shown independently.
 *
 * If none of the fields are available (e.g. brand-new business), the component
 * renders nothing to avoid showing an empty / misleading widget.
 */

import { ShieldCheck, MessageSquare, Clock } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TransparencyScoreProps {
  /** Composite 0-100 stored in DB (nullable for legacy rows) */
  transparencyScore?: number | null;
  /** 0-1 fraction of reviews that are verified */
  verifiedReviewRatio?: number | null;
  /** 0-1 fraction of reviews that received an owner response */
  responseRate?: number | null;
  /** Median hours the owner takes to respond (null = never responded) */
  avgResponseHours?: number | null;
  /** When true a compact single-line chip is shown instead of the full panel */
  compact?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map avg_response_hours to a 0-100 responsiveness sub-score */
function responsivenessScore(hours: number | null | undefined): number {
  if (hours == null) return 0;
  if (hours <= 4)  return 100;
  if (hours <= 12) return 80;
  if (hours <= 24) return 60;
  if (hours <= 48) return 40;
  if (hours <= 96) return 20;
  return 10;
}

/** Derive composite 0-100 score from the three pillars */
function deriveScore(
  verifiedRatio: number | null | undefined,
  respRate: number | null | undefined,
  avgHours: number | null | undefined,
): number {
  const v = (verifiedRatio ?? 0) * 100 * 0.4;
  const r = (respRate ?? 0) * 100 * 0.3;
  const s = responsivenessScore(avgHours) * 0.3;
  return Math.round(v + r + s);
}

/** Score tier labels and colours */
function scoreTier(score: number): { label: string; color: string; ringColor: string } {
  if (score >= 80) return { label: "שקיפות גבוהה מאוד", color: "text-emerald-600", ringColor: "bg-emerald-500" };
  if (score >= 60) return { label: "שקיפות גבוהה",       color: "text-green-600",   ringColor: "bg-green-500"   };
  if (score >= 40) return { label: "שקיפות בינונית",     color: "text-amber-600",   ringColor: "bg-amber-500"   };
  if (score >= 20) return { label: "שקיפות חלקית",       color: "text-orange-600",  ringColor: "bg-orange-500"  };
  return                  { label: "נתוני שקיפות מועטים", color: "text-muted-foreground", ringColor: "bg-border" };
}

/** Format avg_response_hours for display */
function formatResponseTime(hours: number | null | undefined): string {
  if (hours == null) return "—";
  if (hours < 1) return "פחות משעה";
  if (hours < 24) return `${Math.round(hours)} שעות`;
  return `${Math.round(hours / 24)} ימים`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TransparencyScore({
  transparencyScore,
  verifiedReviewRatio,
  responseRate,
  avgResponseHours,
  compact = false,
}: TransparencyScoreProps) {

  // Prefer the DB-stored composite score; fall back to deriving it locally
  const score = transparencyScore != null
    ? Math.round(transparencyScore)
    : deriveScore(verifiedReviewRatio, responseRate, avgResponseHours);

  // Don't render if there's genuinely no data at all
  const hasAnyData =
    transparencyScore != null ||
    verifiedReviewRatio != null ||
    responseRate != null ||
    avgResponseHours != null;

  if (!hasAnyData) return null;

  const tier        = scoreTier(score);
  const scoreOut10  = (score / 10).toFixed(1);
  const verifiedPct = verifiedReviewRatio != null ? Math.round(verifiedReviewRatio * 100) : null;
  const respPct     = responseRate != null ? Math.round(responseRate * 100) : null;
  const respTime    = formatResponseTime(avgResponseHours);
  const respScore   = responsivenessScore(avgResponseHours);

  // ── Compact chip variant ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <ShieldCheck size={12} className={tier.color} aria-hidden="true" />
        <span className={`font-semibold ${tier.color}`}>{scoreOut10}/10</span>
        <span className="text-muted-foreground">{tier.label}</span>
      </div>
    );
  }

  // ── Full panel ───────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 space-y-4" dir="rtl">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">ציון שקיפות</p>
            <p className="text-[10px] text-muted-foreground leading-tight">מבוסס ביקורות מאומתות, מענה ומהירות תגובה</p>
          </div>
        </div>
        {/* Circular-ish score badge */}
        <div className="flex flex-col items-center">
          <span className={`text-2xl font-bold tabular-nums ${tier.color}`}>{scoreOut10}</span>
          <span className="text-[10px] text-muted-foreground -mt-0.5">מתוך 10</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tier.ringColor}`}
            style={{ width: `${score}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className={`text-xs font-medium ${tier.color}`}>{tier.label}</p>
      </div>

      {/* Pillar breakdown */}
      <div className="grid grid-cols-3 gap-2">

        {/* Verified reviews */}
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40 text-center">
          <ShieldCheck size={14} className="text-emerald-500" aria-hidden="true" />
          <span className="text-[11px] text-muted-foreground leading-tight">ביקורות מאומתות</span>
          <span className="text-sm font-bold">
            {verifiedPct != null ? `${verifiedPct}%` : "—"}
          </span>
          <span className="text-[9px] text-muted-foreground/70">משקל 40%</span>
        </div>

        {/* Response rate */}
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40 text-center">
          <MessageSquare size={14} className="text-blue-500" aria-hidden="true" />
          <span className="text-[11px] text-muted-foreground leading-tight">אחוז מענה</span>
          <span className="text-sm font-bold">
            {respPct != null ? `${respPct}%` : "—"}
          </span>
          <span className="text-[9px] text-muted-foreground/70">משקל 30%</span>
        </div>

        {/* Responsiveness */}
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40 text-center">
          <Clock size={14} className="text-violet-500" aria-hidden="true" />
          <span className="text-[11px] text-muted-foreground leading-tight">מהירות תגובה</span>
          <span className="text-sm font-bold">{respTime}</span>
          <span className="text-[9px] text-muted-foreground/70">משקל 30%</span>
        </div>

      </div>

      {/* Why tooltip */}
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border/40 pt-2">
        הציון מחושב אוטומטית על בסיס: יחס ביקורות מאומתות (40%), שיעור מענה הבעלים לביקורות (30%), ומהירות התגובה הממוצעת (30%). ציון גבוה משקף עסק שקוף ומעורב.
      </p>
    </div>
  );
}

/**
 * PrestigeBadge.tsx
 *
 * Renders a trust-credential prestige badge for a business entity.
 * Badges are static trust marks — different from the live TrustWidget review feed.
 *
 * Badge types:
 *   "verified"       — ReviewHub Verified (≥1 verified review in the registry)
 *   "highly-trusted" — Highly Trusted (grade A or A+)
 *   "top-saas"       — Top Trusted SaaS in Israel (saas type + grade A/A+)
 *   "top-ai-tool"    — Top AI Tool — ReviewHub (AI category + grade A/A+)
 *
 * Usage:
 *   <PrestigeBadge type="verified" slug="acme" name="Acme" grade="A+" rating={4.8} />
 *
 * Embed code:
 *   Use buildBadgeEmbedCode(type, slug) to generate copy-paste HTML for founders.
 */

import { ShieldCheck, Cpu, Zap, Award } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PrestigeBadgeType = "verified" | "highly-trusted" | "top-saas" | "top-ai-tool";

export interface PrestigeBadgeProps {
  type: PrestigeBadgeType;
  slug: string;
  name: string;
  grade: string;
  rating: number;
  size?: "sm" | "md" | "lg";
  /** If true, renders as a plain div (no outer anchor — for use inside <a> tags) */
  noLink?: boolean;
}

// ── Badge config per type ──────────────────────────────────────────────────────

const BADGE_CONFIG = {
  "verified": {
    label:     "ReviewHub Verified",
    sublabel:  "עסק מאומת",
    accent:    "#10b981", // emerald-500
    accentBg:  "#064e3b", // emerald-950
    border:    "#065f46",
    Icon:      ShieldCheck,
  },
  "highly-trusted": {
    label:     "Highly Trusted",
    sublabel:  "מדורג גבוה מאוד · ReviewHub",
    accent:    "#34d399", // emerald-400
    accentBg:  "#022c22",
    border:    "#059669",
    Icon:      Award,
  },
  "top-saas": {
    label:     "Top Trusted SaaS",
    sublabel:  "ישראל · ReviewHub",
    accent:    "#60a5fa", // blue-400
    accentBg:  "#1e3a5f",
    border:    "#2563eb",
    Icon:      Cpu,
  },
  "top-ai-tool": {
    label:     "Top AI Tool",
    sublabel:  "ReviewHub Certified",
    accent:    "#a78bfa", // violet-400
    accentBg:  "#2e1065",
    border:    "#7c3aed",
    Icon:      Zap,
  },
} as const satisfies Record<PrestigeBadgeType, {
  label: string; sublabel: string; accent: string;
  accentBg: string; border: string; Icon: React.ComponentType<{ size?: number; color?: string }>;
}>;

const SIZE_MAP = {
  sm: { outer: "h-12 pr-3 pl-4 gap-2.5 rounded-xl", icon: 16, title: "text-[11px]", sub: "text-[9px]", dot: "w-1.5 h-1.5" },
  md: { outer: "h-14 pr-3.5 pl-5 gap-3 rounded-2xl", icon: 20, title: "text-xs", sub: "text-[10px]", dot: "w-2 h-2" },
  lg: { outer: "h-16 pr-4 pl-6 gap-3.5 rounded-2xl", icon: 24, title: "text-sm", sub: "text-[11px]", dot: "w-2 h-2" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PrestigeBadge({
  type,
  slug,
  name,
  grade,
  rating,
  size = "md",
  noLink = false,
}: PrestigeBadgeProps) {
  const cfg = BADGE_CONFIG[type];
  const sz  = SIZE_MAP[size];
  const { Icon } = cfg;

  const inner = (
    <div
      className={`inline-flex items-center ${sz.outer} border select-none transition-all duration-200`}
      style={{
        background:   `linear-gradient(135deg, ${cfg.accentBg}, color-mix(in srgb, ${cfg.accentBg} 60%, #000))`,
        borderColor:  cfg.border,
        boxShadow:    `0 0 18px -4px ${cfg.accent}50, inset 0 1px 0 ${cfg.accent}15`,
      }}
    >
      {/* Icon circle */}
      <div
        className="shrink-0 rounded-lg p-1.5 flex items-center justify-center"
        style={{ background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40` }}
      >
        <Icon size={sz.icon} color={cfg.accent} />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className={`${sz.title} font-bold leading-tight tracking-tight whitespace-nowrap`} style={{ color: cfg.accent }}>
          {cfg.label}
        </span>
        <span className={`${sz.sub} font-medium leading-tight whitespace-nowrap`} style={{ color: `${cfg.accent}80` }}>
          {cfg.sublabel}
        </span>
      </div>

      {/* Grade pill */}
      <div
        className="ml-1 shrink-0 rounded-md px-1.5 py-0.5 flex flex-col items-center"
        style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}35` }}
      >
        <span className="text-[11px] font-black leading-none" style={{ color: cfg.accent }}>{grade}</span>
        <span className="text-[8px] font-medium leading-none mt-0.5" style={{ color: `${cfg.accent}70` }}>{rating.toFixed(1)}★</span>
      </div>
    </div>
  );

  if (noLink) return inner;

  return (
    <a
      href={`/biz/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} — ${cfg.label} | ReviewHub`}
      className="inline-block hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
    >
      {inner}
    </a>
  );
}

// ── Eligibility helpers ────────────────────────────────────────────────────────

/**
 * Computes which prestige badges a business entity qualifies for.
 * Uses the same grade logic as BusinessHero / BusinessCard.
 */
export function computeEligibleBadges(params: {
  rating: number;
  verifiedCount: number;
  type: string;
  category: string;
}): PrestigeBadgeType[] {
  const { rating, verifiedCount, type, category } = params;
  const badges: PrestigeBadgeType[] = [];

  if (verifiedCount < 1) return badges; // nothing without a single verified review

  // ① Verified — at least 1 verified review
  badges.push("verified");

  // ② Highly Trusted — grade A or A+
  const isHighlyTrusted =
    (rating >= 4.7 && verifiedCount >= 10) ||
    (rating >= 4.3 && verifiedCount >= 5);
  if (isHighlyTrusted) badges.push("highly-trusted");

  // ③ Top Trusted SaaS in Israel — saas + highly trusted
  if (isHighlyTrusted && type === "saas") badges.push("top-saas");

  // ④ Top AI Tool — AI category + highly trusted
  if (isHighlyTrusted && category === "כלי AI") badges.push("top-ai-tool");

  return badges;
}

// ── Embed code builder ────────────────────────────────────────────────────────

const BASE_URL = "https://reviewhub.co.il";

export function buildBadgeEmbedCode(
  type: PrestigeBadgeType,
  slug: string,
  grade: string,
): string {
  const cfg = BADGE_CONFIG[type];
  const profileUrl = `${BASE_URL}/biz/${slug}`;
  const badgeImgUrl = `${BASE_URL}/api/badge/${slug}?type=${type}`;

  return `<!-- ReviewHub — ${cfg.label} Badge -->
<a href="${profileUrl}"
   target="_blank"
   rel="noopener noreferrer"
   title="${cfg.label} | ReviewHub"
   style="display:inline-block;">
  <img
    src="${badgeImgUrl}"
    alt="${cfg.label} — Grade ${grade}"
    width="220"
    height="56"
    loading="lazy"
    decoding="async"
  />
</a>`;
}

export { BADGE_CONFIG };

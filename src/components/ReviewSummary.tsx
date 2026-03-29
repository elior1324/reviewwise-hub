/**
 * ReviewSummary.tsx
 *
 * AI-generated summary of a business's reviews, rendered on the public
 * business profile page.
 *
 * Transparency requirements:
 *   1. Must show the time period the summary is based on.
 *   2. Must show how many reviews were analysed.
 *   3. Must state explicitly that the summary was generated automatically.
 *   4. Must provide a "Why am I seeing this?" explanation.
 *
 * Props:
 *   summary       — the Markdown-formatted summary text
 *   reviewCount   — number of reviews analysed (default 0 = not shown)
 *   periodLabel   — human-readable period, e.g. "6 חודשים אחרונים"
 *   generatedAt   — ISO date string of when the summary was generated
 *   modelVersion  — model string shown in the disclosure tooltip (optional)
 */

import { useState } from "react";
import { Sparkles, HelpCircle, ChevronDown, ChevronUp, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewSummaryProps {
  summary: string;
  reviewCount?: number;
  periodLabel?: string;
  generatedAt?: string;
  modelVersion?: string;
  topTraits?: string[];
}

const ReviewSummary = ({
  summary,
  reviewCount = 0,
  periodLabel,
  generatedAt,
  modelVersion = "AI",
  topTraits = [],
}: ReviewSummaryProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const metaChips: { label: string; value: string }[] = [
    ...(reviewCount > 0 ? [{ label: "ביקורות נותחו", value: String(reviewCount) }] : []),
    ...(periodLabel ? [{ label: "תקופה", value: periodLabel }] : []),
    ...(formattedDate ? [{ label: "עודכן", value: formattedDate }] : []),
  ];

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden mb-4">
      {/* Header row — title + traits + disclosure all in one compact strip */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap">
        <Sparkles size={13} className="text-primary shrink-0" aria-hidden="true" />
        <span className="font-semibold text-xs text-primary">סיכום ביקורות AI</span>

        {/* Top 3 traits — inline with header */}
        {topTraits.map((trait, i) => (
          <span
            key={trait}
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
              i === 0
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : i === 1
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {trait}
          </span>
        ))}

        <div className="flex-1" />

        {/* Disclosure */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-0.5 text-[10px] text-primary/50 hover:text-primary transition-colors cursor-help shrink-0"
              aria-label="מידע על הסיכום"
            >
              <Bot size={10} aria-hidden="true" />
              נוצר אוטומטית
              <HelpCircle size={9} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] space-y-2 p-3" dir="rtl">
            <p className="font-semibold text-xs">למה אני רואה את זה?</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              סיכום זה נוצר אוטומטית על ידי {modelVersion} שניתח את ביקורות העסק.
              הוא לא נכתב על ידי בן אדם ואינו מייצג את עמדת ReviewHub.
            </p>
            {metaChips.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/30">
                {metaChips.map(chip => (
                  <div key={chip.label} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{chip.label}</span>
                    <span className="font-medium">{chip.value}</span>
                  </div>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Summary text */}
      <div className="px-4 pb-3">
        <div
          className={`prose prose-sm max-w-none text-foreground/80 text-xs leading-relaxed transition-all
            ${!expanded && summary.length > 400 ? "max-h-[80px] overflow-hidden relative" : ""}`}
        >
          {!expanded && summary.length > 400 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          )}
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
        {summary.length > 400 && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary transition-colors mt-1"
          >
            {expanded ? <><ChevronUp size={11} /> הצג פחות</> : <><ChevronDown size={11} /> הצג עוד</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewSummary;

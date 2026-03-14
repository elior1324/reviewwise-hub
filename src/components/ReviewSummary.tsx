/**
 * ReviewSummary.tsx
 *
 * AI-generated summary of a business's reviews, rendered on the public
 * business profile page.
 *
 * Transparency requirements (Trustpilot-benchmark):
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
}

const ReviewSummary = ({
  summary,
  reviewCount = 0,
  periodLabel,
  generatedAt,
  modelVersion = "AI",
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
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <Sparkles size={16} className="text-primary shrink-0" aria-hidden="true" />
        <span className="font-display font-semibold text-sm text-primary flex-1">
          סיכום ביקורות AI
        </span>
        {/* AI-generated disclosure tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-primary/60
                hover:text-primary transition-colors cursor-help"
              aria-label="מידע על הסיכום"
            >
              <Bot size={11} aria-hidden="true" />
              נוצר אוטומטית
              <HelpCircle size={10} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px] space-y-2 p-3" dir="rtl">
            <p className="font-semibold text-xs">למה אני רואה את זה?</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              סיכום זה נוצר אוטומטית על ידי מודל שפה ({modelVersion}) שניתח את הביקורות
              הנוכחיות של העסק. הוא לא נכתב על ידי בן אדם ואינו מייצג את עמדת ReviewHub.
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
            <p className="text-[10px] text-muted-foreground/60 leading-snug pt-1 border-t border-border/30">
              סיכומי AI עשויים להכיל שגיאות. לתמונה המלאה, קראו את הביקורות הבודדות.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Meta chips row */}
      {metaChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-2">
          {metaChips.map(chip => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 text-[10px] text-primary/70
                bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5"
            >
              <span className="text-primary/40">{chip.label}:</span>
              <span className="font-semibold">{chip.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Summary text — collapsible if long */}
      <div className="px-5 pb-2">
        <div
          className={`prose prose-sm max-w-none text-foreground/80 transition-all
            ${!expanded && summary.length > 400 ? "max-h-[120px] overflow-hidden relative" : ""}`}
        >
          {!expanded && summary.length > 400 && (
            <div className="absolute bottom-0 left-0 right-0 h-12
              bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          )}
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
        {summary.length > 400 && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary
              transition-colors mt-2"
          >
            {expanded ? (
              <><ChevronUp size={13} /> הצג פחות</>
            ) : (
              <><ChevronDown size={13} /> הצג את הסיכום המלא</>
            )}
          </button>
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="px-5 py-2.5 border-t border-primary/15 bg-primary/3">
        <p className="text-[10px] text-primary/50 leading-snug flex items-start gap-1.5">
          <Sparkles size={9} className="shrink-0 mt-0.5" aria-hidden="true" />
          סיכום זה נוצר אוטומטית על ידי {modelVersion} ומבוסס על
          {reviewCount > 0 ? ` ${reviewCount} ביקורות` : " הביקורות הקיימות"}
          {periodLabel ? ` מ${periodLabel}` : ""}.
          {" "}הוא אינו עורך-דין, יועץ פיננסי, או המלצה רשמית מטעם ReviewHub.
        </p>
      </div>
    </div>
  );
};

export default ReviewSummary;

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReviewSummaryProps {
  summary: string;
}

const ReviewSummary = ({ summary }: ReviewSummaryProps) => {
  if (!summary) return null;
  return (
    <div className="rounded-xl p-5 mb-6 border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-primary" />
        <span className="font-display font-semibold text-sm text-primary">סיכום ביקורות AI</span>
      </div>
      <div className="prose prose-sm prose-invert max-w-none text-foreground/80">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ReviewSummary;

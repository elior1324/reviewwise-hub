import { MessageSquareReply } from "lucide-react";

interface ReviewResponseProps {
  text: string;
  date: string;
}

const ReviewResponse = ({ text, date }: ReviewResponseProps) => (
  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
    <div className="flex items-center gap-2 mb-1.5">
      <MessageSquareReply size={14} className="text-primary" />
      <span className="text-xs font-semibold text-primary">תגובת בעל העסק</span>
      <span className="text-xs text-muted-foreground mr-auto">{date}</span>
    </div>
    <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
  </div>
);

export default ReviewResponse;

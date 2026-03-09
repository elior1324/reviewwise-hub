import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  showBoost?: boolean;
}

const VerifiedBadge = ({ showBoost = false }: VerifiedBadgeProps) => (
  <Tooltip>
    <TooltipTrigger>
      <Badge className="bg-emerald-500/15 text-emerald-600 border-0 gap-1 font-body text-xs cursor-help">
        <BadgeCheck size={14} />
        רכישה מאומתת
        {showBoost && <span className="text-[9px] font-bold mr-0.5">2x</span>}
      </Badge>
    </TooltipTrigger>
    <TooltipContent className="text-xs max-w-[220px]">
      <p className="font-semibold mb-0.5">✅ ביקורת מאומתת</p>
      <p>המשתמש אימת את הרכישה שלו עם הוכחה. ביקורת זו מזכה ב-2x נקודות בלידרבורד.</p>
    </TooltipContent>
  </Tooltip>
);

export default VerifiedBadge;

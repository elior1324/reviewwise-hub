import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import { User } from "lucide-react";

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  text: string;
  courseName: string;
  date: string;
  verified: boolean;
  anonymous: boolean;
}

const ReviewCard = ({ reviewerName, rating, text, courseName, date, verified, anonymous }: ReviewCardProps) => (
  <Card className="shadow-card hover:shadow-card-hover transition-all duration-500 animated-border bg-card">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">
              {anonymous ? "אנונימי" : reviewerName}
            </p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        {verified && <VerifiedBadge />}
      </div>
      <StarRating rating={rating} size={16} />
      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{text}</p>
      <p className="mt-3 text-xs text-muted-foreground">קורס: {courseName}</p>
    </CardContent>
  </Card>
);

export default ReviewCard;

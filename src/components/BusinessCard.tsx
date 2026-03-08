import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BusinessCardProps {
  slug: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
}

const BusinessCard = ({ slug, name, category, rating, reviewCount, description }: BusinessCardProps) => (
  <Link to={`/biz/${slug}`}>
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-500 group cursor-pointer h-full animated-border bg-card">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-lg">
            {name.charAt(0)}
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">{category}</span>
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-1">{name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={rating} size={14} />
          <span className="text-sm text-muted-foreground">({reviewCount})</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{description}</p>
        <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
          צפו בביקורות <ArrowLeft size={14} />
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default BusinessCard;

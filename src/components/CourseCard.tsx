import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import type { Course } from "@/data/mockData";

const CourseCard = ({ id, name, price, category, rating, reviewCount, verifiedPurchases, description }: Course) => (
  <Link to={`/course/${id}`}>
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-500 group cursor-pointer h-full animated-border bg-card">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">{category}</span>
          <span className="font-display font-bold text-primary text-lg">₪{price.toLocaleString()}</span>
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-1">{name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={rating} size={14} />
          <span className="text-sm text-muted-foreground">({reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <ShieldCheck size={12} className="text-trust-green" />
          <span>{verifiedPurchases} רכישות מאומתות</span>
          <span className="mx-1">•</span>
          <Users size={12} />
          <span>{reviewCount} ביקורות</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{description}</p>
        <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
          צפה בקורס <ArrowLeft size={14} />
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default CourseCard;

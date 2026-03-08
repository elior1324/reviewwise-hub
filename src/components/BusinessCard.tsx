import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface BusinessCardProps {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  description: string;
  logo?: string;
}

const BusinessCard = ({ slug, name, category, subcategory, rating, reviewCount, description, logo }: BusinessCardProps) => (
  <Link to={`/biz/${slug}`}>
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-500 group cursor-pointer h-full animated-border bg-card overflow-hidden relative">
      {/* Ambient glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)" }}
      />
      <CardContent className="p-6 flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Logo with 3D float effect */}
          <motion.div
            whileHover={{ rotateY: 12, rotateX: -8, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
            style={{ perspective: "600px", transformStyle: "preserve-3d" }}
          >
            {logo ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden relative group-hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] transition-shadow duration-500">
                <img src={logo} alt={name} className="w-full h-full object-contain bg-white/5 p-1.5" />
                {/* Shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-xl group-hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)] transition-shadow duration-500">
                {name.charAt(0)}
              </div>
            )}
          </motion.div>
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

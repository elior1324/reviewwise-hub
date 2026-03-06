import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

const ALL_BUSINESSES = [
  { slug: "digital-marketing-academy", name: "Digital Marketing Academy", category: "Marketing", rating: 4.8, reviewCount: 124, description: "Comprehensive digital marketing courses." },
  { slug: "code-masters-il", name: "Code Masters IL", category: "Programming", rating: 4.6, reviewCount: 89, description: "Full-stack development bootcamp." },
  { slug: "design-school-tlv", name: "Design School TLV", category: "Design", rating: 4.9, reviewCount: 67, description: "UI/UX design courses by industry pros." },
  { slug: "data-science-hub", name: "Data Science Hub", category: "Data Science", rating: 4.7, reviewCount: 156, description: "Python basics to advanced ML." },
  { slug: "hebrew-tech", name: "Hebrew Tech", category: "Programming", rating: 4.5, reviewCount: 42, description: "Hebrew-first tech education." },
  { slug: "growth-academy", name: "Growth Academy", category: "Business", rating: 4.4, reviewCount: 31, description: "Growth hacking and startup strategy." },
];

const CATEGORIES = ["All", "Marketing", "Programming", "Design", "Data Science", "Business"];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const filtered = ALL_BUSINESSES.filter(b => {
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase()) || b.description.toLowerCase().includes(query.toLowerCase()) || b.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
    const matchesRating = b.rating >= minRating;
    return matchesQuery && matchesCategory && matchesRating;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-6">Browse Courses & Businesses</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 h-11" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[0, 4, 4.5].map(r => (
            <Button key={r} variant={minRating === r ? "default" : "outline"} size="sm" onClick={() => setMinRating(r)}>
              {r === 0 ? "Any Rating" : `${r}+ ★`}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} results found</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((biz, i) => (
            <motion.div key={biz.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No businesses found. Try adjusting your search.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";

const ALL_BUSINESSES = [
  { slug: "digital-marketing-academy", name: "אקדמיית שיווק דיגיטלי", category: "שיווק", rating: 4.8, reviewCount: 124, description: "קורסים מקיפים בשיווק דיגיטלי." },
  { slug: "code-masters-il", name: "Code Masters IL", category: "תכנות", rating: 4.6, reviewCount: 89, description: "בוטקמפ פיתוח Full-Stack." },
  { slug: "design-school-tlv", name: "בית הספר לעיצוב ת״א", category: "עיצוב", rating: 4.9, reviewCount: 67, description: "קורסי UI/UX מאנשי תעשייה." },
  { slug: "data-science-hub", name: "מרכז מדעי הנתונים", category: "מדעי נתונים", rating: 4.7, reviewCount: 156, description: "מ-Python ועד למידת מכונה." },
  { slug: "hebrew-tech", name: "Hebrew Tech", category: "תכנות", rating: 4.5, reviewCount: 42, description: "חינוך טכנולוגי בעברית." },
  { slug: "growth-academy", name: "אקדמיית צמיחה", category: "עסקים", rating: 4.4, reviewCount: 31, description: "Growth hacking ואסטרטגיית סטארטאפ." },
];

const CATEGORIES = ["הכל", "שיווק", "תכנות", "עיצוב", "מדעי נתונים", "עסקים"];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [minRating, setMinRating] = useState(0);

  const filtered = ALL_BUSINESSES.filter(b => {
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase()) || b.description.includes(query) || b.category.includes(query);
    const matchesCategory = selectedCategory === "הכל" || b.category === selectedCategory;
    const matchesRating = b.rating >= minRating;
    return matchesQuery && matchesCategory && matchesRating;
  });

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-6">עיון בקורסים ועסקים</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="חיפוש..." className="pr-10 h-11 glass border-border/50" value={query} onChange={e => setQuery(e.target.value)} />
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
          {[{ v: 0, l: "כל הדירוגים" }, { v: 4, l: "4+ ★" }, { v: 4.5, l: "4.5+ ★" }].map(({ v, l }) => (
            <Button key={v} variant={minRating === v ? "default" : "outline"} size="sm" onClick={() => setMinRating(v)}>
              {l}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} תוצאות נמצאו</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((biz, i) => (
            <motion.div key={biz.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">לא נמצאו עסקים. נסו לשנות את החיפוש.</p>
        )}
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default SearchPage;

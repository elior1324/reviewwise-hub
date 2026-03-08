import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";
import { BUSINESSES, COURSES } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const CATEGORIES = ["הכל", "שיווק", "תכנות", "עיצוב", "מדעי נתונים", "עסקים"];
const EXPERIENCE_OPTIONS = [
  { value: 0, label: "הכל" },
  { value: 3, label: "3+ חודשים" },
  { value: 6, label: "6+ חודשים" },
  { value: 12, label: "שנה+" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [minExperience, setMinExperience] = useState(0);

  const filteredBusinesses = BUSINESSES.filter(b => {
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase()) || b.description.includes(query) || b.category.includes(query);
    const matchesCategory = selectedCategory === "הכל" || b.category === selectedCategory;
    const matchesRating = b.rating >= minRating;
    return matchesQuery && matchesCategory && matchesRating;
  });

  const filteredCourses = COURSES.filter(c => {
    const matchesQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.description.includes(query) || c.category.includes(query);
    const matchesCategory = selectedCategory === "הכל" || c.category === selectedCategory;
    const matchesRating = c.rating >= minRating;
    const matchesPrice = c.price >= priceRange[0] && c.price <= priceRange[1];
    return matchesQuery && matchesCategory && matchesRating && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-6">חפשו קורסים ועסקים</h1>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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

        {/* Rating + Price + Experience Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">דירוג:</span>
            {[{ v: 0, l: "הכל" }, { v: 4, l: "4+ ★" }, { v: 4.5, l: "4.5+ ★" }].map(({ v, l }) => (
              <Button key={v} variant={minRating === v ? "default" : "outline"} size="sm" onClick={() => setMinRating(v)}>
                {l}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">מחיר עד: ₪{priceRange[1].toLocaleString()}</span>
            <div className="w-40">
              <Slider min={0} max={20000} step={500} value={[priceRange[1]]} onValueChange={v => setPriceRange([0, v[0]])} />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">ניסיון:</span>
            {EXPERIENCE_OPTIONS.map(opt => (
              <Button key={opt.value} variant={minExperience === opt.value ? "default" : "outline"} size="sm" onClick={() => setMinExperience(opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="courses">קורסים ({filteredCourses.length})</TabsTrigger>
            <TabsTrigger value="businesses">עסקים ({filteredBusinesses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <p className="text-center text-muted-foreground py-16">לא נמצאו קורסים התואמים לחיפוש. נסו לשנות את מילות החיפוש או הסינון.</p>
            )}
          </TabsContent>

          <TabsContent value="businesses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz, i) => (
                <motion.div key={biz.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <BusinessCard {...biz} />
                </motion.div>
              ))}
            </div>
            {filteredBusinesses.length === 0 && (
              <p className="text-center text-muted-foreground py-16">לא נמצאו עסקים התואמים לחיפוש. נסו לשנות את מילות החיפוש או הסינון.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default SearchPage;

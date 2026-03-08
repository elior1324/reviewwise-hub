import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, BookOpen, ChevronDown, ArrowUpDown, Trophy, Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";
import FloatingEarnCTA from "@/components/FloatingEarnCTA";
import { BUSINESSES, COURSES, FREELANCER_SUBCATEGORIES, CATEGORY_PLURAL, Business } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "default" | "top5" | "alpha-asc" | "rating-desc" | "rating-asc" | "most-reviews" | "least-reviews";

const SORT_LABELS: Record<SortOption, string> = {
  "default": "ברירת מחדל",
  "top5": "טופ 5 הכי מוכרים",
  "alpha-asc": "א׳–ב׳ (א–ת)",
  "rating-desc": "דירוג גבוה תחילה",
  "rating-asc": "דירוג נמוך תחילה",
  "most-reviews": "הכי הרבה ביקורות",
  "least-reviews": "הכי פחות ביקורות",
};

function sortBusinesses(list: Business[], sort: SortOption): Business[] {
  const sorted = [...list];
  switch (sort) {
    case "top5":
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
    case "alpha-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "he"));
    case "rating-desc":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "rating-asc":
      return sorted.sort((a, b) => a.rating - b.rating);
    case "most-reviews":
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case "least-reviews":
      return sorted.sort((a, b) => a.reviewCount - b.reviewCount);
    default:
      return sorted;
  }
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const defaultTab = searchParams.get("tab") || "freelancers";
  const [selectedFreelancerCat, setSelectedFreelancerCat] = useState("הכל");
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [selectedCourseCat, setSelectedCourseCat] = useState("הכל");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [sortOption, setSortOption] = useState<SortOption>("default");

  // Fallback mock top 5
  const mockTop5 = useMemo(() => 
    [...BUSINESSES]
      .filter(b => b.rating >= 4.0)
      .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
      .slice(0, 5),
    []
  );

  // Fetch AI-generated monthly top 5 from DB
  const [dbTop5, setDbTop5] = useState<any[] | null>(null);
  const [top5Month, setTop5Month] = useState("");

  useEffect(() => {
    const fetchTop5 = async () => {
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      
      const { data } = await supabase
        .from("monthly_top5")
        .select("*")
        .eq("month_year", monthYear)
        .order("rank", { ascending: true });

      if (data && data.length > 0) {
        setTop5Month(monthYear);
        // Map DB rankings to mock business data for BusinessCard display
        const mapped = data.map((item: any) => {
          const biz = BUSINESSES.find(b => b.slug === item.business_slug);
          return biz ? { ...biz, _aiReasoning: item.ai_reasoning } : null;
        }).filter(Boolean);
        if (mapped.length > 0) setDbTop5(mapped);
      }
    };
    fetchTop5();
  }, []);

  const top5Overall = dbTop5 || mockTop5;
  const isAiRanked = dbTop5 !== null;

  const { data: freelancerCats = [] } = useCategories("freelancer");
  const { data: courseCats = [] } = useCategories("course");
  const ALL_FREELANCER_CATS = ["הכל", ...freelancerCats.filter(c => c !== "אחר"), "אחר"];
  const ALL_COURSE_CATS = ["הכל", ...courseCats.filter(c => c !== "אחר"), "אחר"];

  // Get subcategories for selected category
  const currentSubcats = selectedFreelancerCat !== "הכל" 
    ? FREELANCER_SUBCATEGORIES[selectedFreelancerCat] || [] 
    : [];

  const freelancersFiltered = BUSINESSES.filter(b => {
    if (b.type !== "freelancer") return false;
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase()) || b.description.includes(query) || b.category.includes(query) || (b.subcategory && b.subcategory.includes(query));
    const matchesCat = selectedFreelancerCat === "הכל" || b.category === selectedFreelancerCat;
    const matchesSubcat = !selectedSubcat || b.subcategory === selectedSubcat;
    const matchesRating = b.rating >= minRating;
    return matchesQuery && matchesCat && matchesSubcat && matchesRating;
  });

  const freelancers = useMemo(() => sortBusinesses(freelancersFiltered, sortOption), [freelancersFiltered, sortOption]);

  const courseProviders = BUSINESSES.filter(b => {
    if (b.type !== "course-provider") return false;
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase()) || b.description.includes(query) || b.category.includes(query);
    const matchesCat = selectedCourseCat === "הכל" || b.category === selectedCourseCat;
    const matchesRating = b.rating >= minRating;
    return matchesQuery && matchesCat && matchesRating;
  });

  const filteredCourses = COURSES.filter(c => {
    const matchesQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.description.includes(query) || c.category.includes(query);
    const matchesCat = selectedCourseCat === "הכל" || c.category === selectedCourseCat;
    const matchesRating = c.rating >= minRating;
    const matchesPrice = c.price >= priceRange[0] && c.price <= priceRange[1];
    return matchesQuery && matchesCat && matchesRating && matchesPrice;
  });

  const handleCatSelect = (cat: string) => {
    setSelectedFreelancerCat(cat);
    setSelectedSubcat(null);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <FloatingEarnCTA />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-6">חפשו בעלי מקצוע וקורסים</h1>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="חיפוש פרילנסרים, קורסים, קטגוריות..." className="pr-10 h-11 glass border-border/50" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {/* Top 5 Most Reviewed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={20} className="text-primary" />
            <h2 className="font-display font-bold text-lg text-foreground">טופ 5 — הכי הרבה ביקורות חיוביות</h2>
            {isAiRanked && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">🤖 AI מעודכן</span>
            )}
          </div>
          {isAiRanked && top5Month && (
            <p className="text-xs text-muted-foreground mb-3 mr-7">דירוג חודשי מבוסס AI — עודכן לאחרונה ב-{top5Month}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 auto-rows-fr">
            {top5Overall.map((biz, i) => (
              <motion.div
                key={biz.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="h-full"
              >
                <div className="relative h-full">
                  {i < 3 && (
                    <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                      style={{
                        background: i === 0 ? 'hsl(var(--primary))' : i === 1 ? 'hsl(220 10% 45%)' : 'hsl(25 30% 35%)',
                      }}
                    >
                      {["🥇", "🥈", "🥉"][i]}
                    </div>
                  )}
                  <BusinessCard {...biz} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rating Filter + Sort */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">דירוג:</span>
            {[{ v: 0, l: "הכל" }, { v: 4, l: "4+ ★" }, { v: 4.5, l: "4.5+ ★" }].map(({ v, l }) => (
              <Button key={v} variant={minRating === v ? "default" : "outline"} size="sm" onClick={() => setMinRating(v)}>
                {l}
              </Button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowUpDown size={14} />
                {SORT_LABELS[sortOption]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortOption(key)}
                  className={sortOption === key ? "bg-accent font-medium" : ""}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="freelancers" className="flex items-center gap-1.5">
              <UserCheck size={14} />
              בעלי מקצוע ({freelancers.length})
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1.5">
              <BookOpen size={14} />
              קורסים והכשרות ({filteredCourses.length})
            </TabsTrigger>
          </TabsList>

          {/* Freelancers Tab */}
          <TabsContent value="freelancers">
            {/* Main Categories */}
            <div className="flex gap-2 flex-wrap mb-3">
              {ALL_FREELANCER_CATS.map(cat => (
                <Button 
                  key={cat} 
                  variant={selectedFreelancerCat === cat ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => handleCatSelect(cat)}
                >
                  {cat}
                  {FREELANCER_SUBCATEGORIES[cat] && selectedFreelancerCat !== cat && (
                    <ChevronDown size={12} className="mr-1 opacity-50" />
                  )}
                </Button>
              ))}
            </div>

            {/* Sub-categories */}
            {currentSubcats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2 flex-wrap mb-6 pr-4 border-r-2 border-primary/30"
              >
                <Button
                  variant={selectedSubcat === null ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedSubcat(null)}
                >
                  כל {CATEGORY_PLURAL[selectedFreelancerCat] || `ה${selectedFreelancerCat}`}
                </Button>
                {currentSubcats.map(sub => (
                  <Button
                    key={sub}
                    variant={selectedSubcat === sub ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedSubcat(sub)}
                  >
                    {sub}
                  </Button>
                ))}
              </motion.div>
            )}

            {currentSubcats.length === 0 && <div className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((biz, i) => (
                <motion.div key={biz.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <BusinessCard {...biz} />
                </motion.div>
              ))}
            </div>
            {freelancers.length === 0 && (
              <p className="text-center text-muted-foreground py-16">לא נמצאו בעלי מקצוע התואמים לחיפוש.</p>
            )}
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <div className="flex gap-2 flex-wrap mb-4">
              {ALL_COURSE_CATS.map(cat => (
                <Button key={cat} variant={selectedCourseCat === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCourseCat(cat)}>
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <span className="text-sm font-medium text-foreground">מחיר עד: ₪{priceRange[1].toLocaleString()}</span>
              <div className="w-52">
                <Slider
                  min={0}
                  max={20000}
                  step={500}
                  value={[priceRange[1]]}
                  onValueChange={v => {
                    setPriceRange([0, v[0]]);
                    if (navigator.vibrate) {
                      navigator.vibrate(5);
                    }
                  }}
                />
              </div>
            </div>

            {/* Course Providers */}
            <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" /> ספקי קורסים ({courseProviders.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {courseProviders.map((biz, i) => (
                <motion.div key={biz.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <BusinessCard {...biz} />
                </motion.div>
              ))}
            </div>

            {/* Courses List */}
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">קורסים וסדנאות ({filteredCourses.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
            {filteredCourses.length === 0 && courseProviders.length === 0 && (
              <p className="text-center text-muted-foreground py-16">לא נמצאו קורסים או ספקים התואמים לחיפוש.</p>
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

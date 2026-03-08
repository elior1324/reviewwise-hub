import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { useState } from "react";
import { BUSINESSES, REVIEWS } from "@/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const topBusinesses = BUSINESSES.slice(0, 4);
  const recentReviews = REVIEWS.slice(0, 3);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> רק ביקורות מאומתות
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              מצאו את הקורסים{" "}
              <span className="gradient-text glow-text">הטובים ביותר</span>
              <br />בישראל
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              ביקורות אמיתיות ומאומתות מסטודנטים שרכשו בפועל. קבלו החלטות מושכלות לגבי ההשכלה שלכם.
            </motion.p>
            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חפשו קורסים, מנטורים או קטגוריות..."
                  className="pr-10 h-12 glass border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 glow-primary">
                חיפוש
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 glass">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Star, label: "ביקורות", value: "12,400+" },
              { icon: Users, label: "עסקים", value: "850+" },
              { icon: ShieldCheck, label: "מאומתות", value: "98%" },
              { icon: TrendingUp, label: "מבקרים בחודש", value: "45K+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <Icon size={24} className="mx-auto mb-2 text-primary" />
                <p className="font-display font-bold text-2xl text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Businesses */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">עסקים מובילים</h2>
            <p className="text-muted-foreground mt-1">אלפי סטודנטים סומכים עליהם</p>
          </div>
          <Link to="/search">
            <Button variant="outline" size="sm" className="border-border/50">הצגת הכל</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topBusinesses.map((biz, i) => (
            <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">ביקורות אחרונות</h2>
          <p className="text-muted-foreground mb-10">משוב אמיתי מסטודנטים מאומתים</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map((review, i) => (
              <motion.div key={review.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              יוצרי קורסים? הצטרפו עכשיו
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              בנו אמון אמיתי עם ביקורות מאומתות והגדילו את העסק שלכם.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                  צרו פרופיל עסקי
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                  קראו עוד על ReviewHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;

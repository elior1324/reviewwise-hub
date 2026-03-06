import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BusinessCard from "@/components/BusinessCard";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const MOCK_BUSINESSES = [
  { slug: "digital-marketing-academy", name: "Digital Marketing Academy", category: "Marketing", rating: 4.8, reviewCount: 124, description: "Comprehensive digital marketing courses for beginners and professionals." },
  { slug: "code-masters-il", name: "Code Masters IL", category: "Programming", rating: 4.6, reviewCount: 89, description: "Full-stack development bootcamp with hands-on projects." },
  { slug: "design-school-tlv", name: "Design School TLV", category: "Design", rating: 4.9, reviewCount: 67, description: "UI/UX design courses taught by industry professionals." },
  { slug: "data-science-hub", name: "Data Science Hub", category: "Data Science", rating: 4.7, reviewCount: 156, description: "From Python basics to advanced machine learning." },
];

const MOCK_REVIEWS = [
  { reviewerName: "Sarah L.", rating: 5, text: "Absolutely transformative course! The mentorship was outstanding and I landed a job within 2 months.", courseName: "Full-Stack Bootcamp", date: "Feb 28, 2026", verified: true, anonymous: false },
  { reviewerName: "Anonymous", rating: 4, text: "Great content and practical exercises. The community support is excellent.", courseName: "Digital Marketing Masterclass", date: "Feb 25, 2026", verified: true, anonymous: true },
  { reviewerName: "David K.", rating: 5, text: "Best investment I've made in my career. The curriculum is well-structured and up to date.", courseName: "UI/UX Design Foundations", date: "Feb 20, 2026", verified: true, anonymous: false },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hero-gradient)] opacity-[0.03]" />
        <div className="container py-20 md:py-32 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-trust-green-light text-trust-green px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ShieldCheck size={16} /> Only Verified Reviews
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Find the Best<br />
              <span className="text-primary">Online Courses</span> in Israel
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Trusted, verified reviews from real students. Make confident decisions about your education.
            </motion.p>
            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses, mentors, or categories..."
                  className="pl-10 h-12 bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6">
                Search
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Star, label: "Reviews", value: "12,400+" },
              { icon: Users, label: "Businesses", value: "850+" },
              { icon: ShieldCheck, label: "Verified", value: "98%" },
              { icon: TrendingUp, label: "Monthly Visitors", value: "45K+" },
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
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Top Rated Businesses</h2>
            <p className="text-muted-foreground mt-1">Trusted by thousands of students</p>
          </div>
          <Link to="/search">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_BUSINESSES.map((biz, i) => (
            <motion.div key={biz.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <BusinessCard {...biz} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="bg-card border-y">
        <div className="container py-16">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">Recent Reviews</h2>
          <p className="text-muted-foreground mb-8">Real feedback from verified students</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_REVIEWS.map((review, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="bg-primary rounded-2xl p-10 md:p-16 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-foreground mb-4">
            Are You a Course Creator?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Join ReviewHub to build trust with verified reviews and grow your business.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-card text-foreground hover:bg-card/90 font-semibold">
              Create Your Profile
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

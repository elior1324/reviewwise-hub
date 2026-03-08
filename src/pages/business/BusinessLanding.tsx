import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Star, TrendingUp, Zap, BarChart3, Code,
  Award, ArrowRight, CheckCircle, Users
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const FEATURES = [
  { icon: ShieldCheck, title: "Verified Reviews", desc: "Only customers with verified purchases can leave reviews. 100% authentic." },
  { icon: BarChart3, title: "Advanced Dashboard", desc: "Track ratings, trends, new reviews, and response rates in real time." },
  { icon: Code, title: "Embeddable Widgets", desc: "Display reviews and ratings on your website with a single line of code." },
  { icon: Zap, title: "Automated Review Requests", desc: "Send customers unique review links or upload a CSV of purchases." },
  { icon: TrendingUp, title: "Affiliate System", desc: "Create referral links with click, conversion, and revenue tracking." },
  { icon: Award, title: "AI-Powered Insights", desc: "Weekly AI reports identify strengths, weaknesses, and growth opportunities." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Public business profile", "Up to 50 reviews", "Basic rating badge", "Review responses"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: ["Unlimited reviews", "Embeddable widgets", "Automated review requests", "Advanced dashboard", "Affiliate system", "AI summaries"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Everything in Pro", "Full API access", "Custom integrations", "Dedicated account manager", "Google Ads Review Stars", "Advanced reporting"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const TRUSTED = [
  { name: "Digital Marketing Academy", initials: "DMA" },
  { name: "Code Masters IL", initials: "CM" },
  { name: "Design School TLV", initials: "DS" },
  { name: "Data Science Hub", initials: "DH" },
  { name: "Hebrew Tech", initials: "HT" },
  { name: "Growth Academy", initials: "GA" },
  { name: "TechPro Academy", initials: "TP" },
  { name: "LearnX Israel", initials: "LX" },
];

const BusinessLanding = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay" dir="ltr">
      <BusinessNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute top-20 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="container py-24 md:py-36 relative">
          <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
                  <Zap size={16} /> For Business Owners
                </motion.div>
                <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
                  Build Real Trust with{" "}
                  <span className="gradient-text glow-text">Verified Reviews</span>
                </motion.h1>
                <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Join hundreds of businesses in Israel using ReviewHub to collect verified reviews, build reputation, and increase sales.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="flex gap-3 flex-wrap">
                  <Link to="/business/signup">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link to="/business/pricing">
                    <Button size="lg" variant="outline" className="border-border/50 font-semibold">
                      View Pricing
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <motion.div variants={fadeUp} custom={2} className="hidden md:block">
                <div className="rounded-2xl p-6 bg-card border border-border/50 shadow-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary glow-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-display font-bold text-sm">R</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">ReviewHub Dashboard</p>
                      <p className="text-xs text-muted-foreground">Preview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Avg. Rating", value: "4.8 ⭐" },
                      { label: "Reviews This Month", value: "+23" },
                      { label: "Response Rate", value: "92%" },
                      { label: "Affiliate Clicks", value: "1,240" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-display font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <TrendingUp size={14} />
                    <span>Conversions up 34% this month</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="border-y border-border/50 glass">
        <div className="container py-12">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium">Trusted by leading education companies</p>
          <div className="flex flex-wrap justify-center gap-4">
            {TRUSTED.map((company) => (
              <div key={company.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-xs">
                  {company.initials}
                </div>
                <span className="text-xs text-foreground font-medium">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "850+", label: "Registered Businesses" },
            { value: "12,400+", label: "Verified Reviews" },
            { value: "34%", label: "Average Conversion Increase" },
            { value: "98%", label: "Business Satisfaction" },
          ].map(({ value, label }, i) => (
            <motion.div key={label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <p className="font-display font-bold text-3xl md:text-4xl text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">Everything You Need to Manage Your Reputation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Professional tools built specifically for course creators and learning services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">Choose the plan that fits your business</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className={`rounded-xl p-6 border ${
                plan.highlighted
                  ? "bg-card border-primary/50 shadow-card-hover relative"
                  : "bg-card border-border/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-display font-bold text-xl text-foreground mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="font-display font-bold text-3xl text-primary">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/business/signup">
                <Button className={`w-full ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden animated-border" style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.08), hsl(160 60% 55% / 0.04))" }}>
          <div className="absolute inset-0 bg-primary/5 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              Ready to Build Real Trust?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join hundreds of businesses already using ReviewHub. Start free and upgrade when you're ready.
            </p>
            <Link to="/business/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary gap-2">
                Create Free Account <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <BusinessFooter />
    </div>
  );
};

export default BusinessLanding;

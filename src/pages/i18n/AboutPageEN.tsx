/**
 * AboutPageEN.tsx — English version of the About page
 * Rendered by AboutPage.tsx when language === "en".
 * Hebrew is the legally binding version.
 */

import { ShieldCheck, Target, BookOpen, Users, Award, TrendingUp, CheckCircle, XCircle, BarChart2, AlertTriangle, Clock, Star, Tag, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { computeVerifiedPricing, formatPrice, LEARNER_DISCOUNT_RATE, PLATFORM_FEE_RATE, TOTAL_TRUST_CHARGE } from "@/lib/affiliate";
import LegalTranslationNotice from "@/components/LegalTranslationNotice";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const AboutPageEN = () => {
  const ex = computeVerifiedPricing(1000);

  return (
    <div dir="ltr" className="text-left">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-24 md:py-32 relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
              <ShieldCheck size={16} /> Independent Verification System
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Trust Infrastructure —{" "}
              <span className="gradient-text glow-text">Not a Marketing Platform</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ReviewHub is an independent verification system. We connect to payment systems and
              produce trust data based on real commercial records — not what a creator says about
              themselves.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Legal notice */}
      <div className="container pt-8 max-w-4xl">
        <LegalTranslationNotice />
      </div>

      {/* What we do */}
      <section className="container py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
            What We Do
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              ReviewHub is a trust infrastructure for digital education. The platform ranks online
              courses by verified-purchase reviews — producing an independent trust score for every
              course and every creator. ReviewHub is not a marketing platform and is not a commercial
              partner of course creators.
            </p>
            <p>
              The trust scores we produce are built from three measurable components: review volume,
              refund and complaint ratio, and verified activity period. Our full methodology is public
              — you can inspect exactly how every number is calculated.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 5/5 Verified Deal */}
      <section className="border-y border-border/50">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <Tag size={24} className="text-primary" />
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                5/5 Model — Full Operational Transparency
              </h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="space-y-5">
              <p className="text-foreground/80 leading-relaxed">
                ReviewHub operates on the <strong className="text-foreground">5/5 Verified Deal</strong> model —
                a commercial infrastructure built on a Win-Win-Win principle: learners save, creators
                build trust, and the platform earns from operations.
              </p>

              {/* Economics table */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                <div className="bg-primary/10 px-5 py-3">
                  <p className="text-sm font-bold text-foreground">
                    Example: Course priced at {formatPrice(ex.listPrice)}
                  </p>
                </div>
                <div className="divide-y divide-border/40 text-sm">
                  {[
                    { label: "List price",          value: formatPrice(ex.listPrice),         note: "" },
                    { label: `Platform fee (${(TOTAL_TRUST_CHARGE * 100).toFixed(0)}%)`, value: `−${formatPrice(ex.platformFee)}`, note: "covers trust infra" },
                    { label: `Learner discount (${(LEARNER_DISCOUNT_RATE * 100).toFixed(0)}%)`, value: `−${formatPrice(ex.learnerDiscount)}`, note: "applied automatically" },
                    { label: "Creator receives",    value: formatPrice(ex.creatorReceives),   note: "net payout" },
                    { label: "Learner pays",        value: formatPrice(ex.learnerPays),       note: "discounted price" },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="px-5 py-2.5 flex items-center justify-between">
                      <span className="text-foreground/70">{label}</span>
                      <span className="font-semibold text-foreground">
                        {value}
                        {note && <span className="ml-2 text-[11px] text-muted-foreground font-normal">({note})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
            Three Trust Pillars
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-10 max-w-2xl">
            Our trust score formula is built from three independently measurable indicators.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2,
                title: "Review Volume",
                description: "The number of verified-purchase reviews. A minimum threshold is required to receive a trust score — this prevents gaming with a handful of staged reviews.",
              },
              {
                icon: AlertTriangle,
                title: "Refund & Complaint Ratio",
                description: "Refund and dispute rates drawn directly from payment-processor records — not self-reported. High rates are a direct trust penalty.",
              },
              {
                icon: Clock,
                title: "Verified Activity Period",
                description: "How long the creator has maintained a verified commercial presence. Longevity is a signal of stability.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={2}
                className="rounded-xl border border-border/50 p-6 bg-card"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* What ReviewHub is NOT */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="container py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-8">
              What ReviewHub Is — and Is Not
            </motion.h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { is: true,  text: "An independent verification system"     },
                { is: true,  text: "Connects to real payment records"        },
                { is: true,  text: "Publicly documented methodology"         },
                { is: true,  text: "Separate from creator marketing"         },
                { is: false, text: "Not a marketing partner of creators"     },
                { is: false, text: "Does not accept paid reviews"            },
                { is: false, text: "Does not guarantee course quality"       },
                { is: false, text: "Not liable for creator's content"        },
              ].map(({ is, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40">
                  {is
                    ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    : <XCircle    size={16} className="text-rose-500 shrink-0" />
                  }
                  <span className="text-sm text-foreground/80">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
            Contact Us
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
            Questions about our trust methodology, dispute a score, or business partnerships — reach us at:
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <a
              href="mailto:support@reviewshub.info"
              className="text-primary font-medium hover:underline text-lg"
            >
              support@reviewshub.info
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={3} className="mt-8">
            <Link to="/search">
              <Button size="lg" className="font-semibold">
                Browse the Trust Library
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPageEN;

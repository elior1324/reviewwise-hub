/**
 * TermsEN.tsx — English version of the Terms of Service
 * Hebrew is the legally binding version.
 */

import { Scale, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import LegalTranslationNotice from "@/components/LegalTranslationNotice";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeUp}
    className="space-y-3"
  >
    <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
      <ChevronRight size={18} className="text-primary shrink-0" />
      {title}
    </h2>
    <div className="pl-6 text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

const TermsEN = () => (
  <div dir="ltr" className="text-left">
    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-16 md:py-24 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
            <Scale size={16} /> Terms of Service
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">Version 1.0 — March 2026</p>
          <p className="text-muted-foreground mt-2">
            These terms govern your access to and use of the ReviewHub platform and related services.
            Please read them carefully.
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <LegalTranslationNotice />

      <div className="space-y-10">
        <Section title="1. Introduction">
          <p>
            ReviewHub is a <strong>technology platform only</strong> that acts as an intermediary
            between business owners and consumers, enabling the publication of reviews, ratings, and
            feedback. ReviewHub is not a party to any transaction, contract, or legal relationship
            between business owners and consumers or reviewers, and bears no responsibility for
            content, transactions, or such relationships.
          </p>
          <p>
            By accessing or using the services — whether free or paid — you accept these terms.
            Access is conditional on your acceptance.
          </p>
        </Section>

        <Section title="2. Definitions">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Platform</strong> — the ReviewHub website at reviewhub.co.il and all associated services</li>
            <li><strong>User</strong> — any person who accesses the platform</li>
            <li><strong>Business Owner</strong> — a user who has registered a business profile</li>
            <li><strong>Review</strong> — any textual or rating content submitted by a user</li>
            <li><strong>Trust Score</strong> — an algorithmic score produced by the platform based on verified data</li>
          </ul>
        </Section>

        <Section title="3. Account Registration">
          <p>
            To access certain features you must create an account. You are responsible for
            maintaining the confidentiality of your credentials and for all activity under your
            account. You must provide accurate information and update it as necessary. Accounts
            may not be shared or transferred.
          </p>
        </Section>

        <Section title="4. Reviews & Content">
          <ul className="list-disc pl-5 space-y-1">
            <li>Reviews must be based on genuine, first-hand experience</li>
            <li>You may not submit false, misleading, or fabricated reviews</li>
            <li>Reviews must not contain personal attacks, defamatory content, or illegal material</li>
            <li>Verified-purchase reviews require evidence of an actual purchase</li>
            <li>The platform may remove reviews that violate these rules without notice</li>
          </ul>
          <p>
            By submitting content you grant ReviewHub a worldwide, royalty-free licence to display,
            reproduce, and distribute it on the platform.
          </p>
        </Section>

        <Section title="5. Trust Scores">
          <p>
            Trust scores are produced algorithmically from verified data sources. They represent
            our independent assessment and are not a guarantee of service quality, reliability, or
            suitability. Scores may change as new data becomes available. ReviewHub is not liable
            for decisions made on the basis of trust scores.
          </p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>You may not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempt to manipulate, purchase, or incentivise reviews</li>
            <li>Scrape or systematically extract platform data without permission</li>
            <li>Circumvent security features or attempt unauthorised access</li>
            <li>Use the platform for spam or unsolicited communications</li>
            <li>Impersonate another person or entity</li>
          </ul>
        </Section>

        <Section title="7. Pricing & Payment">
          <p>
            Paid services are subject to the pricing published on the platform at the time of
            purchase. Prices are subject to change with reasonable notice. The platform operates
            under the 5/5 Verified Deal model — full pricing mechanics are disclosed in the About
            page.
          </p>
        </Section>

        <Section title="8. Disclaimers & Liability">
          <p>
            The platform is provided "as is". ReviewHub makes no warranties regarding the
            accuracy, completeness, or fitness for purpose of any content. To the fullest extent
            permitted by law, ReviewHub's liability is limited to the amount you paid for the
            relevant service in the three months preceding the claim.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We may suspend or terminate your account for breach of these terms. You may delete
            your account at any time. Upon termination, your right to use the platform ceases.
            Reviews submitted by you may remain on the platform.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These terms are governed by the laws of the State of Israel. Disputes shall be
            subject to the exclusive jurisdiction of the competent courts in Israel.{" "}
            <strong>The Hebrew version of these terms is the legally binding version.</strong>
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>
          </p>
        </Section>
      </div>
    </div>
  </div>
);

export default TermsEN;

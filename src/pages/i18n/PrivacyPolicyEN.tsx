/**
 * PrivacyPolicyEN.tsx — English version of the Privacy Policy
 * Hebrew is the legally binding version.
 */

import { Shield, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import LegalTranslationNotice from "@/components/LegalTranslationNotice";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
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

const PrivacyPolicyEN = () => (
  <div dir="ltr" className="text-left">
    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="container py-16 md:py-24 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-6 text-primary">
            <Shield size={16} /> Privacy Policy
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Updated: March 10, 2026 · ReviewHub
          </p>
          <p className="text-muted-foreground mt-2">
            We are committed to protecting your privacy. This policy explains what data we collect,
            why, and how you can exercise your rights.
          </p>
        </motion.div>
      </div>
    </section>

    <div className="container py-12 max-w-4xl">
      <LegalTranslationNotice />

      <div className="space-y-10">
        <Section title="1. Introduction & Scope">
          <p>
            ReviewHub ("we", "our", "the platform") is committed to protecting your privacy. This
            policy applies to all users of reviewhub.co.il and complies with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Israeli Privacy Protection Law, 5741-1981 and its regulations</li>
            <li>Privacy Protection Regulations (Information Security), 5777-2017</li>
            <li>EU GDPR Regulation 2016/679 — for users located in the EU</li>
            <li>Israeli Communications Law (regarding cookies)</li>
          </ul>
        </Section>

        <Section title="2. Data We Collect">
          <p className="font-medium text-foreground">Data you provide directly:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full name and email address (on registration)</li>
            <li>Password — stored as a one-way bcrypt hash only</li>
            <li>Reviews you write: text, rating, display name (or "Anonymous")</li>
            <li>Business information (for business owners): name, website, phone, category</li>
            <li>Purchase evidence for verified-review purposes (not stored; only the boolean result is kept)</li>
          </ul>
          <p className="font-medium text-foreground mt-3">Automatically collected data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP address — for security and fraud prevention (deleted after 90 days)</li>
            <li>User-Agent and Referrer — for technical analytics (affiliate links only)</li>
            <li>Session cookies — for authentication (expire on logout or after 30 days)</li>
          </ul>
          <p className="font-medium text-foreground mt-3">Data we do NOT collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Credit card or payment details (handled entirely by payment processors)</li>
            <li>Biometric data</li>
            <li>Location beyond country-level (via IP)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-1">
            <li>Providing and improving the platform services</li>
            <li>Verifying reviews and trust scores</li>
            <li>Security and fraud prevention</li>
            <li>Communicating service updates (transactional emails only)</li>
            <li>Complying with legal obligations</li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal data to third parties.
            We do not use your data for behavioural advertising.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>We use the following third-party processors (data processing agreements in place):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database and authentication hosting (EU region)</li>
            <li><strong>Cloudflare</strong> — CDN, bot protection (CAPTCHA)</li>
            <li>Payment processors — for verified-purchase checks (we receive only the boolean verification result)</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <ul className="list-disc pl-5 space-y-1">
            <li>Account data: retained while account is active + 3 years after deletion</li>
            <li>Reviews: retained indefinitely (public platform data)</li>
            <li>IP logs: deleted after 90 days</li>
            <li>Cookies: session cookies expire on logout; persistent cookies last 30 days</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of your personal data</li>
            <li><strong>Rectification</strong> — correct inaccurate data</li>
            <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten")</li>
            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
            <li><strong>Withdraw consent</strong> — withdraw any consent given at any time</li>
          </ul>
          <p>
            To exercise any right, contact us at{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>. We respond within 30 days.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use strictly necessary cookies for authentication and security, and analytical
            cookies for affiliate link tracking. No advertising cookies are used. You can manage
            cookies in your browser settings.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We employ industry-standard security measures including encryption at rest and in
            transit (TLS 1.2+), bcrypt password hashing, and regular security audits. No system
            is 100% secure; we commit to notifying affected users of any breach within 72 hours
            where required by law.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            The platform is not directed at children under 18. We do not knowingly collect data
            from minors. If you believe we have inadvertently collected such data, please contact
            us immediately.
          </p>
        </Section>

        <Section title="10. Contact & Supervisory Authority">
          <p>
            Privacy questions or complaints:{" "}
            <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
              support@reviewshub.info
            </a>
          </p>
          <p>
            Israeli users may also contact the{" "}
            <a
              href="https://www.gov.il/he/departments/the_privacy_protection_authority"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Protection Authority
            </a>
            . EU users may contact their local data protection authority.
          </p>
        </Section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyEN;

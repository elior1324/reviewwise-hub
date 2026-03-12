// src/components/blocks/features-grid.tsx
//
// ReviewHub "why us" bento feature grid, powered by GlowingEffect.
// Adapts the Aceternity UI GlowingEffectDemo layout for the ReviewHub brand:
//   - Hebrew copy, RTL text direction
//   - Five feature tiles matching ReviewHub's core value props
//   - Bento grid: same responsive 12-column layout from the original demo
//   - Lucide-react icons only (no external icon assets)
//
// Placement: rendered on the Index (homepage) between the Stats strip and
// the TestimonialsSection so it reinforces platform trust before social proof.

import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  ShieldCheck,
  BadgeCheck,
  Search,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Section wrapper ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

export function FeaturesGrid() {
  return (
    <section className="container py-16 md:py-24">
      {/* Heading */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mb-12 text-center"
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4"
        >
          <Sparkles size={15} />
          למה ReviewHub?
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="font-display font-bold text-2xl md:text-4xl text-foreground mb-3"
        >
          הפלטפורמה שבנויה על אמון אמיתי
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-muted-foreground max-w-lg mx-auto"
        >
          כל תכונה תוכננה כדי להגן עליכם, לשפר את חוויית הגלישה ולוודא שכל ביקורת שתראו — אמיתית.
        </motion.p>
      </motion.div>

      {/* Bento grid */}
      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
        {/* ① Large — Verified reviews */}
        <GridItem
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={<ShieldCheck className="h-4 w-4" />}
          title="ביקורות מאומתות בלבד"
          description="כל ביקורת עוברת אימות רכישה. אנחנו מוודאים שהמשתמש אכן שילם לפני שמפרסמים את חוות דעתו — אפס ביקורות מזויפות."
        />

        {/* ② Medium — Trust points */}
        <GridItem
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={<BadgeCheck className="h-4 w-4" />}
          title="נקודות אמון וסטטוס"
          description={
            <>
              כתבו ביקורות והרוויחו <strong>נקודות אמון</strong>, דרגות ותג
              <strong> Verified Reviewer</strong> לאחר אימות רכישה.
              הנקודות הן מוניטין בלבד ללא ערך כספי.
            </>
          }
        />

        {/* ③ Tall — Smart search */}
        <GridItem
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={<Search className="h-4 w-4" />}
          title="חיפוש חכם ומסננים מתקדמים"
          description={
            <>
              מצאו פרילנסרים, קורסים וסדנאות לפי קטגוריה, דירוג, מחיר וקהל יעד.{" "}
              <strong>אלגוריתם החיפוש שלנו</strong> מדרג לפי אמינות הביקורות,
              לא לפי תשלום.
            </>
          }
        />

        {/* ④ Wide — Privacy */}
        <GridItem
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={<Lock className="h-4 w-4" />}
          title="פרטיות ואנונימיות"
          description="בחרו לפרסם ביקורת בשמכם המלא או באנונימיות — הבחירה שלכם. הנתונים שלכם מוצפנים ולעולם לא נמכרים לצד שלישי."
        />

        {/* ⑤ Full-width — UX & accessibility */}
        <GridItem
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={<Sparkles className="h-4 w-4" />}
          title="ממשק נגיש, מהיר ודו-לשוני"
          description="תמיכה מלאה בעברית ב-RTL, ממשק נגיש לפי תקן WCAG 2.1, ותצוגה אופטימלית בכל מכשיר — מובייל, טאבלט ומחשב."
        />
      </ul>
    </section>
  );
}

// ─── GridItem — single bento card ────────────────────────────────────────────

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

function GridItem({ area, icon, title, description }: GridItemProps) {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        {/* Glowing border that tracks the mouse cursor */}
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />

        {/* Card body — must be relative so it layers above the glow */}
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-border/30 bg-background p-6 shadow-sm shadow-black/20 md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            {/* Icon badge */}
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2 text-primary">
              {icon}
            </div>

            {/* Text */}
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-display tracking-tight md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <p className="font-body text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground/80">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

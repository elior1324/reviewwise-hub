// src/components/blocks/features-grid.tsx
//
// ReviewHub "Why ReviewHub?" bento feature grid.
// Five tiles represent the five institutional pillars that distinguish
// ReviewHub from generic review and directory platforms.
//
// Placement: rendered on the Index (homepage) between the Stats strip and
// the TestimonialsSection so it reinforces platform trust before social proof.

import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  ShieldCheck,
  BarChart2,
  Lock,
  BookOpen,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
          <ShieldCheck size={15} />
          תשתית אמון — לא פלטפורמת שיווק
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="font-display font-bold text-2xl md:text-4xl text-foreground mb-3"
        >
          מה שמבדיל אותנו
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-muted-foreground max-w-lg mx-auto"
        >
          ReviewHub בנויה על עקרונות אחרים לחלוטין מאתרי הביקורות המוכרים.
          כל החלטות האדריכלות שלנו נועדו לשמור על אמון — לא להגדיל הכנסות על חשבונו.
        </motion.p>
      </motion.div>

      {/* Bento grid */}
      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">

        {/* ① Large — Verified records only */}
        <GridItem
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={<ShieldCheck className="h-4 w-4" />}
          title="רשומות מאומתות — לא דעות"
          description={
            <>
              כל ביקורת שנספרת בציון האמון קשורה לרכישה ממשית — אומתה מול
              מערכות תשלום, לא על בסיס הצהרה עצמית.{" "}
              <strong>ביקורת ללא הוכחת רכישה מוצגת בנפרד ואינה נספרת.</strong>
            </>
          }
        />

        {/* ② — TrustScore formula */}
        <GridItem
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={<BarChart2 className="h-4 w-4" />}
          title="ציון אמון — לא דירוג כוכבים"
          description={
            <>
              ציון האמון (0–100) מחושב מ-3 מרכיבים:{" "}
              <strong>נפח ביקורות</strong> (40 נק׳),{" "}
              <strong>בריאות החזרים</strong> (35 נק׳),{" "}
              <strong>ותק פעילות</strong> (25 נק׳).
              הנוסחה פתוחה — ניתן לבדוק כל מספר.
            </>
          }
        />

        {/* ③ Tall — Complete independence */}
        <GridItem
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={<Lock className="h-4 w-4" />}
          title="עצמאות מוחלטת"
          description={
            <>
              ציוני האמון <strong>אינם למכירה.</strong>{" "}
              בעל עסק לא יכול לרכוש ציון גבוה יותר, לשלם על מיקום עדיף
              בתוצאות החיפוש, או למחוק ביקורת שלילית.{" "}
              ביקורות מוסרות רק אם הן מפרות כללים מוגדרים ועוברות בדיקה עצמאית.
              <br /><br />
              כאשר קיימים קישורי שותפים, זה מצוין במפורש —
              ציון האמון נשאר בלתי תלוי לחלוטין.
            </>
          }
        />

        {/* ④ Wide — Open methodology */}
        <GridItem
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={<BookOpen className="h-4 w-4" />}
          title="מתודולוגיה פתוחה לציבור"
          description={
            <>
              הנוסחה לחישוב ציון האמון,{" "}
              <strong>כולל כל המרכיבים, משקולות והסבר מלא</strong>,
              מפורסמת ונגישה לכל.{" "}
              אתם יכולים לבדוק בדיוק איך כל מספר מתקבל — ולהחליט בעצמכם.
            </>
          }
          link={{ to: "/about", label: "קראו את המתודולוגיה המלאה" }}
        />

        {/* ⑤ Full-width — Trust-first search */}
        <GridItem
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={<Search className="h-4 w-4" />}
          title="חיפוש ממוקד אמון — לא פרסום"
          description={
            <>
              תוצאות החיפוש מדורגות לפי{" "}
              <strong>ציון אמון ונפח ביקורות מאומתות</strong>,
              לא לפי תשלום. ספק לא יכול לרכוש מיקום בולט יותר
              מאשר ספק עם ציון אמון גבוה יותר — לעולם.
            </>
          }
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
  link?: { to: string; label: string };
}

function GridItem({ area, icon, title, description, link }: GridItemProps) {
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
          <div className="relative flex h-full flex-1 flex-col justify-between gap-3">
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
              {link && (
                <Link
                  to={link.to}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
                >
                  {link.label} ←
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

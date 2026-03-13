// src/components/blocks/testimonials-with-marquee.tsx
//
// Scrolling testimonials strip with continuous marquee animation.
// Source structure from serafimcloud/testimonials-with-marquee, adapted for:
//   - ReviewHub brand (Hebrew, RTL page layout)
//   - Dark-mode design tokens (--background, --muted, --foreground)
//   - RTL-safe marquee: the scroll container uses dir="ltr" so the animation
//     always moves right-to-left visually, regardless of the page direction.
//   - `max-w-container` (1280 px) token added to tailwind.config.ts
//   - `animate-marquee` powered by `var(--duration)` / `var(--gap)` CSS vars
//     (see tailwind.config.ts animation & keyframes extensions).
//
// Usage example (Hebrew):
//
//   <TestimonialsSection
//     title="מה אומרים עלינו?"
//     description="ביקורות אמיתיות ממשתמשים מאומתים"
//     testimonials={REVIEW_HUB_TESTIMONIALS}
//   />

import { cn } from "@/lib/utils";
import {
  TestimonialCard,
  type TestimonialAuthor,
} from "@/components/ui/testimonial-card";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TestimonialsSectionProps {
  title: string;
  description: string;
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-0",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        {/* Heading */}
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight font-display">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl font-body">
            {description}
          </p>
        </div>

        {/* Marquee */}
        {/*
          dir="ltr" on the overflow wrapper ensures the CSS translateX animation
          always moves content visually right-to-left, even though the page is
          set to RTL (dir="rtl" in index.css on <html>).
        */}
        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden"
          dir="ltr"
        >
          <div
            className={cn(
              "group flex overflow-hidden p-2",
              "[--gap:1rem] [gap:var(--gap)]",
              "flex-row [--duration:40s]",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 justify-around [gap:var(--gap)]",
                "animate-marquee flex-row",
                "group-hover:[animation-play-state:paused]",
              )}
            >
              {/* Render 4 copies for a seamless infinite loop */}
              {[0, 1, 2, 3].map((setIndex) =>
                testimonials.map((testimonial, i) => (
                  <TestimonialCard
                    key={`${setIndex}-${i}`}
                    {...testimonial}
                  />
                )),
              )}
            </div>
          </div>

          {/* Edge fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  );
}

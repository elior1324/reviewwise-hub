// src/components/ui/background-paths.tsx
//
// Animated floating SVG path background for the ReviewHub hero section.
// Adapted from the Aceternity UI "background-paths" component:
//
//   Original changes applied for this codebase
//   ─────────────────────────────────────────────────────────────────────────
//   • "use client" removed — Vite/React, not Next.js.
//   • Colors switched to ReviewHub's teal primary (--primary CSS var) instead
//     of slate-950 / white to match the dark design system.
//   • Math.random() replaced with a deterministic index-based duration formula
//     — random values cause hydration mismatches and are unpredictable for
//     automated accessibility testing.
//   • prefers-reduced-motion honoured via framer-motion's useReducedMotion().
//     When the user has enabled "Reduce Motion" in their OS, all path animations
//     are replaced with a static, fully-drawn state (WCAG 2.3.3 / 2.1 AAA).
//   • Decorative SVG elements carry aria-hidden="true" and focusable="false" so
//     screen readers and keyboard navigation skip them entirely (WCAG 1.1.1).
//   • The standalone BackgroundPaths hero wraps its animated h1 with an
//     aria-label equal to the full title string — screen readers read one
//     coherent heading rather than individual animated letters (WCAG 1.3.1).
//   • Each animated letter span is aria-hidden="true" to prevent double-reading.
//   • RTL-compatible: the layout uses logical spacing properties.
//
// Exports
// ───────
//   FloatingPaths   — animated teal line decorations (used behind hero content)
//   BackgroundPaths — self-contained hero section with animated title + CTA

import { useReducedMotion, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── FloatingPaths ─────────────────────────────────────────────────────────────
// Pure decoration: 36 bezier curves that animate along their path length.
// The `position` prop mirrors the curves (pass +1 and -1 for a balanced look).

export function FloatingPaths({
  position,
  className,
}: {
  position: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    // Stroke width grows slightly per index for a layered depth effect
    width: 0.5 + i * 0.03,
  }));

  return (
    // aria-hidden: the entire container is decorative — skip for AT & keyboard
    <div
      className={cn("absolute inset-0 pointer-events-none", className)}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full text-primary"
        viewBox="0 0 696 316"
        fill="none"
        // Both aria-hidden AND focusable="false" are needed for some older
        // screen-reader + browser combinations (WCAG 1.1.1 technique H67).
        aria-hidden="true"
        focusable="false"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            // Opacity gradient: subtler for early paths, more visible later
            strokeOpacity={0.05 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={
              prefersReducedMotion
                ? // Reduced motion: draw paths once, no looping animation
                  { pathLength: 1, opacity: 0.35 }
                : {
                    pathLength: 1,
                    opacity: [0.3, 0.6, 0.3],
                    pathOffset: [0, 1, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    // Deterministic duration (no Math.random): 20–28 s per path
                    duration: 20 + (path.id % 5) * 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}

// ─── BackgroundPaths ───────────────────────────────────────────────────────────
// Self-contained hero section with animated letter title + CTA.
// Use this for standalone pages; on the main Index the FloatingPaths are
// layered directly into the existing hero for maximum flexibility.

interface BackgroundPathsProps {
  /** Main heading — split into words then letters for the spring animation */
  title?: string;
  /** Subtitle shown below the heading */
  subtitle?: string;
  /** Label on the CTA button */
  ctaLabel?: string;
  /** Internal route the CTA button links to */
  ctaHref?: string;
  className?: string;
}

export function BackgroundPaths({
  title = "ReviewHub",
  subtitle = "ביקורות אמיתיות. אמון אמיתי.",
  ctaLabel = "התחילו לחפש",
  ctaHref = "/search",
  className,
}: BackgroundPathsProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = title.split(" ");

  return (
    <div
      className={cn(
        "relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background",
        className,
      )}
    >
      {/* Decorative animated paths — two mirrored layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          {/*
           * Accessibility: the visible content is animated letter-by-letter,
           * which would make a screen reader read each character individually.
           * aria-label on <h1> provides the full, coherent heading string for AT.
           * Each animated child span is aria-hidden so it's skipped.
           */}
          <h1
            aria-label={title}
            className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter font-display"
          >
            {words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="inline-block ms-4 first:ms-0"
                aria-hidden="true"
              >
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={
                      prefersReducedMotion ? false : { y: 100, opacity: 0 }
                    }
                    animate={{ y: 0, opacity: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            delay: wordIndex * 0.1 + letterIndex * 0.03,
                            type: "spring",
                            stiffness: 150,
                            damping: 25,
                          }
                    }
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70"
                    aria-hidden="true"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {subtitle && (
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.6 }
              }
              className="text-muted-foreground text-lg md:text-xl mb-10 font-body"
            >
              {subtitle}
            </motion.p>
          )}

          {/* CTA button */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.9 }
            }
            className="inline-block group relative bg-gradient-to-b from-primary/20 to-primary/5 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Button
              variant="ghost"
              asChild
              className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-background/95 hover:bg-background/100 text-foreground transition-all duration-300 group-hover:-translate-y-0.5 border border-border/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Link to={ctaHref}>
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                  {ctaLabel}
                </span>
                {/* Directional arrow — decorative, hidden from AT */}
                <span
                  className="me-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1.5 transition-all duration-300"
                  aria-hidden="true"
                >
                  ←
                </span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

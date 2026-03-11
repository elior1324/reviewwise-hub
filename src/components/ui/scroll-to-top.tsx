/**
 * ScrollToTopButton
 *
 * A floating action button that:
 *  • Appears after the user scrolls > 200 px
 *  • Smoothly scrolls to the top of the page when clicked
 *  • Uses the site's primary color + shadow/hover system
 *  • Respects `prefers-reduced-motion` — falls back to instant scroll
 *  • Is globally mounted once in App.tsx (works on every page)
 */
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCROLL_THRESHOLD = 200; // px before the button appears

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  // ── Track scroll position ────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    // Passive listener — does not block scrolling
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Smooth scroll to top ─────────────────────────────────────────────────
  const scrollToTop = () => {
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "instant" : "smooth",
    });
  };

  // ── Render — fully hidden (not just invisible) when above threshold ──────
  if (!visible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      aria-label="חזרה לראש הדף"
      className={[
        // Position
        "fixed bottom-6 left-6 z-50",
        // Shape
        "rounded-full",
        // Size
        "h-11 w-11",
        // Colors — matches site primary (teal-green)
        "bg-primary text-primary-foreground",
        // Elevation
        "shadow-lg shadow-primary/25",
        // Hover / active
        "hover:scale-110 hover:shadow-xl hover:shadow-primary/35",
        "active:scale-95",
        // Entrance animation
        "animate-in fade-in zoom-in-75 duration-200",
        // Smooth transition for everything else
        "transition-all duration-200",
      ].join(" ")}
    >
      <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
    </Button>
  );
};

export default ScrollToTopButton;

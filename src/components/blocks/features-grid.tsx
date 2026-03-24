// src/components/blocks/features-grid.tsx
//
// Minimal trust pillars strip — compact version of the original bento grid.
// Preserves the glowing card aesthetic in a single horizontal row.

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ShieldCheck, Lock, Search } from "lucide-react";

const PILLARS = [
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "ביקורות מאומתות",
    desc: "ביקורות מאומתות קשורות לרכישה ממשית ונספרות בציון האמון. ביקורות קהילה מוצגות בנפרד.",
  },
  {
    icon: <Lock className="h-4 w-4" />,
    title: "ציון אמון עצמאי",
    desc: "ציונים אינם למכירה. בעל עסק לא יכול לרכוש ציון גבוה או למחוק ביקורת שלילית.",
  },
  {
    icon: <Search className="h-4 w-4" />,
    title: "חיפוש לפי אמון",
    desc: "תוצאות מדורגות לפי ציון אמון ונפח ביקורות — לא לפי תשלום או פרסום.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="container py-12">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map((p) => (
          <li key={p.title} className="list-none">
            <div className="relative h-full rounded-2xl border-[0.75px] border-border p-2">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative flex flex-col gap-3 rounded-xl border-[0.75px] border-border/30 bg-background p-5 shadow-sm shadow-black/20">
                <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2 text-primary">
                  {p.icon}
                </div>
                <h3 className="font-display font-bold text-foreground text-base">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

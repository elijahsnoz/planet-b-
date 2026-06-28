"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Dark Becomes Light (docs/experience/03 S5) — the Hope passage warms from
 * near-black to paper as the visitor scrolls through it; dust drifts upward.
 * Reduced-motion: a static warm surface, no scroll choreography.
 */
export function HopeShift({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bg = useTransform(scrollYProgress, [0, 0.5, 1], ["#0b0b0c", "#7a5c3e", "#f6f3ec"]);
  const color = useTransform(scrollYProgress, [0, 0.45, 0.7], ["#f6f3ec", "#f6f3ec", "#0b0b0c"]);

  if (reduce) {
    return <section className="bg-paper text-ink">{children}</section>;
  }

  return (
    <motion.section ref={ref} style={{ backgroundColor: bg, color }} className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[...Array(14)].map((_, i) => (
          <Dust key={i} index={i} progress={scrollYProgress} />
        ))}
      </div>
      <div className="relative">{children}</div>
    </motion.section>
  );
}

function Dust({ index, progress }: { index: number; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const left = (index * 67) % 100;
  const y = useTransform(progress, [0, 1], [40, -120]);
  const opacity = useTransform(progress, [0, 0.4, 1], [0, 0.18, 0]);
  return (
    <motion.span
      style={{ left: `${left}%`, y, opacity }}
      className="absolute bottom-0 block h-1 w-1 rounded-full bg-paper"
    />
  );
}

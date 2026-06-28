"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * The Watch Ticks Once (docs/experience/03 S4) — urgency at the Reflection beat.
 * A damaged watch; its hand jumps a single second as it enters view, then stills.
 */
export function TickingWatch({ size = 56 }: { size?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const tick = inView && !reduce;
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden className="text-accent">
      <circle cx="50" cy="50" r="34" strokeWidth={3} opacity={0.7} />
      {/* a crack, for "damaged" */}
      <path d="M50 16 L54 30 L46 40" strokeWidth={1.5} opacity={0.5} />
      {/* hour hand */}
      <line x1="50" y1="50" x2="50" y2="30" strokeWidth={3} strokeLinecap="round" />
      {/* second hand — ticks once */}
      <motion.line
        x1="50" y1="54" x2="68" y2="50"
        strokeWidth={2} strokeLinecap="round"
        style={{ originX: "50px", originY: "50px" }}
        initial={{ rotate: 0 }}
        animate={{ rotate: tick ? 6 : 0 }}
        transition={{ duration: 0.12, ease: "linear" }}
      />
      <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The doorway between rooms.
 *
 * A `template` re-mounts on every navigation (unlike a `layout`, which persists),
 * so it is the right seam for a route transition. When a visitor moves from one
 * room of the institution to another, the arriving content settles in with a slow,
 * decelerating rise — the same "inevitable" curve the rest of the site uses — so a
 * navigation reads as walking through a doorway, not a hard page swap. The header
 * and footer live in the layout and stay put: the building's frame is constant,
 * only the room changes.
 *
 * Discipline:
 * - The FIRST paint (the initial server-rendered arrival) is never animated, so
 *   Largest Contentful Paint is never delayed and there is no hydration mismatch.
 *   `hasEntered` is only ever set on the client, so SSR always renders the still
 *   version.
 * - prefers-reduced-motion yields entirely — content appears instantly.
 * - Motion is opacity + transform only (compositor-safe, no layout shift).
 */
let hasEntered = false;

export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const animate = hasEntered && !reduce;

  useEffect(() => {
    hasEntered = true;
  }, []);

  if (!animate) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

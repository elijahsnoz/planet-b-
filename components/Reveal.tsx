"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The Reveal — content rises + fades in once on enter (docs/06).
 * Honors prefers-reduced-motion: under reduce it renders instantly, no transform.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      // The site's motion language: a slow, decelerating arrival — content doesn't
      // "animate in", it settles as though it was always going to be there. Same
      // curve as the Passport's rise, so every reveal feels of one inevitable piece.
      transition={{ duration: 0.68, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

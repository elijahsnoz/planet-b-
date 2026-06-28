"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/**
 * The Eye — the soul of Planet B (docs/experience/06).
 * Breathes, opens on arrival, and (on fine pointers) the pupil drifts toward
 * movement before re-centering. Collapses to a still, open mark under
 * prefers-reduced-motion. One color (currentColor).
 */
export function AliveEye({
  size = 132,
  watch = true,
  openOnMount = true,
  className,
  title = "Planet B",
}: {
  size?: number;
  watch?: boolean;
  openOnMount?: boolean;
  className?: string;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!openOnMount || !!reduce);
  const ref = useRef<SVGSVGElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const dx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const dy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduce) {
      setOpen(true);
      return;
    }
    const t = setTimeout(() => setOpen(true), openOnMount ? 500 : 0);
    return () => clearTimeout(t);
  }, [reduce, openOnMount]);

  useEffect(() => {
    if (!watch || reduce) return;
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const ang = Math.atan2(e.clientY - cy, e.clientX - cx);
        const dist = Math.min(6, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
        px.set(Math.cos(ang) * dist);
        py.set(Math.sin(ang) * dist);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [watch, reduce, px, py]);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={`${reduce ? "" : "pb-breath"} ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      {/* eye outline (almond) */}
      <path d="M6 50 C 28 22, 72 22, 94 50 C 72 78, 28 78, 6 50 Z" />
      {/* iris + pupil group: opens by scaling vertically, then the pupil watches */}
      <motion.g
        style={{ originX: "50px", originY: "50px" }}
        initial={false}
        animate={{ scaleY: open ? 1 : 0.04, opacity: open ? 1 : 0.3 }}
        transition={{ duration: reduce ? 0 : 1.2, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <circle cx="50" cy="50" r="17" />
        <line x1="50" y1="50" x2="44" y2="35" />
        <motion.circle cx="50" cy="50" r="3.4" fill="currentColor" stroke="none" style={{ x: dx, y: dy }} />
      </motion.g>
    </svg>
  );
}

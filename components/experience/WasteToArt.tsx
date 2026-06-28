"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/**
 * Waste Becomes Art (docs/experience/03 S2, 04 frame 2). As the visitor
 * descends, scattered fragments converge while the artwork resolves into being.
 * Reduced-motion: a still artwork with its caption (no scroll choreography).
 */
const SHARD_COLORS = ["#7A5C3E", "#9B978E", "#6E1414", "#2FA36B", "#E7E2D7", "#7A5C3E", "#9B978E", "#6E1414", "#2FA36B", "#E7E2D7", "#7A5C3E", "#9B978E"];

function Shard({ progress, index, total, color }: { progress: MotionValue<number>; index: number; total: number; color: string }) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 120 + (index % 5) * 42;
  const sx = Math.cos(angle) * radius;
  const sy = Math.sin(angle) * radius * 0.7;
  const x = useTransform(progress, [0, 0.85], [sx, 0]);
  const y = useTransform(progress, [0, 0.85], [sy, 0]);
  const opacity = useTransform(progress, [0, 0.1, 0.7], [0, 0.85, 0]);
  const rotate = useTransform(progress, [0, 1], [index * 24, index * 24 + 140]);
  return (
    <motion.span
      aria-hidden
      style={{ x, y, opacity, rotate, color }}
      className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 block h-3 w-3 rounded-[1px] bg-current"
    />
  );
}

export function WasteToArt({ image, alt, title, artist }: { image: string; alt: string; title: string; artist?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const artOpacity = useTransform(scrollYProgress, [0.15, 0.85], [0, 1]);
  const artScale = useTransform(scrollYProgress, [0.15, 1], [0.92, 1]);
  const captionOpacity = useTransform(scrollYProgress, [0.7, 0.95], [0, 1]);

  if (reduce) {
    return (
      <section className="mx-auto max-w-container px-5 py-24 text-center">
        <div className="relative mx-auto aspect-square max-w-xl overflow-hidden rounded-sm shadow-museum-soft">
          <Image src={image} alt={alt} fill sizes="(max-width:768px) 100vw, 36rem" className="object-cover" />
        </div>
        <p className="mt-5 font-display text-2xl">{title}</p>
        {artist && <p className="text-sm text-text-muted">{artist}</p>}
        <p className="mx-auto mt-2 max-w-md text-text-muted">What the world threw away. Look closer.</p>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative h-[240vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-5">
        <div className="pointer-events-none absolute inset-0">
          {SHARD_COLORS.map((c, i) => (
            <Shard key={i} progress={scrollYProgress} index={i} total={SHARD_COLORS.length} color={c} />
          ))}
        </div>

        <motion.div
          style={{ opacity: artOpacity, scale: artScale }}
          className="relative aspect-square w-[min(80vw,34rem)] overflow-hidden rounded-sm shadow-museum-soft"
        >
          <Image src={image} alt={alt} fill sizes="(max-width:768px) 80vw, 34rem" className="object-cover" />
        </motion.div>

        <motion.div style={{ opacity: captionOpacity }} className="relative mt-6 text-center">
          <p className="font-display text-2xl">{title}</p>
          {artist && <p className="text-sm text-text-muted">{artist}</p>}
        </motion.div>
      </div>
    </div>
  );
}

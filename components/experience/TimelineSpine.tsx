"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * The documentary backbone (Chapter blueprint Scene C). A vertical spine whose
 * accent line "writes itself" as the visitor descends, and whose nodes fill in
 * as each phase enters view. Motion is transform/opacity only (compositor-safe).
 * Reduced-motion: a static, complete, fully legible ordered list with filled nodes.
 */
type Entry = { order: number; phase: string | null; date: string | null; title: string; description: string | null };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function TimelineSpine({ entries }: { entries: Entry[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 75%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative ml-1.5">
      {/* the spine */}
      <span aria-hidden className="absolute bottom-2 left-0 top-2 w-px bg-border" />
      {/* the progress line — writes itself on descent (scaleY only) */}
      {!reduce && (
        <motion.span
          aria-hidden
          style={{ scaleY: fill }}
          className="absolute bottom-2 left-0 top-2 w-px origin-top bg-accent"
        />
      )}
      <ol>
      {entries.map((e) => (
        <li key={e.order} className="relative pb-14 pl-9 last:pb-0">
          {/* node — a ring that fills as the phase enters view */}
          <span aria-hidden className="absolute -left-[5px] top-1 grid h-3 w-3 place-items-center rounded-full border border-accent bg-bg">
            {reduce ? (
              <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
            ) : (
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-accent"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-35% 0px -35% 0px" }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              />
            )}
          </span>

          {reduce ? (
            <Row entry={e} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
            >
              <Row entry={e} />
            </motion.div>
          )}
        </li>
      ))}
      </ol>
    </div>
  );
}

function Row({ entry }: { entry: Entry }) {
  return (
    <>
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-muted">
        {String(entry.order).padStart(2, "0")} · {entry.phase}
        {entry.date ? ` · ${formatDate(entry.date)}` : ""}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-snug tracking-[-0.01em] sm:text-[1.7rem]">{entry.title}</h3>
      <p className="mt-2 max-w-measure leading-relaxed text-text-muted">{entry.description}</p>
    </>
  );
}

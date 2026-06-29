"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PassportCover, type PassportHolder } from "./PassportCover";

type Stat = { label: string; value: string; sub: string };

/**
 * "One Identity. A Lifetime of Contribution." — the homepage's quiet, premium
 * invitation. A single Planet Passport rises from darkness as though lit in a
 * vitrine; the visitor sees it through glass but cannot open it here. The aim is
 * desire, not disclosure. Compositor-only motion (opacity/transform), fully
 * reduced-motion safe.
 */
export function PassportInvitation({
  holder,
  href,
  stats,
}: {
  holder: PassportHolder;
  href: string;
  stats: Stat[];
}) {
  const reduce = useReducedMotion();

  return (
    <section
      data-theme="ink"
      className="relative overflow-hidden bg-bg px-5 py-32 text-text sm:py-40"
    >
      {/* the museum light — a soft pool that resolves behind the vitrine */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(246,243,236,0.10), rgba(246,243,236,0.03) 55%, transparent 75%)",
        }}
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 1.6, ease: [0.22, 0.61, 0.36, 1] }}
      />

      <div className="relative mx-auto flex max-w-container flex-col items-center text-center">
        <motion.p
          className="text-[0.7rem] uppercase tracking-[0.4em] text-text-muted"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        >
          The Planet Passport
        </motion.p>
        <motion.h2
          className="mt-6 max-w-3xl font-display text-4xl leading-[1.06] tracking-[-0.015em] sm:text-6xl"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay: 0.05 }}
        >
          One identity.
          <br className="hidden sm:block" /> A lifetime of contribution.
        </motion.h2>

        {/* the vitrine — passport rising from the dark, seen through glass */}
        <motion.div
          className="group relative mt-16 w-[min(76vw,21rem)]"
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.965 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
        >
          <Link
            href={href}
            aria-label={`Explore the Planet Passport of ${holder.name}`}
            className="block rounded-[7px] outline-none transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:ring-2 focus-visible:ring-paper/60 motion-safe:hover:-translate-y-1"
          >
            <PassportCover holder={holder} />
            {/* the glass — a single diagonal sheen across the vitrine */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[7px] opacity-70 transition-opacity duration-700 group-hover:opacity-40"
              style={{
                background:
                  "linear-gradient(125deg, transparent 38%, rgba(246,243,236,0.10) 47%, transparent 56%)",
              }}
            />
          </Link>
          {/* the verified mark, set on the glass like a museum tag */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-verified">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-verified"
              aria-hidden
            />
            Verified · Permanent
          </div>
        </motion.div>

        <motion.p
          className="mt-12 max-w-xl text-pretty text-base leading-relaxed text-text-muted sm:text-lg"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        >
          Every verified contributor receives a permanent Planet Passport that
          grows throughout their lifetime.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1], delay: 0.05 }}
        >
          <Link
            href={href}
            className="mt-8 inline-flex items-center gap-2 rounded-sm border border-paper/25 px-6 py-3 text-sm tracking-wide text-paper transition-all duration-300 hover:border-paper/60 hover:-translate-y-0.5"
          >
            Explore the Planet Passport
            <span aria-hidden>→</span>
          </Link>
        </motion.div>

        {/* live institutional indicators — quiet, and they grow with the movement */}
        <dl className="mt-20 grid w-full max-w-2xl grid-cols-1 gap-y-10 border-t border-border pt-12 sm:grid-cols-3 sm:gap-x-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-[0.62rem] uppercase tracking-[0.32em] text-text-muted">
                {s.label}
              </dt>
              <dd className="mt-3 font-mono text-2xl tracking-[0.12em] text-text">
                {s.value}
              </dd>
              <dd className="mt-1 text-xs text-text-muted">{s.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

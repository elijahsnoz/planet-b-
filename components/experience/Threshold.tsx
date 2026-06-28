import { AliveEye } from "./AliveEye";
import { Reveal } from "@/components/Reveal";

/**
 * The Threshold (docs/experience/04, frames 0–1). The sacred arrival: darkness,
 * the Eye, one line. No nav, no chrome — the movement dominates, not the interface.
 */
export function Threshold() {
  return (
    <section
      data-theme="ink"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bg px-5 text-center text-text"
    >
      {/* faint atmospheric depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(123,92,62,0.10), transparent 70%), radial-gradient(40% 30% at 50% 80%, rgba(110,20,20,0.10), transparent 70%)",
        }}
      />
      <AliveEye size={140} className="relative text-accent" />

      <Reveal delay={0.9}>
        <h1 className="relative mt-12 max-w-3xl font-display text-4xl leading-[1.1] sm:text-6xl">
          Because there is no Planet&nbsp;B.
        </h1>
      </Reveal>

      <Reveal delay={1.4}>
        <p className="relative mt-6 max-w-md text-sm text-text-muted">
          The living archive of a global movement.
        </p>
      </Reveal>

      <span
        aria-hidden
        className="absolute bottom-8 flex flex-col items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-text-muted"
      >
        descend
        <span className="block h-8 w-px bg-current opacity-40" />
      </span>
    </section>
  );
}

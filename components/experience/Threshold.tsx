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
      {/* faint atmospheric depth — settles up once on arrival (the room "comes up") */}
      <div
        aria-hidden
        className="pb-settle pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(123,92,62,0.10), transparent 70%), radial-gradient(40% 30% at 50% 80%, rgba(110,20,20,0.10), transparent 70%)",
        }}
      />
      <AliveEye size={140} className="relative text-accent" />

      {/* The moment. The Eye settles, a held beat, then the line rises slowly and
          inevitably, and only then the quiet whisper beneath it. The pauses are the
          point — this is meant to be remembered, not read. */}
      <Reveal delay={1.1}>
        <h1 className="relative mt-14 max-w-3xl pb-display-1 font-display leading-[1.12] tracking-[-0.015em] sm:mt-16">
          Because there is no Planet&nbsp;B.
        </h1>
      </Reveal>

      <Reveal delay={1.9}>
        <p className="relative mt-7 max-w-md text-[0.95rem] leading-relaxed tracking-[0.01em] text-text-muted">
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

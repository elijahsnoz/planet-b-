import { PassportSeal } from "./PassportSeal";

export type PassportHolder = {
  passportId: string;
  name: string;
  /** A short, curated role line (e.g. "Founder · Genesis Contributor"). */
  line: string;
  genesis?: boolean;
};

/**
 * The closed Planet Passport — the booklet cover as a physical object: deep
 * oxblood board, blind-embossed seal and wordmark, a bearer plate at the foot.
 * Presentational and server-safe; reused as the homepage preview and as the
 * document's closed (pre-opening) state. The foil is monochrome (paper on
 * oxblood) — disciplined blind-emboss, not gilt.
 */
export function PassportCover({
  holder,
  className,
}: {
  holder: PassportHolder;
  className?: string;
}) {
  return (
    <div
      className={`relative flex aspect-[5/7] w-full flex-col items-center overflow-hidden rounded-[7px] px-7 pb-7 pt-9 text-paper ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(160deg, #2a0f0f 0%, #1c0a0a 42%, #120708 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(246,243,236,0.10), inset 0 0 0 1px rgba(246,243,236,0.06), 0 30px 60px -24px rgba(0,0,0,0.65)",
      }}
    >
      {/* inner diplomatic keyline */}
      <div
        className="pointer-events-none absolute inset-3 rounded-[4px]"
        style={{ border: "1px solid rgba(246,243,236,0.14)" }}
      />
      {/* faint grain / sheen so it reads as boarded leather, not flat fill */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(246,243,236,0.08), transparent 55%)",
        }}
      />

      <p className="z-10 text-center text-[0.62rem] uppercase tracking-[0.42em] text-paper/70">
        Planet&nbsp;B
      </p>

      <div className="z-10 mt-auto flex flex-col items-center">
        <PassportSeal size={132} className="text-paper/90" />
        <h3 className="mt-5 font-display text-[1.7rem] leading-none tracking-[0.16em] text-paper">
          PLANET&nbsp;PASSPORT
        </h3>
        <p className="mt-2 text-[0.58rem] uppercase tracking-[0.34em] text-paper/55">
          Lifelong record of contribution
        </p>
      </div>

      {/* bearer plate — embossed at the foot, as on a diplomatic document */}
      <div className="z-10 mt-auto w-full">
        <div
          className="rounded-[3px] px-4 py-3 text-center"
          style={{
            background: "rgba(246,243,236,0.05)",
            border: "1px solid rgba(246,243,236,0.12)",
          }}
        >
          <p className="font-mono text-[0.62rem] tracking-[0.28em] text-paper/65">
            {holder.passportId}
          </p>
          <p className="mt-1.5 font-display text-lg leading-tight text-paper">
            {holder.name}
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.24em] text-paper/60">
            {holder.line}
          </p>
        </div>
      </div>
    </div>
  );
}

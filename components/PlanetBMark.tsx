/**
 * Planet B — "The Eye-World" mark (Logo Concept A, docs/08).
 * One symbol, four meanings: an eye (awareness), a planet (the iris/world),
 * a clock near midnight (the meridian = urgency), made watchful.
 * Single-color (currentColor), scales from favicon to building. Pure SVG (server-safe).
 */
export function PlanetBMark({
  size = 40,
  className,
  title = "Planet B",
  animated = false,
}: {
  size?: number;
  className?: string;
  title?: string;
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      {/* eye outline (almond) — drawn as two arcs meeting at the corners */}
      <path d="M6 50 C 28 22, 72 22, 94 50 C 72 78, 28 78, 6 50 Z" />
      {/* iris = the planet */}
      <circle cx="50" cy="50" r="17" />
      {/* meridian / clock-hand pointing to ~11:55 — the world being watched, time almost out */}
      <line x1="50" y1="50" x2="44" y2="35" />
      {/* pupil */}
      <circle cx="50" cy="50" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

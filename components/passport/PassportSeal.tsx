/**
 * The Passport Seal — the Planet B Eye raised into a diplomatic/institutional
 * emblem. Two concentric rings carry arced text ("PLANET B · PLANET PASSPORT"
 * above, "BECAUSE THERE IS NO PLANET B" below); at the centre is the Eye
 * ([[eye-global-motion-system]]). One colour (currentColor), pure SVG —
 * server-safe and scales from a preview chip to a printed credential.
 */
export function PassportSeal({
  size = 132,
  className,
  title = "Planet B — official seal",
  ring = true,
}: {
  size?: number;
  className?: string;
  title?: string;
  /** Without the ring it is just the bare Eye emblem (tighter contexts). */
  ring?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>

      {ring && (
        <g>
          <circle cx="100" cy="100" r="96" strokeWidth={1.25} opacity={0.55} />
          <circle cx="100" cy="100" r="84" strokeWidth={1} opacity={0.35} />

          {/* arc guides for the seal lettering (never drawn) */}
          <defs>
            <path id="pb-seal-top" d="M 38.8 53.7 A 72 72 0 0 1 161.2 53.7" />
            <path id="pb-seal-bottom" d="M 38.8 146.3 A 72 72 0 0 0 161.2 146.3" />
          </defs>

          <text
            fill="currentColor"
            stroke="none"
            fontSize="11"
            letterSpacing="3.4"
            style={{ fontFamily: "var(--pb-font-text)", textTransform: "uppercase" }}
            opacity={0.85}
          >
            <textPath href="#pb-seal-top" startOffset="50%" textAnchor="middle">
              Planet&nbsp;B · Planet&nbsp;Passport
            </textPath>
          </text>
          <text
            fill="currentColor"
            stroke="none"
            fontSize="8.5"
            letterSpacing="2.6"
            style={{ fontFamily: "var(--pb-font-text)", textTransform: "uppercase" }}
            opacity={0.6}
          >
            <textPath href="#pb-seal-bottom" startOffset="50%" textAnchor="middle">
              Because there is no Planet&nbsp;B
            </textPath>
          </text>

          {/* flanking stars where the two arcs meet */}
          <g fill="currentColor" stroke="none" opacity={0.55}>
            <circle cx="33" cy="100" r="1.6" />
            <circle cx="167" cy="100" r="1.6" />
          </g>
        </g>
      )}

      {/* The Eye — awareness, a planet for an iris, a meridian near midnight */}
      <g transform="translate(100 100) scale(0.62) translate(-50 -50)">
        <path d="M6 50 C 28 22, 72 22, 94 50 C 72 78, 28 78, 6 50 Z" strokeWidth={5} />
        <circle cx="50" cy="50" r="17" strokeWidth={5} />
        <line x1="50" y1="50" x2="44" y2="35" strokeWidth={5} />
        <circle cx="50" cy="50" r="3.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

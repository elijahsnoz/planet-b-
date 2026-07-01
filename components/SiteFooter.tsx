import Link from "next/link";
import { PlanetBMark } from "./PlanetBMark";

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Archive",
    links: [
      { href: "/chapters/abuja-2026", label: "Genesis Chapter" },
      { href: "/artists", label: "Artist Registry" },
      { href: "/artworks", label: "Artwork Registry" },
      { href: "/partners", label: "Partners" },
    ],
  },
  {
    title: "Institution",
    links: [
      { href: "/founders-letter", label: "Founder’s Letter" },
      { href: "/origin", label: "Origin Story" },
      { href: "/research", label: "Research" },
      { href: "/certificates", label: "Certificates" },
      { href: "/press", label: "Press" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="pb-safe-b mt-32 border-t border-border bg-bg sm:mt-44">
      <div className="mx-auto grid max-w-container-wide gap-12 px-5 py-20 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-16 sm:py-28">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <PlanetBMark size={28} />
            <span className="font-display text-lg tracking-[0.08em] text-text">PLANET&nbsp;B</span>
          </div>
          <p className="mt-5 max-w-measure text-sm leading-relaxed text-text-muted">
            The living archive of the movement <em>Because There Is No Planet B</em>.
            Planet B is humanity&rsquo;s Plan&nbsp;B for protecting the only planet we have.
          </p>
        </div>
        {SECTIONS.map((s) => (
          <nav key={s.title} aria-label={s.title}>
            <h2 className="font-display text-sm text-text-muted">{s.title}</h2>
            <ul className="mt-1 sm:mt-2">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-[44px] items-center text-[0.95rem] text-text transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-container-wide px-5 py-7 text-xs text-text-muted">
          Genesis Chapter — Abuja, World Environment Day, 5 June 2026 · Royal Norwegian Embassy &amp; Nike Art Gallery
        </p>
      </div>
    </footer>
  );
}

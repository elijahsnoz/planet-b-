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
    <footer className="mt-24 border-t border-border bg-bg">
      <div className="mx-auto grid max-w-container-wide gap-10 px-5 py-14 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <PlanetBMark size={32} />
            <span className="font-display text-xl tracking-wide text-text">PLANET&nbsp;B</span>
          </div>
          <p className="mt-4 max-w-measure text-sm text-text-muted">
            The living archive of the movement <em>Because There Is No Planet B</em>.
            Planet B is humanity&rsquo;s Plan&nbsp;B for protecting the only planet we have.
          </p>
        </div>
        {SECTIONS.map((s) => (
          <nav key={s.title} aria-label={s.title}>
            <h2 className="font-display text-sm text-text-muted">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-text transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-container-wide px-5 py-5 text-xs text-text-muted">
          Genesis Chapter — Abuja, World Environment Day, 5 June 2026 · Royal Norwegian Embassy &amp; Nike Art Gallery
        </p>
      </div>
    </footer>
  );
}

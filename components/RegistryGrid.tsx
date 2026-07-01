import Link from "next/link";
import { Plate } from "./Plate";
import { Reveal } from "./Reveal";

export interface RegistryItem {
  href: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image: string | null;
  imageAlt: string;
}

/**
 * RegistryGrid — the one filterable index template (docs/12) used by Artists,
 * Artworks and People. Filtering is added in a later phase; the card grid is the core.
 */
export function RegistryGrid({ items }: { items: RegistryItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-y-24 sm:grid-cols-2 sm:gap-x-14 sm:gap-y-28 lg:gap-x-24 lg:gap-y-36">
      {items.map((item, i) => (
        <Reveal as="li" key={item.href} delay={(i % 2) * 0.08}>
          <Link href={item.href} className="group block">
            <Plate src={item.image} alt={item.imageAlt} fit="contain" />
            <div className="mt-6">
              {item.eyebrow && (
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-text-muted">{item.eyebrow}</p>
              )}
              <h3 className="mt-2 font-display text-2xl leading-tight text-text transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-1.5 text-sm text-text-muted">{item.subtitle}</p>
              )}
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

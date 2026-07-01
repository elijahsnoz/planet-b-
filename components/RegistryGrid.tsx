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
    <ul className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-20 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-24">
      {items.map((item, i) => (
        <Reveal as="li" key={item.href} delay={(i % 3) * 0.06}>
          <Link href={item.href} className="group block">
            <Plate src={item.image} alt={item.imageAlt} fit="contain" />
            <div className="mt-5">
              {item.eyebrow && (
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-text-muted">{item.eyebrow}</p>
              )}
              <h3 className="mt-1.5 font-display text-xl leading-tight text-text transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-1 text-sm text-text-muted">{item.subtitle}</p>
              )}
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

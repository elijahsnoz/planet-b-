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
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <Reveal as="li" key={item.href} delay={(i % 3) * 0.06}>
          <Link href={item.href} className="group block">
            <Plate src={item.image} alt={item.imageAlt} fit="contain" />
            <div className="mt-3">
              {item.eyebrow && (
                <p className="text-xs uppercase tracking-wide text-text-muted">{item.eyebrow}</p>
              )}
              <h3 className="font-display text-xl text-text transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-text-muted">{item.subtitle}</p>
              )}
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

import type { Metadata } from "next";
import { RegistryGrid, type RegistryItem } from "@/components/RegistryGrid";
import { Reveal } from "@/components/Reveal";
import { getArtworks, artworkImage, getPerson } from "@/lib/data";

export const metadata: Metadata = {
  title: "Artwork Registry",
  description: "The founding artworks of the Genesis Chapter — discarded materials transformed.",
};

export default function ArtworksPage() {
  const items: RegistryItem[] = getArtworks().map((a) => {
    const artist = getPerson(a.artist);
    return {
      href: `/artworks/${a.slug}`,
      title: a.title,
      subtitle: artist?.full_name,
      eyebrow: a.medium,
      image: artworkImage(a.slug),
      imageAlt: `${a.title}${artist ? ` by ${artist.full_name}` : ""}`,
    };
  });

  return (
    <div className="mx-auto max-w-container px-5 py-24 sm:py-32">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Genesis Chapter · Abuja 2026</p>
        <h1 className="mt-4 pb-display-2 font-display">Artwork Registry</h1>
        <p className="pb-read mt-5 max-w-measure leading-relaxed text-text-muted">
          Discarded plastics, drink cans, dead electronics, tailors&rsquo; offcuts — given new
          meaning. Every work is an assemblage made in 2026.
        </p>
      </Reveal>
      <div className="mt-16 sm:mt-24">
        <RegistryGrid items={items} />
      </div>
    </div>
  );
}

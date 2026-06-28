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
    <div className="mx-auto max-w-container-wide px-5 py-14">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-text-muted">Genesis Chapter · Abuja 2026</p>
        <h1 className="mt-2 font-display text-5xl">Artwork Registry</h1>
        <p className="mt-3 max-w-measure text-text-muted">
          Discarded plastics, drink cans, dead electronics, tailors&rsquo; offcuts — given new
          meaning. Every work is a 61×61cm assemblage made in 2026.
        </p>
      </Reveal>
      <div className="mt-12">
        <RegistryGrid items={items} />
      </div>
    </div>
  );
}

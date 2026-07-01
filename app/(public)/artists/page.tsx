import type { Metadata } from "next";
import { RegistryGrid, type RegistryItem } from "@/components/RegistryGrid";
import { Reveal } from "@/components/Reveal";
import { artworkImage, getFoundingArtists, getArtwork, pendingArtist } from "@/lib/data";

export const metadata: Metadata = {
  title: "Artist Registry",
  description: "The founding artists of the Genesis Chapter — Abuja, 2026.",
};

export default function ArtistsPage() {
  const items: RegistryItem[] = getFoundingArtists().map((p) => {
    const aw = p.artworks?.[0] ? getArtwork(p.artworks[0]) : undefined;
    return {
      href: `/artists/${p.slug}`,
      title: p.full_name,
      subtitle: aw?.title,
      eyebrow: "Founding Artist",
      image: p.artworks?.[0] ? artworkImage(p.artworks[0]) : null,
      imageAlt: `${p.full_name}${aw ? ` — ${aw.title}` : ""}`,
    };
  });

  return (
    <div className="mx-auto max-w-container px-5 py-24 sm:py-32">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Genesis Chapter · Abuja 2026</p>
        <h1 className="mt-4 pb-display-2 font-display">Artist Registry</h1>
        <p className="pb-read mt-5 max-w-measure leading-relaxed text-text-muted">
          The founding artists of the movement. Each is preserved as a permanent record — a museum
          subject, not a profile card.
        </p>
      </Reveal>
      <div className="mt-16 sm:mt-24">
        <RegistryGrid items={items} />
      </div>
      {pendingArtist && (
        <Reveal>
          <p className="mt-12 max-w-measure border-l-2 border-accent pl-4 text-sm text-text-muted">
            <strong className="text-text">The fifteenth founding artist.</strong>{" "}
            {pendingArtist.reason}
          </p>
        </Reveal>
      )}
    </div>
  );
}

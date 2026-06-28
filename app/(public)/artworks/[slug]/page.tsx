import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExhibitLayout } from "@/components/ExhibitLayout";
import { getArtworks, artworkImage, getArtwork, getPerson } from "@/lib/data";

export function generateStaticParams() {
  return getArtworks().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const art = getArtwork(params.slug);
  if (!art) return { title: "Artwork not found" };
  const artist = getPerson(art.artist);
  return {
    title: art.title,
    description: `${art.title}${artist ? ` by ${artist.full_name}` : ""} — ${art.medium}, ${art.dimensions}, ${art.year}.`,
  };
}

export default function ArtworkRecord({ params }: { params: { slug: string } }) {
  const art = getArtwork(params.slug);
  if (!art) notFound();
  const artist = getPerson(art.artist);

  return (
    <ExhibitLayout
      backHref="/artworks"
      backLabel="Artwork Registry"
      eyebrow={art.medium}
      title={art.title}
      image={artworkImage(art.slug)}
      imageAlt={`${art.title}${artist ? ` by ${artist.full_name}` : ""}`}
      meta={
        <div className="space-y-1">
          {artist && (
            <p>
              by{" "}
              <Link href={`/artists/${artist.slug}`} className="text-accent hover:underline">
                {artist.full_name}
              </Link>
            </p>
          )}
          <p>
            {art.dimensions} · {art.year}
          </p>
        </div>
      }
      related={
        art.materials?.length ? (
          <div>
            <h2 className="font-display text-2xl">Reclaimed materials</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {art.materials.map((m) => (
                <li key={m} className="rounded-sm bg-mist px-3 py-1 text-sm text-ink">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      }
    >
      {art.statement && <p>&ldquo;{art.statement}&rdquo;</p>}
      {art.significance && <p className="mt-4 text-text-muted">{art.significance}</p>}
    </ExhibitLayout>
  );
}

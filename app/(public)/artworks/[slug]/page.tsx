import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExhibitLayout } from "@/components/ExhibitLayout";
import { artworkImage, getArtwork, getPerson } from "@/lib/data";
import { artworkService } from "@domains/artwork";
import type { ProvenanceKind } from "@domains/artwork";

// Dynamic so the accumulating provenance record is always current.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const art = getArtwork(params.slug);
  if (!art) return { title: "Artwork not found" };
  const artist = getPerson(art.artist);
  return {
    title: art.title,
    description: `${art.title}${artist ? ` by ${artist.full_name}` : ""} — ${art.medium}, ${art.dimensions}, ${art.year}.`,
  };
}

const PROVENANCE_LABEL: Record<ProvenanceKind, string> = {
  creation: "Created",
  workshop: "Workshop",
  exhibition: "Exhibited",
  publication: "Published",
  research: "Researched",
  collection: "Collected",
  verification: "Verified",
  anchoring: "Anchored",
  restoration: "Restored",
  ownership: "Ownership",
};

export default function ArtworkRecord({ params }: { params: { slug: string } }) {
  const art = getArtwork(params.slug);
  if (!art) notFound();
  const artist = getPerson(art.artist);
  const profile = artworkService.profile(params.slug);

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

      {/* Provenance — the accumulating life of a preserved object */}
      {profile && profile.provenance.length > 0 && (
        <section className="mt-10">
          <h3 className="font-display text-xl">Provenance</h3>
          <p className="text-xs text-text-muted">
            The recorded life of this object. History accumulates; nothing is overwritten.
          </p>
          <ol className="mt-3 space-y-3 border-l border-border pl-4">
            {profile.provenance.map((e) => (
              <li key={e.id}>
                <div className="text-xs uppercase tracking-wide text-accent">
                  {PROVENANCE_LABEL[e.kind]} {e.occurredOn ? `· ${e.occurredOn.slice(0, 10)}` : ""}
                </div>
                <div className="text-sm">{e.title}</div>
                {e.description && <div className="text-sm text-text-muted">{e.description}</div>}
                {e.verified && <span className="text-xs text-verified">✓ verified</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Certificate(s) */}
      {profile && profile.certificates.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-xl">Certificate</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {profile.certificates.map((c) => (
              <li key={c.id}>
                <Link href={`/verify?q=${encodeURIComponent(c.publicId)}`} className="text-accent hover:underline">
                  {c.publicId}
                </Link>{" "}
                <span className="text-text-muted">· {c.roleAtIssue} ({c.status})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured in stories */}
      {profile && profile.stories.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-xl">Featured in</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {profile.stories.map((s) => (
              <li key={s.slug}>
                <Link href={`/stories/${s.slug}`} className="text-accent hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ExhibitLayout>
  );
}

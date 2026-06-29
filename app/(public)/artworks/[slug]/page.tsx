import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plate } from "@/components/Plate";
import { Reveal } from "@/components/Reveal";
import { PlanetBMark } from "@/components/PlanetBMark";
import { AliveEye } from "@/components/experience/AliveEye";
import { artworkImage, getArtworks } from "@/lib/data";
import { artworkService } from "@domains/artwork";
import type { ArtworkProfile, ProvenanceEvent, ProvenanceKind } from "@domains/artwork";

// Dynamic so the accumulating provenance record is always current (Principle II).
export const dynamic = "force-dynamic";

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

/**
 * Image seam (blueprint §0). `artwork.primaryMedia` is a media id, not a path;
 * `artworkImage(slug)` is the real path resolver. This is the only remaining
 * (image-only, removable) seam — everything else single-sources from profile.
 */
function heroImage(art: ArtworkProfile["artwork"], fallbackSlug: string): string | null {
  return artworkImage(art.slug ?? fallbackSlug);
}

/** Provenance reads ascending — a life told from its making (museum convention). */
function chronological(events: ProvenanceEvent[]): ProvenanceEvent[] {
  return [...events].sort((a, b) => {
    if (a.occurredOn && b.occurredOn) return a.occurredOn.localeCompare(b.occurredOn);
    if (a.occurredOn) return -1;
    if (b.occurredOn) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const profile = artworkService.profile(params.slug);
  if (!profile) return { title: "Artwork not found" };
  const { artwork, artist } = profile;
  const facts = [artwork.medium, artwork.dimensions, artwork.year].filter(Boolean).join(", ");
  return {
    title: artwork.title,
    description: `${artwork.title}${artist ? ` by ${artist.name}` : ""}${facts ? ` — ${facts}.` : "."}`,
  };
}

/** A quiet section label, shared across the reading column (matches the Passport). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">{children}</h2>
  );
}

export default function ArtworkRecord({ params }: { params: { slug: string } }) {
  const profile = artworkService.profile(params.slug);
  if (!profile) notFound();

  const { artwork, artist, certificates, stories } = profile;
  const image = heroImage(artwork, params.slug);
  const alt = `${artwork.title}${artist ? ` by ${artist.name}` : ""}`;
  const provenance = chronological(profile.provenance);

  // Region G — "More by this artist" (blueprint Open Q3, option a; within current data).
  const siblings = artist
    ? getArtworks()
        .filter((a) => a.artist === artist.slug && a.slug !== artwork.slug)
        .slice(0, 6)
    : [];

  return (
    <article className="mx-auto max-w-container px-5 py-12">
      <Link href="/artworks" className="text-sm text-text-muted hover:text-accent">
        ← Artwork Registry
      </Link>

      {/* ── Region A · The work (hero) ───────────────────────────────────── */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-sm bg-mist shadow-museum-soft">
            <Plate
              src={image}
              alt={alt}
              className="aspect-square"
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              fit="contain"
            />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div>
            {artwork.medium && (
              <p className="text-xs uppercase tracking-widest text-text-muted">{artwork.medium}</p>
            )}
            <h1 className="mt-2 font-display text-4xl leading-tight text-text sm:text-5xl">
              {artwork.title}
            </h1>
            {artwork.titleVariant && (
              <p className="mt-1.5 font-display text-lg italic text-text-muted">
                {artwork.titleVariant}
              </p>
            )}
            <div className="mt-5 space-y-1 text-sm text-text-muted">
              {artist && (
                <p>
                  by{" "}
                  <Link href={`/artists/${artist.slug}`} className="text-accent hover:underline">
                    {artist.name}
                  </Link>
                </p>
              )}
              {(artwork.dimensions || artwork.year) && (
                <p>{[artwork.dimensions, artwork.year].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── The reading column (B–F) ─────────────────────────────────────── */}
      <div className="mx-auto mt-20 max-w-measure space-y-16">
        {/* Region B · The artist's statement */}
        {(artwork.statement || artwork.significance) && (
          <Reveal as="section">
            {artwork.statement && (
              <blockquote className="border-l-2 border-accent pl-6">
                <p className="text-pretty font-display text-2xl leading-snug text-text sm:text-[1.7rem]">
                  &ldquo;{artwork.statement}&rdquo;
                </p>
              </blockquote>
            )}
            {artwork.significance && (
              <p className="mt-6 text-pretty text-base leading-relaxed text-text-muted">
                {artwork.significance}
              </p>
            )}
          </Reveal>
        )}

        {/* Region C · Reclaimed materials (the wall label) */}
        {artwork.materials.length > 0 && (
          <Reveal as="section">
            <SectionLabel>Reclaimed materials</SectionLabel>
            <ul className="mt-4 flex flex-wrap gap-2">
              {artwork.materials.map((m) => (
                <li key={m} className="rounded-sm bg-mist px-3 py-1 text-sm text-ink">
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm italic text-text-muted">Made from what was discarded.</p>
          </Reveal>
        )}

        {/* Region D · Provenance (the lineage / museum wall label) */}
        {provenance.length > 0 && (
          <Reveal as="section">
            <SectionLabel>Provenance</SectionLabel>
            <p className="mt-2 max-w-measure text-sm text-text-muted">
              The recorded life of this object. History accumulates; nothing is overwritten.
            </p>
            <ol className="mt-6 space-y-7 border-l border-border pl-6">
              {provenance.map((e) => (
                <li
                  key={e.id}
                  className="relative [content-visibility:auto] [contain-intrinsic-size:auto_5rem]"
                >
                  {/* the Eye, distilled — the institutional mark on every recorded act */}
                  <span
                    className={`absolute -left-[calc(1.5rem+8px)] top-0.5 ${
                      e.verified ? "text-signal" : "text-stone"
                    }`}
                    aria-hidden
                  >
                    <PlanetBMark size={16} title="" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[0.7rem] uppercase tracking-[0.18em] text-accent">
                      {PROVENANCE_LABEL[e.kind]}
                    </span>
                    {e.occurredOn && (
                      <span className="font-mono text-xs text-text-muted">
                        {e.occurredOn.slice(0, 10)}
                      </span>
                    )}
                    {e.verified && (
                      <span className="text-xs text-signal">✓ verified</span>
                    )}
                  </div>
                  <div className="mt-1 text-text">{e.title}</div>
                  {e.description && (
                    <div className="mt-0.5 text-sm text-text-muted">{e.description}</div>
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
        )}

        {/* Region E · Certificate (verifiable · the Eye seal) */}
        {certificates.length > 0 && (
          <Reveal as="section">
            <SectionLabel>Certificate</SectionLabel>
            <ul className="mt-5 space-y-5">
              {certificates.map((c) => {
                const issued = c.status === "issued";
                return (
                  <li key={c.id} className="flex items-start gap-4">
                    <span
                      className={`mt-0.5 shrink-0 ${issued ? "text-accent" : "text-stone"}`}
                      aria-hidden
                    >
                      <AliveEye size={40} watch={false} title="Planet B — institutional seal" />
                    </span>
                    <div>
                      <p className="font-mono text-sm tracking-[0.08em] text-text">{c.publicId}</p>
                      <p className="mt-0.5 text-sm text-text-muted">
                        {c.roleAtIssue}
                        {!issued && ` · ${c.status}`}
                      </p>
                      {issued ? (
                        <Link
                          href={`/verify?q=${encodeURIComponent(c.publicId)}`}
                          className="mt-2 inline-block text-sm text-accent hover:underline"
                        >
                          Verify this record ↗
                        </Link>
                      ) : (
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                          Not presented as a valid credential
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        )}

        {/* Region F · Featured in (stories) */}
        {stories.length > 0 && (
          <Reveal as="section">
            <SectionLabel>Featured in</SectionLabel>
            <ul className="mt-5 space-y-5">
              {stories.map((s) => (
                <li key={s.slug ?? s.title}>
                  {s.slug ? (
                    <Link href={`/stories/${s.slug}`} className="group block">
                      <span className="text-text transition-colors group-hover:text-accent">
                        → {s.title}
                      </span>
                      {s.dek && (
                        <span className="mt-0.5 block text-sm text-text-muted">{s.dek}</span>
                      )}
                    </Link>
                  ) : (
                    <span className="text-text">→ {s.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      {/* ── Region G · More by this artist (the graph, gently revealed) ───── */}
      {siblings.length > 0 && artist && (
        <Reveal as="section" className="mt-24">
          <SectionLabel>More by {artist.name}</SectionLabel>
          <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {siblings.map((a) => (
              <li key={a.slug}>
                <Link href={`/artworks/${a.slug}`} className="group block">
                  <div className="overflow-hidden rounded-sm transition-shadow duration-300 group-hover:shadow-museum-soft">
                    <Plate
                      src={artworkImage(a.slug)}
                      alt={`${a.title} by ${artist.name}`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      fit="contain"
                      className="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-2 text-sm text-text transition-colors group-hover:text-accent">
                    {a.title}
                  </p>
                  {a.year && <p className="text-xs text-text-muted">{a.year}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExhibitLayout } from "@/components/ExhibitLayout";
import { artworkImage, getArtwork, getPerson, personImage } from "@/lib/data";
import { artistService } from "@domains/artist";

// Dynamic so the living archive (works, chapters, stories, provenance) is current.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const person = getPerson(params.slug);
  if (!person) return { title: "Artist not found" };
  return { title: person.full_name, description: person.short_bio };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-display text-xl">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function ArtistProfile({ params }: { params: { slug: string } }) {
  const person = getPerson(params.slug);
  if (!person) notFound();

  const primaryArtwork = person.artworks?.[0] ? getArtwork(person.artworks[0]) : undefined;
  const image = (primaryArtwork && artworkImage(primaryArtwork.slug)) || personImage(person);
  // The living archive — projected from the Planet Passport + cultural facets.
  const profile = artistService.profile(params.slug);

  return (
    <ExhibitLayout
      backHref="/artists"
      backLabel="Artist Registry"
      eyebrow={person.primary_role}
      title={person.full_name}
      fit={primaryArtwork ? "contain" : "cover"}
      image={image}
      imageAlt={primaryArtwork ? `${person.full_name} — ${primaryArtwork.title}` : `${person.full_name}`}
      meta={
        <ul className="flex flex-wrap gap-2">
          {person.roles.map((r) => (
            <li key={r} className="rounded-sm border border-border px-2 py-1 text-xs">
              {r}
            </li>
          ))}
        </ul>
      }
      related={
        profile?.passportId ? (
          <div>
            <h2 className="font-display text-2xl">Planet Passport</h2>
            <Link
              href={`/passport/${profile.passportId}`}
              className="mt-3 inline-block text-accent underline-offset-4 hover:underline"
            >
              {profile.passportId} — lifelong record ↗
            </Link>
            {profile.isGenesisContributor && (
              <p className="mt-2 text-xs uppercase tracking-widest text-accent">Genesis Contributor</p>
            )}
          </div>
        ) : null
      }
    >
      {person.short_bio && <p>{person.short_bio}</p>}
      {primaryArtwork?.statement && (
        <>
          <h3 className="mt-6 font-display text-lg">In their words</h3>
          <p className="text-text-muted">&ldquo;{primaryArtwork.statement}&rdquo;</p>
        </>
      )}

      {profile && (
        <>
          {profile.artworks.length > 0 && (
            <Section title={`Works (${profile.counts.artworks})`}>
              <ul className="space-y-1 text-sm">
                {profile.artworks.map((w) => (
                  <li key={w.id} className="flex justify-between gap-3 border-b border-border/40 py-1">
                    {w.slug ? (
                      <Link href={`/artworks/${w.slug}`} className="hover:text-accent">{w.title}</Link>
                    ) : (
                      <span>{w.title}</span>
                    )}
                    <span className="text-text-muted">{w.year ?? ""}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.chapters.length > 0 && (
            <Section title="Chapters">
              <ul className="space-y-1 text-sm">
                {profile.chapters.map((c) => (
                  <li key={c.name} className="flex justify-between gap-3">
                    <span>
                      {c.slug ? <Link href={`/chapters/${c.slug}`} className="hover:text-accent">{c.name}</Link> : c.name}
                      {c.isGenesis ? <span className="ml-1 text-accent">★</span> : null}
                    </span>
                    <span className="text-text-muted">{(c.roles ?? []).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.stories.length > 0 && (
            <Section title="Stories">
              <ul className="space-y-1 text-sm">
                {profile.stories.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/stories/${s.slug}`} className="text-accent hover:underline">{s.title}</Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.materials.length > 0 && (
            <Section title="Materials">
              <ul className="flex flex-wrap gap-2">
                {profile.materials.map((m) => (
                  <li key={m} className="rounded-sm bg-mist px-3 py-1 text-sm text-ink">{m}</li>
                ))}
              </ul>
            </Section>
          )}

          {profile.collaborators.length > 0 && (
            <Section title="Fellow contributors">
              <ul className="flex flex-wrap gap-2 text-sm">
                {profile.collaborators.slice(0, 16).map((c) => (
                  <li key={c.id}>
                    {c.passportId ? (
                      <Link href={`/passport/${c.passportId}`} className="text-accent hover:underline">{c.name}</Link>
                    ) : (
                      <span>{c.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.certificates.length > 0 && (
            <Section title="Certificates">
              <ul className="space-y-1 text-sm">
                {profile.certificates.map((c) => (
                  <li key={c.id}>
                    <Link href={`/verify?q=${encodeURIComponent(c.publicId)}`} className="font-mono text-xs text-accent hover:underline">
                      {c.publicId}
                    </Link>{" "}
                    <span className="text-text-muted">· {c.roleAtIssue}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </ExhibitLayout>
  );
}

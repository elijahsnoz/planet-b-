import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExhibitLayout } from "@/components/ExhibitLayout";
import {
  artworkImage,
  getArtwork,
  getCertificateForPerson,
  getPeople,
  getPerson,
  personImage,
} from "@/lib/data";

export function generateStaticParams() {
  return getPeople().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const person = getPerson(params.slug);
  if (!person) return { title: "Artist not found" };
  return { title: person.full_name, description: person.short_bio };
}

export default function ArtistProfile({ params }: { params: { slug: string } }) {
  const person = getPerson(params.slug);
  if (!person) notFound();

  const primaryArtwork = person.artworks?.[0] ? getArtwork(person.artworks[0]) : undefined;
  const cert = getCertificateForPerson(person.slug);
  const image = primaryArtwork ? artworkImage(primaryArtwork.slug) : personImage(person);

  return (
    <ExhibitLayout
      backHref="/artists"
      backLabel="Artist Registry"
      eyebrow={person.primary_role}
      title={person.full_name}
      image={image}
      imageAlt={
        primaryArtwork
          ? `${person.full_name} — ${primaryArtwork.title}`
          : `${person.full_name}`
      }
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
        primaryArtwork && (
          <div>
            <h2 className="font-display text-2xl">Work</h2>
            <Link
              href={`/artworks/${primaryArtwork.slug}`}
              className="mt-3 inline-block text-accent underline-offset-4 hover:underline"
            >
              {primaryArtwork.title} — {primaryArtwork.medium}, {primaryArtwork.dimensions}, {primaryArtwork.year}
            </Link>
          </div>
        )
      }
    >
      {person.short_bio && <p>{person.short_bio}</p>}
      {primaryArtwork?.statement && (
        <>
          <h3 className="mt-6 font-display text-lg">In their words</h3>
          <p className="text-text-muted">&ldquo;{primaryArtwork.statement}&rdquo;</p>
        </>
      )}
      {cert && (
        <p className="mt-6 text-sm text-text-muted">
          Planet B certificate: <span className="font-mono text-text">{cert.public_id}</span>{" "}
          <span className="text-stone">({cert.status})</span>
        </p>
      )}
    </ExhibitLayout>
  );
}

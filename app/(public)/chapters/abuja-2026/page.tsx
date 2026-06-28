import type { Metadata } from "next";
import Link from "next/link";
import { Plate } from "@/components/Plate";
import { Reveal } from "@/components/Reveal";
import {
  artworkImage,
  getChapter,
  getFoundingArtists,
  getOrganization,
  performance,
  getTimeline,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Genesis Chapter — Abuja 2026",
  description: "The Genesis Chapter of Planet B — Abuja, World Environment Day 2026.",
};

export default function GenesisChapter() {
  const chapter = getChapter()!;
  const foundingArtists = getFoundingArtists();
  const timeline = getTimeline();
  return (
    <>
      {/* hero */}
      <section data-theme="ink" className="bg-bg px-5 py-24 text-text">
        <div className="mx-auto max-w-container">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Genesis Chapter · Sacred · Never archived
          </p>
          <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">{chapter.theme}</h1>
          <p className="mt-5 max-w-2xl text-text-muted">{chapter.summary}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div>
              <dt className="text-text-muted">Opened</dt>
              <dd className="font-display text-lg">World Environment Day, 5 June 2026</dd>
            </div>
            <div>
              <dt className="text-text-muted">Venue</dt>
              <dd className="font-display text-lg">{chapter.venue}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Founding artists</dt>
              <dd className="font-display text-lg">15 (14 documented)</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* proverbs */}
      <section className="mx-auto max-w-container px-5 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          {chapter.yoruba_proverbs.map((p) => (
            <Reveal key={p.yoruba}>
              <blockquote className="border-l-2 border-accent pl-5">
                <p className="font-display text-xl">{p.yoruba}</p>
                <p className="mt-2 text-text-muted">{p.english}</p>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* immersive timeline */}
      <section className="mx-auto max-w-container px-5 py-12">
        <Reveal>
          <h2 className="font-display text-3xl">The founding timeline</h2>
        </Reveal>
        <ol className="mt-8 border-l border-border">
          {timeline.map((e) => (
            <Reveal as="li" key={e.order} className="relative pl-8 pb-10">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-accent" aria-hidden />
              <p className="text-xs uppercase tracking-widest text-text-muted">
                {e.phase}
                {e.date ? ` · ${e.date}` : ""}
              </p>
              <h3 className="mt-1 font-display text-xl">{e.title}</h3>
              <p className="mt-1 max-w-measure text-text-muted">{e.description}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* performance */}
      <section className="mx-auto max-w-container px-5 py-12">
        <Reveal>
          <div className="rounded-sm border border-border p-8">
            <p className="text-xs uppercase tracking-widest text-text-muted">Performance Art</p>
            <h2 className="mt-2 font-display text-3xl">{performance.title}</h2>
            <p className="mt-1 text-text-muted">{performance.translation}</p>
            <p className="mt-4 max-w-measure">{performance.description}</p>
          </div>
        </Reveal>
      </section>

      {/* founders */}
      <section className="mx-auto max-w-container-wide px-5 py-12">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl">Founding artists</h2>
            <Link href="/artists" className="text-sm text-text-muted hover:text-accent">
              Artist Registry →
            </Link>
          </div>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {foundingArtists.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 4) * 0.05}>
              <Link href={`/artists/${p.slug}`} className="group block">
                <Plate
                  src={p.artworks ? artworkImage(p.artworks[0]) : null}
                  alt={`${p.full_name}`}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <p className="mt-2 font-display text-lg group-hover:text-accent">{p.full_name}</p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* partners */}
      <section className="mx-auto max-w-container px-5 py-16">
        <Reveal>
          <h2 className="font-display text-3xl">Made possible by</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {chapter.partners.map((pt) => {
              const org = getOrganization(pt.organization);
              if (!org) return null;
              return (
                <li key={pt.organization} className="rounded-sm border border-border p-5">
                  <p className="text-xs uppercase tracking-widest text-text-muted">{pt.role}</p>
                  <h3 className="mt-1 font-display text-xl">{org.name}</h3>
                  {org.about && <p className="mt-2 text-sm text-text-muted">{org.about}</p>}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </section>
    </>
  );
}

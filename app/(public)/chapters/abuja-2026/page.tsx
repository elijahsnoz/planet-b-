import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plate } from "@/components/Plate";
import { Reveal } from "@/components/Reveal";
import { VideoPlayer } from "@/components/experience/VideoPlayer";
import {
  COVER_IMAGE,
  ROAD_WALK_IMAGE,
  TEAM_IMAGE,
  artworkImage,
  getChapter,
  getFoundingArtists,
  getOrganization,
  getPerson,
  getVideos,
  performance,
  personImage,
  getTimeline,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Genesis Chapter — Abuja 2026",
  description: "The Genesis Chapter of Planet B — Abuja, World Environment Day 2026.",
};

const TEAM_SLUGS = ["yusuf-durodola", "temitope-oladeji", "caroline-useh", "katurag-chinyio", "abdullahi-ibrahim"];

export default function GenesisChapter() {
  const chapter = getChapter()!;
  const foundingArtists = getFoundingArtists();
  const timeline = getTimeline();
  const videos = getVideos();
  const voices = ["svein-baera", "solveig-andresen", "nike-okundaye"].map(getPerson).filter(Boolean);
  const team = TEAM_SLUGS.map(getPerson).filter(Boolean);

  return (
    <>
      {/* hero */}
      <section data-theme="ink" className="relative overflow-hidden bg-bg px-5 py-28 text-text">
        <Image src={COVER_IMAGE} alt="" fill priority sizes="100vw" className="object-cover opacity-20" />
        <div className="relative mx-auto max-w-container">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Genesis Chapter · Sacred · Never archived</p>
          <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">{chapter.theme}</h1>
          <p className="mt-5 max-w-2xl text-text-muted">{chapter.summary}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div><dt className="text-text-muted">Opened</dt><dd className="font-display text-lg">World Environment Day, 5 June 2026</dd></div>
            <div><dt className="text-text-muted">Venue</dt><dd className="font-display text-lg">{chapter.venue}</dd></div>
            <div><dt className="text-text-muted">Founding artists</dt><dd className="font-display text-lg">15 (14 documented)</dd></div>
          </dl>
        </div>
      </section>

      {/* proverbs */}
      <section className="mx-auto max-w-container px-5 py-20">
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

      {/* voices — embassy & host */}
      <section className="mx-auto max-w-container-wide px-5 py-12">
        <Reveal>
          <h2 className="font-display text-3xl">Those who made it possible</h2>
          <p className="mt-2 max-w-measure text-text-muted">
            A collaboration between the Royal Norwegian Embassy and Nike Art Gallery.
          </p>
        </Reveal>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3">
          {voices.map((p, i) => (
            <Reveal as="li" key={p!.slug} delay={(i % 3) * 0.06}>
              <Link href={`/artists/${p!.slug}`} className="group block">
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-sm bg-mist shadow-museum-soft">
                  <Plate src={personImage(p!)} alt={p!.full_name} fit="cover" className="aspect-[4/5]" sizes="(max-width:768px) 90vw, 18rem" />
                </div>
                <p className="mt-3 font-display text-xl group-hover:text-accent">
                  {p!.honorific ? `${p!.honorific} ` : ""}{p!.full_name}
                </p>
                <p className="text-sm text-text-muted">{p!.primary_role}</p>
                {p!.short_bio && <p className="mt-2 text-sm text-text-muted">{p!.short_bio}</p>}
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* immersive timeline */}
      <section className="mx-auto max-w-container px-5 py-16">
        <Reveal><h2 className="font-display text-3xl">The founding timeline</h2></Reveal>
        <ol className="mt-8 border-l border-border">
          {timeline.map((e) => (
            <Reveal as="li" key={e.order} className="relative pl-8 pb-10">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-accent" aria-hidden />
              <p className="text-xs uppercase tracking-widest text-text-muted">{e.phase}{e.date ? ` · ${e.date}` : ""}</p>
              <h3 className="mt-1 font-display text-xl">{e.title}</h3>
              <p className="mt-1 max-w-measure text-text-muted">{e.description}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* the team */}
      <section className="mx-auto max-w-container px-5 py-16">
        <Reveal>
          <h2 className="font-display text-3xl">The workshop team</h2>
          <div className="mt-6 overflow-hidden rounded-sm border border-border bg-ink shadow-museum-soft">
            <div className="relative aspect-[16/10] w-full">
              <Image src={TEAM_IMAGE} alt="The upcycling art workshop team" fill sizes="(max-width:1024px) 100vw, 1100px" className="object-contain" />
            </div>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {team.map((p) => (
              <li key={p!.slug}>
                <Link href={`/artists/${p!.slug}`} className="hover:text-accent">{p!.full_name}</Link>
                <span className="text-text-muted"> — {p!.primary_role}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* watch — the films */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-container px-5 py-16">
          <Reveal>
            <h2 className="font-display text-3xl">The films</h2>
            <p className="mt-2 max-w-measure text-text-muted">From discarded materials to an exhibition — documented by Edge Media.</p>
          </Reveal>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {videos.map((v, i) => (
              <Reveal key={v.src} delay={(i % 2) * 0.06}>
                <VideoPlayer src={v.src} title={v.title} poster={v.title.toLowerCase().includes("workshop") ? ROAD_WALK_IMAGE : COVER_IMAGE} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* performance */}
      <section className="mx-auto max-w-container px-5 py-16">
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
      <section className="mx-auto max-w-container-wide px-5 py-16">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl">Founding artists</h2>
            <Link href="/artists" className="text-sm text-text-muted hover:text-accent">Artist Registry →</Link>
          </div>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {foundingArtists.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 4) * 0.05}>
              <Link href={`/artists/${p.slug}`} className="group block">
                <Plate src={p.artworks ? artworkImage(p.artworks[0]) : null} alt={p.full_name} sizes="(max-width: 768px) 50vw, 25vw" fit="contain" />
                <p className="mt-2 font-display text-lg group-hover:text-accent">{p.full_name}</p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* partners */}
      <section className="mx-auto max-w-container px-5 py-20">
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

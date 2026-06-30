import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { AliveEye } from "@/components/experience/AliveEye";
import { PlanetBMark } from "@/components/PlanetBMark";
import { VideoPlayer } from "@/components/experience/VideoPlayer";
import { TimelineSpine } from "@/components/experience/TimelineSpine";
import {
  COVER_IMAGE,
  ROAD_WALK_IMAGE,
  artworkImage,
  getArtworks,
  getCertificates,
  getChapter,
  getFoundingArtists,
  getFoundingCouncil,
  getOrganization,
  getPerson,
  getPress,
  getTimeline,
  getVideos,
  panel,
  performance,
  personImage,
  personName,
  type Person,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Genesis Chapter — Abuja 2026",
  description:
    "The Genesis Chapter of Planet B: a five-day upcycling masterclass and exhibition that opened on World Environment Day at Nike Art Gallery, Abuja, sponsored by the Royal Norwegian Embassy. The beginning of Because There Is No Planet B.",
};

// ── small editorial primitives (server-safe) ────────────────────────────────
function SceneMarker({ n, label }: { n: string; label: string }) {
  return (
    <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-text-muted">
      <span className="text-accent">{n}</span>&nbsp;&nbsp;·&nbsp;&nbsp;{label}
    </p>
  );
}
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.15em] text-text-muted">{label}</dt>
      <dd className="mt-1.5 font-display text-lg leading-tight">{children}</dd>
    </div>
  );
}
function PortraitCard({ person, compact = false }: { person: Person; compact?: boolean }) {
  const img = personImage(person);
  return (
    <Link href={`/artists/${person.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-mist shadow-museum-soft">
        {img ? (
          <Image
            src={img}
            alt={person.full_name}
            fill
            sizes="(max-width:768px) 90vw, 20rem"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs uppercase tracking-widest text-text-muted">
            {person.full_name}
          </div>
        )}
      </div>
      <p className={`mt-3 font-display group-hover:text-accent ${compact ? "text-base" : "text-xl"}`}>
        {person.honorific ? `${person.honorific} ` : ""}
        {person.full_name}
      </p>
      {person.primary_role && <p className="text-sm text-text-muted">{person.primary_role}</p>}
    </Link>
  );
}

export default function GenesisChapter() {
  const chapter = getChapter()!;
  const timeline = getTimeline();
  const videos = getVideos();
  const press = getPress();
  const council = getFoundingCouncil();

  // works: the founding artworks that have a real archive image (the 14 documented).
  const works = getArtworks()
    .filter((w) => artworkImage(w.slug))
    .sort((a, b) => Number(b.slug === "the-watchful-eye") - Number(a.slug === "the-watchful-eye"));

  // partners derived from the chapter record (no org names hardcoded in logic).
  const sponsorOrg = getOrganization(chapter.partners.find((p) => p.role === "sponsor")?.organization ?? "");
  const hostOrg = getOrganization(chapter.partners.find((p) => p.role === "host")?.organization ?? "");
  const nike = getPerson("nike-okundaye");
  const embassyVoices = ["svein-baera", "solveig-andresen"].map(getPerson).filter(Boolean) as Person[];
  const communityPartners = ["plogging-nigeria", "nesrea", "trash-monger"]
    .map(getOrganization)
    .filter(Boolean) as NonNullable<ReturnType<typeof getOrganization>>[];

  const counts = {
    artists: getFoundingArtists().length,
    works: works.length,
    certificates: getCertificates().length,
  };

  return (
    <>
      {/* ── A · ESTABLISHING HERO — arrival ───────────────────────────────── */}
      <section data-theme="ink" className="relative flex min-h-[92svh] flex-col justify-center overflow-hidden bg-bg px-5 py-20 text-text sm:py-32">
        <Image src={COVER_IMAGE} alt="" fill priority sizes="100vw" className="object-cover opacity-[0.16]" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(11,11,12,0.6), rgba(11,11,12,0.25) 38%, var(--pb-ink))" }}
        />
        <div className="relative mx-auto w-full max-w-container">
          <Reveal>
            <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-text-muted">
              <AliveEye size={26} watch={false} className="text-accent" />
              Genesis Chapter · {chapter.name}, Nigeria
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 max-w-4xl pb-display-1 font-display leading-[1.05] tracking-[-0.02em]">
              {chapter.theme}
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="pb-read mt-6 max-w-2xl leading-relaxed text-text-muted">{chapter.summary}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-6 sm:mt-12 sm:gap-x-12">
              <Fact label="Opened">World Environment Day · 5 June 2026</Fact>
              <Fact label="Venue">{chapter.venue}</Fact>
              <Fact label="Sponsor">Royal Norwegian Embassy</Fact>
              <Fact label="Host">Nike Art Gallery</Fact>
            </dl>
          </Reveal>
        </div>
        <span
          aria-hidden
          className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-text-muted"
        >
          descend
          <span className="block h-8 w-px bg-current opacity-40" />
        </span>
      </section>

      {/* ── B · INVOCATION — reverence ────────────────────────────────────── */}
      <section className="mx-auto max-w-container px-5 py-24 sm:py-32">
        <Reveal>
          <SceneMarker n="01" label="The invocation" />
        </Reveal>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {chapter.yoruba_proverbs.map((p, i) => (
            <Reveal key={p.yoruba} delay={i * 0.08}>
              <blockquote className="border-l-2 border-accent pl-6">
                <p className="font-display text-2xl leading-snug">{p.yoruba}</p>
                <p className="mt-3 leading-relaxed text-text-muted">{p.english}</p>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── the breath — setting the stakes (ink interstitial) ────────────── */}
      <section data-theme="ink" className="bg-bg px-5 py-20 text-text sm:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="pb-display-3 font-display leading-[1.3] tracking-[-0.01em] sm:leading-[1.25]">
              Five days. Fifteen artists. A pile of what the world had thrown away — and one question:{" "}
              <span className="text-accent">what if waste is only a resource we have not yet learned to see?</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── C · TIMELINE SPINE — understanding ────────────────────────────── */}
      <section className="mx-auto max-w-container px-5 py-24 sm:py-28">
        <Reveal>
          <SceneMarker n="02" label="How it happened" />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">
            From a community road walk to a gallery opening, in eleven movements.
          </h2>
        </Reveal>
        <div className="mt-14">
          <TimelineSpine entries={timeline} />
        </div>
      </section>

      {/* ── F+D · THE WORKS — wonder & recognition (gallery wall on ink) ──── */}
      <section data-theme="ink" className="bg-bg px-5 py-24 text-text sm:py-28">
        <div className="mx-auto max-w-container-wide">
          <Reveal>
            <SceneMarker n="03" label="What it produced" />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">
                Fourteen works. Each 61×61cm. Each made entirely from discard.
              </h2>
              <Link href="/artworks" className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline">
                All works →
              </Link>
            </div>
          </Reveal>
          <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {works.map((w, i) => {
              const artist = getPerson(w.artist);
              return (
                <Reveal as="li" key={w.slug} delay={(i % 4) * 0.04}>
                  <Link href={`/artworks/${w.slug}`} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-mist shadow-museum-soft transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:-translate-y-1">
                      <Image
                        src={artworkImage(w.slug)!}
                        alt={`${w.title}${artist ? ` by ${artist.full_name}` : ""}`}
                        fill
                        sizes="(max-width:768px) 50vw, 22vw"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-3 font-display text-lg leading-tight group-hover:text-accent">{w.title}</p>
                    {artist && <p className="text-sm text-text-muted">{artist.full_name}</p>}
                  </Link>
                </Reveal>
              );
            })}
            {/* the fifteenth — intentionally unfilled (Principle VI) */}
            <Reveal as="li" delay={0.12}>
              <div className="flex aspect-square flex-col items-center justify-center rounded-sm border border-dashed border-border p-5 text-center">
                <span className="font-display text-4xl text-text-muted">15</span>
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">The reserved seat</p>
              </div>
              <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-text-muted">
                The fifteenth founding work is intentionally unrecorded — held until verified from the official documentation.
              </p>
            </Reveal>
          </ul>
        </div>
      </section>

      {/* ── E · HOST & SPONSOR — credibility ──────────────────────────────── */}
      <section className="mx-auto max-w-container px-5 py-24 sm:py-28">
        <Reveal>
          <SceneMarker n="04" label="Who made it possible" />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">
            An embassy that crossed an ocean. A gallery that has taught art since 1983.
          </h2>
        </Reveal>

        {/* host — Nike Art Gallery */}
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[19rem_1fr]">
          {nike && (
            <Reveal>
              <PortraitCard person={nike} />
            </Reveal>
          )}
          <Reveal delay={0.08}>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-text-muted">The host · {hostOrg?.name ?? "Nike Art Gallery"}</p>
              <p className="mt-4 max-w-measure leading-relaxed">{hostOrg?.about}</p>
            </div>
          </Reveal>
        </div>

        {/* sponsor — Royal Norwegian Embassy */}
        <div className="mt-16 grid items-start gap-10 lg:grid-cols-[1fr_19rem]">
          <Reveal>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-text-muted">The sponsor · {sponsorOrg?.name ?? "Royal Norwegian Embassy"}</p>
              <p className="mt-4 max-w-measure leading-relaxed">{sponsorOrg?.about}</p>
            </div>
          </Reveal>
          {embassyVoices.length > 0 && (
            <Reveal delay={0.08}>
              <ul className="grid grid-cols-2 gap-5">
                {embassyVoices.map((p) => (
                  <li key={p.slug}>
                    <PortraitCard person={p} compact />
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── G · THE FILMS — immersion ─────────────────────────────────────── */}
      {videos.length > 0 && (
        <section data-theme="ink" className="bg-bg px-5 pt-24 text-text sm:pt-28">
          <div className="mx-auto max-w-container">
            <Reveal>
              <SceneMarker n="05" label="The record" />
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-display text-3xl tracking-[-0.01em] sm:text-4xl">The films</h2>
              <p className="mt-3 max-w-measure text-text-muted">
                From discarded materials to an exhibition — documented by Edge Media and the Nigerian Television Authority.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {videos.map((v, i) => (
                <Reveal key={v.src} delay={(i % 2) * 0.06}>
                  <VideoPlayer
                    src={v.src}
                    title={v.title}
                    poster={v.title.toLowerCase().includes("workshop") ? ROAD_WALK_IMAGE : COVER_IMAGE}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── the performance — Òdàlè Dà'lẹ̀ (the second proverb, enacted) ───── */}
      <section data-theme="ink" className="bg-bg px-5 py-20 text-text sm:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Performance Art · 5 June 2026</p>
            <h2 className="mt-4 pb-display-3 font-display tracking-[-0.01em]">{performance.title}</h2>
            <p className="mt-3 text-lg text-accent">{performance.translation}</p>
            <p className="mt-6 leading-relaxed text-text-muted">{performance.description}</p>
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              <Fact label="Lead">{personName(performance.lead)}</Fact>
              <Fact label="Curator">{personName(performance.curator)}</Fact>
              <Fact label="Photography">{personName(performance.photo_credit)}</Fact>
            </dl>
            <p className="mt-5 text-sm text-text-muted">With {performance.co_performers.map(personName).join(", ")}.</p>
          </Reveal>
        </div>
      </section>

      {/* ── H · THE CONVERSATION & THE PROOF — conviction ─────────────────── */}
      <section className="mx-auto max-w-container px-5 py-24 sm:py-28">
        <Reveal>
          <SceneMarker n="06" label="The conversation & the proof" />
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-8">
            <h2 className="font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">{panel.title}</h2>
            <p className="mt-3 max-w-measure text-text-muted">
              Moderated by {personName(panel.moderator)}, with {panel.speakers.map(personName).join(", ")}.
            </p>
          </div>
        </Reveal>

        {communityPartners.length > 0 && (
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {communityPartners.map((org, i) => (
              <Reveal as="li" key={org.slug} delay={(i % 3) * 0.05}>
                <div className="h-full rounded-sm border border-border p-6">
                  <h3 className="font-display text-xl leading-tight">{org.name}</h3>
                  {org.about && <p className="mt-3 text-sm leading-relaxed text-text-muted">{org.about}</p>}
                </div>
              </Reveal>
            ))}
          </ul>
        )}

        {press.length > 0 && (
          <div className="mt-16">
            <Reveal>
              <h3 className="font-display text-2xl">In the press</h3>
            </Reveal>
            <ul className="mt-6 border-y border-border">
              {press.map((a) => (
                <Reveal as="li" key={a.url} className="border-b border-border last:border-b-0">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="font-display text-lg leading-snug group-hover:text-accent">{a.title}</span>
                    <span className="shrink-0 text-sm text-text-muted">{a.outlet} ↗</span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── I · THE FOUNDING COUNCIL — authority ──────────────────────────── */}
      <section className="border-t border-border bg-bg px-5 py-24 sm:py-28">
        <div className="mx-auto max-w-container">
          <Reveal>
            <SceneMarker n="07" label="The charter" />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-5 max-w-2xl">
              <h2 className="font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">The founding council</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                A historical record of those who established the movement — the Genesis cohort, never removed.
                {council.pending.length > 0 ? " One seat is intentionally reserved." : ""}
              </p>
            </div>
          </Reveal>
          <div className="mt-14 space-y-14">
            {council.groups.map((g) => (
              <Reveal key={g.label}>
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-[13rem_1fr]">
                  <h3 className="font-display text-xl text-text-muted sm:sticky sm:top-24 sm:self-start">{g.label}</h3>
                  <ul className="space-y-6">
                    {g.members.map((m) => (
                      <li key={m.slug} className="flex gap-3.5">
                        <span aria-hidden className="mt-0.5 shrink-0">
                          <PlanetBMark size={20} className="text-accent" />
                        </span>
                        <div>
                          <p className="font-display text-lg leading-tight">
                            {m.linkable ? (
                              <Link href={`/artists/${m.slug}`} className="hover:text-accent">
                                {m.name}
                              </Link>
                            ) : (
                              m.name
                            )}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-text-muted">{m.citation}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── J · FEDERATION FOOTER — continuation ──────────────────────────── */}
      <section data-theme="ink" className="bg-bg px-5 py-20 text-text sm:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="pb-display-3 font-display leading-snug tracking-[-0.01em]">
              This is one chapter of a federation built to hold a hundred chapters over a hundred years.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-7 font-mono text-sm text-text-muted">
              {counts.artists} founding artists · {counts.works} works · {counts.certificates} certificates · 1 of ∞ chapters
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link href="/chapters" className="inline-flex min-h-[44px] items-center rounded-sm border border-text-muted px-5 text-sm transition-colors hover:border-text">
                All chapters
              </Link>
              <Link href="/artists" className="inline-flex min-h-[44px] items-center rounded-sm border border-text-muted px-5 text-sm transition-colors hover:border-text">
                Artist registry
              </Link>
              <Link href="/origin" className="inline-flex min-h-[44px] items-center px-2 text-sm text-text-muted underline-offset-4 hover:text-text hover:underline">
                Become part of the story
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

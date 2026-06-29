import Link from "next/link";
import { Plate } from "@/components/Plate";
import { Reveal } from "@/components/Reveal";
import { AliveEye } from "@/components/experience/AliveEye";
import { Threshold } from "@/components/experience/Threshold";
import { WasteToArt } from "@/components/experience/WasteToArt";
import { HopeShift } from "@/components/experience/HopeShift";
import { TickingWatch } from "@/components/experience/TickingWatch";
import { PassportInvitation } from "@/components/passport/PassportInvitation";
import {
  artworkImage,
  getArtwork,
  getChapter,
  getFoundingArtists,
  getPassportCount,
  getPerson,
} from "@/lib/data";

const FOUNDER_ID = "PB-ID-000001";

export default function Home() {
  const eye = getArtwork("the-watchful-eye");
  const eyeArtist = eye ? getPerson(eye.artist) : undefined;
  const silence = getArtwork("man-and-his-environment");
  const hope = getArtwork("garbage-to-grace");
  const chapter = getChapter();
  const proverb = chapter?.yoruba_proverbs?.[0];
  const founders = getFoundingArtists();

  // The founding Passport (PB-ID-000001) — the reference for every future one.
  const passportsIssued = getPassportCount();
  const passportHolder = {
    passportId: FOUNDER_ID,
    name: "Ajayi Elijah Snoz",
    line: "Founder · Genesis Contributor",
    genesis: true,
  };
  const passportStats = [
    {
      label: "Planet Passports Issued",
      value: String(passportsIssued).padStart(6, "0"),
      sub: "and counting",
    },
    {
      label: "Genesis Collection",
      value: String(founders.length).padStart(2, "0"),
      sub: "Founding Artists",
    },
    { label: "Federation Origin", value: "2026", sub: "Abuja, Nigeria" },
  ];

  return (
    <>
      {/* ── ARRIVAL · CURIOSITY ─────────────────────────────────────────── */}
      <Threshold />

      {/* ── WONDER · waste becomes art ──────────────────────────────────── */}
      {eye && artworkImage(eye.slug) && (
        <WasteToArt
          image={artworkImage(eye.slug)!}
          alt={`${eye.title} by ${eyeArtist?.full_name ?? "a founding artist"}`}
          title={eye.title}
          artist={eyeArtist?.full_name}
        />
      )}

      {/* ── SILENCE · one work, let it land ─────────────────────────────── */}
      {silence && (
        <section data-theme="ink" className="flex min-h-[100svh] flex-col items-center justify-center bg-bg px-5 text-text">
          <Reveal>
            <div className="relative aspect-square w-[min(82vw,40rem)] overflow-hidden rounded-sm shadow-museum-soft">
              <Plate src={artworkImage(silence.slug)} alt={silence.title} className="aspect-square" sizes="(max-width:768px) 82vw, 40rem" fit="contain" />
            </div>
          </Reveal>
        </section>
      )}

      {/* ── REFLECTION · the artist's own words ─────────────────────────── */}
      {eye?.statement && (
        <section className="mx-auto max-w-container px-5 py-28">
          <Reveal>
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <TickingWatch />
              <blockquote className="mt-8">
                <p className="font-display text-2xl leading-snug sm:text-[2rem]">&ldquo;{eye.statement}&rdquo;</p>
                <footer className="mt-6 text-sm text-text-muted">
                  {eyeArtist?.full_name ?? "A founding artist"} — <cite className="not-italic">{eye.title}</cite>
                </footer>
              </blockquote>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── HOPE · dark becomes light ───────────────────────────────────── */}
      {hope && (
        <HopeShift>
          <div className="mx-auto grid max-w-container items-center gap-10 px-5 py-32 lg:grid-cols-2">
            <Reveal>
              <div className="relative aspect-square overflow-hidden rounded-sm shadow-museum-soft">
                <Plate src={artworkImage(hope.slug)} alt={hope.title} className="aspect-square" sizes="(max-width:1024px) 100vw, 40rem" fit="contain" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] opacity-70">From waste to grace</p>
                <h2 className="mt-3 font-display text-4xl leading-tight tracking-[-0.015em]">Waste is not an end, but a beginning.</h2>
                <p className="mt-5 max-w-measure opacity-80">{hope.statement}</p>
              </div>
            </Reveal>
          </div>
        </HopeShift>
      )}

      {/* ── RESPONSIBILITY · the planet watches back ────────────────────── */}
      {proverb && (
        <section data-theme="ink" className="flex min-h-[80svh] flex-col items-center justify-center gap-8 bg-bg px-5 text-center text-text">
          <AliveEye size={88} watch openOnMount={false} className="text-accent" />
          <Reveal>
            <p className="max-w-3xl font-display text-2xl leading-snug sm:text-4xl">{proverb.yoruba}</p>
            <p className="mx-auto mt-5 max-w-xl text-text-muted">{proverb.english}</p>
          </Reveal>
        </section>
      )}

      {/* ── BELONGING · the founders ────────────────────────────────────── */}
      <section className="mx-auto max-w-container-wide px-5 py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl">Ordinary people began this.</h2>
            <p className="mt-3 text-text-muted">
              Fifteen artists, a gallery that has nurtured talent since 1983, and an embassy that crossed
              an ocean — one World Environment Day in Abuja.
            </p>
          </div>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {founders.slice(0, 10).map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 5) * 0.04}>
              <Link href={`/artists/${p.slug}`} className="group block">
                <div className="overflow-hidden rounded-sm transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:-translate-y-1">
                  <Plate src={p.artworks ? artworkImage(p.artworks[0]) : null} alt={p.full_name} sizes="(max-width:768px) 50vw, 20vw" fit="contain" />
                </div>
                <p className="mt-3 font-display text-base transition-colors group-hover:text-accent">{p.full_name}</p>
                <span className="mt-0.5 block text-[0.65rem] uppercase tracking-[0.25em] text-text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100">
                  View in archive&nbsp;→
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── IDENTITY · the Planet Passport (curiosity, not disclosure) ──── */}
      <PassportInvitation
        holder={passportHolder}
        href={`/passport/${FOUNDER_ID}`}
        stats={passportStats}
      />

      {/* ── INVITATION · the end that is a beginning ────────────────────── */}
      <section data-theme="ink" className="flex min-h-[90svh] flex-col items-center justify-center gap-10 bg-bg px-5 text-center text-text">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-text-muted">The next chapter</p>
          <h2 className="mt-6 max-w-3xl font-display text-4xl leading-tight tracking-[-0.015em] sm:text-6xl">
            has not yet been written.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/chapters/abuja-2026"
              className="rounded-sm bg-accent px-6 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Enter the Genesis Chapter
            </Link>
            <Link href="/origin" className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline">
              Become part of the story
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

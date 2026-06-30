import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { AliveEye } from "@/components/experience/AliveEye";
import { ArchivalFilm } from "@/components/experience/ArchivalFilm";

export const metadata: Metadata = {
  title: "Why Planet B Exists · A Letter to Those Who Will Come After Us",
  description:
    "A founding letter. Planet B did not begin with software — it began on World Environment Day in Abuja, inside the inaugural Upcycle Art Workshop and Exhibition at Nike Art Gallery, in partnership with the Royal Norwegian Embassy.",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Why Planet B Exists — a founding document.
 *
 * Not an About page; a letter meant to be read slowly and discovered decades from
 * now. The words lead; everything else recedes. Two archival films are woven into
 * the narrative, not presented as separate media. Soft ambient motion only
 * (Reveal), full reduced-motion support, generous whitespace, a single reading
 * measure. The voice is the founder's, first person, verbatim.
 *
 * Route is /founders-letter (the personal founding document); /origin remains the
 * philosophical origin of the movement. The (public) layout already provides the
 * <main> landmark, so this page is an <article>.
 * ────────────────────────────────────────────────────────────────────────── */

// Both films are H.264/AAC MP4 served as video/mp4. The Mama Nike file was a
// .mov-wrapped MP4 that browsers refused as video/quicktime — now a clean .mp4.
// The interview filename carries spaces, so it is URL-encoded.
const FILM_MAMA_NIKE = "/media/video/about-mama-nike.mp4";
const FILM_FINAL = encodeURI("/media/video/Final interview .mp4");

export default function FoundersLetterPage() {
  return (
    <article className="pb-28">
      {/* ── Title — quiet arrival, the words already beginning to settle ───────── */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="pb-settle pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(123,92,62,0.10), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-measure px-5 pt-24 pb-10 text-center sm:pt-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">A Founding Document</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h1 className="mt-6 pb-display-1 font-display leading-[1.1] tracking-[-0.015em]">
              Why Planet&nbsp;B Exists
            </h1>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-5 font-display text-lg italic text-text-muted sm:text-xl">
              A Letter to Those Who Will Come After Us
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <p className="mt-8 text-xs uppercase tracking-[0.22em] text-text-muted">
              Abuja, Nigeria · World Environment Day, 5 June 2026
            </p>
          </Reveal>
        </div>
      </header>

      {/* ── The letter ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-measure px-5 text-[1.075rem] leading-[1.85] text-text [&_p]:mt-7">
        {/* Opening */}
        <Reveal as="section">
          <p className="!mt-0">Planet B did not begin with software.</p>
          <p>
            It began on World Environment Day in Abuja, Nigeria. It began during the inaugural
            Upcycle Art Workshop and Exhibition at Nike Art Gallery Abuja, in partnership with the
            Royal Norwegian Embassy.
          </p>
          <p>That exhibition changed something inside me.</p>
          <p>
            I served as the Master of Ceremonies. Standing before artists, diplomats, visitors and
            friends of the movement, I realised that my role was much more than introducing
            speakers. I was able to transfer my excitement, hope and genuine love for our planet to
            the audience and my fellow artists.
          </p>
          <p>That remains one of the greatest honours of my life.</p>
        </Reveal>

        {/* Gratitude — Mama Nike, in whose gallery Planet B found its first home */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">
            I am deeply grateful to Mama Nike for giving us the opportunity to exhibit inside Nike
            Art Gallery Abuja. Her generosity, encouragement and commitment to nurturing artists
            created the environment where Planet B could begin.
          </p>
          <p>Without that opportunity, this story might have unfolded very differently.</p>
        </Reveal>

        {/* Archival film 01 — Mama Nike: a quiet appreciation, Planet B's first home */}
        <ArchivalFilm
          src={FILM_MAMA_NIKE}
          type="video/mp4"
          kicker="Archival Film · 01"
          heading="Mama Nike"
          label="An archival appreciation for Mama Nike, in whose gallery Planet B found its first home."
          caption="An appreciation for Mama Nike — and for Nike Art Gallery Abuja, where Planet B found its first home."
        />

        {/* Gratitude — Ms. Solveig Andresen */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">
            I want to sincerely thank my mentor, Ms.&nbsp;Solveig&nbsp;Andresen, Counsellor, Trade and
            Cultural Affairs at the Royal Norwegian Embassy.
          </p>
          <p>
            She believed in me enough to entrust me with being the Master of Ceremonies for this
            historic event. Her confidence gave me the opportunity to find my own voice. I will
            always remain grateful.
          </p>
          <p>
            Beyond the event itself, I am also thankful for her friendship, encouragement and belief
            in my future.
          </p>
        </Reveal>

        {/* Archival film 02 — Final Conversation */}
        <ArchivalFilm
          src={FILM_FINAL}
          type="video/mp4"
          kicker="Archival Film · 02"
          heading="Final Conversation"
          label="The final conversation after the exhibition between Ms. Solveig Andresen and me."
          caption="The final conversation after the exhibition, between Ms. Solveig Andresen and me — the closing moments of the beginning of Planet B."
        />

        {/* What I saw */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">
            When I looked around the room that day, I did not see an exhibition ending. I saw
            continuity. I saw something capable of growing beyond a single event. I saw artists
            transforming discarded materials into beauty.
          </p>
          <p>
            I realised creativity does not wait for perfect conditions. Even when I cannot afford
            traditional materials, discarded objects remain everywhere.
          </p>
        </Reveal>

        <Reveal className="my-12">
          <p className="text-center font-display text-2xl leading-snug text-text sm:text-3xl">
            Waste is everywhere.
            <br />
            Possibility is everywhere.
          </p>
        </Reveal>

        <Reveal as="section">
          <p className="!mt-0">That realization changed how I think about art forever.</p>
        </Reveal>

        {/* The beginning of Planet B */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">In many ways, Planet B began on the exhibition day.</p>
          <p className="text-text-muted">
            The website came later.
            <br />
            The software came later.
            <br />
            The architecture came later.
          </p>
          <p>The movement was born inside that room.</p>
          <p>
            Everything I have built since then has been an attempt to preserve that feeling and make
            it accessible to people everywhere.
          </p>
        </Reveal>

        {/* Why I kept building */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">I built Planet B because I wanted to leave evidence.</p>
          <p className="text-text-muted">
            Evidence for my future self.
            <br />
            Evidence for my future wife.
            <br />
            Evidence for my future children.
            <br />
            Evidence for every young artist who wonders whether their work matters.
          </p>
          <p>I wanted them to know that artists do more than create beautiful objects.</p>
        </Reveal>

        {/* Pull quote */}
        <Reveal className="my-14 sm:my-20">
          <blockquote className="border-l-2 border-accent pl-5 sm:pl-8">
            <p className="pb-display-2 font-display leading-[1.2] tracking-[-0.01em] text-text">
              Artists notice what others overlook.
            </p>
          </blockquote>
        </Reveal>

        <Reveal as="section">
          <p className="!mt-0">
            Artists find value where others see waste. Artists remind communities of what is still
            possible.
          </p>
        </Reveal>

        {/* Why the sentence matters */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">The movement is built around one sentence:</p>
          <p className="my-8 text-center font-display text-2xl text-text sm:text-3xl">
            “Because There Is No Planet&nbsp;B.”
          </p>
          <p className="!mt-0">These words are not a slogan. They are a responsibility.</p>
          <p>Our facilitator said something that has stayed with me ever since:</p>
          <blockquote className="my-8 border-l-2 border-border pl-6">
            <p className="font-display text-xl italic leading-relaxed text-text sm:text-2xl">
              “When the community falls into disrepair, its restoration lies in the hands of those
              who inhabit it.”
            </p>
          </blockquote>
          <p className="!mt-0">Those words explain Planet B better than any mission statement.</p>
          <p>We are the people who inhabit this planet. Its restoration belongs to us.</p>
        </Reveal>

        {/* The future */}
        <Reveal as="section" className="mt-16">
          <p className="!mt-0">Planet B is no longer just my project.</p>
          <p>
            It belongs to every artist. Every student. Every teacher. Every curator. Every child.
            Every institution. Every community that chooses to create rather than discard.
          </p>
          <p>
            My hope is that one day this archive will preserve thousands of stories from around the
            world. Not because we built software. Because people chose to care.
          </p>
        </Reveal>

        {/* Ending — quiet close, the seal, the signature */}
        <Reveal className="mt-20 border-t border-border pt-16 text-center">
          <p className="mx-auto max-w-measure font-display text-2xl leading-[1.4] text-text sm:text-[1.75rem]">
            If you are reading this many years from now, I hope Planet&nbsp;B has grown far beyond
            anything I imagined. If it has, then it was never really mine. It always belonged to all
            of us.
          </p>

          <AliveEye size={64} openOnMount={false} className="mx-auto mt-16 text-accent" title="The Planet B seal" />

          {/* Founding signature — the permanent historical signature, fixed by the
              founder on World Environment Day 2026. Understated by intent. */}
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Written by</p>
            <p className="mt-4 font-display text-2xl text-text">Ajayi Elijah Snoz</p>
            <p className="mt-5 text-sm leading-[1.9] text-text-muted">
              Founding Artist · Founding Narrator · Creator of Planet&nbsp;B
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-text-muted">Abuja, Nigeria</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-muted">
              World Environment Day · 2026
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── After the letter — a gentle invitation, well clear of the words ──────── */}
      <Reveal className="mx-auto mt-28 max-w-measure px-5">
        <div className="border-t border-border pt-10 text-center">
          <p className="text-sm text-text-muted">Continue into the archive</p>
          <Link
            href="/chapters/abuja-2026"
            className="group mt-2 inline-flex min-h-[44px] items-center font-display text-xl text-text transition-colors hover:text-accent"
          >
            The Genesis Chapter
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </Reveal>
    </article>
  );
}

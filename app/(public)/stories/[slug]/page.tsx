import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plate } from "@/components/Plate";
import { Reveal } from "@/components/Reveal";
import { artworkImage } from "@/lib/data";
import { storyService } from "@domains/story";
import type { ResolvedSection, StoryRefType } from "@domains/story";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const story = storyService.getView(params.slug);
  if (!story || story.status !== "published") return { title: "Story" };
  return {
    title: `${story.title} — Planet B`,
    description: story.dek ?? story.subtitle ?? undefined,
  };
}

/** The institutional name for each kind of connected record. */
const REF_LABEL: Record<StoryRefType, string> = {
  chapter: "Chapter",
  person: "Contributor",
  artwork: "Artwork",
  certificate: "Certificate",
  media: "Media",
  timeline: "Timeline",
  press: "Press",
  organization: "Partner",
  impact: "Impact",
};

/** The verb that invites the reader onward from a referenced record. */
const REF_VERB: Partial<Record<StoryRefType, string>> = {
  chapter: "Enter the chapter",
  artwork: "View in the registry",
  certificate: "Verify this record",
  person: "Open the record",
  organization: "Meet the partners",
  media: "Open media",
  press: "Read the coverage",
};

function artworkSlugFromHref(href: string | null): string | null {
  const m = href?.match(/^\/artworks\/(.+)$/);
  return m ? m[1] : null;
}

/** A quiet eyebrow label (shared with the Passport / Artwork experiences). */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">{children}</span>
  );
}

/** The "let it land" plate — an artwork given a wall of its own, with a catalogue caption. */
function ArtworkExhibit({ s, fig }: { s: ResolvedSection; fig: number }) {
  const r = s.resolved!;
  const slug = artworkSlugFromHref(r.href);
  return (
    <Reveal as="div" className="mx-auto max-w-container px-5">
      <figure className="mx-auto max-w-2xl">
        <Link href={r.href ?? "#"} className="group block">
          <div className="overflow-hidden rounded-sm transition-shadow duration-300 group-hover:shadow-museum-soft">
            <Plate
              src={slug ? artworkImage(slug) : null}
              alt={r.label}
              sizes="(max-width: 768px) 100vw, 66vw"
              fit="contain"
              className="aspect-square"
            />
          </div>
        </Link>
        <figcaption className="mx-auto mt-5 max-w-measure">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            Fig. {String(fig).padStart(2, "0")} · {r.label}
            {r.sub ? ` · ${r.sub}` : ""}
          </p>
          {s.caption && <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.caption}</p>}
          {r.href && (
            <Link href={r.href} className="mt-2 inline-block text-sm text-accent hover:underline">
              {REF_VERB.artwork} ↗
            </Link>
          )}
        </figcaption>
      </figure>
    </Reveal>
  );
}

/** A single impact figure — the one place signal-green is earned. */
function ImpactStat({ s }: { s: ResolvedSection }) {
  const r = s.resolved!;
  return (
    <Reveal as="div" className="mx-auto max-w-measure px-5 text-center">
      <p className="font-display text-5xl leading-none text-signal sm:text-6xl">{r.label}</p>
      {r.sub && (
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-text-muted">{r.sub}</p>
      )}
      {s.caption && <p className="mt-3 text-sm text-text-muted">{s.caption}</p>}
    </Reveal>
  );
}

/** Every other referenced record, presented as a quiet museum wall-label. */
function RecordLabel({ s }: { s: ResolvedSection }) {
  const r = s.resolved!;
  const verb = REF_VERB[r.refType];
  const external = !!r.href && /^https?:\/\//.test(r.href);
  return (
    <Reveal as="div" className="mx-auto max-w-measure px-5">
      <div className="border-l-2 border-accent pl-6">
        <Eyebrow>{REF_LABEL[r.refType] ?? r.refType}</Eyebrow>
        <p className="mt-1.5 font-display text-2xl leading-snug text-text">{r.label}</p>
        {r.sub && <p className="mt-0.5 text-sm text-text-muted">{r.sub}</p>}
        {s.caption && <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.caption}</p>}
        {r.href && verb && (
          <Link
            href={r.href}
            className="mt-3 inline-block text-sm text-accent hover:underline"
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {verb} ↗
          </Link>
        )}
      </div>
    </Reveal>
  );
}

function StoryRecord({ s, fig }: { s: ResolvedSection; fig: number | null }) {
  const r = s.resolved;
  if (!r || !r.found) return null;
  if (r.refType === "artwork" && fig !== null) return <ArtworkExhibit s={s} fig={fig} />;
  if (r.refType === "impact") return <ImpactStat s={s} />;
  return <RecordLabel s={s} />;
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = storyService.getView(params.slug);
  if (!story || story.status !== "published") notFound();

  // Monotonic figure numbers across the artwork plates (catalogue convention).
  let figCounter = 0;
  const numbered = story.sections.map((s) => {
    const isPlate = s.kind === "record" && s.resolved?.found && s.resolved.refType === "artwork";
    return { s, fig: isPlate ? ++figCounter : null };
  });

  // The graph this story is woven from — grouped, de-duplicated, for the coda.
  const connections = new Map<StoryRefType, ResolvedSection["resolved"][]>();
  const seen = new Set<string>();
  for (const { s } of numbered) {
    const r = s.resolved;
    if (s.kind !== "record" || !r?.found) continue;
    const key = `${r.refType}:${r.refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = connections.get(r.refType) ?? [];
    arr.push(r);
    connections.set(r.refType, arr);
  }
  const connectionCount = seen.size;

  // One hop further: the graph surfaces related works, their makers, and sibling
  // stories — discovery the reader never had to ask for.
  const discovery = storyService.discover(params.slug);
  const hasDiscovery =
    discovery.artworks.length > 0 ||
    discovery.people.length > 0 ||
    discovery.organizations.length > 0 ||
    discovery.certificates.length > 0 ||
    discovery.stories.length > 0;

  return (
    <article className="pb-24">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="mx-auto max-w-measure px-5 pt-16">
        <Eyebrow>{story.kind}</Eyebrow>
        <h1 className="mt-3 text-pretty pb-display-1 font-display leading-[1.08] text-text">
          {story.title}
        </h1>
        {story.subtitle && (
          <p className="mt-3 font-display text-xl text-text-muted sm:text-2xl">{story.subtitle}</p>
        )}
        {story.dek && (
          <p className="mt-6 max-w-measure text-pretty pb-read leading-relaxed text-text">
            {story.dek}
          </p>
        )}
        {story.chapterSlug && (
          <p className="mt-5 text-sm text-text-muted">
            From the{" "}
            <Link href={`/chapters/${story.chapterSlug}`} className="text-accent hover:underline">
              {story.chapterName}
            </Link>{" "}
            chapter
          </p>
        )}
      </header>

      {/* ── The narrative ──────────────────────────────────────────────── */}
      <div className="mt-12 space-y-16 sm:mt-24 sm:space-y-28">
        {numbered.map(({ s, fig }) => {
          switch (s.kind) {
            case "heading":
              return (
                <Reveal key={s.id} as="div" className="mx-auto max-w-measure px-5">
                  <h2 className="font-display text-3xl leading-tight text-text sm:text-4xl">
                    {s.text}
                  </h2>
                </Reveal>
              );
            case "prose":
              return (
                <Reveal key={s.id} as="div" className="mx-auto max-w-measure px-5">
                  <p className="text-pretty pb-read leading-relaxed text-text">{s.text}</p>
                </Reveal>
              );
            case "quote":
              return (
                <Reveal key={s.id} as="div" className="mx-auto max-w-measure px-5">
                  <blockquote>
                    <p className="text-pretty font-display text-3xl leading-snug text-text sm:text-4xl">
                      &ldquo;{s.text}&rdquo;
                    </p>
                    {s.attribution && (
                      <footer className="mt-4 text-sm uppercase tracking-[0.18em] text-text-muted">
                        — {s.attribution}
                      </footer>
                    )}
                  </blockquote>
                </Reveal>
              );
            case "record":
              return <StoryRecord key={s.id} s={s} fig={fig} />;
            default:
              return null;
          }
        })}
      </div>

      {/* ── Connections — the graph this story is woven from ───────────── */}
      {connectionCount > 0 && (
        <Reveal as="section" className="mx-auto mt-20 max-w-measure border-t border-border px-5 pt-10 sm:mt-28">
          <Eyebrow>Connections</Eyebrow>
          <p className="mt-3 text-pretty text-base leading-relaxed text-text-muted">
            Nothing here exists in isolation. This story is woven from {connectionCount} living{" "}
            {connectionCount === 1 ? "record" : "records"} in the Planet B archive — none of it
            duplicated, each one verifiable at its source.
          </p>
          <dl className="mt-6 space-y-4">
            {[...connections.entries()].map(([refType, items]) => (
              <div key={refType} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-xs uppercase tracking-[0.18em] text-text-muted">
                  {REF_LABEL[refType]}
                  {items.length > 1 ? ` (${items.length})` : ""}
                </dt>
                <dd className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {items.map((r, i) =>
                    r!.href ? (
                      <Link
                        key={`${r!.refId}-${i}`}
                        href={r!.href}
                        className="text-accent hover:underline"
                      >
                        {r!.label}
                      </Link>
                    ) : (
                      <span key={`${r!.refId}-${i}`} className="text-text">
                        {r!.label}
                      </span>
                    )
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}

      {/* ── Further into the archive — the graph, one hop out ──────────── */}
      {hasDiscovery && (
        <Reveal as="section" className="mx-auto mt-20 max-w-container border-t border-border px-5 pt-10 sm:mt-28">
          <div className="mx-auto max-w-measure">
            <Eyebrow>Further into the archive</Eyebrow>
            <p className="mt-3 text-pretty text-base leading-relaxed text-text-muted">
              The graph keeps going. Following the threads this story is woven from leads to
              other works, the hands that made them, and — as the archive grows — other stories.
            </p>
          </div>

          {/* Related works — small plates, each labelled with the thread that ties it here. */}
          {discovery.artworks.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Related works</h3>
              <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
                {discovery.artworks.map((a) => {
                  const slug = artworkSlugFromHref(a.href);
                  return (
                    <li key={a.refId}>
                      <Link href={a.href ?? "#"} className="group block">
                        <div className="overflow-hidden rounded-sm transition-shadow duration-300 group-hover:shadow-museum-soft">
                          <Plate
                            src={slug ? artworkImage(slug) : null}
                            alt={a.label}
                            sizes="(max-width: 768px) 50vw, 25vw"
                            fit="contain"
                            className="aspect-square"
                          />
                        </div>
                        <p className="mt-2.5 font-display text-base leading-snug text-text transition-colors group-hover:text-accent">
                          {a.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{a.reason}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* The makers — artists reached through the works above. */}
          {discovery.people.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">The makers</h3>
              <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                {discovery.people.map((p) => (
                  <li key={p.refId}>
                    {p.href ? (
                      <Link href={p.href} className="group block">
                        <p className="font-display text-lg leading-tight text-text transition-colors group-hover:text-accent">
                          {p.label}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{p.reason}</p>
                      </Link>
                    ) : (
                      <div>
                        <p className="font-display text-lg leading-tight text-text">{p.label}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{p.reason}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Partners — organizations reached through the story's chapter. */}
          {discovery.organizations.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Partners</h3>
              <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                {discovery.organizations.map((o) => (
                  <li key={o.refId}>
                    <Link href={o.href ?? "/partners"} className="group block">
                      <p className="font-display text-lg leading-tight text-text transition-colors group-hover:text-accent">
                        {o.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{o.reason}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certificates — the verifiable record behind the featured works. */}
          {discovery.certificates.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Verifiable record</h3>
              <ul className="mt-5 space-y-3">
                {discovery.certificates.map((c) => (
                  <li key={c.refId}>
                    <Link href={c.href ?? "#"} className="group inline-flex flex-wrap items-baseline gap-x-3">
                      <span className="font-mono text-sm text-text transition-colors group-hover:text-accent">
                        {c.label}
                      </span>
                      <span className="text-xs text-text-muted">{c.reason}</span>
                      <span className="text-xs text-accent group-hover:underline">Verify ↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sibling stories — woven from the same records. Lights up as the archive grows. */}
          {discovery.stories.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xs uppercase tracking-[0.22em] text-text-muted">Continue reading</h3>
              <ul className="mt-5 space-y-6">
                {discovery.stories.map((s) => (
                  <li key={s.slug ?? s.title}>
                    <Link
                      href={s.slug ? `/stories/${s.slug}` : "#"}
                      className="group block border-t border-border pt-5"
                    >
                      <span className="text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">
                        {s.kind}
                      </span>
                      <p className="mt-1.5 font-display text-2xl leading-snug text-text transition-colors group-hover:text-accent">
                        {s.title}
                      </p>
                      {s.dek && (
                        <p className="mt-2 max-w-measure text-pretty text-sm leading-relaxed text-text-muted">
                          {s.dek}
                        </p>
                      )}
                      <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                        Shares {s.via}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>
      )}

      {/* ── Coda ───────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-16 max-w-measure px-5 text-sm text-text-muted">
        Explore more{" "}
        <Link href="/stories" className="text-accent hover:underline">
          stories
        </Link>
        , the{" "}
        <Link href="/chapters" className="text-accent hover:underline">
          chapters
        </Link>
        , or{" "}
        <Link href="/verify" className="text-accent hover:underline">
          verify a certificate
        </Link>
        .
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { storyService } from "@domains/story";
import type { ResolvedSection } from "@domains/story";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const story = storyService.getView(params.slug);
  if (!story || story.status !== "published") return { title: "Story" };
  return { title: `${story.title} — Planet B`, description: story.dek ?? story.subtitle ?? undefined };
}

const REF_LABEL: Record<string, string> = {
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

function RecordCard({ s }: { s: ResolvedSection }) {
  const r = s.resolved;
  if (!r || !r.found) return null;
  const inner = (
    <div className="rounded-sm border border-border p-5 transition-colors hover:border-accent">
      <span className="text-xs uppercase tracking-widest text-accent">{REF_LABEL[r.refType] ?? r.refType}</span>
      <div className="mt-1 font-display text-2xl">{r.label}</div>
      {r.sub && <div className="text-sm text-text-muted">{r.sub}</div>}
      {s.caption && <p className="mt-2 text-sm text-text-muted">{s.caption}</p>}
      {r.href && <span className="mt-2 inline-block text-xs text-accent">Explore ↗</span>}
    </div>
  );
  return r.href ? (
    <Link href={r.href} className="block">{inner}</Link>
  ) : (
    inner
  );
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = storyService.getView(params.slug);
  if (!story || story.status !== "published") notFound();

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">{story.kind}</p>
      <h1 className="mt-2 font-display text-5xl leading-tight">{story.title}</h1>
      {story.subtitle && <p className="mt-2 text-xl text-text-muted">{story.subtitle}</p>}
      {story.dek && <p className="mt-6 text-lg leading-relaxed">{story.dek}</p>}
      {story.chapterSlug && (
        <p className="mt-3 text-sm text-text-muted">
          From the{" "}
          <Link href={`/chapters/${story.chapterSlug}`} className="text-accent hover:underline">
            {story.chapterName}
          </Link>{" "}
          chapter
        </p>
      )}

      <article className="mt-10 space-y-6">
        {story.sections.map((s) => {
          switch (s.kind) {
            case "heading":
              return <h2 key={s.id} className="font-display text-3xl">{s.text}</h2>;
            case "prose":
              return <p key={s.id} className="text-lg leading-relaxed text-text">{s.text}</p>;
            case "quote":
              return (
                <blockquote key={s.id} className="border-l-2 border-accent pl-5 font-display text-2xl leading-snug">
                  “{s.text}”
                  {s.attribution && <footer className="mt-2 text-sm font-sans text-text-muted">— {s.attribution}</footer>}
                </blockquote>
              );
            case "record":
              return <RecordCard key={s.id} s={s} />;
            default:
              return null;
          }
        })}
      </article>

      <p className="mt-14 border-t border-border pt-6 text-sm text-text-muted">
        Explore more{" "}
        <Link href="/stories" className="text-accent hover:underline">stories</Link>, the{" "}
        <Link href="/chapters" className="text-accent hover:underline">chapters</Link>, or{" "}
        <Link href="/verify" className="text-accent hover:underline">verify a certificate</Link>.
      </p>
    </main>
  );
}

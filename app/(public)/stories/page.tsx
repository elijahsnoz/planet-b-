import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { storyService } from "@domains/story";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Planet B is an archive of transformation. Explore narratives — not records — composed from the people, artworks, chapters, and impact of the movement.",
};

export default async function StoriesIndex() {
  const stories = storyService.list({ status: "published" });

  return (
    <div className="mx-auto max-w-measure px-5 py-16 sm:py-24">
      <header>
        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">Planet B</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-text sm:text-6xl">Stories</h1>
        <p className="mt-5 max-w-measure text-pretty text-lg leading-relaxed text-text-muted">
          Planet B is an archive of transformation. These are narratives — woven from chapters,
          people, artworks, certificates, and impact — meant to be read slowly, not browsed.
        </p>
      </header>

      {stories.length === 0 ? (
        <p className="mt-16 text-text-muted">No published stories yet.</p>
      ) : (
        <ul className="mt-16 space-y-12 sm:space-y-16">
          {stories.map((s) => (
            <li key={s.id}>
              <Reveal>
                <Link href={`/stories/${s.slug}`} className="group block border-t border-border pt-8">
                <span className="text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">
                  {s.kind}
                </span>
                <h2 className="mt-2 font-display text-3xl leading-snug text-text transition-colors group-hover:text-accent sm:text-4xl">
                  {s.title}
                </h2>
                {s.dek && (
                  <p className="mt-3 max-w-measure text-pretty text-base leading-relaxed text-text-muted">
                    {s.dek}
                  </p>
                )}
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                    {s.chapterName ? `${s.chapterName} · ` : ""}
                    {s.recordCount} connected {s.recordCount === 1 ? "record" : "records"}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

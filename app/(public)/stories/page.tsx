import type { Metadata } from "next";
import Link from "next/link";
import { storyService } from "@domains/story";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Planet B is an archive of transformation. Explore narratives — not records — composed from the people, artworks, chapters, and impact of the movement.",
};

export default async function StoriesIndex() {
  const stories = storyService.list({ status: "published" });

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs uppercase tracking-widest text-text-muted">Planet B</p>
      <h1 className="mt-2 font-display text-5xl">Stories</h1>
      <p className="mt-4 max-w-2xl text-lg text-text-muted">
        Planet B is an archive of transformation. These are narratives — woven from chapters,
        people, artworks, certificates, and impact — meant to be explored, not browsed.
      </p>

      {stories.length === 0 ? (
        <p className="mt-10 text-text-muted">No published stories yet.</p>
      ) : (
        <ul className="mt-10 space-y-5">
          {stories.map((s) => (
            <li key={s.id}>
              <Link
                href={`/stories/${s.slug}`}
                className="block rounded-sm border border-border p-6 transition-colors hover:border-accent"
              >
                <span className="text-xs uppercase tracking-widest text-accent">{s.kind}</span>
                <h2 className="mt-1 font-display text-3xl">{s.title}</h2>
                {s.dek && <p className="mt-2 text-text-muted">{s.dek}</p>}
                <p className="mt-3 text-xs text-text-muted">
                  {s.chapterName ? `${s.chapterName} · ` : ""}{s.recordCount} connected records
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

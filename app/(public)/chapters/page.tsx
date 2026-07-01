import type { Metadata } from "next";
import Link from "next/link";
import { chapterService } from "@domains/chapter";

export const metadata: Metadata = {
  title: "Chapters",
  description:
    "Planet B is a federation of chapters — each locally rooted, all part of one global institution. It begins with the Genesis Chapter, Abuja 2026.",
};

export default async function ChaptersIndex() {
  const chapters = chapterService.list().filter((c) => c.status === "published");

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 sm:py-32">
      <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Planet B</p>
      <h1 className="mt-4 pb-display-2 font-display">Chapters</h1>
      <p className="mt-6 max-w-2xl pb-read leading-relaxed text-text-muted">
        Planet B is a federation. Each chapter is locally rooted — hosted by a gallery, embassy,
        museum, university, or community — yet part of one global institution. It begins in Abuja,
        and is built to hold a hundred chapters over a hundred years.
      </p>

      <ul className="mt-16 space-y-6 sm:mt-24">
        {chapters.map((c) => (
          <li key={c.id}>
            <Link
              href={c.slug ? `/chapters/${c.slug}` : "/chapters"}
              className={`block rounded-sm border p-8 transition-colors hover:border-accent sm:p-10 ${
                c.isGenesis ? "border-accent/40" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl">
                  {c.name}
                  {c.isGenesis && <span className="ml-2 text-xs uppercase tracking-widest text-accent">Genesis</span>}
                </h2>
                <span className="text-sm text-text-muted">{c.openedOn ?? ""}</span>
              </div>
              <p className="mt-1 text-text-muted">{[c.city, c.country].filter(Boolean).join(", ")}</p>
              <p className="mt-3 text-sm text-text-muted">
                {c.counts.artists} contributors · {c.counts.artworks} artworks · {c.counts.certificates} certificates
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

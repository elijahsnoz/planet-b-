import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { chapterService } from "@domains/chapter";

export default async function ChaptersAdmin() {
  await requirePermission("chapter.read");
  const chapters = chapterService.list();

  return (
    <div>
      <PageHeader
        title="Chapters"
        subtitle="The federation, city by city. Future chapters are additions — never replacements (Principle II)."
      />

      <div className="space-y-3">
        {chapters.map((c) => (
          <Link
            key={c.id}
            href={`/admin/chapters/${c.id}`}
            className={`block rounded-sm border p-5 transition-colors hover:border-accent ${
              c.isGenesis ? "border-accent/40" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {c.isGenesis && <span className="text-accent" title="Sacred — never deleted">★</span>}
                <h2 className="font-display text-2xl">
                  {c.name}
                  {c.isGenesis && <span className="text-base text-text-muted"> — Genesis Chapter</span>}
                </h2>
              </div>
              <StatusPill status={c.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {[c.city, c.country].filter(Boolean).join(", ")}
              {c.openedOn ? ` · ${c.openedOn}${c.endedOn ? `–${c.endedOn}` : ""}` : ""}
            </p>
            <p className="mt-3 text-sm text-text-muted">
              {c.counts.artists} contributors · {c.counts.artworks} artworks · {c.counts.certificates} certificates
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

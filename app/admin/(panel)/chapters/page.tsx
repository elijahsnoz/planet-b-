import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import { requirePermission } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";

export default async function ChaptersAdmin() {
  await requirePermission("chapter.read");
  const genesis = db.select().from(t.chapters).where(eq(t.chapters.isGenesis, true)).get();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Chapters" subtitle="The movement, city by city. Future chapters are additions — never replacements." />
      {genesis && (
        <div className="rounded-sm border border-accent/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-accent" title="Sacred — never deleted">★</span>
              <h2 className="font-display text-2xl">{genesis.name} — Genesis Chapter</h2>
            </div>
            <StatusPill status={genesis.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-text-muted">{genesis.registryId}</p>
          <p className="mt-3 text-sm text-text-muted">{genesis.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-stone">Opened</dt><dd>{genesis.openedOn}</dd></div>
            <div><dt className="text-stone">Venue</dt><dd>{genesis.venue}</dd></div>
          </dl>
          <p className="mt-5 rounded-sm bg-mist/50 p-3 text-xs text-text-muted">
            🔒 Protected by Principle II. This chapter is immutable and cannot be deleted or replaced.
            Editing the founding record is restricted to the Archivist role.
          </p>
          <Link href="/chapters/abuja-2026" className="mt-4 inline-block text-sm text-accent hover:underline">
            View public chapter ↗
          </Link>
        </div>
      )}
    </div>
  );
}

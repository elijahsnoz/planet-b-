/**
 * Idempotent backfill for Phase 2F (Artwork provenance).
 *
 * Seeds the first provenance events for the Genesis artworks from real/derived
 * facts only (Principle VI): a "creation" event (the work's own medium) and an
 * "exhibition" event tied to the Genesis Chapter's opening date. No facts are
 * invented; curators extend the timeline from here. Skips any artwork that
 * already has provenance. Safe to run repeatedly.
 *
 * Run: npx tsx db/backfill-phase2f.ts
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const chapter = db
  .prepare("SELECT id, name, opened_on FROM chapters WHERE is_genesis = 1")
  .get() as { id: string; name: string; opened_on: string | null } | undefined;
if (!chapter) {
  console.error("No Genesis chapter; aborting.");
  process.exit(1);
}

const artworks = db
  .prepare("SELECT id, title, medium, year FROM artworks WHERE chapter_id = ?")
  .all(chapter.id) as { id: string; title: string; medium: string | null; year: number | null }[];

const hasProvenance = db.prepare("SELECT 1 FROM provenance_events WHERE artwork_id = ? LIMIT 1");
const insert = db.prepare(
  `INSERT INTO provenance_events
     (id, artwork_id, kind, title, description, occurred_on, chapter_id, source, verified, sort_order, created_by, updated_by)
   VALUES (@id, @artworkId, @kind, @title, @description, @occurredOn, @chapterId, @source, @verified, @sortOrder, 'system', 'system')`
);

const run = db.transaction(() => {
  let seeded = 0;
  for (const a of artworks) {
    if (hasProvenance.get(a.id)) continue;
    insert.run({
      id: randomUUID(),
      artworkId: a.id,
      kind: "creation",
      title: a.year ? `Created (${a.year})` : "Created",
      description: a.medium ?? "Assembled from reclaimed materials.",
      occurredOn: null,
      chapterId: chapter.id,
      source: "Genesis Chapter catalogue",
      verified: 1,
      sortOrder: 0,
    });
    insert.run({
      id: randomUUID(),
      artworkId: a.id,
      kind: "exhibition",
      title: `Exhibited — ${chapter.name} (Genesis Chapter)`,
      description: null,
      occurredOn: chapter.opened_on,
      chapterId: chapter.id,
      source: "Genesis Chapter catalogue",
      verified: 1,
      sortOrder: 1,
    });
    seeded++;
  }
  return seeded;
});

const n = run();
console.log(`✓ Phase 2F backfill: seeded provenance (creation + exhibition) for ${n} artwork(s).`);
db.close();

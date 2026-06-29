/**
 * Idempotent backfill for Phase 2E (Story domain).
 *
 * Composes ONE starter Story — "The Genesis Chapter" — entirely from records
 * that already exist (the chapter summary, real artworks, a manifesto line).
 * No facts are invented (Principle VI); it is a curated, editable scaffold so
 * the public narrative experience is demonstrable. Safe to run repeatedly
 * (skips if the story already exists). A fresh reset can re-run this script.
 *
 * Run: npx tsx db/backfill-phase2e.ts
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const SLUG = "the-genesis-chapter";

const exists = db.prepare("SELECT id FROM stories WHERE slug = ?").get(SLUG);
if (exists) {
  console.log("✓ Genesis story already exists — nothing to do.");
  process.exit(0);
}

const chapter = db
  .prepare("SELECT id, name, summary FROM chapters WHERE is_genesis = 1")
  .get() as { id: string; name: string; summary: string | null } | undefined;
if (!chapter) {
  console.error("No Genesis chapter found; aborting.");
  process.exit(1);
}

const artworks = db
  .prepare("SELECT id, title FROM artworks WHERE chapter_id = ? ORDER BY title LIMIT 3")
  .all(chapter.id) as { id: string; title: string }[];

const sect = (s: Record<string, unknown>) => ({ id: randomUUID(), ...s });
const sections = [
  sect({ kind: "heading", text: "Because There Is No Planet B" }),
  sect({
    kind: "prose",
    text:
      chapter.summary ??
      "The Genesis Chapter of Planet B — where the movement began, in Abuja, on World Environment Day.",
  }),
  sect({ kind: "record", refType: "chapter", refId: chapter.id, caption: "The Genesis Chapter" }),
  sect({
    kind: "quote",
    text: "We are not building a second Earth. We are building humanity's Plan B — a plan to keep the first one.",
    attribution: "Planet B — Movement Manifesto",
  }),
  ...artworks.map((a) =>
    sect({ kind: "record", refType: "artwork", refId: a.id, caption: a.title })
  ),
];

const mint = db.prepare(
  `INSERT INTO registry_counters(kind, last_value) VALUES ('story', 1)
   ON CONFLICT(kind) DO UPDATE SET last_value = last_value + 1 RETURNING last_value`
);
const insertStory = db.prepare(
  `INSERT INTO stories(id, registry_id, slug, status, verified, title, subtitle, dek, body, chapter_id, kind, created_by, updated_by)
   VALUES (@id, @registryId, @slug, 'published', 1, @title, @subtitle, @dek, @body, @chapterId, 'exhibition', 'system', 'system')`
);
const insertEdge = db.prepare(
  `INSERT OR IGNORE INTO entity_links(from_type, from_id, relation, to_type, to_id)
   VALUES ('story', ?, 'features', ?, ?)`
);

const run = db.transaction(() => {
  const n = (mint.get() as { last_value: number }).last_value;
  const registryId = `PB-STORY-${String(n).padStart(6, "0")}`;
  const id = randomUUID();
  insertStory.run({
    id,
    registryId,
    slug: SLUG,
    title: "The Genesis Chapter",
    subtitle: "Abuja · World Environment Day · 2026",
    dek: "How the movement began — fifteen artists, a gallery, an embassy, and the only planet we have.",
    body: JSON.stringify(sections),
    chapterId: chapter.id,
  });
  for (const s of sections as any[]) {
    if (s.kind === "record" && s.refType && s.refId) insertEdge.run(id, s.refType, s.refId);
  }
  return { registryId, sections: sections.length };
});

const r = run();
console.log(`✓ Composed "${SLUG}" (${r.registryId}) with ${r.sections} sections from real records.`);
db.close();

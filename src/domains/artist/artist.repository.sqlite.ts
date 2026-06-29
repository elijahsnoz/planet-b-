import "server-only";
/**
 * SqliteArtistRepository — the cultural-facet reads (stories, collaborators,
 * materials, themes) and the artist directory. Swapped for Postgres later.
 */
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type { ArtistRepository } from "./artist.repository";
import type { ArtistStoryRef, ArtistSummary, Collaborator } from "./artist.types";

export class SqliteArtistRepository implements ArtistRepository {
  list(opts: { q?: string } = {}): ArtistSummary[] {
    // distinct people who hold at least one artwork
    const artistIds = new Set(
      db
        .select({ artistId: t.artworks.artistId })
        .from(t.artworks)
        .all()
        .map((r) => r.artistId)
        .filter((x): x is string => !!x)
    );
    if (artistIds.size === 0) return [];
    const rows = db
      .select({
        id: t.people.id,
        slug: t.people.slug,
        name: t.people.fullName,
        primaryRole: t.people.primaryRole,
        passportId: t.passports.passportId,
      })
      .from(t.people)
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(inArray(t.people.id, [...artistIds]))
      .orderBy(t.people.fullName)
      .all();
    let list = rows.map((r) => {
      const artworkCount = db
        .select({ id: t.artworks.id })
        .from(t.artworks)
        .where(eq(t.artworks.artistId, r.id))
        .all().length;
      const genesis = db
        .select({ id: t.certificates.id })
        .from(t.certificates)
        .innerJoin(t.chapters, eq(t.chapters.id, t.certificates.chapterId))
        .where(
          and(
            eq(t.certificates.personId, r.id),
            eq(t.chapters.isGenesis, true),
            eq(t.certificates.roleAtIssue, "Founding Artist")
          )
        )
        .get();
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        primaryRole: r.primaryRole,
        passportId: r.passportId ?? null,
        artworkCount,
        isGenesisContributor: !!genesis,
      } satisfies ArtistSummary;
    });
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }

  personIdBySlug(slug: string): string | null {
    return db.select({ id: t.people.id }).from(t.people).where(eq(t.people.slug, slug)).get()?.id ?? null;
  }

  storiesFor(personId: string, artworkIds: string[]): ArtistStoryRef[] {
    const targets: Array<{ type: string; id: string }> = [
      { type: "person", id: personId },
      ...artworkIds.map((id) => ({ type: "artwork", id })),
    ];
    const seen = new Set<string>();
    const out: ArtistStoryRef[] = [];
    for (const tgt of targets) {
      db.select({ id: t.stories.id, slug: t.stories.slug, title: t.stories.title, dek: t.stories.dek, status: t.stories.status })
        .from(t.entityLinks)
        .innerJoin(t.stories, eq(t.stories.id, t.entityLinks.fromId))
        .where(
          and(
            eq(t.entityLinks.fromType, "story"),
            eq(t.entityLinks.relation, "features"),
            eq(t.entityLinks.toType, tgt.type),
            eq(t.entityLinks.toId, tgt.id)
          )
        )
        .all()
        .filter((s) => s.status === "published" && !seen.has(s.id))
        .forEach((s) => {
          seen.add(s.id);
          out.push({ slug: s.slug, title: s.title, dek: s.dek });
        });
    }
    return out;
  }

  collaboratorsFor(personId: string): Collaborator[] {
    // chapters this person exhibited in (via their artworks)
    const chapterIds = new Set(
      db
        .select({ chapterId: t.artworks.chapterId })
        .from(t.artworks)
        .where(eq(t.artworks.artistId, personId))
        .all()
        .map((r) => r.chapterId)
        .filter((x): x is string => !!x)
    );
    if (chapterIds.size === 0) return [];
    // other artists who exhibited in those chapters
    const otherIds = new Set(
      db
        .select({ artistId: t.artworks.artistId, chapterId: t.artworks.chapterId })
        .from(t.artworks)
        .where(and(inArray(t.artworks.chapterId, [...chapterIds]), ne(t.artworks.artistId, personId)))
        .all()
        .map((r) => r.artistId)
        .filter((x): x is string => !!x)
    );
    if (otherIds.size === 0) return [];
    return db
      .select({ id: t.people.id, slug: t.people.slug, name: t.people.fullName, passportId: t.passports.passportId })
      .from(t.people)
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(inArray(t.people.id, [...otherIds]))
      .orderBy(t.people.fullName)
      .all()
      .map((r) => ({ id: r.id, slug: r.slug, name: r.name, passportId: r.passportId ?? null }));
  }

  materialsFor(personId: string): string[] {
    const rows = db
      .select({ materials: t.artworks.materials })
      .from(t.artworks)
      .where(eq(t.artworks.artistId, personId))
      .all();
    const set = new Set<string>();
    for (const r of rows) for (const m of (r.materials as string[] | null) ?? []) set.add(m);
    return [...set].sort();
  }

  themesFor(personId: string): string[] {
    const rows = db
      .select({ theme: t.chapters.theme })
      .from(t.artworks)
      .innerJoin(t.chapters, eq(t.chapters.id, t.artworks.chapterId))
      .where(eq(t.artworks.artistId, personId))
      .all();
    const set = new Set<string>();
    for (const r of rows) if (r.theme) set.add(r.theme);
    return [...set];
  }
}

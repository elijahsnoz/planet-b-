import "server-only";
/**
 * SqliteArtworkRepository — better-sqlite3 implementation. Swapped for Postgres
 * later (ADR-0001).
 */
import { and, asc, eq } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type { ArtworkRepository } from "./artwork.repository";
import type {
  ArtworkCertificate,
  ArtworkRefLite,
  ArtworkRow,
  ArtworkStoryRef,
  ArtworkSummary,
  NewProvenanceEvent,
  ProvenanceEvent,
  ProvenanceKind,
} from "./artwork.types";
import type { LifecycleStatus } from "@shared/index";

function toRow(r: any): ArtworkRow {
  return {
    id: r.id,
    registryId: r.registryId,
    slug: r.slug,
    status: r.status as LifecycleStatus,
    verified: !!r.verified,
    title: r.title,
    titleVariant: r.titleVariant,
    artistId: r.artistId,
    chapterId: r.chapterId,
    medium: r.medium,
    dimensions: r.dimensions,
    year: r.year,
    statement: r.statement,
    significance: r.significance,
    materials: Array.isArray(r.materials) ? (r.materials as string[]) : [],
    primaryMedia: r.primaryMedia,
    exhibitorRole: r.exhibitorRole,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    archivedAt: r.archivedAt,
  };
}

function toProvenance(r: any): ProvenanceEvent {
  return {
    id: r.id,
    artworkId: r.artworkId,
    kind: r.kind as ProvenanceKind,
    title: r.title,
    description: r.description,
    occurredOn: r.occurredOn,
    chapterId: r.chapterId,
    organizationId: r.organizationId,
    actorPersonId: r.actorPersonId,
    source: r.source,
    verified: !!r.verified,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    archivedAt: r.archivedAt,
  };
}

export class SqliteArtworkRepository implements ArtworkRepository {
  getById(id: string): ArtworkRow | null {
    const r = db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
    return r ? toRow(r) : null;
  }
  getBySlug(slug: string): ArtworkRow | null {
    const r = db.select().from(t.artworks).where(eq(t.artworks.slug, slug)).get();
    return r ? toRow(r) : null;
  }

  list(opts: { q?: string; chapterId?: string } = {}): ArtworkSummary[] {
    let rows = db
      .select({
        id: t.artworks.id,
        slug: t.artworks.slug,
        title: t.artworks.title,
        year: t.artworks.year,
        status: t.artworks.status,
        chapterId: t.artworks.chapterId,
        artistName: t.people.fullName,
        chapterName: t.chapters.name,
      })
      .from(t.artworks)
      .leftJoin(t.people, eq(t.people.id, t.artworks.artistId))
      .leftJoin(t.chapters, eq(t.chapters.id, t.artworks.chapterId))
      .orderBy(t.artworks.title)
      .all();
    if (opts.chapterId) rows = rows.filter((r) => r.chapterId === opts.chapterId);
    if (opts.q) {
      const q = opts.q.toLowerCase();
      rows = rows.filter((r) => r.title.toLowerCase().includes(q));
    }
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      year: r.year,
      status: r.status as LifecycleStatus,
      artistName: r.artistName,
      chapterName: r.chapterName,
      provenanceCount: this.listProvenance(r.id).length,
    }));
  }

  artistFor(artistId: string | null): (ArtworkRefLite & { passportId: string | null }) | null {
    if (!artistId) return null;
    const r = db
      .select({ id: t.people.id, slug: t.people.slug, name: t.people.fullName, passportId: t.passports.passportId })
      .from(t.people)
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(eq(t.people.id, artistId))
      .get();
    return r ? { id: r.id, slug: r.slug, name: r.name, passportId: r.passportId ?? null } : null;
  }

  chapterFor(chapterId: string | null): ArtworkRefLite | null {
    if (!chapterId) return null;
    const r = db.select({ id: t.chapters.id, slug: t.chapters.slug, name: t.chapters.name }).from(t.chapters).where(eq(t.chapters.id, chapterId)).get();
    return r ?? null;
  }

  certificatesFor(artworkId: string): ArtworkCertificate[] {
    return db
      .select({ id: t.certificates.id, publicId: t.certificates.publicId, roleAtIssue: t.certificates.roleAtIssue, status: t.certificates.status })
      .from(t.certificates)
      .where(eq(t.certificates.artworkId, artworkId))
      .all();
  }

  storiesFeaturing(artworkId: string): ArtworkStoryRef[] {
    return db
      .select({ slug: t.stories.slug, title: t.stories.title, dek: t.stories.dek, status: t.stories.status })
      .from(t.entityLinks)
      .innerJoin(t.stories, eq(t.stories.id, t.entityLinks.fromId))
      .where(
        and(
          eq(t.entityLinks.fromType, "story"),
          eq(t.entityLinks.toType, "artwork"),
          eq(t.entityLinks.toId, artworkId),
          eq(t.entityLinks.relation, "features")
        )
      )
      .all()
      .filter((s) => s.status === "published")
      .map((s) => ({ slug: s.slug, title: s.title, dek: s.dek }));
  }

  listProvenance(artworkId: string, includeArchived = false): ProvenanceEvent[] {
    const rows = db
      .select()
      .from(t.provenanceEvents)
      .where(eq(t.provenanceEvents.artworkId, artworkId))
      .orderBy(asc(t.provenanceEvents.occurredOn), asc(t.provenanceEvents.sortOrder))
      .all();
    return rows.filter((r) => includeArchived || !r.archivedAt).map(toProvenance);
  }

  getProvenance(id: string): ProvenanceEvent | null {
    const r = db.select().from(t.provenanceEvents).where(eq(t.provenanceEvents.id, id)).get();
    return r ? toProvenance(r) : null;
  }

  addProvenance(id: string, e: NewProvenanceEvent, actor: string): void {
    db.insert(t.provenanceEvents)
      .values({
        id,
        artworkId: e.artworkId,
        kind: e.kind,
        title: e.title,
        description: e.description ?? null,
        occurredOn: e.occurredOn ?? null,
        chapterId: e.chapterId ?? null,
        organizationId: e.organizationId ?? null,
        source: e.source ?? null,
        verified: e.verified ?? false,
        createdBy: actor,
        updatedBy: actor,
      })
      .run();
  }

  archiveProvenance(id: string, at: string | null): void {
    db.update(t.provenanceEvents)
      .set({ archivedAt: at, updatedAt: new Date().toISOString() })
      .where(eq(t.provenanceEvents.id, id))
      .run();
  }
}

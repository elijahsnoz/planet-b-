import "server-only";
/**
 * SqliteStoryRepository — better-sqlite3 implementation. Persists the story row +
 * section body, keeps `entity_links` (relation 'features') in sync with the
 * record sections so Stories live in the knowledge graph, and resolves record
 * references to live display data. Swapped for Postgres later (ADR-0001).
 */
import { and, desc, eq } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type {
  NewStoryRow,
  StoryMetaPatch,
  StoryRepository,
} from "./story.repository";
import type {
  ResolvedRef,
  StoryKind,
  StoryRefType,
  StoryRow,
  StorySection,
  StorySummary,
} from "./story.types";
import type { LifecycleStatus } from "@shared/index";

const FEATURES = "features";

function toRow(r: any): StoryRow {
  const body = Array.isArray(r.body) ? (r.body as StorySection[]) : [];
  return {
    id: r.id,
    registryId: r.registryId,
    slug: r.slug,
    status: r.status as LifecycleStatus,
    verified: !!r.verified,
    title: r.title,
    subtitle: r.subtitle,
    dek: r.dek,
    body,
    coverMedia: r.coverMedia,
    chapterId: r.chapterId,
    kind: r.kind as StoryKind,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    archivedAt: r.archivedAt,
  };
}

export class SqliteStoryRepository implements StoryRepository {
  getById(id: string): StoryRow | null {
    const r = db.select().from(t.stories).where(eq(t.stories.id, id)).get();
    return r ? toRow(r) : null;
  }
  getBySlug(slug: string): StoryRow | null {
    const r = db.select().from(t.stories).where(eq(t.stories.slug, slug)).get();
    return r ? toRow(r) : null;
  }
  slugExists(slug: string): boolean {
    return !!db.select({ id: t.stories.id }).from(t.stories).where(eq(t.stories.slug, slug)).get();
  }

  list(opts: { status?: string; kind?: string } = {}): StorySummary[] {
    const rows = db
      .select({
        id: t.stories.id,
        slug: t.stories.slug,
        registryId: t.stories.registryId,
        title: t.stories.title,
        dek: t.stories.dek,
        kind: t.stories.kind,
        status: t.stories.status,
        body: t.stories.body,
        updatedAt: t.stories.updatedAt,
        chapterName: t.chapters.name,
      })
      .from(t.stories)
      .leftJoin(t.chapters, eq(t.chapters.id, t.stories.chapterId))
      .orderBy(desc(t.stories.updatedAt))
      .all();
    return rows
      .filter((r) => (opts.status ? r.status === opts.status : true))
      .filter((r) => (opts.kind ? r.kind === opts.kind : true))
      .map((r) => {
        const body = Array.isArray(r.body) ? (r.body as StorySection[]) : [];
        return {
          id: r.id,
          slug: r.slug,
          registryId: r.registryId,
          title: r.title,
          dek: r.dek,
          kind: r.kind as StoryKind,
          status: r.status as LifecycleStatus,
          chapterName: r.chapterName,
          sectionCount: body.length,
          recordCount: body.filter((s) => s.kind === "record" && s.refId).length,
          updatedAt: r.updatedAt,
        };
      });
  }

  insert(row: NewStoryRow): void {
    db.insert(t.stories)
      .values({
        id: row.id,
        registryId: row.registryId,
        slug: row.slug,
        title: row.title,
        dek: row.dek ?? null,
        subtitle: row.subtitle ?? null,
        kind: row.kind,
        chapterId: row.chapterId ?? null,
        body: [],
        createdBy: row.createdBy ?? null,
        updatedBy: row.createdBy ?? null,
      })
      .run();
  }

  updateMeta(id: string, patch: StoryMetaPatch): void {
    db.update(t.stories)
      .set({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle } : {}),
        ...(patch.dek !== undefined ? { dek: patch.dek } : {}),
        ...(patch.kind ? { kind: patch.kind } : {}),
        ...(patch.chapterId !== undefined ? { chapterId: patch.chapterId } : {}),
        ...(patch.coverMedia !== undefined ? { coverMedia: patch.coverMedia } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        updatedBy: patch.updatedBy ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(t.stories.id, id))
      .run();
  }

  setSections(id: string, sections: StorySection[]): void {
    // 1. persist the ordered body
    db.update(t.stories)
      .set({ body: sections, updatedAt: new Date().toISOString() })
      .where(eq(t.stories.id, id))
      .run();
    // 2. re-sync the knowledge-graph edges (relation 'features')
    db.delete(t.entityLinks)
      .where(
        and(
          eq(t.entityLinks.fromType, "story"),
          eq(t.entityLinks.fromId, id),
          eq(t.entityLinks.relation, FEATURES)
        )
      )
      .run();
    const seen = new Set<string>();
    for (const s of sections) {
      if (s.kind !== "record" || !s.refType || !s.refId) continue;
      const key = `${s.refType}:${s.refId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      db.insert(t.entityLinks)
        .values({ fromType: "story", fromId: id, relation: FEATURES, toType: s.refType, toId: s.refId })
        .onConflictDoNothing()
        .run();
    }
  }

  chapterName(chapterId: string | null): string | null {
    if (!chapterId) return null;
    return db.select({ name: t.chapters.name }).from(t.chapters).where(eq(t.chapters.id, chapterId)).get()?.name ?? null;
  }
  chapterSlug(chapterId: string | null): string | null {
    if (!chapterId) return null;
    return db.select({ slug: t.chapters.slug }).from(t.chapters).where(eq(t.chapters.id, chapterId)).get()?.slug ?? null;
  }

  resolveRef(refType: StoryRefType, refId: string): ResolvedRef {
    const miss = (): ResolvedRef => ({ refType, refId, label: "(missing record)", sub: null, href: null, found: false });
    switch (refType) {
      case "chapter": {
        const r = db.select({ name: t.chapters.name, slug: t.chapters.slug }).from(t.chapters).where(eq(t.chapters.id, refId)).get();
        return r ? { refType, refId, label: r.name, sub: "Chapter", href: r.slug ? `/chapters/${r.slug}` : null, found: true } : miss();
      }
      case "person": {
        const r = db
          .select({ name: t.people.fullName, slug: t.people.slug, role: t.people.primaryRole, passportId: t.passports.passportId, consent: t.people.consentStatus, status: t.people.status })
          .from(t.people)
          .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
          .where(eq(t.people.id, refId))
          .get();
        if (!r) return miss();
        const href = r.passportId && r.consent === "granted" && r.status === "published" ? `/passport/${r.passportId}` : r.slug ? `/artists/${r.slug}` : null;
        return { refType, refId, label: r.name, sub: r.role ?? "Contributor", href, found: true };
      }
      case "artwork": {
        const r = db.select({ title: t.artworks.title, slug: t.artworks.slug, year: t.artworks.year }).from(t.artworks).where(eq(t.artworks.id, refId)).get();
        return r ? { refType, refId, label: r.title, sub: r.year ? String(r.year) : "Artwork", href: r.slug ? `/artworks/${r.slug}` : null, found: true } : miss();
      }
      case "certificate": {
        const r = db.select({ publicId: t.certificates.publicId, role: t.certificates.roleAtIssue }).from(t.certificates).where(eq(t.certificates.id, refId)).get();
        return r ? { refType, refId, label: r.publicId, sub: r.role, href: `/verify?q=${encodeURIComponent(r.publicId)}`, found: true } : miss();
      }
      case "media": {
        const r = db.select({ title: t.media.title, alt: t.media.altText, path: t.media.storagePath, kind: t.media.kind }).from(t.media).where(eq(t.media.id, refId)).get();
        return r ? { refType, refId, label: r.title ?? r.alt ?? "Media", sub: r.kind, href: r.path, found: true } : miss();
      }
      case "timeline": {
        const r = db.select({ title: t.timelineEvents.title, date: t.timelineEvents.eventDate, phase: t.timelineEvents.phase }).from(t.timelineEvents).where(eq(t.timelineEvents.id, refId)).get();
        return r ? { refType, refId, label: r.title, sub: r.date ?? r.phase ?? "Timeline", href: null, found: true } : miss();
      }
      case "press": {
        const r = db.select({ title: t.press.title, outlet: t.press.outlet, url: t.press.url }).from(t.press).where(eq(t.press.id, refId)).get();
        return r ? { refType, refId, label: r.title ?? r.outlet, sub: r.outlet, href: r.url, found: true } : miss();
      }
      case "organization": {
        const r = db.select({ name: t.organizations.name, slug: t.organizations.slug, type: t.organizations.type }).from(t.organizations).where(eq(t.organizations.id, refId)).get();
        return r ? { refType, refId, label: r.name, sub: r.type ?? "Organization", href: "/partners", found: true } : miss();
      }
      case "impact": {
        const r = db.select({ metric: t.impactMetrics.metric, value: t.impactMetrics.value, unit: t.impactMetrics.unit }).from(t.impactMetrics).where(eq(t.impactMetrics.id, refId)).get();
        return r ? { refType, refId, label: `${r.value}${r.unit ? " " + r.unit : ""}`, sub: r.metric, href: null, found: true } : miss();
      }
      default:
        return miss();
    }
  }
}

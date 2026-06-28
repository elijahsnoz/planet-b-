import "server-only";
/**
 * SqliteChapterRepository — better-sqlite3 implementation. Reads the
 * chapter-scoped data (people, artworks, certificates, timeline, press, impact,
 * council, partners) that emerges from a chapter. Swapped for Postgres later.
 */
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type { ChapterRepository } from "./chapter.repository";
import type {
  ChapterArtworkRef,
  ChapterParticipation,
  ChapterPartner,
  ChapterPatch,
  ChapterPerson,
  ChapterRow,
  ChapterSummary,
  CouncilEntry,
  ImpactEntry,
  PressEntry,
  TimelineEntry,
  YorubaProverb,
} from "./chapter.types";
import type { LifecycleStatus } from "@shared/index";

const RELATION_LABEL: Record<string, string> = {
  hosted_by: "Host",
  sponsored_by: "Sponsor",
  partnered_with: "Partner",
};

function toRow(r: any): ChapterRow {
  return {
    id: r.id,
    registryId: r.registryId,
    slug: r.slug,
    status: r.status as LifecycleStatus,
    verified: !!r.verified,
    name: r.name,
    city: r.city,
    country: r.country,
    isGenesis: !!r.isGenesis,
    immutable: !!r.immutable,
    movement: r.movement,
    theme: r.theme,
    eventName: r.eventName,
    openedOn: r.openedOn,
    endedOn: r.endedOn,
    venue: r.venue,
    summary: r.summary,
    yorubaProverbs: (r.yorubaProverbs ?? null) as YorubaProverb[] | null,
    heroMedia: r.heroMedia,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    archivedAt: r.archivedAt,
  };
}

/** personId → roles, drawn from certificates (role_at_issue) + artworks (Artist). */
function rolesByPerson(chapterId: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (pid: string | null, role: string) => {
    if (!pid) return;
    if (!map.has(pid)) map.set(pid, new Set());
    map.get(pid)!.add(role);
  };
  db.select({ personId: t.certificates.personId, role: t.certificates.roleAtIssue })
    .from(t.certificates)
    .where(and(eq(t.certificates.chapterId, chapterId), isNotNull(t.certificates.personId)))
    .all()
    .forEach((r) => add(r.personId, r.role));
  db.select({ artistId: t.artworks.artistId })
    .from(t.artworks)
    .where(and(eq(t.artworks.chapterId, chapterId), isNotNull(t.artworks.artistId)))
    .all()
    .forEach((r) => add(r.artistId, "Artist"));
  return map;
}

export class SqliteChapterRepository implements ChapterRepository {
  getById(id: string): ChapterRow | null {
    const r = db.select().from(t.chapters).where(eq(t.chapters.id, id)).get();
    return r ? toRow(r) : null;
  }
  getBySlug(slug: string): ChapterRow | null {
    const r = db.select().from(t.chapters).where(eq(t.chapters.slug, slug)).get();
    return r ? toRow(r) : null;
  }

  list(): ChapterSummary[] {
    const rows = db.select().from(t.chapters).orderBy(desc(t.chapters.isGenesis), t.chapters.openedOn).all();
    return rows.map((r) => {
      const roles = rolesByPerson(r.id);
      const artworks = db
        .select({ id: t.artworks.id })
        .from(t.artworks)
        .where(eq(t.artworks.chapterId, r.id))
        .all().length;
      const certificates = this.certificateCount(r.id);
      const row = toRow(r);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        city: row.city,
        country: row.country,
        status: row.status,
        isGenesis: row.isGenesis,
        openedOn: row.openedOn,
        endedOn: row.endedOn,
        counts: { artists: roles.size, artworks, certificates },
      };
    });
  }

  update(id: string, patch: ChapterPatch): void {
    db.update(t.chapters)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.country !== undefined ? { country: patch.country } : {}),
        ...(patch.venue !== undefined ? { venue: patch.venue } : {}),
        ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
        ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
        ...(patch.openedOn !== undefined ? { openedOn: patch.openedOn } : {}),
        ...(patch.endedOn !== undefined ? { endedOn: patch.endedOn } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        updatedBy: patch.updatedBy ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(t.chapters.id, id))
      .run();
  }

  partnersFor(chapterId: string): ChapterPartner[] {
    return db
      .select({
        id: t.organizations.id,
        slug: t.organizations.slug,
        name: t.organizations.name,
        type: t.organizations.type,
        relation: t.entityLinks.relation,
      })
      .from(t.entityLinks)
      .innerJoin(t.organizations, eq(t.organizations.id, t.entityLinks.toId))
      .where(
        and(
          eq(t.entityLinks.fromType, "chapter"),
          eq(t.entityLinks.fromId, chapterId),
          eq(t.entityLinks.toType, "organization")
        )
      )
      .all()
      .map((r) => ({ ...r, label: RELATION_LABEL[r.relation] ?? "Partner" }));
  }

  peopleFor(chapterId: string): ChapterPerson[] {
    const roles = rolesByPerson(chapterId);
    const ids = [...roles.keys()];
    if (ids.length === 0) return [];
    const people = db
      .select({
        id: t.people.id,
        slug: t.people.slug,
        name: t.people.fullName,
        passportId: t.passports.passportId,
      })
      .from(t.people)
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(inArray(t.people.id, ids))
      .all();
    return people
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        passportId: p.passportId ?? null,
        roles: [...(roles.get(p.id) ?? new Set<string>())],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  artworksFor(chapterId: string): ChapterArtworkRef[] {
    return db
      .select({
        id: t.artworks.id,
        slug: t.artworks.slug,
        title: t.artworks.title,
        year: t.artworks.year,
        status: t.artworks.status,
        artistName: t.people.fullName,
      })
      .from(t.artworks)
      .leftJoin(t.people, eq(t.people.id, t.artworks.artistId))
      .where(eq(t.artworks.chapterId, chapterId))
      .orderBy(t.artworks.title)
      .all();
  }

  timelineFor(chapterId: string): TimelineEntry[] {
    return db
      .select({
        id: t.timelineEvents.id,
        phase: t.timelineEvents.phase,
        title: t.timelineEvents.title,
        eventDate: t.timelineEvents.eventDate,
        description: t.timelineEvents.description,
        sortOrder: t.timelineEvents.sortOrder,
      })
      .from(t.timelineEvents)
      .where(eq(t.timelineEvents.chapterId, chapterId))
      .orderBy(t.timelineEvents.sortOrder)
      .all();
  }

  pressFor(chapterId: string): PressEntry[] {
    return db
      .select({
        id: t.press.id,
        outlet: t.press.outlet,
        title: t.press.title,
        url: t.press.url,
        publishedOn: t.press.publishedOn,
      })
      .from(t.press)
      .where(eq(t.press.chapterId, chapterId))
      .all();
  }

  impactFor(chapterId: string): ImpactEntry[] {
    return db
      .select({
        id: t.impactMetrics.id,
        metric: t.impactMetrics.metric,
        value: t.impactMetrics.value,
        unit: t.impactMetrics.unit,
        asOf: t.impactMetrics.asOf,
        verified: t.impactMetrics.verified,
      })
      .from(t.impactMetrics)
      .where(eq(t.impactMetrics.chapterId, chapterId))
      .all()
      .map((r) => ({ ...r, verified: !!r.verified }));
  }

  councilFor(chapterId: string): CouncilEntry[] {
    return db
      .select({
        personId: t.foundingCouncil.personId,
        personName: t.people.fullName,
        councilCategory: t.foundingCouncil.councilCategory,
        citation: t.foundingCouncil.citation,
        isCharterMember: t.foundingCouncil.isCharterMember,
      })
      .from(t.foundingCouncil)
      .leftJoin(t.people, eq(t.people.id, t.foundingCouncil.personId))
      .where(eq(t.foundingCouncil.chapterId, chapterId))
      .orderBy(t.foundingCouncil.sortOrder)
      .all()
      .map((r) => ({ ...r, isCharterMember: !!r.isCharterMember }));
  }

  certificateCount(chapterId: string): number {
    return db
      .select({ id: t.certificates.id })
      .from(t.certificates)
      .where(eq(t.certificates.chapterId, chapterId))
      .all().length;
  }

  participationFor(personId: string): ChapterParticipation[] {
    const roles = new Map<string, Set<string>>();
    const add = (cid: string | null, role: string) => {
      if (!cid) return;
      if (!roles.has(cid)) roles.set(cid, new Set());
      roles.get(cid)!.add(role);
    };
    db.select({ chapterId: t.certificates.chapterId, role: t.certificates.roleAtIssue })
      .from(t.certificates)
      .where(and(eq(t.certificates.personId, personId), isNotNull(t.certificates.chapterId)))
      .all()
      .forEach((r) => add(r.chapterId, r.role));
    db.select({ chapterId: t.artworks.chapterId })
      .from(t.artworks)
      .where(and(eq(t.artworks.artistId, personId), isNotNull(t.artworks.chapterId)))
      .all()
      .forEach((r) => add(r.chapterId, "Artist"));

    const ids = [...roles.keys()];
    if (ids.length === 0) return [];
    const chapters = db
      .select({ id: t.chapters.id, slug: t.chapters.slug, name: t.chapters.name, isGenesis: t.chapters.isGenesis })
      .from(t.chapters)
      .where(inArray(t.chapters.id, ids))
      .all();
    return chapters.map((c) => ({
      chapterId: c.id,
      chapterSlug: c.slug,
      chapterName: c.name,
      isGenesis: !!c.isGenesis,
      roles: [...(roles.get(c.id) ?? new Set<string>())],
    }));
  }
}

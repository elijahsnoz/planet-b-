import "server-only";
/**
 * SqlitePassportRepository — better-sqlite3 implementation. Swapped for Postgres
 * later (ADR-0001) with no change to PassportService.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type {
  ContributionPatch,
  PassportBase,
  PassportPatch,
  PassportRepository,
} from "./passport.repository";
import type {
  ChapterRef,
  ContributionView,
  NewContribution,
  PassportArtwork,
  PassportPerson,
  PassportRow,
  PassportStatus,
  PassportSummary,
} from "./passport.types";

function toPassportRow(r: any): PassportRow {
  return {
    id: r.id,
    registryId: r.registryId,
    passportId: r.passportId,
    personId: r.personId,
    country: r.country,
    passportStatus: r.passportStatus as PassportStatus,
    institutionalNote: r.institutionalNote,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    archivedAt: r.archivedAt,
  };
}
function toPerson(r: any): PassportPerson {
  return {
    id: r.personId,
    slug: r.personSlug,
    fullName: r.fullName,
    displayName: r.displayName,
    honorific: r.honorific,
    primaryRole: r.primaryRole,
    roles: (r.roles ?? []) as string[],
    shortBio: r.shortBio,
    bio: r.bio,
    portraitMedia: r.portraitMedia,
    consentStatus: r.consentStatus,
    status: r.status,
  };
}

function baseSelect() {
  return db
    .select({
      id: t.passports.id,
      registryId: t.passports.registryId,
      passportId: t.passports.passportId,
      personId: t.passports.personId,
      country: t.passports.country,
      passportStatus: t.passports.passportStatus,
      institutionalNote: t.passports.institutionalNote,
      createdAt: t.passports.createdAt,
      updatedAt: t.passports.updatedAt,
      archivedAt: t.passports.archivedAt,
      personSlug: t.people.slug,
      fullName: t.people.fullName,
      displayName: t.people.displayName,
      honorific: t.people.honorific,
      primaryRole: t.people.primaryRole,
      roles: t.people.roles,
      shortBio: t.people.shortBio,
      bio: t.people.bio,
      portraitMedia: t.people.portraitMedia,
      consentStatus: t.people.consentStatus,
      status: t.people.status,
    })
    .from(t.passports)
    .innerJoin(t.people, eq(t.people.id, t.passports.personId));
}

function hydrate(r: any | undefined): PassportBase | null {
  return r ? { passport: toPassportRow(r), person: toPerson(r) } : null;
}

export class SqlitePassportRepository implements PassportRepository {
  getByUuid(id: string): PassportBase | null {
    return hydrate(baseSelect().where(eq(t.passports.id, id)).get());
  }
  getByPassportId(passportId: string): PassportBase | null {
    return hydrate(baseSelect().where(eq(t.passports.passportId, passportId)).get());
  }
  getByPersonId(personId: string): PassportBase | null {
    return hydrate(baseSelect().where(eq(t.passports.personId, personId)).get());
  }
  getByPersonSlug(slug: string): PassportBase | null {
    return hydrate(baseSelect().where(eq(t.people.slug, slug)).get());
  }

  list(opts: { q?: string; status?: PassportStatus } = {}): PassportSummary[] {
    const rows = baseSelect().orderBy(t.passports.passportId).all();
    let list = rows.map((r) => {
      const personId = r.personId;
      const certificates = db
        .select({ id: t.certificates.id })
        .from(t.certificates)
        .where(eq(t.certificates.personId, personId))
        .all();
      const artworks = db
        .select({ id: t.artworks.id })
        .from(t.artworks)
        .where(eq(t.artworks.artistId, personId))
        .all();
      const contributions = db
        .select({ id: t.contributions.id })
        .from(t.contributions)
        .where(and(eq(t.contributions.personId, personId), isNull(t.contributions.archivedAt)))
        .all();
      const isGenesisContributor = db
        .select({ id: t.certificates.id })
        .from(t.certificates)
        .innerJoin(t.chapters, eq(t.chapters.id, t.certificates.chapterId))
        .where(
          and(
            eq(t.certificates.personId, personId),
            eq(t.chapters.isGenesis, true),
            eq(t.certificates.roleAtIssue, "Founding Artist")
          )
        )
        .get();
      const s: PassportSummary = {
        id: r.id,
        passportId: r.passportId,
        personId,
        personName: r.fullName,
        personSlug: r.personSlug,
        country: r.country,
        passportStatus: r.passportStatus as PassportStatus,
        consentStatus: r.consentStatus,
        isGenesisContributor: !!isGenesisContributor,
        counts: {
          certificates: certificates.length,
          artworks: artworks.length,
          contributions: contributions.length,
        },
      };
      return s;
    });
    if (opts.status) list = list.filter((p) => p.passportStatus === opts.status);
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter(
        (p) => p.personName.toLowerCase().includes(q) || p.passportId.toLowerCase().includes(q)
      );
    }
    return list;
  }

  ensureForPerson(personId: string, passportId: string): PassportBase {
    const existing = this.getByPersonId(personId);
    if (existing) return existing;
    db.insert(t.passports)
      .values({ id: randomUUID(), registryId: passportId, passportId, personId })
      .run();
    return this.getByPersonId(personId)!;
  }

  update(id: string, patch: PassportPatch): void {
    db.update(t.passports)
      .set({
        ...(patch.country !== undefined ? { country: patch.country } : {}),
        ...(patch.passportStatus ? { passportStatus: patch.passportStatus } : {}),
        ...(patch.institutionalNote !== undefined ? { institutionalNote: patch.institutionalNote } : {}),
        updatedBy: patch.updatedBy ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(t.passports.id, id))
      .run();
  }

  artworksForPerson(personId: string): PassportArtwork[] {
    return db
      .select({
        id: t.artworks.id,
        slug: t.artworks.slug,
        title: t.artworks.title,
        year: t.artworks.year,
        status: t.artworks.status,
        chapterName: t.chapters.name,
      })
      .from(t.artworks)
      .leftJoin(t.chapters, eq(t.chapters.id, t.artworks.chapterId))
      .where(eq(t.artworks.artistId, personId))
      .orderBy(t.artworks.title)
      .all();
  }

  chaptersForPerson(personId: string): ChapterRef[] {
    const seen = new Map<string, ChapterRef>();
    const add = (slug: string | null, name: string | null) => {
      if (name && !seen.has(name)) seen.set(name, { slug, name });
    };
    db.select({ slug: t.chapters.slug, name: t.chapters.name })
      .from(t.artworks)
      .innerJoin(t.chapters, eq(t.chapters.id, t.artworks.chapterId))
      .where(eq(t.artworks.artistId, personId))
      .all()
      .forEach((r) => add(r.slug, r.name));
    db.select({ slug: t.chapters.slug, name: t.chapters.name })
      .from(t.certificates)
      .innerJoin(t.chapters, eq(t.chapters.id, t.certificates.chapterId))
      .where(eq(t.certificates.personId, personId))
      .all()
      .forEach((r) => add(r.slug, r.name));
    return [...seen.values()];
  }

  listContributions(personId: string, includeArchived = false): ContributionView[] {
    const rows = db
      .select({
        id: t.contributions.id,
        personId: t.contributions.personId,
        kind: t.contributions.kind,
        title: t.contributions.title,
        description: t.contributions.description,
        occurredOn: t.contributions.occurredOn,
        chapterId: t.contributions.chapterId,
        source: t.contributions.source,
        verified: t.contributions.verified,
        sortOrder: t.contributions.sortOrder,
        createdAt: t.contributions.createdAt,
        updatedAt: t.contributions.updatedAt,
        archivedAt: t.contributions.archivedAt,
        chapterName: t.chapters.name,
      })
      .from(t.contributions)
      .leftJoin(t.chapters, eq(t.chapters.id, t.contributions.chapterId))
      .where(eq(t.contributions.personId, personId))
      .orderBy(desc(t.contributions.occurredOn))
      .all();
    return rows
      .filter((r) => includeArchived || !r.archivedAt)
      .map((r) => ({ ...r, kind: r.kind as ContributionView["kind"] }));
  }

  getContribution(id: string): ContributionView | null {
    const r = db
      .select({
        id: t.contributions.id,
        personId: t.contributions.personId,
        kind: t.contributions.kind,
        title: t.contributions.title,
        description: t.contributions.description,
        occurredOn: t.contributions.occurredOn,
        chapterId: t.contributions.chapterId,
        source: t.contributions.source,
        verified: t.contributions.verified,
        sortOrder: t.contributions.sortOrder,
        createdAt: t.contributions.createdAt,
        updatedAt: t.contributions.updatedAt,
        archivedAt: t.contributions.archivedAt,
        chapterName: t.chapters.name,
      })
      .from(t.contributions)
      .leftJoin(t.chapters, eq(t.chapters.id, t.contributions.chapterId))
      .where(eq(t.contributions.id, id))
      .get();
    return r ? { ...r, kind: r.kind as ContributionView["kind"] } : null;
  }

  addContribution(id: string, c: NewContribution, actor: string): void {
    db.insert(t.contributions)
      .values({
        id,
        personId: c.personId,
        kind: c.kind,
        title: c.title,
        description: c.description ?? null,
        occurredOn: c.occurredOn ?? null,
        chapterId: c.chapterId ?? null,
        source: c.source ?? null,
        verified: c.verified ?? false,
        createdBy: actor,
        updatedBy: actor,
      })
      .run();
  }

  updateContribution(id: string, patch: ContributionPatch): void {
    db.update(t.contributions)
      .set({ ...patch, updatedAt: new Date().toISOString() } as any)
      .where(eq(t.contributions.id, id))
      .run();
  }

  archiveContribution(id: string, at: string | null): void {
    db.update(t.contributions)
      .set({ archivedAt: at, updatedAt: new Date().toISOString() })
      .where(eq(t.contributions.id, id))
      .run();
  }
}

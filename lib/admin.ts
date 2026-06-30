import "server-only";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { db, schema as t } from "@/db/client";

/** Admin reads — ALL statuses incl. archived (the console manages everything). */

export function listPeople(opts: { q?: string; includeArchived?: boolean } = {}) {
  const rows = db.select().from(t.people).orderBy(desc(t.people.updatedAt)).all();
  return rows
    .filter((r) => opts.includeArchived || !r.archivedAt)
    .filter((r) => !opts.q || r.fullName.toLowerCase().includes(opts.q.toLowerCase()) || (r.registryId ?? "").includes(opts.q));
}

export function getPersonById(id: string) {
  return db.select().from(t.people).where(eq(t.people.id, id)).get();
}

export function listArtworks(opts: { q?: string; includeArchived?: boolean } = {}) {
  const people = new Map(db.select({ id: t.people.id, name: t.people.fullName }).from(t.people).all().map((p) => [p.id, p.name]));
  const rows = db.select().from(t.artworks).orderBy(desc(t.artworks.updatedAt)).all();
  return rows
    .filter((r) => opts.includeArchived || !r.archivedAt)
    .filter((r) => !opts.q || r.title.toLowerCase().includes(opts.q.toLowerCase()) || (r.registryId ?? "").includes(opts.q))
    .map((r) => ({ ...r, artistName: r.artistId ? people.get(r.artistId) ?? "—" : "—" }));
}

export function getArtworkById(id: string) {
  return db.select().from(t.artworks).where(eq(t.artworks.id, id)).get();
}

export function artistOptions() {
  return db.select({ id: t.people.id, name: t.people.fullName }).from(t.people).orderBy(t.people.fullName).all();
}

export function listOrganizations(opts: { q?: string; includeArchived?: boolean } = {}) {
  const rows = db.select().from(t.organizations).orderBy(desc(t.organizations.updatedAt)).all();
  return rows
    .filter((r) => opts.includeArchived || !r.archivedAt)
    .filter((r) => !opts.q || r.name.toLowerCase().includes(opts.q.toLowerCase()) || (r.registryId ?? "").includes(opts.q));
}

export function getOrganizationById(id: string) {
  return db.select().from(t.organizations).where(eq(t.organizations.id, id)).get();
}

export function listMedia() {
  return db.select().from(t.media).orderBy(desc(t.media.updatedAt)).all();
}

export function getMediaById(id: string) {
  return db.select().from(t.media).where(eq(t.media.id, id)).get();
}

export function revisionsFor(entityType: string, entityId: string) {
  return db
    .select()
    .from(t.revisions)
    .where(sql`${t.revisions.entityType} = ${entityType} and ${t.revisions.entityId} = ${entityId}`)
    .orderBy(desc(t.revisions.version))
    .all();
}

export function dashboardCounts() {
  const c = (tbl: any, where?: any) => {
    const q = db.select({ n: sql<number>`count(*)` }).from(tbl);
    return (where ? q.where(where) : q).get()?.n ?? 0;
  };
  return {
    artists: c(t.people),
    artworks: c(t.artworks),
    media: c(t.media),
    organizations: c(t.organizations),
    certificates: c(t.certificates),
    draftArtworks: c(t.artworks, eq(t.artworks.status, "draft")),
    pendingConsent: c(t.people, eq(t.people.consentStatus, "pending")),
  };
}

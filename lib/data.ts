/**
 * Planet B — public read layer (the public-site repository).
 * Reads from SQLite and returns stable view-model shapes the pages consume.
 *
 * IMPORTANT: these are FUNCTIONS (queried per render), not frozen module
 * constants — so edits made in the admin reflect on the public site after
 * revalidation. Only published, non-archived rows are exposed (public projection).
 */
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import performanceJson from "@/data/genesis/performance.json";
import panelJson from "@/data/genesis/panel.json";
import artworksJson from "@/data/genesis/artworks.json";

const PUBLISHED = (tbl: any) => and(eq(tbl.status, "published"), isNull(tbl.archivedAt));
const u = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

export type Person = {
  slug: string; full_name: string; display_name?: string; honorific?: string;
  primary_role?: string; roles: string[]; short_bio?: string;
  consent_status: string; artworks?: string[]; portrait_media?: string;
};
export type Artwork = {
  slug: string; title: string; title_variant?: string; artist: string;
  medium: string; dimensions: string; year: number; statement?: string;
  significance?: string; materials: string[];
};
export type Organization = { slug: string; name: string; type?: string; role?: string; about?: string };

// ── internal helpers ────────────────────────────────────────────────────────
function personSlugById() {
  return new Map(db.select({ id: t.people.id, slug: t.people.slug }).from(t.people).all().map((r) => [r.id, r.slug!]));
}
function orgSlugById() {
  return new Map(db.select({ id: t.organizations.id, slug: t.organizations.slug }).from(t.organizations).all().map((r) => [r.id, r.slug!]));
}
function artworkSlugsByArtist() {
  const m = new Map<string, string[]>();
  for (const r of db.select({ artistId: t.artworks.artistId, slug: t.artworks.slug }).from(t.artworks).where(PUBLISHED(t.artworks)).all()) {
    if (!r.artistId || !r.slug) continue;
    const arr = m.get(r.artistId) ?? [];
    arr.push(r.slug);
    m.set(r.artistId, arr);
  }
  return m;
}
function mapPerson(row: any, awByArtist: Map<string, string[]>): Person {
  return {
    slug: row.slug, full_name: row.fullName, display_name: u(row.displayName), honorific: u(row.honorific),
    primary_role: u(row.primaryRole), roles: row.roles ?? [], short_bio: u(row.shortBio),
    consent_status: row.consentStatus, portrait_media: u(row.portraitMedia), artworks: awByArtist.get(row.id) ?? [],
  };
}
function mapArtwork(row: any, slugByPerson: Map<string, string>): Artwork {
  return {
    slug: row.slug, title: row.title, title_variant: u(row.titleVariant),
    artist: row.artistId ? slugByPerson.get(row.artistId) ?? "" : "",
    medium: row.medium, dimensions: row.dimensions, year: row.year,
    statement: u(row.statement), significance: u(row.significance), materials: row.materials ?? [],
  };
}

// ── people ──────────────────────────────────────────────────────────────────
export function getPeople(): Person[] {
  const aw = artworkSlugsByArtist();
  return db.select().from(t.people).where(PUBLISHED(t.people)).all().map((r) => mapPerson(r, aw));
}
export function getPerson(slug: string): Person | undefined {
  const row = db.select().from(t.people).where(and(eq(t.people.slug, slug), PUBLISHED(t.people))).get();
  return row ? mapPerson(row, artworkSlugsByArtist()) : undefined;
}
export function getFoundingArtists(): Person[] {
  return getPeople().filter((p) => p.primary_role === "Founding Artist");
}

// ── artworks ────────────────────────────────────────────────────────────────
export function getArtworks(): Artwork[] {
  const sp = personSlugById();
  return db.select().from(t.artworks).where(PUBLISHED(t.artworks)).all().map((r) => mapArtwork(r, sp));
}
export function getArtwork(slug: string): Artwork | undefined {
  const row = db.select().from(t.artworks).where(and(eq(t.artworks.slug, slug), PUBLISHED(t.artworks))).get();
  return row ? mapArtwork(row, personSlugById()) : undefined;
}
/** The 15th founding artist is intentionally pending (Principle VI) — still from seed JSON. */
export const pendingArtist = (artworksJson as any)._pending?.[0];

// ── organizations ───────────────────────────────────────────────────────────
export function getOrganizations(): Organization[] {
  return db.select().from(t.organizations).where(PUBLISHED(t.organizations)).all()
    .map((o) => ({ slug: o.slug!, name: o.name, type: u(o.type), role: u(o.role), about: u(o.about) }));
}
export function getOrganization(slug: string) {
  return getOrganizations().find((o) => o.slug === slug);
}

// ── chapter (genesis) ───────────────────────────────────────────────────────
export function getChapter() {
  const c = db.select().from(t.chapters).where(eq(t.chapters.isGenesis, true)).get();
  if (!c) return null;
  const osb = orgSlugById();
  const partners = db.select().from(t.entityLinks)
    .where(and(eq(t.entityLinks.fromType, "chapter"), eq(t.entityLinks.fromId, c.id))).all()
    .filter((e) => e.toType === "organization")
    .map((e) => ({ organization: osb.get(e.toId) ?? e.toId, role: (e.metadata as any)?.role ?? e.relation }));
  return {
    slug: c.slug!, name: c.name, venue: u(c.venue), theme: u(c.theme), summary: u(c.summary),
    opened_on: u(c.openedOn), yoruba_proverbs: c.yorubaProverbs ?? [], partners,
  };
}

// ── timeline ────────────────────────────────────────────────────────────────
export function getTimeline() {
  return db.select().from(t.timelineEvents).where(isNull(t.timelineEvents.archivedAt))
    .orderBy(asc(t.timelineEvents.sortOrder)).all()
    .map((e) => ({ order: e.sortOrder, phase: e.phase, date: e.eventDate, title: e.title, description: e.description }));
}

// ── certificates ────────────────────────────────────────────────────────────
export type Certificate = { public_id: string; person: string | null; role_at_issue: string; status: string };
export function getCertificates(): Certificate[] {
  const sp = personSlugById();
  return db.select().from(t.certificates).all().map((c) => ({
    public_id: c.publicId, person: c.personId ? sp.get(c.personId) ?? null : null,
    role_at_issue: c.roleAtIssue, status: c.status,
  }));
}
export function getCertificateForPerson(slug: string) {
  return getCertificates().find((c) => c.person === slug);
}

// ── press ───────────────────────────────────────────────────────────────────
export function getPress() {
  return db.select().from(t.press).where(isNull(t.press.archivedAt)).all()
    .map((p) => ({ outlet: p.outlet, title: p.title, url: p.url }));
}

// ── still from seed JSON (no admin module yet) ──────────────────────────────
export const performance = performanceJson;
export const panel = panelJson;

// ── media resolution (Phase 1 derivatives in /public/media) ─────────────────
const KEYART: Record<string, string> = {
  "media.keyart.cover": "/media/keyart/cover.jpg",
  "media.keyart.meet-the-team": "/media/keyart/meet-the-team.jpg",
  "media.divider.road-walk": "/media/keyart/road-walk.jpg",
};
export function artworkImage(slug: string): string { return `/media/artworks/${slug}.jpg`; }
export function personImage(person: Person): string | null {
  if (person.artworks?.length) return artworkImage(person.artworks[0]);
  if (person.portrait_media && KEYART[person.portrait_media]) return KEYART[person.portrait_media];
  return null;
}
export function keyArt(id: string) { return KEYART[id]; }

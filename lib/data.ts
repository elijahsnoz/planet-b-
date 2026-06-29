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
import councilJson from "@/data/genesis/founding-council.json";
import peopleJson from "@/data/genesis/people.json";

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

// ── passport (institutional statistics for the homepage indicator) ───────────
/** How many permanent Planet Passports have been issued (grows with the movement). */
export function getPassportCount(): number {
  return db.select({ id: t.passports.id }).from(t.passports).all().length;
}

/** Published stories that feature this person (knowledge-graph 'features' edges). */
export function getStoriesFeaturingCount(personId: string): number {
  return db
    .select({ id: t.stories.id })
    .from(t.entityLinks)
    .innerJoin(t.stories, eq(t.stories.id, t.entityLinks.fromId))
    .where(
      and(
        eq(t.entityLinks.relation, "features"),
        eq(t.entityLinks.toType, "person"),
        eq(t.entityLinks.toId, personId),
        PUBLISHED(t.stories),
      ),
    )
    .all().length;
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

// ── founding council (Principle V: a historical record, not a governing body) ─
// Names resolve from the people archive (all contributors, incl. those without a
// public artist page); the linkable flag marks the ones a visitor can open.
const PERSON_NAME = new Map<string, string>(
  (peopleJson as any).people.map((p: any) => [p.slug, p.full_name as string]),
);
/** Resolve a contributor's display name from the archive; prettifies the slug if unlisted. */
export function personName(slug: string): string {
  return PERSON_NAME.get(slug) ?? slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}
const COUNCIL_GROUPS = [
  { key: "founding_artist", label: "Founding Artists" },
  { key: "gallery_leadership", label: "Gallery Leadership" },
  { key: "embassy_representative", label: "Royal Norwegian Embassy" },
  { key: "_rest", label: "Collaborators & Organizers" },
] as const;
export type CouncilMember = { slug: string; name: string; categories: string[]; citation: string; linkable: boolean };
export function getFoundingCouncil() {
  const pub = new Set(getPeople().map((p) => p.slug));
  const members: (CouncilMember & { group: string })[] = (councilJson as any).members.map((m: any) => {
    const group = COUNCIL_GROUPS.find((g) => g.key !== "_rest" && m.categories.includes(g.key))?.key ?? "_rest";
    return {
      slug: m.person, name: PERSON_NAME.get(m.person) ?? m.person,
      categories: m.categories, citation: m.citation, linkable: pub.has(m.person), group,
    };
  });
  const groups = COUNCIL_GROUPS
    .map((g) => ({ label: g.label, members: members.filter((m) => m.group === g.key) }))
    .filter((g) => g.members.length > 0);
  return { groups, pending: (councilJson as any).pending ?? [], isCharter: !!(councilJson as any).charter_cohort };
}

// ── media resolution (Phase 1 derivatives in /public/media) ─────────────────
const KEYART: Record<string, string> = {
  "media.keyart.cover": "/media/keyart/cover.jpg",
  "media.keyart.meet-the-team": "/media/keyart/meet-the-team.jpg",
  "media.divider.road-walk": "/media/keyart/road-walk.jpg",
};
/** Web image for an artwork, or null if no derivative exists (e.g. facilitator works). */
export function artworkImage(slug: string): string | null {
  const row = db.select({ pm: t.artworks.primaryMedia }).from(t.artworks).where(eq(t.artworks.slug, slug)).get();
  return row?.pm ? `/media/artworks/${slug}.jpg` : null;
}
export function personImage(person: Person): string | null {
  if (person.portrait_media?.startsWith("/")) return person.portrait_media; // real portrait derivative
  if (person.artworks?.length) {
    const ai = artworkImage(person.artworks[0]);
    if (ai) return ai;
  }
  if (person.portrait_media && KEYART[person.portrait_media]) return KEYART[person.portrait_media];
  return null;
}
export function keyArt(id: string) { return KEYART[id]; }

/** Genesis key art (derivatives in /public/media/keyart). */
export const TEAM_IMAGE = "/media/keyart/meet-the-team.jpg";
export const COVER_IMAGE = "/media/keyart/cover.jpg";
export const ROAD_WALK_IMAGE = "/media/keyart/road-walk.jpg";

/** Published videos (exhibition, workshop) from the DAM. */
export function getVideos(): { title: string; src: string }[] {
  return db
    .select()
    .from(t.media)
    .where(and(eq(t.media.kind, "video"), eq(t.media.status, "published"), isNull(t.media.archivedAt)))
    .all()
    .map((m) => ({ title: m.title ?? "", src: m.storagePath ?? "" }))
    .filter((v) => v.src);
}

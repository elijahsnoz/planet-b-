import "server-only";
/**
 * SqliteStoryRepository — better-sqlite3 implementation. Persists the story row +
 * section body, keeps `entity_links` (relation 'features') in sync with the
 * record sections so Stories live in the knowledge graph, and resolves record
 * references to live display data. Swapped for Postgres later (ADR-0001).
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type {
  NewStoryRow,
  StoryMetaPatch,
  StoryRepository,
} from "./story.repository";
import type {
  DiscoveredRecord,
  RelatedStory,
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

  // ── graph discovery ───────────────────────────────────────────────────────────

  /** The (toType, toId) records this story features — its own graph edges. */
  private featuredEdges(storyId: string): Array<{ toType: string; toId: string }> {
    return db
      .select({ toType: t.entityLinks.toType, toId: t.entityLinks.toId })
      .from(t.entityLinks)
      .where(
        and(
          eq(t.entityLinks.fromType, "story"),
          eq(t.entityLinks.fromId, storyId),
          eq(t.entityLinks.relation, FEATURES)
        )
      )
      .all();
  }

  /** The reader-facing link for a person — their passport if public, else their
   *  artist page (mirrors resolveRef's person rule so discovery links stay sound). */
  private personHref(r: { slug: string | null; passportId: string | null; consent: string | null; status: string | null }): string | null {
    if (r.passportId && r.consent === "granted" && r.status === "published") return `/passport/${r.passportId}`;
    return r.slug ? `/artists/${r.slug}` : null;
  }

  discoverRecords(
    storyId: string,
    limit = 6
  ): { artworks: DiscoveredRecord[]; people: DiscoveredRecord[]; organizations: DiscoveredRecord[]; certificates: DiscoveredRecord[] } {
    const edges = this.featuredEdges(storyId);
    const featuredArtworkIds = new Set(edges.filter((e) => e.toType === "artwork").map((e) => e.toId));
    const featuredChapterIds = [...new Set(edges.filter((e) => e.toType === "chapter").map((e) => e.toId))];
    const organizations = this.discoverOrganizations(featuredChapterIds);
    const certificates = this.discoverCertificates([...featuredArtworkIds]);
    if (featuredArtworkIds.size === 0) return { artworks: [], people: [], organizations, certificates };

    // What the featured artworks are made of, and where they live — the threads
    // we follow outward into the rest of the registry.
    const featured = db
      .select({ id: t.artworks.id, title: t.artworks.title, materials: t.artworks.materials, chapterId: t.artworks.chapterId, artistId: t.artworks.artistId })
      .from(t.artworks)
      .where(inArray(t.artworks.id, [...featuredArtworkIds]))
      .all();
    const featMaterials = new Set<string>();
    const featChapterIds = new Set<string>();
    for (const a of featured) {
      (Array.isArray(a.materials) ? (a.materials as string[]) : []).forEach((m) => featMaterials.add(m.toLowerCase()));
      if (a.chapterId) featChapterIds.add(a.chapterId);
    }

    // Every other published artwork, joined to its maker, scored by the threads
    // it shares with the story. Shared material is the strong, specific tie;
    // sharing a chapter is gentler context.
    const candidates = db
      .select({
        id: t.artworks.id,
        slug: t.artworks.slug,
        title: t.artworks.title,
        year: t.artworks.year,
        materials: t.artworks.materials,
        chapterId: t.artworks.chapterId,
        artistId: t.artworks.artistId,
        artistName: t.people.fullName,
        artistSlug: t.people.slug,
        passportId: t.passports.passportId,
        consent: t.people.consentStatus,
        personStatus: t.people.status,
      })
      .from(t.artworks)
      .leftJoin(t.people, eq(t.people.id, t.artworks.artistId))
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(and(eq(t.artworks.status, "published"), isNull(t.artworks.archivedAt)))
      .all();

    const scored = candidates
      .filter((r) => !featuredArtworkIds.has(r.id))
      .map((r) => {
        const mats = Array.isArray(r.materials) ? (r.materials as string[]) : [];
        const sharedMaterial = mats.find((m) => featMaterials.has(m.toLowerCase())) ?? null;
        const sameChapter = !!r.chapterId && featChapterIds.has(r.chapterId);
        const score = (sharedMaterial ? 3 : 0) + (sameChapter ? 1 : 0);
        const reason = sharedMaterial
          ? `Made of ${sharedMaterial}`
          : sameChapter
          ? `From the same chapter`
          : "";
        return { r, score, reason };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title));

    const artworks: DiscoveredRecord[] = scored.slice(0, limit).map(({ r, reason }) => ({
      refType: "artwork" as StoryRefType,
      refId: r.id,
      label: r.title,
      sub: r.year ? String(r.year) : "Artwork",
      href: r.slug ? `/artworks/${r.slug}` : null,
      reason,
    }));

    // The makers — artists behind the story's own works first (meet who you just
    // read about), then artists of the related works, de-duplicated.
    const people: DiscoveredRecord[] = [];
    const seenPeople = new Set<string>();
    const pushArtist = (
      person: { artistId: string | null; artistName: string | null; artistSlug: string | null; passportId: string | null; consent: string | null; personStatus: string | null },
      artworkTitle: string
    ) => {
      if (!person.artistId || !person.artistName || seenPeople.has(person.artistId)) return;
      seenPeople.add(person.artistId);
      people.push({
        refType: "person",
        refId: person.artistId,
        label: person.artistName,
        sub: "Contributor",
        href: this.personHref({ slug: person.artistSlug, passportId: person.passportId, consent: person.consent, status: person.personStatus }),
        reason: `Artist of ${artworkTitle}`,
      });
    };

    const featuredMeta = db
      .select({
        title: t.artworks.title,
        artistId: t.artworks.artistId,
        artistName: t.people.fullName,
        artistSlug: t.people.slug,
        passportId: t.passports.passportId,
        consent: t.people.consentStatus,
        personStatus: t.people.status,
      })
      .from(t.artworks)
      .leftJoin(t.people, eq(t.people.id, t.artworks.artistId))
      .leftJoin(t.passports, eq(t.passports.personId, t.people.id))
      .where(inArray(t.artworks.id, [...featuredArtworkIds]))
      .all();
    for (const m of featuredMeta) pushArtist(m, m.title);
    for (const { r } of scored) pushArtist(r, r.title);

    return { artworks, people: people.slice(0, 5), organizations, certificates };
  }

  /** Partners reached through the story's chapter(s): host, partner, sponsor. */
  private discoverOrganizations(chapterIds: string[]): DiscoveredRecord[] {
    if (chapterIds.length === 0) return [];
    const RELATION_PRIORITY: Record<string, number> = { hosted_by: 0, partnered_with: 1, sponsored_by: 2 };
    const RELATION_NOUN: Record<string, string> = { hosted_by: "Host", partnered_with: "Partner", sponsored_by: "Sponsor" };

    const links = db
      .select({ chapterId: t.entityLinks.fromId, relation: t.entityLinks.relation, orgId: t.entityLinks.toId })
      .from(t.entityLinks)
      .where(and(eq(t.entityLinks.fromType, "chapter"), inArray(t.entityLinks.fromId, chapterIds), eq(t.entityLinks.toType, "organization")))
      .all();
    if (links.length === 0) return [];

    const orgs = db
      .select({ id: t.organizations.id, name: t.organizations.name, type: t.organizations.type, status: t.organizations.status })
      .from(t.organizations)
      .where(inArray(t.organizations.id, [...new Set(links.map((l) => l.orgId))]))
      .all();
    const orgById = new Map(orgs.map((o) => [o.id, o]));

    const seen = new Set<string>();
    return links
      .filter((l) => orgById.get(l.orgId)?.status === "published")
      .sort((a, b) => (RELATION_PRIORITY[a.relation] ?? 9) - (RELATION_PRIORITY[b.relation] ?? 9))
      .filter((l) => (seen.has(l.orgId) ? false : (seen.add(l.orgId), true)))
      .map((l) => {
        const org = orgById.get(l.orgId)!;
        const noun = RELATION_NOUN[l.relation] ?? "Partner";
        const chapterName = this.chapterName(l.chapterId);
        return {
          refType: "organization" as StoryRefType,
          refId: org.id,
          label: org.name,
          sub: org.type ?? "Organization",
          href: "/partners",
          reason: chapterName ? `${noun} of the ${chapterName} chapter` : `${noun} of this chapter`,
        };
      })
      .slice(0, 6);
  }

  /** Public certificates of the story's featured works — issued ones only, the
   *  state that is verifiable to a reader. Dormant until a work is certified. */
  private discoverCertificates(artworkIds: string[]): DiscoveredRecord[] {
    if (artworkIds.length === 0) return [];
    const titleByArtwork = new Map(
      db
        .select({ id: t.artworks.id, title: t.artworks.title })
        .from(t.artworks)
        .where(inArray(t.artworks.id, artworkIds))
        .all()
        .map((a) => [a.id, a.title])
    );
    return db
      .select({ id: t.certificates.id, publicId: t.certificates.publicId, role: t.certificates.roleAtIssue, artworkId: t.certificates.artworkId, status: t.certificates.status })
      .from(t.certificates)
      .where(and(inArray(t.certificates.artworkId, artworkIds), eq(t.certificates.status, "issued")))
      .all()
      .map((c) => ({
        refType: "certificate" as StoryRefType,
        refId: c.id,
        label: c.publicId,
        sub: c.role,
        href: `/verify?q=${encodeURIComponent(c.publicId)}`,
        reason: c.artworkId && titleByArtwork.has(c.artworkId) ? `Certifies ${titleByArtwork.get(c.artworkId)}` : "Verified certificate",
      }))
      .slice(0, 4);
  }

  relatedStories(storyId: string, limit = 4): RelatedStory[] {
    const edges = this.featuredEdges(storyId);
    if (edges.length === 0) return [];

    // Tally how many of THIS story's records each OTHER story also features.
    const tally = new Map<string, { count: number; sample: { toType: string; toId: string } }>();
    for (const e of edges) {
      const siblings = db
        .select({ fromId: t.entityLinks.fromId })
        .from(t.entityLinks)
        .where(
          and(
            eq(t.entityLinks.fromType, "story"),
            eq(t.entityLinks.relation, FEATURES),
            eq(t.entityLinks.toType, e.toType),
            eq(t.entityLinks.toId, e.toId)
          )
        )
        .all();
      for (const s of siblings) {
        if (s.fromId === storyId) continue;
        const prev = tally.get(s.fromId);
        if (prev) prev.count += 1;
        else tally.set(s.fromId, { count: 1, sample: { toType: e.toType, toId: e.toId } });
      }
    }
    if (tally.size === 0) return [];

    const ids = [...tally.keys()];
    const stories = db
      .select({ id: t.stories.id, slug: t.stories.slug, title: t.stories.title, dek: t.stories.dek, kind: t.stories.kind, status: t.stories.status })
      .from(t.stories)
      .where(inArray(t.stories.id, ids))
      .all();

    return stories
      .filter((s) => s.status === "published")
      .map((s) => {
        const { count, sample } = tally.get(s.id)!;
        const label = this.resolveRef(sample.toType as StoryRefType, sample.toId).label;
        const via = count > 1 ? `${label}, and ${count - 1} more` : label;
        return { slug: s.slug, title: s.title, dek: s.dek, kind: s.kind as StoryKind, sharedCount: count, via };
      })
      .sort((a, b) => b.sharedCount - a.sharedCount || a.title.localeCompare(b.title))
      .slice(0, limit);
  }
}

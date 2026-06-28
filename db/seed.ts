/**
 * Seeds db/planet-b.db from the normalized Genesis data (data/genesis/*.json)
 * and the archive manifest. Idempotent-ish: run after `db:reset`. Assigns
 * permanent registry IDs, wires relationships, seeds RBAC + the founder admin.
 * Run: npm run db:seed   (or npm run db:reset for a clean rebuild)
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as s from "./schema";

const root = process.cwd();
const read = (p: string) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
const sqlite = new Database(process.env.PLANET_B_DB ?? path.join(root, "db", "planet-b.db"));
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema: s });

// ── registry minting (SQLite has no sequences) ──────────────────────────────
const bump = sqlite.prepare(
  `insert into registry_counters(kind,last_value) values(?,1)
   on conflict(kind) do update set last_value = last_value + 1
   returning last_value`
);
function mint(kind: string): string {
  const { last_value } = bump.get(kind) as { last_value: number };
  return `PB-${kind.toUpperCase()}-${String(last_value).padStart(6, "0")}`;
}

const chapterData = read("data/genesis/chapter.json");
const orgsData = read("data/genesis/organizations.json").organizations;
const peopleData = read("data/genesis/people.json").people;
const artData = read("data/genesis/artworks.json");
const timelineData = read("data/genesis/timeline.json").events;
const councilData = read("data/genesis/founding-council.json");
const certsData = read("data/genesis/certificates.json");
const pressData = read("data/genesis/press.json").items;
const manifest = read("archive/manifest.json");

const ARTWORK_DEFAULTS = artData._defaults;
const slugToArtworkSrc: Record<string, string> = {};
for (const it of manifest.items) {
  if (it.depicts?.artwork) slugToArtworkSrc[it.depicts.artwork] = it;
}

const tx = sqlite.transaction(() => {
  // wipe (keep migrations table) for clean re-seed
  for (const t of [
    "founding_council","press","impact_metrics","entity_links","certificates",
    "timeline_events","artworks","media","people","organizations","chapters",
    "user_roles","role_permissions","sessions","users","permissions","roles","registry_counters",
  ]) sqlite.prepare(`delete from ${t}`).run();

  // ── chapter ──
  const chapterId = randomUUID();
  db.insert(s.chapters).values({
    id: chapterId, registryId: mint("chapter"), slug: chapterData.slug, status: "published",
    verified: true, name: chapterData.name, city: chapterData.city, country: chapterData.country,
    isGenesis: true, immutable: true, movement: chapterData.movement, theme: chapterData.theme,
    eventName: chapterData.event_name, openedOn: chapterData.opened_on, venue: chapterData.venue,
    summary: chapterData.summary, yorubaProverbs: chapterData.yoruba_proverbs,
  }).run();

  // ── organizations ──
  const orgIdBySlug: Record<string, string> = {};
  for (const o of orgsData) {
    const id = randomUUID(); orgIdBySlug[o.slug] = id;
    db.insert(s.organizations).values({
      id, registryId: mint("org"), slug: o.slug, status: "published", verified: !!o.verified,
      name: o.name, type: o.type, role: o.role, about: o.about, website: o.website ?? null,
      established: o.established ?? null,
    }).run();
  }

  // ── people ──
  const personIdBySlug: Record<string, string> = {};
  for (const p of peopleData) {
    const id = randomUUID(); personIdBySlug[p.slug] = id;
    db.insert(s.people).values({
      id, registryId: mint("artist"), slug: p.slug, status: "published", verified: !!p.verified,
      fullName: p.full_name, displayName: p.display_name ?? null, honorific: p.honorific ?? null,
      primaryRole: p.primary_role ?? null, roles: p.roles ?? [], shortBio: p.short_bio ?? null,
      portraitMedia: p.portrait_media ?? null,
      consentStatus: p.consent_status ?? "pending", foundingCouncil: p.founding_council ?? null,
      evolves: !!p.evolves, note: p.note ?? null,
    }).run();
  }

  // ── media (from archive manifest: artwork plates + key art) ──
  const mediaRegByArtwork: Record<string, string> = {};
  for (const [artworkSlug, it] of Object.entries(slugToArtworkSrc)) {
    const id = randomUUID(); const reg = mint("media");
    mediaRegByArtwork[artworkSlug] = reg;
    db.insert(s.media).values({
      id, registryId: reg, slug: `plate-${artworkSlug}`, status: "published", verified: true,
      kind: "image", title: artworkSlug, storagePath: `/media/artworks/${artworkSlug}.jpg`,
      masterPath: (it as any).path, sha256: (it as any).sha256, bytes: (it as any).bytes,
      mime: "image/jpeg", source: "catalogue", license: manifest.items[0]?.license ?? null,
      altText: `Catalogue spread — ${artworkSlug}`, credit: "Catalogue / Edge Media",
    }).run();
  }

  // ── artworks ──
  const artIdBySlug: Record<string, string> = {};
  for (const a of artData.artworks) {
    const id = randomUUID(); artIdBySlug[a.slug] = id;
    const merged = { ...ARTWORK_DEFAULTS, ...a };
    db.insert(s.artworks).values({
      id, registryId: mint("artwork"), slug: a.slug, status: "published", verified: !!a.verified,
      title: a.title, titleVariant: a.title_variant ?? null,
      artistId: personIdBySlug[a.artist] ?? null, chapterId,
      medium: merged.medium, dimensions: merged.dimensions, year: merged.year,
      statement: a.statement ?? null, significance: a.significance ?? null,
      materials: a.materials ?? [], primaryMedia: mediaRegByArtwork[a.slug] ?? null,
      exhibitorRole: a.exhibitor_role ?? "artist",
    }).run();
    // wire artist portrait to their plate; add graph edges
    if (mediaRegByArtwork[a.slug]) {
      if (personIdBySlug[a.artist]) {
        db.update(s.people).set({ portraitMedia: mediaRegByArtwork[a.slug] })
          .where(eqId(s.people, personIdBySlug[a.artist])).run();
      }
      db.insert(s.entityLinks).values({
        fromType: "artwork", fromId: id, relation: "depicts", toType: "media",
        toId: mediaRegByArtwork[a.slug],
      }).run();
    }
    if (personIdBySlug[a.artist]) {
      db.insert(s.entityLinks).values({
        fromType: "artwork", fromId: id, relation: "created_by", toType: "person",
        toId: personIdBySlug[a.artist],
      }).run();
    }
  }

  // ── timeline ──
  for (const e of timelineData) {
    db.insert(s.timelineEvents).values({
      id: randomUUID(), chapterId, sortOrder: e.order, phase: e.phase, title: e.title,
      eventDate: e.date ?? null, description: e.description, verified: !!e.verified, note: e.note ?? null,
    }).run();
  }

  // ── founding council ──
  for (const [i, m] of councilData.members.entries()) {
    if (!personIdBySlug[m.person]) continue;
    db.insert(s.foundingCouncil).values({
      id: randomUUID(), personId: personIdBySlug[m.person], chapterId,
      councilCategory: m.categories[0], citation: m.citation, isCharterMember: true, sortOrder: i,
    }).run();
  }

  // ── certificates (person + reserved + org) ──
  for (const c of certsData.certificates) {
    db.insert(s.certificates).values({
      id: randomUUID(), registryId: mint("cert"), publicId: c.public_id,
      personId: c.person ? personIdBySlug[c.person] ?? null : null, chapterId,
      roleAtIssue: c.role_at_issue, artworkId: c.artwork ? artIdBySlug[c.artwork] ?? null : null,
      status: c.status, note: c.note ?? c._note ?? null,
    }).run();
  }
  for (const c of certsData.organization_certificates ?? []) {
    db.insert(s.certificates).values({
      id: randomUUID(), registryId: mint("cert"), publicId: c.public_id,
      organizationId: orgIdBySlug[c.organization] ?? null, chapterId,
      roleAtIssue: c.role_at_issue, status: c.status,
    }).run();
  }

  // ── partners as graph edges ──
  for (const pt of chapterData.partners) {
    if (!orgIdBySlug[pt.organization]) continue;
    db.insert(s.entityLinks).values({
      fromType: "chapter", fromId: chapterId,
      relation: pt.role === "host" ? "hosted_by" : pt.role === "sponsor" ? "sponsored_by" : "partnered_with",
      toType: "organization", toId: orgIdBySlug[pt.organization], metadata: { role: pt.role },
    }).run();
  }

  // ── press ──
  for (const p of pressData) {
    db.insert(s.press).values({
      id: randomUUID(), chapterId, outlet: p.outlet, title: p.title, url: p.url, topic: p.topic ?? null,
    }).run();
  }

  // ── key art & videos (so they are in the system + admin Media) ──
  const extraMedia = [
    { slug: "keyart-cover", kind: "image", path: "/media/keyart/cover.jpg", title: "Because There Is No Planet B — key art" },
    { slug: "keyart-meet-the-team", kind: "image", path: "/media/keyart/meet-the-team.jpg", title: "Meet the Team" },
    { slug: "keyart-road-walk", kind: "image", path: "/media/keyart/road-walk.jpg", title: "Road Walk — Community Sensitization" },
    { slug: "portrait-svein-baera", kind: "image", path: "/media/people/svein-baera.jpg", title: "H.E. Mr. Svein Bæra — Ambassador" },
    { slug: "portrait-solveig-andresen", kind: "image", path: "/media/people/solveig-andresen.jpg", title: "Ms. Solveig Andresen — Counsellor" },
    { slug: "portrait-nike-okundaye", kind: "image", path: "/media/people/nike-okundaye.jpg", title: "Chief Nike Okundaye — Mama Nike" },
    { slug: "video-exhibition", kind: "video", path: "/media/video/exhibition.mp4", title: "Exhibition — documentation" },
    { slug: "video-workshop", kind: "video", path: "/media/video/workshop.mp4", title: "The Upcycle Workshop" },
  ];
  for (const m of extraMedia) {
    db.insert(s.media).values({
      id: randomUUID(), registryId: mint("media"), slug: m.slug, status: "published", verified: true,
      kind: m.kind, title: m.title, storagePath: m.path, source: "catalogue / Edge Media",
      credit: "Catalogue / Edge Media", altText: m.title,
    }).run();
  }

  // ── RBAC ──
  seedRbac();
});

function eqId(table: any, id: string) { return eq(table.id, id); }

function seedRbac() {
  const ROLES = [
    ["super_admin", "Super Admin", 100], ["platform_admin", "Platform Administrator", 90],
    ["archivist", "Archivist", 80], ["content_editor", "Content Editor", 70],
    ["chapter_director", "Chapter Director", 60], ["chapter_editor", "Chapter Editor", 50],
    ["researcher", "Researcher", 40], ["media_manager", "Media Manager", 40],
    ["artist", "Artist", 20], ["partner_org", "Partner Organization", 20], ["public", "Public", 0],
  ] as const;
  const RESOURCES = ["chapter","artist","artwork","organization","certificate","media","research","story","press","impact","timeline","user","settings","audit"];
  const ACTIONS = ["read","create","update","publish","archive","restore","issue","revoke","manage","upload","export","history"];

  const roleId: Record<string, number> = {};
  for (const [key, name, rank] of ROLES) {
    const r = db.insert(s.roles).values({ key, name, rank }).returning({ id: s.roles.id }).get();
    roleId[key] = r.id;
  }
  const permId: Record<string, number> = {};
  for (const res of RESOURCES) for (const act of ACTIONS) {
    const key = `${res}.${act}`;
    const p = db.insert(s.permissions).values({ key }).returning({ id: s.permissions.id }).get();
    permId[key] = p.id;
  }
  // super_admin + platform_admin → all permissions
  for (const k of ["super_admin", "platform_admin"]) {
    for (const pid of Object.values(permId)) {
      db.insert(s.rolePermissions).values({ roleId: roleId[k], permissionId: pid }).run();
    }
  }
  // representative subsets for a few roles (extend later)
  const grant = (role: string, keys: string[]) => keys.forEach((key) =>
    permId[key] && db.insert(s.rolePermissions).values({ roleId: roleId[role], permissionId: permId[key] }).run());
  grant("archivist", ["media.read","media.update","media.archive","media.restore","artwork.read","artwork.update","audit.read","artwork.history"]);
  grant("content_editor", ["story.read","story.create","story.update","story.publish","press.read","press.update","research.read"]);
  grant("media_manager", ["media.read","media.create","media.update","media.upload","media.archive"]);
  grant("chapter_director", ["chapter.read","artist.read","artist.update","artwork.read","artwork.create","artwork.update","artwork.publish","artwork.archive","certificate.issue","media.read"]);
  grant("researcher", ["research.read","research.create","research.update","research.publish","artwork.read","artist.read"]);

  // founder super admin
  const email = process.env.PLANET_B_ADMIN_EMAIL ?? "victoreni14@gmail.com";
  const password = process.env.PLANET_B_ADMIN_PASSWORD ?? "planetb-admin";
  const uid = randomUUID();
  db.insert(s.users).values({
    id: uid, email, displayName: "Elijah Snoz", passwordHash: bcrypt.hashSync(password, 10),
    isActive: true, mfaRequired: false,
  }).run();
  db.insert(s.userRoles).values({ userId: uid, roleId: roleId["super_admin"] }).run();
  console.log(`  admin user: ${email}  (password: ${password} — change after first login)`);
}

tx();

// summary
const count = (t: string) => (sqlite.prepare(`select count(*) c from ${t}`).get() as any).c;
console.log("✓ seeded planet-b.db");
for (const t of ["chapters","people","artworks","media","organizations","timeline_events","certificates","founding_council","entity_links","roles","permissions","users"]) {
  console.log(`   ${t}: ${count(t)}`);
}
sqlite.close();

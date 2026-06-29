/**
 * Planet B — SQLite schema (Drizzle ORM).
 * Implements docs/architecture/03 + 02 + 06 adapted to SQLite (no sequences/RLS):
 *  - registry IDs minted via registry_counters (doc 07)
 *  - soft-delete only (archived_at), status workflow, audit + revisions (Principle VIII)
 *  - RBAC tables (enforced in app layer, lib/rbac) since SQLite has no RLS
 *  - entity_links polymorphic graph (doc 07)
 * Timestamps are ISO text (human-readable in the archive file); booleans are 0/1 integers.
 */
import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

/**
 * Columns shared by every cultural/media entity. Defined as a FACTORY so each
 * table gets fresh column builders — otherwise Drizzle reuses one instance and
 * auto-names every unique index after the first table (collision).
 */
const governance = () => ({
  id: text("id").primaryKey(), // uuid
  registryId: text("registry_id").unique(), // PB-TYPE-000001 (permanent)
  slug: text("slug").unique(),
  status: text("status").notNull().default("draft"), // draft|in_review|published|archived
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  archivedAt: text("archived_at"), // soft delete; null = live
});

/* ── registry minting ─────────────────────────────────────────────────────── */
export const registryCounters = sqliteTable("registry_counters", {
  kind: text("kind").primaryKey(), // 'artist','artwork','chapter','cert','org','event','story','media'
  lastValue: integer("last_value").notNull().default(0),
});

/* ── cultural core ────────────────────────────────────────────────────────── */
export const chapters = sqliteTable("chapters", {
  ...governance(),
  name: text("name").notNull(),
  city: text("city"),
  country: text("country"),
  isGenesis: integer("is_genesis", { mode: "boolean" }).notNull().default(false),
  immutable: integer("immutable", { mode: "boolean" }).notNull().default(false),
  movement: text("movement").notNull().default("Because There Is No Planet B"),
  theme: text("theme"),
  eventName: text("event_name"),
  openedOn: text("opened_on"), // start / opening date
  endedOn: text("ended_on"), // close date (null for ongoing)
  venue: text("venue"),
  summary: text("summary"),
  yorubaProverbs: text("yoruba_proverbs", { mode: "json" }).$type<{ yoruba: string; english: string }[]>(),
  heroMedia: text("hero_media"),
});

export const people = sqliteTable("people", {
  ...governance(),
  fullName: text("full_name").notNull(),
  displayName: text("display_name"),
  honorific: text("honorific"),
  primaryRole: text("primary_role"),
  roles: text("roles", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  shortBio: text("short_bio"),
  bio: text("bio"),
  portraitMedia: text("portrait_media"),
  consentStatus: text("consent_status").notNull().default("pending"), // granted|pending|withheld
  contactPublic: integer("contact_public", { mode: "boolean" }).notNull().default(false),
  foundingCouncil: text("founding_council", { mode: "json" }).$type<string[]>(),
  evolves: integer("evolves", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
});

export const organizations = sqliteTable("organizations", {
  ...governance(),
  name: text("name").notNull(),
  type: text("type"),
  role: text("role"),
  about: text("about"),
  website: text("website"),
  logoMedia: text("logo_media"),
  established: text("established"),
});

export const artworks = sqliteTable("artworks", {
  ...governance(),
  title: text("title").notNull(),
  titleVariant: text("title_variant"),
  artistId: text("artist_id").references(() => people.id),
  chapterId: text("chapter_id").references(() => chapters.id),
  medium: text("medium").default("Discarded items assemblage"),
  dimensions: text("dimensions").default("61cm x 61cm"),
  year: integer("year").default(2026),
  statement: text("statement"),
  significance: text("significance"),
  materials: text("materials", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  primaryMedia: text("primary_media"),
  exhibitorRole: text("exhibitor_role").default("artist"),
});

export const media = sqliteTable("media", {
  ...governance(),
  kind: text("kind").notNull().default("image"), // image|video|audio|document
  title: text("title"),
  description: text("description"),
  storagePath: text("storage_path"), // web/derivative path under /public/media or bucket key
  masterPath: text("master_path"), // archive/source path
  sha256: text("sha256"),
  bytes: integer("bytes"),
  mime: text("mime"),
  width: integer("width"),
  height: integer("height"),
  durationS: integer("duration_s"),
  altText: text("alt_text"),
  caption: text("caption"),
  credit: text("credit"),
  source: text("source"),
  license: text("license"),
  author: text("author"),
  copyright: text("copyright"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  captureDate: text("capture_date"),
  location: text("location"),
});

export const timelineEvents = sqliteTable("timeline_events", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id").references(() => chapters.id),
  sortOrder: integer("sort_order").notNull(),
  phase: text("phase"),
  title: text("title").notNull(),
  eventDate: text("event_date"),
  description: text("description"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  archivedAt: text("archived_at"),
});

export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey(),
  registryId: text("registry_id").unique(), // PB-CERT-000001 (global)
  publicId: text("public_id").unique().notNull(), // PB-ABJ-2026-001 (human/chapter form)
  personId: text("person_id").references(() => people.id),
  organizationId: text("organization_id").references(() => organizations.id),
  chapterId: text("chapter_id").references(() => chapters.id),
  roleAtIssue: text("role_at_issue").notNull(),
  artworkId: text("artwork_id").references(() => artworks.id),
  issuedOn: text("issued_on"),
  status: text("status").notNull().default("draft"), // draft|issued|revoked|reserved
  verificationHash: text("verification_hash"),
  soulboundRef: text("soulbound_ref"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

/* ── knowledge graph ──────────────────────────────────────────────────────── */
export const entityLinks = sqliteTable(
  "entity_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromType: text("from_type").notNull(),
    fromId: text("from_id").notNull(),
    relation: text("relation").notNull(),
    toType: text("to_type").notNull(),
    toId: text("to_id").notNull(),
    weight: integer("weight").default(1),
    metadata: text("metadata", { mode: "json" }),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({
    uniq: uniqueIndex("uq_edge").on(t.fromType, t.fromId, t.relation, t.toType, t.toId),
    fromIdx: index("ix_edge_from").on(t.fromType, t.fromId),
    toIdx: index("ix_edge_to").on(t.toType, t.toId),
  })
);

/* ── identity & access (RBAC enforced in lib/rbac) ────────────────────────── */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  mfaRequired: integer("mfa_required", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
  lastLoginAt: text("last_login_at"),
});

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").unique().notNull(),
  name: text("name").notNull(),
  rank: integer("rank").notNull().default(0),
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").unique().notNull(), // 'artwork.update'
});

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: integer("role_id").notNull().references(() => roles.id),
    permissionId: integer("permission_id").notNull().references(() => permissions.id),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) })
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id").notNull().references(() => users.id),
    roleId: integer("role_id").notNull().references(() => roles.id),
    chapterId: text("chapter_id").references(() => chapters.id), // null = global scope
    grantedBy: text("granted_by"),
    grantedAt: text("granted_at").notNull().default(now),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) })
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(now),
});

/* ── governance: audit + revisions (nothing is lost) ──────────────────────── */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    registryId: text("registry_id"),
    before: text("before", { mode: "json" }),
    after: text("after", { mode: "json" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({ actorIdx: index("ix_audit_actor").on(t.actor), entIdx: index("ix_audit_entity").on(t.entityType, t.entityId) })
);

export const revisions = sqliteTable(
  "revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    registryId: text("registry_id"),
    version: integer("version").notNull(),
    snapshot: text("snapshot", { mode: "json" }).notNull(),
    changeSummary: text("change_summary"),
    createdBy: text("created_by"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({ entIdx: index("ix_rev_entity").on(t.entityType, t.entityId) })
);

export const impactMetrics = sqliteTable("impact_metrics", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id").references(() => chapters.id),
  metric: text("metric").notNull(),
  value: integer("value").notNull(),
  unit: text("unit"),
  asOf: text("as_of"),
  source: text("source"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
});

export const press = sqliteTable("press", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id").references(() => chapters.id),
  outlet: text("outlet").notNull(),
  title: text("title"),
  url: text("url").notNull(),
  topic: text("topic"),
  publishedOn: text("published_on"),
  excerpt: text("excerpt"),
  archivedAt: text("archived_at"),
});

export const foundingCouncil = sqliteTable("founding_council", {
  id: text("id").primaryKey(),
  personId: text("person_id").references(() => people.id),
  chapterId: text("chapter_id").references(() => chapters.id),
  councilCategory: text("council_category").notNull(),
  citation: text("citation"),
  inductedOn: text("inducted_on"),
  isCharterMember: integer("is_charter_member", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes"),
});

/* ── trust layer: verification, claims, anchoring (Phase 2B) ──────────────────
 * Additive, Postgres-ready (ADR-0001), and matching docs/phase-2/02-database-erd.
 * Certificates stay immutable; these tables hold the *digital relationships*
 * (verification, claiming, on-chain proof) that evolve around them.
 */

/** Certificate claim/verification workflow (doc 05, ADR-0008). */
export const claimRequests = sqliteTable(
  "claim_requests",
  {
    id: text("id").primaryKey(),
    fileRef: text("file_ref"), // uploaded image/pdf storage key
    ocrText: text("ocr_text"),
    ocrConfidence: real("ocr_confidence"), // 0..1, null until OCR runs
    parsedFields: text("parsed_fields", { mode: "json" }),
    submittedPublicId: text("submitted_public_id"), // what the claimant/OCR asserts
    matchedCertificateId: text("matched_certificate_id").references(() => certificates.id),
    confidence: real("confidence"), // match score 0..1
    status: text("status").notNull().default("uploaded"), // uploaded|ocr_done|matched|needs_review|claimed|rejected
    submittedBy: text("submitted_by").references(() => users.id),
    reviewer: text("reviewer").references(() => users.id),
    reviewNote: text("review_note"),
    decidedAt: text("decided_at"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    statusIdx: index("ix_claimreq_status").on(t.status),
    certIdx: index("ix_claimreq_cert").on(t.matchedCertificateId),
    userIdx: index("ix_claimreq_user").on(t.submittedBy),
  })
);

/** Merkle batch anchoring (doc 06) — populated only when the chain flag is on. */
export const chainAnchors = sqliteTable(
  "chain_anchors",
  {
    id: text("id").primaryKey(),
    anchorId: text("anchor_id").unique().notNull(), // PB-ANCHOR-000001
    merkleRoot: text("merkle_root").notNull(),
    memberCount: integer("member_count").notNull(),
    provider: text("provider"),
    txRef: text("tx_ref"),
    status: text("status").notNull().default("pending"), // pending|committed|failed
    anchoredAt: text("anchored_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({ statusIdx: index("ix_anchor_status").on(t.status) })
);

/** Generic on-chain pointer — generalizes certificates.soulbound_ref. */
export const onchainRefs = sqliteTable(
  "onchain_refs",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(), // certificate|artwork|chapter|passport|…
    entityId: text("entity_id").notNull(),
    provider: text("provider"),
    tokenRef: text("token_ref"),
    kind: text("kind").notNull(), // sbt|anchor|attestation
    anchorId: text("anchor_id").references(() => chainAnchors.anchorId),
    mintedAt: text("minted_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({
    entityIdx: index("ix_onchain_entity").on(t.entityType, t.entityId),
    anchorIdx: index("ix_onchain_anchor").on(t.anchorId),
  })
);

/* ── Planet Passport: lifelong institutional identity (Phase 2C) ──────────────
 * A Passport is a 1:1 projection over a `people` row — NOT a user account
 * (ADR-0002). Aggregations (certificates, artworks, chapters) are computed from
 * joins + the graph, never duplicated here. Additive + Postgres-ready.
 */

/** One Passport per contributor. `passport_id` = PB-ID-NNNNNN (registry kind 'id'). */
export const passports = sqliteTable(
  "passports",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id").unique(), // equals passportId for human use
    passportId: text("passport_id").unique().notNull(), // PB-ID-000001
    personId: text("person_id").notNull().unique().references(() => people.id),
    country: text("country"),
    passportStatus: text("passport_status").notNull().default("unclaimed"), // unclaimed|claimed|linked
    institutionalNote: text("institutional_note"), // PRIVATE institutional data
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    personIdx: uniqueIndex("ux_passport_person").on(t.personId),
    statusIdx: index("ix_passport_status").on(t.passportStatus),
  })
);

/** A living contributor (a user account) claiming their Passport identity. */
export const passportClaims = sqliteTable(
  "passport_claims",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    personId: text("person_id").notNull().references(() => people.id),
    claimRequestId: text("claim_request_id").references(() => claimRequests.id),
    status: text("status").notNull().default("pending"), // pending|approved|rejected
    evidence: text("evidence", { mode: "json" }),
    reviewer: text("reviewer").references(() => users.id),
    reviewNote: text("review_note"),
    decidedAt: text("decided_at"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    userIdx: index("ix_pclaim_user").on(t.userId),
    personIdx: index("ix_pclaim_person").on(t.personId),
  })
);

/** Life-events that grow a Passport over decades (Principle: never "completed"). */
export const contributions = sqliteTable(
  "contributions",
  {
    id: text("id").primaryKey(),
    registryId: text("registry_id"),
    personId: text("person_id").notNull().references(() => people.id),
    kind: text("kind").notNull(), // exhibition|award|mentorship|interview|research|talk|residency|role_change|leadership
    title: text("title").notNull(),
    description: text("description"),
    occurredOn: text("occurred_on"),
    chapterId: text("chapter_id").references(() => chapters.id),
    source: text("source"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    personIdx: index("ix_contrib_person").on(t.personId, t.occurredOn),
    kindIdx: index("ix_contrib_kind").on(t.kind),
  })
);

/* ── Story: the narrative layer (Phase 2E, ADR-0003) ─────────────────────────
 * A Story is a curated narrative COMPOSED FROM connected records, not duplicated
 * content. `body` holds an ordered array of sections (prose/quote/heading +
 * record references); every record reference is mirrored as an `entity_links`
 * edge (relation 'features') so Stories participate in the knowledge graph.
 */
export const stories = sqliteTable(
  "stories",
  {
    ...governance(), // id, registryId (PB-STORY-…), slug, status, verified, timestamps, archivedAt
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    dek: text("dek"), // standfirst / summary
    body: text("body", { mode: "json" }).$type<unknown>(), // StorySection[]
    coverMedia: text("cover_media"),
    chapterId: text("chapter_id").references(() => chapters.id),
    kind: text("kind").notNull().default("feature"), // feature|exhibition|profile|dispatch|essay
  },
  (t) => ({
    statusIdx: index("ix_story_status").on(t.status),
    kindIdx: index("ix_story_kind").on(t.kind),
  })
);

/* ── Artwork provenance: the accumulating life-history of a cultural object ────
 * (Phase 2F) History ACCUMULATES and is never overwritten — creation, workshop,
 * exhibition, publication, research, collection, verification, future blockchain
 * anchoring, restoration, ownership. Soft-delete only; designed for museum-grade
 * provenance long before blockchain exists.
 */
export const provenanceEvents = sqliteTable(
  "provenance_events",
  {
    id: text("id").primaryKey(),
    artworkId: text("artwork_id").notNull().references(() => artworks.id),
    kind: text("kind").notNull(), // creation|workshop|exhibition|publication|research|collection|verification|anchoring|restoration|ownership
    title: text("title").notNull(),
    description: text("description"),
    occurredOn: text("occurred_on"),
    chapterId: text("chapter_id").references(() => chapters.id),
    organizationId: text("organization_id").references(() => organizations.id),
    actorPersonId: text("actor_person_id").references(() => people.id),
    source: text("source"), // provenance of the fact
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    archivedAt: text("archived_at"), // soft-delete only; provenance is never erased
  },
  (t) => ({
    artworkIdx: index("ix_provenance_artwork").on(t.artworkId, t.occurredOn),
    kindIdx: index("ix_provenance_kind").on(t.kind),
  })
);

/** Append-only log of every verify/claim/anchor/mint — feeds /verify + audit. */
export const verificationEvents = sqliteTable(
  "verification_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventType: text("event_type").notNull(), // verify|claim|anchor|mint
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    actor: text("actor"), // user id or "system"/"public"
    result: text("result", { mode: "json" }),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({
    entIdx: index("ix_vev_entity").on(t.entityType, t.entityId),
    typeIdx: index("ix_vev_type").on(t.eventType, t.createdAt),
  })
);

import "server-only";
/**
 * SqliteCertificateRepository — better-sqlite3 implementation. Joins the
 * certificate to its recipient (person OR organization), artwork, and chapter,
 * and reads the evolving digital layer (graph relations + master asset) from
 * `entity_links` / `media`. Swapped for Postgres later (ADR-0001).
 */
import { and, eq, sql } from "drizzle-orm";
import { db, schema as t } from "@platform/db";
import type { CertificateRepository } from "./certificate.repository";
import type {
  CertificateContext,
  CertificateListItem,
  CertificateListQuery,
  CertRelation,
  CertificateStatus,
  RecipientType,
} from "./certificate.types";

const MASTER_RELATION = "has_master";

type FlatRow = {
  id: string;
  registryId: string | null;
  publicId: string;
  personId: string | null;
  organizationId: string | null;
  chapterId: string | null;
  roleAtIssue: string;
  artworkId: string | null;
  issuedOn: string | null;
  status: string;
  verificationHash: string | null;
  soulboundRef: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  personSlug: string | null;
  personName: string | null;
  orgSlug: string | null;
  orgName: string | null;
  artworkSlug: string | null;
  artworkTitle: string | null;
  chapterSlug: string | null;
  chapterName: string | null;
  isGenesisChapter: boolean | null;
};

function baseQuery() {
  return db
    .select({
      id: t.certificates.id,
      registryId: t.certificates.registryId,
      publicId: t.certificates.publicId,
      personId: t.certificates.personId,
      organizationId: t.certificates.organizationId,
      chapterId: t.certificates.chapterId,
      roleAtIssue: t.certificates.roleAtIssue,
      artworkId: t.certificates.artworkId,
      issuedOn: t.certificates.issuedOn,
      status: t.certificates.status,
      verificationHash: t.certificates.verificationHash,
      soulboundRef: t.certificates.soulboundRef,
      note: t.certificates.note,
      createdAt: t.certificates.createdAt,
      updatedAt: t.certificates.updatedAt,
      personSlug: t.people.slug,
      personName: t.people.fullName,
      orgSlug: t.organizations.slug,
      orgName: t.organizations.name,
      artworkSlug: t.artworks.slug,
      artworkTitle: t.artworks.title,
      chapterSlug: t.chapters.slug,
      chapterName: t.chapters.name,
      isGenesisChapter: t.chapters.isGenesis,
    })
    .from(t.certificates)
    .leftJoin(t.people, eq(t.people.id, t.certificates.personId))
    .leftJoin(t.organizations, eq(t.organizations.id, t.certificates.organizationId))
    .leftJoin(t.artworks, eq(t.artworks.id, t.certificates.artworkId))
    .leftJoin(t.chapters, eq(t.chapters.id, t.certificates.chapterId));
}

function toListItem(r: FlatRow): CertificateListItem {
  const recipientType: RecipientType | null = r.personId
    ? "person"
    : r.organizationId
      ? "organization"
      : null;
  const isGenesisChapter = !!r.isGenesisChapter;
  const isGenesisCollection =
    isGenesisChapter && r.roleAtIssue === "Founding Artist" && r.status !== "reserved";
  return {
    id: r.id,
    registryId: r.registryId,
    publicId: r.publicId,
    personId: r.personId,
    organizationId: r.organizationId,
    chapterId: r.chapterId,
    roleAtIssue: r.roleAtIssue,
    artworkId: r.artworkId,
    issuedOn: r.issuedOn,
    status: r.status as CertificateStatus,
    verificationHash: r.verificationHash,
    soulboundRef: r.soulboundRef,
    note: r.note,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    recipientType,
    recipientName: r.personName ?? r.orgName ?? null,
    recipientSlug: r.personSlug ?? r.orgSlug ?? null,
    artworkTitle: r.artworkTitle,
    artworkSlug: r.artworkSlug,
    chapterName: r.chapterName,
    chapterSlug: r.chapterSlug,
    isGenesisChapter,
    isGenesisCollection,
  };
}

export class SqliteCertificateRepository implements CertificateRepository {
  private relationsFor(certId: string): CertRelation[] {
    return db
      .select({
        relation: t.entityLinks.relation,
        toType: t.entityLinks.toType,
        toId: t.entityLinks.toId,
      })
      .from(t.entityLinks)
      .where(and(eq(t.entityLinks.fromType, "certificate"), eq(t.entityLinks.fromId, certId)))
      .all();
  }

  private masterFor(certId: string): CertificateContext["masterAsset"] {
    const edge = db
      .select({ toId: t.entityLinks.toId })
      .from(t.entityLinks)
      .where(
        and(
          eq(t.entityLinks.fromType, "certificate"),
          eq(t.entityLinks.fromId, certId),
          eq(t.entityLinks.relation, MASTER_RELATION)
        )
      )
      .get();
    if (!edge?.toId) return null;
    const m = db
      .select({
        id: t.media.id,
        storagePath: t.media.storagePath,
        sha256: t.media.sha256,
        altText: t.media.altText,
      })
      .from(t.media)
      .where(eq(t.media.id, edge.toId))
      .get();
    return m ?? null;
  }

  private hydrate(r: FlatRow | undefined): CertificateContext | null {
    if (!r) return null;
    const item = toListItem(r);
    const masterAsset = this.masterFor(item.id);
    const archiveStatus: CertificateContext["archiveStatus"] =
      item.status === "reserved" ? "reserved" : masterAsset ? "preserved" : "pending";
    return { ...item, relations: this.relationsFor(item.id), masterAsset, archiveStatus };
  }

  findById(id: string): CertificateContext | null {
    return this.hydrate(baseQuery().where(eq(t.certificates.id, id)).get() as FlatRow | undefined);
  }
  findByPublicId(publicId: string): CertificateContext | null {
    return this.hydrate(
      baseQuery().where(eq(t.certificates.publicId, publicId)).get() as FlatRow | undefined
    );
  }
  findByRegistryId(registryId: string): CertificateContext | null {
    return this.hydrate(
      baseQuery().where(eq(t.certificates.registryId, registryId)).get() as FlatRow | undefined
    );
  }

  list(query: CertificateListQuery): CertificateListItem[] {
    let rows = (baseQuery().orderBy(t.certificates.publicId).all() as FlatRow[]).map(toListItem);
    if (!query.includeReserved && !query.genesisCollectionOnly) {
      // reserved rows are shown only when explicitly requested
      rows = rows.filter((r) => query.includeReserved || r.status !== "reserved" || query.q);
    }
    if (query.genesisCollectionOnly) rows = rows.filter((r) => r.isGenesisCollection);
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    if (query.recipientType) rows = rows.filter((r) => r.recipientType === query.recipientType);
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.publicId.toLowerCase().includes(q) ||
          (r.registryId ?? "").toLowerCase().includes(q) ||
          (r.recipientName ?? "").toLowerCase().includes(q) ||
          r.roleAtIssue.toLowerCase().includes(q)
      );
    }
    return rows;
  }

  listGenesisCollection(): CertificateListItem[] {
    return (baseQuery().orderBy(t.certificates.publicId).all() as FlatRow[])
      .map(toListItem)
      .filter((r) => r.isGenesisCollection);
  }

  listForPerson(personId: string): CertificateListItem[] {
    return (
      baseQuery()
        .where(eq(t.certificates.personId, personId))
        .orderBy(t.certificates.publicId)
        .all() as FlatRow[]
    ).map(toListItem);
  }

  countByStatus(): Record<string, number> {
    const rows = db
      .select({ status: t.certificates.status, n: sql<number>`count(*)` })
      .from(t.certificates)
      .groupBy(t.certificates.status)
      .all();
    return Object.fromEntries(rows.map((r) => [r.status, r.n]));
  }

  setIssued(id: string, issuedOn: string, verificationHash: string, actor: string): void {
    db.update(t.certificates)
      .set({ status: "issued", issuedOn, verificationHash, updatedAt: new Date().toISOString() })
      .where(eq(t.certificates.id, id))
      .run();
    void actor;
  }

  setStatus(id: string, status: "issued" | "revoked", actor: string): void {
    db.update(t.certificates)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(t.certificates.id, id))
      .run();
    void actor;
  }

  addRelation(edge: { certId: string } & CertRelation): void {
    db.insert(t.entityLinks)
      .values({
        fromType: "certificate",
        fromId: edge.certId,
        relation: edge.relation,
        toType: edge.toType,
        toId: edge.toId,
      })
      .onConflictDoNothing()
      .run();
  }

  removeRelation(edge: { certId: string } & CertRelation): void {
    db.delete(t.entityLinks)
      .where(
        and(
          eq(t.entityLinks.fromType, "certificate"),
          eq(t.entityLinks.fromId, edge.certId),
          eq(t.entityLinks.relation, edge.relation),
          eq(t.entityLinks.toType, edge.toType),
          eq(t.entityLinks.toId, edge.toId)
        )
      )
      .run();
  }
}

/**
 * Certificate domain — entities.
 *
 * A certificate is an IMMUTABLE historical record of a contribution (Principle
 * III). The software preserves it; it never rewrites it. Only the certificate's
 * *digital relationships* (verification, master asset, related story/press/media)
 * evolve — modeled as graph edges, not edits to the artifact.
 */
import type { RegistryId } from "@shared/index";

export type CertificateStatus = "draft" | "issued" | "revoked" | "reserved";

export type RecipientType = "person" | "organization";

/** A person/organization who signed the original physical certificate. */
export interface Signatory {
  name: string;
  role?: string;
  organization?: string;
}

/** The certificate row as stored (mirror of the `certificates` table). */
export interface CertificateRow {
  id: string;
  registryId: RegistryId | null;
  publicId: string;
  personId: string | null;
  organizationId: string | null;
  chapterId: string | null;
  roleAtIssue: string;
  artworkId: string | null;
  issuedOn: string | null;
  status: CertificateStatus;
  verificationHash: string | null;
  soulboundRef: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A graph relationship hanging off a certificate (the evolving digital layer). */
export interface CertRelation {
  relation: string;
  toType: string;
  toId: string;
}

/** A certificate plus the resolved names needed to list it. */
export interface CertificateListItem extends CertificateRow {
  recipientType: RecipientType | null;
  recipientName: string | null;
  recipientSlug: string | null;
  artworkTitle: string | null;
  artworkSlug: string | null;
  chapterName: string | null;
  chapterSlug: string | null;
  isGenesisChapter: boolean;
  /** Member of the Genesis Collection (the 14 founding-artist certificates). */
  isGenesisCollection: boolean;
}

/** A certificate's master preservation asset (the high-resolution scan). */
export interface MasterAsset {
  id: string;
  storagePath: string | null;
  sha256: string | null;
  altText: string | null;
}

/** The full certificate aggregate: artifact + its evolving digital relationships. */
export interface CertificateContext extends CertificateListItem {
  relations: CertRelation[];
  masterAsset: MasterAsset | null;
  /** Derived preservation posture (see CertificateService.preservationStatus). */
  archiveStatus: "preserved" | "pending" | "reserved";
}

export interface CertificateListQuery {
  q?: string;
  status?: CertificateStatus;
  recipientType?: RecipientType;
  genesisCollectionOnly?: boolean;
  includeReserved?: boolean;
}

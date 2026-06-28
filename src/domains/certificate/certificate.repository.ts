/**
 * CertificateRepository — the domain's storage contract (an implementation
 * detail; callers use CertificateService). Sync over better-sqlite3 today; an
 * async Postgres implementation slots in later (ADR-0001) without changing the
 * service. Note the WRITE surface is deliberately narrow: status transitions and
 * graph relationships only — never the immutable artifact fields.
 */
import type {
  CertificateContext,
  CertificateListItem,
  CertificateListQuery,
  CertRelation,
} from "./certificate.types";

export interface CertificateRepository {
  findById(id: string): CertificateContext | null;
  findByPublicId(publicId: string): CertificateContext | null;
  findByRegistryId(registryId: string): CertificateContext | null;
  list(query: CertificateListQuery): CertificateListItem[];
  listGenesisCollection(): CertificateListItem[];
  listForPerson(personId: string): CertificateListItem[];
  countByStatus(): Record<string, number>;

  // Evolving digital layer only:
  setIssued(id: string, issuedOn: string, verificationHash: string, actor: string): void;
  setStatus(id: string, status: "issued" | "revoked", actor: string): void;
  addRelation(edge: { certId: string } & CertRelation): void;
  removeRelation(edge: { certId: string } & CertRelation): void;
}

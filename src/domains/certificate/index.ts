import "server-only";
/**
 * @domains/certificate — the Certificate domain's PUBLIC contract.
 * The institutional identity layer: preserves the Genesis Collection as immutable
 * historical records and exposes the relationships that evolve around them.
 */
import { CertificateService } from "./certificate.service";
import { SqliteCertificateRepository } from "./certificate.repository.sqlite";

export { CertificateService } from "./certificate.service";
export type { CertificateRepository } from "./certificate.repository";
export type {
  CertificateStatus,
  RecipientType,
  Signatory,
  CertificateRow,
  CertRelation,
  CertificateListItem,
  CertificateListQuery,
  CertificateContext,
  MasterAsset,
} from "./certificate.types";

/** The wired Certificate service (SQLite backend today). */
export const certificateService = new CertificateService(new SqliteCertificateRepository());

// Server-action adapters (defined after the singleton so the import resolves).
export {
  issueCertificateAction,
  revokeCertificateAction,
  relateCertificateAction,
  unrelateCertificateAction,
} from "./certificate.api";

import "server-only";
/**
 * @domains/verification — the Verification domain's PUBLIC contract.
 * Off-chain certificate verification (works with no blockchain) + the claim
 * workflow that begins a contributor's lifelong relationship with Planet B.
 */
import { VerificationService } from "./verification.service";
import { SqliteVerificationRepository } from "./verification.repository.sqlite";

export { VerificationService } from "./verification.service";
export type { VerificationRepository } from "./verification.repository";
export type {
  ClaimStatus,
  ClaimRequestRow,
  ClaimListItem,
  VerifyStatus,
  VerifyOutcome,
} from "./verification.types";

/** The wired Verification service (SQLite backend today). */
export const verificationService = new VerificationService(new SqliteVerificationRepository());

export {
  verifyCertificate,
  submitClaimAction,
  matchClaimAction,
  reviewClaimAction,
} from "./verification.api";

/**
 * Verification domain — entities.
 *
 * Two responsibilities: (1) VERIFY a certificate's authenticity off-chain today
 * (recompute the canonical hash, compare), with on-chain resolution behind the
 * BlockchainService for later; (2) the CLAIM workflow that lets a living
 * contributor connect a physical certificate to their (future) Planet Passport.
 */

export type ClaimStatus =
  | "uploaded"
  | "ocr_done"
  | "matched"
  | "needs_review"
  | "claimed"
  | "rejected";

export interface ClaimRequestRow {
  id: string;
  fileRef: string | null;
  ocrText: string | null;
  ocrConfidence: number | null;
  parsedFields: unknown;
  submittedPublicId: string | null;
  matchedCertificateId: string | null;
  confidence: number | null;
  status: ClaimStatus;
  submittedBy: string | null;
  reviewer: string | null;
  reviewNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimListItem extends ClaimRequestRow {
  matchedPublicId: string | null;
  matchedRecipientName: string | null;
}

/** The result of verifying a certificate (extends the model's VerificationResult). */
export type VerifyStatus =
  | "verified"
  | "unissued"
  | "mismatch"
  | "revoked"
  | "reserved"
  | "not_found";

export interface VerifyOutcome {
  query: string;
  found: boolean;
  status: VerifyStatus;
  /** Off-chain hash check. */
  hashValid: boolean;
  /** On-chain resolution (false until the chain is enabled). */
  onChain: boolean;
  soulboundRef: string | null;
  certificate: {
    id: string;
    publicId: string;
    registryId: string | null;
    recipientName: string | null;
    roleAtIssue: string;
    chapterName: string | null;
    issuedOn: string | null;
    status: string;
    isGenesisCollection: boolean;
  } | null;
}

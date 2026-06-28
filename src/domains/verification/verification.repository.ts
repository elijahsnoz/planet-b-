/**
 * VerificationRepository — storage contract for the claim workflow (claim_requests).
 * Verification *events* are written via @platform/preservation (append-only).
 * Implementation detail of the domain; callers use VerificationService.
 */
import type { ClaimListItem, ClaimRequestRow, ClaimStatus } from "./verification.types";

export interface NewClaim {
  id: string;
  fileRef?: string | null;
  submittedPublicId?: string | null;
  submittedBy?: string | null;
}

export interface ClaimPatch {
  ocrText?: string | null;
  ocrConfidence?: number | null;
  parsedFields?: unknown;
  submittedPublicId?: string | null;
  matchedCertificateId?: string | null;
  confidence?: number | null;
  status?: ClaimStatus;
  reviewer?: string | null;
  reviewNote?: string | null;
  decidedAt?: string | null;
}

export interface VerificationRepository {
  createClaim(claim: NewClaim): ClaimRequestRow;
  getClaim(id: string): ClaimListItem | null;
  listClaims(opts?: { status?: ClaimStatus }): ClaimListItem[];
  updateClaim(id: string, patch: ClaimPatch): void;
}

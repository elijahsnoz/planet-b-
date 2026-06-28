/**
 * BlockchainService — the trust layer's provider-agnostic seam (doc 07, ADR-0007).
 *
 * The platform NEVER imports a chain SDK; it depends on this interface. The
 * default provider is Noop, so Planet B works perfectly with no chain — the
 * chain only *adds* trust. Solana is the first real implementation, later.
 * Custody-optional: nothing here ever requires an artist to hold a wallet.
 * Pure types only.
 */
import type { Result, RegistryId } from "@shared/index";
import type { VerificationResult, CertificateClaimV1 } from "@/models";

/** Where a credential/anchor lives on-chain (generalizes certificates.soulbound_ref). */
export interface OnchainRef {
  entityType: string;
  entityId: string;
  provider: string;
  tokenRef: string;
  kind: "sbt" | "anchor" | "attestation";
  mintedAt?: string;
}

export interface AnchorReceipt {
  anchorId: RegistryId; // PB-ANCHOR-…
  merkleRoot: string;
  memberCount: number;
  provider: string;
  txRef?: string;
  anchoredAt: string;
}

export interface MintCredentialInput {
  /** The certificate/passport/etc. being credentialed. */
  entityType: "certificate" | "passport" | "artwork" | "chapter";
  entityId: string;
  /** Custodial address resolution is the provider's concern; may be undefined. */
  holderRef?: string;
}

export interface BlockchainService {
  /** Provider label, e.g. "noop" | "solana". */
  readonly provider: string;
  /** Whether on-chain operations are enabled. False for Noop. */
  readonly enabled: boolean;

  /** Deterministic, versioned canonical hash of a certificate claim (sync). */
  hashClaim(claim: CertificateClaimV1): string;
  /** Hash an arbitrary canonical archive payload (e.g. a Merkle leaf). */
  hashArchive(canonical: string): string;

  verifyCertificate(publicId: string): Promise<Result<VerificationResult>>;
  verifyArtwork(registryId: RegistryId): Promise<Result<VerificationResult>>;
  verifyChapter(registryId: RegistryId): Promise<Result<VerificationResult>>;

  mintCredential(input: MintCredentialInput): Promise<Result<OnchainRef>>;
  anchorBatch(leafHashes: string[]): Promise<Result<AnchorReceipt>>;
  resolve(ref: { entityType: string; entityId: string }): Promise<Result<OnchainRef | null>>;
}

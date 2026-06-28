import "server-only";
/**
 * NoopBlockchainService — the DEFAULT provider. The chain is disabled; the app
 * works fully without it. Off-chain hashing still works here (it is not a chain
 * operation): `hashClaim`/`hashArchive` produce the canonical sha256 the
 * Verification domain compares against. On-chain operations report "not enabled"
 * (mint/anchor) or onChain:false (verify). Solana replaces this later (ADR-0007).
 */
import { createHash } from "node:crypto";
import { ok, err, UnavailableError, type Result, type RegistryId } from "@shared/index";
import type { VerificationResult, CertificateClaimV1 } from "@/models";
import type {
  AnchorReceipt,
  BlockchainService,
  MintCredentialInput,
  OnchainRef,
} from "./blockchain.service";

/** Stable, ordered serialization so a 2026 hash still validates in 2050. */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export class NoopBlockchainService implements BlockchainService {
  readonly provider = "noop";
  readonly enabled = false;

  hashClaim(claim: CertificateClaimV1): string {
    return sha256Hex(canonicalize(claim));
  }

  hashArchive(canonical: string): string {
    return sha256Hex(canonical);
  }

  // Off-chain verify of the hash is the Verification domain's job; the chain
  // layer only reports the on-chain dimension, which is absent under Noop.
  async verifyCertificate(publicId: string): Promise<Result<VerificationResult>> {
    return ok({ publicId, hashValid: false, onChain: false, soulboundRef: null });
  }
  async verifyArtwork(registryId: RegistryId): Promise<Result<VerificationResult>> {
    return ok({ publicId: registryId, hashValid: false, onChain: false, soulboundRef: null });
  }
  async verifyChapter(registryId: RegistryId): Promise<Result<VerificationResult>> {
    return ok({ publicId: registryId, hashValid: false, onChain: false, soulboundRef: null });
  }

  async mintCredential(_input: MintCredentialInput): Promise<Result<OnchainRef>> {
    return err(new UnavailableError("Blockchain is not enabled (Noop provider)."));
  }
  async anchorBatch(_leafHashes: string[]): Promise<Result<AnchorReceipt>> {
    return err(new UnavailableError("Blockchain is not enabled (Noop provider)."));
  }
  async resolve(_ref: { entityType: string; entityId: string }): Promise<Result<OnchainRef | null>> {
    return ok(null);
  }
}

/**
 * @platform/blockchain — the trust layer's chain seam (doc 07, ADR-0007).
 * Provider selected here from config; the rest of the app depends on the
 * `blockchain` interface, never a chain SDK. Default is Noop (chain disabled).
 */
import { NoopBlockchainService } from "./blockchain.noop";
import type { BlockchainService } from "./blockchain.service";

export type {
  BlockchainService,
  OnchainRef,
  AnchorReceipt,
  MintCredentialInput,
} from "./blockchain.service";
export { NoopBlockchainService } from "./blockchain.noop";

/** Feature flag — only "noop" is implemented today. */
const PROVIDER = process.env.PLANET_B_CHAIN_PROVIDER ?? "noop";

function select(provider: string): BlockchainService {
  switch (provider) {
    // case "solana": return new SolanaBlockchainService(); // later (ADR-0007)
    case "noop":
    default:
      return new NoopBlockchainService();
  }
}

export const blockchain: BlockchainService = select(PROVIDER);

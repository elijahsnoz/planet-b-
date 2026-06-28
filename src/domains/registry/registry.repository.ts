/**
 * RegistryRepository — the storage contract for permanent ID minting.
 *
 * An IMPLEMENTATION DETAIL of the Registry domain (ADR-0009): nothing outside
 * the domain imports this; callers use the published RegistryService. Counter
 * minting is intrinsically synchronous + atomic (single upsert), so this
 * contract is sync rather than Promise-based.
 */
import type { RegistryKind } from "@shared/index";

export interface RegistryRepository {
  /** Atomically increment the counter for `kind` and return the new value. */
  nextValue(kind: RegistryKind): number;
  /** Current counter value without incrementing (0 if the kind is unused). */
  peek(kind: RegistryKind): number;
}

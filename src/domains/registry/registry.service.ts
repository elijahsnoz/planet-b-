/**
 * RegistryService — the Planet Registry's business rules: mint permanent,
 * never-reused identifiers (`PB-<KIND>-<NNNNNN>`) for every cultural record.
 *
 * This is the domain's published capability. It depends on the RegistryRepository
 * INTERFACE, not on any database — the storage driver is injected.
 */
import { formatRegistryId, type RegistryId, type RegistryKind } from "@shared/index";
import type { RegistryRepository } from "./registry.repository";

export class RegistryService {
  constructor(private readonly repo: RegistryRepository) {}

  /** Mint the next permanent Registry ID for a kind. */
  mint(kind: RegistryKind): RegistryId {
    return formatRegistryId(kind, this.repo.nextValue(kind));
  }

  /** How many of a kind have been minted so far. */
  count(kind: RegistryKind): number {
    return this.repo.peek(kind);
  }
}

import "server-only";
/**
 * @domains/registry — the Planet Registry domain's PUBLIC contract.
 *
 * Other code imports ONLY from here (ADR-0009). The repository implementation is
 * private to the domain. This is the reference shape every other domain follows:
 * types + service + repository(interface) + sqlite repository, published behind
 * a single index.
 */
import { RegistryService } from "./registry.service";
import { SqliteRegistryRepository } from "./registry.repository.sqlite";
import type { RegistryId, RegistryKind } from "@shared/index";

export { RegistryService } from "./registry.service";
export type { RegistryRepository } from "./registry.repository";
export { formatRegistryId, isRegistryId, parseRegistryId, REGISTRY_KINDS } from "@shared/index";
export type { RegistryId, RegistryKind } from "@shared/index";

/** The wired, ready-to-use Registry service (SQLite backend today). */
export const registryService = new RegistryService(new SqliteRegistryRepository());

/** Convenience: mint a permanent Registry ID. (Same behavior as the legacy lib/registry.) */
export function mintRegistryId(kind: RegistryKind): RegistryId {
  return registryService.mint(kind);
}

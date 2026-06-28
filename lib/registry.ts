import "server-only";
/**
 * Back-compat shim. Registry minting moved into the Registry domain
 * (@domains/registry) as part of the move to Domain-Driven Architecture
 * (ADR-0009). Existing imports of `@/lib/registry` keep working; new code should
 * import from `@domains/registry` directly.
 */
export { mintRegistryId } from "@domains/registry";

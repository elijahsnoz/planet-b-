/**
 * Identifier value types and the Registry ID format — `PB-<KIND>-<NNNNNN>`.
 *
 * Registry IDs are permanent and minted atomically by the Registry domain
 * (@domains/registry). This module owns only the *shape* and parsing, so any
 * layer can validate an ID without importing the database.
 */

export type Uuid = string;

/** A permanent Planet Registry identifier, e.g. "PB-ARTWORK-000002". */
export type RegistryId = string;

/** Registry kinds (kept in sync with the canon + registry_counters). */
export type RegistryKind =
  | "artist"
  | "artwork"
  | "chapter"
  | "cert"
  | "org"
  | "event"
  | "story"
  | "media"
  | "id" // Planet Passport (PB-ID-…)
  | "asset"
  | "anchor"; // chain batch (PB-ANCHOR-…)

export const REGISTRY_KINDS: readonly RegistryKind[] = [
  "artist",
  "artwork",
  "chapter",
  "cert",
  "org",
  "event",
  "story",
  "media",
  "id",
  "asset",
  "anchor",
];

export const REGISTRY_ID_PADDING = 6;
export const REGISTRY_ID_RE = /^PB-[A-Z]+-\d{6,}$/;

/** Render a kind + counter value into a canonical Registry ID. */
export function formatRegistryId(kind: RegistryKind, value: number): RegistryId {
  return `PB-${kind.toUpperCase()}-${String(value).padStart(REGISTRY_ID_PADDING, "0")}`;
}

export function isRegistryId(value: string): value is RegistryId {
  return REGISTRY_ID_RE.test(value);
}

/** Parse a Registry ID back into its parts, or null if malformed. */
export function parseRegistryId(id: string): { kind: string; value: number } | null {
  const m = /^PB-([A-Z]+)-(\d{6,})$/.exec(id);
  if (!m) return null;
  return { kind: m[1]!.toLowerCase(), value: Number(m[2]) };
}

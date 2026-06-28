/**
 * Clock — an injectable time source. Domains take a Clock instead of calling
 * Date directly, so business rules (expiry, "as of") are testable and the
 * archive's timestamps stay consistent (ISO-8601 UTC).
 */

export interface Clock {
  now(): Date;
  /** ISO-8601 UTC string — the archive's canonical timestamp format. */
  nowIso(): string;
}

export const systemClock: Clock = {
  now: () => new Date(),
  nowIso: () => new Date().toISOString(),
};

/** A fixed clock for tests. */
export function fixedClock(iso: string): Clock {
  return { now: () => new Date(iso), nowIso: () => iso };
}

import "server-only";

/**
 * Centralised, fail-fast access to security-sensitive environment variables.
 *
 * Principle: a missing secret must NEVER silently fall back to a predictable
 * default in production. In development we allow a clearly-labelled dev value so
 * the app still runs, but we warn loudly so it can't be mistaken for safe.
 */

const isProd = process.env.NODE_ENV === "production";

/** Throw in production if `value` is missing; otherwise return the dev fallback (with a warning). */
function requiredSecret(name: string, value: string | undefined, devFallback: string): string {
  if (value && value.length > 0) return value;
  if (isProd) {
    throw new Error(
      `[planet-b] Missing required environment variable ${name}. ` +
        `Refusing to start in production with an insecure default. ` +
        `Set ${name} to a long, random value.`
    );
  }
  console.warn(
    `\x1b[33m[planet-b] ${name} is not set — using an INSECURE development fallback. ` +
      `Never deploy without setting ${name}.\x1b[0m`
  );
  return devFallback;
}

/** Signing secret for session JWTs. Must be set (32+ bytes) in production. */
export function sessionSecret(): Uint8Array {
  const value = requiredSecret(
    "PLANET_B_SESSION_SECRET",
    process.env.PLANET_B_SESSION_SECRET,
    "dev-only-secret-change-me-please-32-bytes!!"
  );
  if (isProd && value.length < 32) {
    throw new Error("[planet-b] PLANET_B_SESSION_SECRET must be at least 32 characters in production.");
  }
  return new TextEncoder().encode(value);
}

/**
 * HMAC key for the anonymous visitor token (The Garden). Prefers a dedicated
 * PLANET_B_VISITOR_SECRET; otherwise reuses the session secret so enabling the
 * Garden never forces a new mandatory production secret. Separable later.
 */
export function visitorTokenSecret(): Uint8Array {
  const dedicated = process.env.PLANET_B_VISITOR_SECRET;
  if (dedicated && dedicated.length > 0) return new TextEncoder().encode(dedicated);
  return sessionSecret();
}

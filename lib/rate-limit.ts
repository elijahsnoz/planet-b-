import "server-only";

/**
 * Minimal in-memory rate limiter for login throttling.
 *
 * Planet B runs as a single Node process backed by a local SQLite file, so a
 * process-local map is an honest fit — no external store needed. If the app is
 * ever scaled horizontally, swap this for a shared store (Redis/DB) behind the
 * same interface.
 */

type Bucket = { count: number; resetAt: number; blockedUntil: number };

declare global {
  // eslint-disable-next-line no-var
  var __planetb_ratelimit__: Map<string, Bucket> | undefined;
}

const buckets = global.__planetb_ratelimit__ ?? new Map<string, Bucket>();
global.__planetb_ratelimit__ = buckets;

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // failed attempts allowed per window
const BLOCK_MS = 15 * 60 * 1000; // lockout duration after exceeding the limit

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

/** Check whether `key` may attempt now. Does not consume an attempt. */
export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const b = buckets.get(key);
  if (b && b.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** Record a failed attempt for `key`; locks the key out once the limit is exceeded. */
export function registerFailure(key: string, now = Date.now()): RateLimitResult {
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 };
  }
  b.count += 1;
  if (b.count >= MAX_ATTEMPTS) {
    b.blockedUntil = now + BLOCK_MS;
  }
  buckets.set(key, b);
  return b.blockedUntil > now
    ? { allowed: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) }
    : { allowed: true, retryAfterSec: 0 };
}

/** Clear a key's counter after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { visitorTokenSecret } from "@/lib/env";

/**
 * The durable anonymous visitor token — transport concern, no domain or vendor here.
 *
 * The raw token is a 192-bit opaque secret stored (signed) in an httpOnly cookie.
 * The cookie value is `raw.HMAC(raw)`; a forged cookie fails signature verification.
 * The database only ever stores `hashToken(raw)` — never the raw token — so a DB
 * leak cannot impersonate a visitor.
 */
function key(): Buffer {
  return Buffer.from(visitorTokenSecret());
}

export function newRawToken(): string {
  return randomBytes(24).toString("base64url");
}

export function signToken(raw: string): string {
  const sig = createHmac("sha256", key()).update(raw).digest("base64url");
  return `${raw}.${sig}`;
}

/** Verify a signed cookie value; returns the raw token or null if tampered. */
export function verifyToken(signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const raw = signed.slice(0, dot);
  const provided = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(createHmac("sha256", key()).update(raw).digest("base64url"));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return raw;
}

/** The stable, opaque key the domain identifies a visitor by. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

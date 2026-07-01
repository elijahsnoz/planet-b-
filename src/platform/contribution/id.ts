import type { IdGenerator } from "@domains/contribution";

/**
 * UUIDv7 — time-ordered ids. Sequential-ish keys keep B-tree inserts local and
 * range scans fast at 50M rows, unlike random UUIDv4. Infrastructure detail behind
 * the IdGenerator port; the domain never knows which id scheme it gets.
 */
export class UuidV7Generator implements IdGenerator {
  next(): string {
    return uuidV7();
  }
}

function uuidV7(): string {
  const b = new Uint8Array(16);
  const ts = Date.now(); // 48-bit unix ms
  for (let i = 0; i < 6; i++) b[5 - i] = Math.floor(ts / 2 ** (8 * i)) % 256;
  crypto.getRandomValues(b.subarray(6));
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

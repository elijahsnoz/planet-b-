import { z } from "zod";

/**
 * Input validation for admin forms. Every server action parses untrusted
 * FormData through one of these schemas before touching the database: enforced
 * types, length ceilings (defence against DoS / storage bloat), and constrained
 * enums for the status / consent workflows defined in db/schema.ts.
 */

const STATUS = ["draft", "in_review", "published", "archived"] as const;
const CONSENT = ["granted", "pending", "withheld"] as const;

/** Trim a form value to a required, non-empty string (with a friendly message). */
const reqStr = (max: number, msg: string) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string().min(1, msg).max(max));

/** Optional text → trimmed string or null. */
const optStr = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
    z.string().max(max).nullable()
  );

/** Comma-separated list → trimmed, de-empty string array (cap entries + length). */
const csvList = (maxItems: number, maxLen: number) =>
  z.preprocess(
    (v) =>
      typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, maxItems)
        : [],
    z.array(z.string().max(maxLen))
  );

const status = z.preprocess(
  (v) => (typeof v === "string" && v ? v : "draft"),
  z.enum(STATUS)
);

const consentStatus = z.preprocess(
  (v) => (typeof v === "string" && v ? v : "pending"),
  z.enum(CONSENT)
);

/** A bare entity id from a hidden form field. */
export const idSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Missing id.").max(64)
);

export const loginSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : ""),
    z.string().email().max(254)
  ),
  password: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().min(1).max(256)
  ),
});

export const organizationSchema = z.object({
  name: reqStr(200, "Name is required."),
  type: optStr(80),
  role: optStr(120),
  about: optStr(5000),
  website: optStr(500),
  logoMedia: optStr(200),
  established: optStr(80),
  status,
});

/** Media details — the curatorial metadata for a picture (the file is handled separately). */
export const mediaSchema = z.object({
  title: optStr(200),
  description: optStr(5000),
  altText: optStr(500),
  caption: optStr(1000),
  credit: optStr(300),
  source: optStr(300),
  license: optStr(200),
  author: optStr(200),
  copyright: optStr(200),
  captureDate: optStr(40),
  location: optStr(200),
  tags: csvList(40, 60),
  status,
});

export const personSchema = z.object({
  fullName: reqStr(200, "Full name is required."),
  displayName: optStr(200),
  primaryRole: optStr(120),
  roles: csvList(40, 120),
  shortBio: optStr(5000),
  consentStatus,
  status,
});

export const artworkSchema = z.object({
  title: reqStr(200, "Title is required."),
  artistId: optStr(64),
  medium: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : "Discarded items assemblage"),
    z.string().max(200)
  ),
  dimensions: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : "61cm x 61cm"),
    z.string().max(120)
  ),
  year: z.preprocess((v) => {
    const n = Number(typeof v === "string" ? v.trim() : v);
    return Number.isFinite(n) && n !== 0 ? n : 2026;
  }, z.number().int().min(1900).max(2200)),
  statement: optStr(5000),
  significance: optStr(5000),
  materials: csvList(50, 120),
  status,
});

/**
 * Parse FormData through a schema, throwing a single readable error on failure.
 * Server actions surface thrown messages, so the first issue is human-friendly.
 */
export function parseForm<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}

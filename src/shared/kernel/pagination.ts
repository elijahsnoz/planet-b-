/**
 * Pagination — keyset (cursor) by default so it stays correct at archive scale
 * (250k+ artworks). `total` is optional because counting large sets is costly.
 */

export interface PageRequest {
  /** Max items to return (repositories clamp to a sane ceiling). */
  limit?: number;
  /** Opaque keyset cursor from a prior page; null/undefined = first page. */
  cursor?: string | null;
}

export interface Page<T> {
  items: T[];
  /** Cursor for the next page, or null when exhausted. */
  nextCursor: string | null;
  /** Present only when cheap/requested. */
  total?: number;
}

export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 200;

export function clampLimit(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(limit, MAX_PAGE_LIMIT);
}

export function emptyPage<T>(): Page<T> {
  return { items: [], nextCursor: null, total: 0 };
}

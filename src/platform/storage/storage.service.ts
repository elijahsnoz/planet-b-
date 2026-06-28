/**
 * StorageService — the swappable object-storage seam for media masters and
 * derivatives. Local filesystem now; Supabase Storage (signed URLs, buckets,
 * RLS) later, behind this same interface (ADR-0001, doc 09). Pure types only.
 */
import type { Result } from "@shared/index";

export interface StoredObject {
  key: string;
  url?: string;
  bytes?: number;
  mime?: string;
  sha256?: string;
}

export interface PutOptions {
  contentType?: string;
  cacheControl?: string;
  /** Masters are immutable once written (preservation). */
  immutable?: boolean;
}

export interface UrlOptions {
  /** Request a time-limited signed URL (restricted assets). */
  signed?: boolean;
  expiresInSec?: number;
}

export interface StorageService {
  /** Backend label, e.g. "local" | "supabase". */
  readonly backend: string;
  put(key: string, data: Uint8Array, opts?: PutOptions): Promise<Result<StoredObject>>;
  get(key: string): Promise<Result<Uint8Array>>;
  url(key: string, opts?: UrlOptions): Promise<Result<string>>;
  exists(key: string): Promise<boolean>;
  /** Removes the stored object. Archival/soft-delete is a record concern, not storage. */
  remove(key: string): Promise<Result<void>>;
}

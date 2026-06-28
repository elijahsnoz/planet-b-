/**
 * @platform/storage — object storage behind one interface.
 * The active backend is chosen here; callers depend on `storage` (the interface),
 * never a concrete class (ADR-0001, doc 09).
 */
import { LocalStorageService } from "./storage.local";
import type { StorageService } from "./storage.service";

export type {
  StorageService,
  StoredObject,
  PutOptions,
  UrlOptions,
} from "./storage.service";
export { LocalStorageService } from "./storage.local";

/** The active storage backend (local now; Supabase Storage later via config). */
export const storage: StorageService = new LocalStorageService();

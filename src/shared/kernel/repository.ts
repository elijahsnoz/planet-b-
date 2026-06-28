/**
 * Base repository contracts. Repositories are an IMPLEMENTATION DETAIL inside a
 * domain (ADR-0009): a domain publishes its service, never its repository. These
 * generic shapes keep the per-domain interfaces consistent and let us swap the
 * storage driver (SQLite now → Supabase Postgres later, ADR-0001) without
 * touching business logic.
 */

import type { Page, PageRequest } from "./pagination";

/** Read side: lookups and listing. */
export interface ReadRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  list(req?: PageRequest): Promise<Page<T>>;
}

/** Write side: create/update plus soft-delete + restore (never hard-delete). */
export interface WriteRepository<T, ID = string> {
  insert(entity: T): Promise<void>;
  update(id: ID, patch: Partial<T>): Promise<void>;
  /** Soft-delete: set archivedAt. */
  archive(id: ID, at: string): Promise<void>;
  restore(id: ID): Promise<void>;
}

export interface Repository<T, ID = string>
  extends ReadRepository<T, ID>,
    WriteRepository<T, ID> {}

/**
 * A unit of work — a transaction boundary a domain service can run a set of
 * writes (record + graph edges + audit + revision) inside, atomically. The
 * platform/db layer provides the concrete implementation.
 */
export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

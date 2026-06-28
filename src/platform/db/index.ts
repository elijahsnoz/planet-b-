import "server-only";
/**
 * @platform/db — the single access point to the database driver.
 *
 * Today this is Drizzle over better-sqlite3 (the portable archive). Per ADR-0001
 * the rest of the system reaches the DB ONLY through domain repositories, which
 * import from here — so swapping to Supabase Postgres later is a change confined
 * to this folder + the repository implementations, never the domains.
 */
export { db, schema } from "@/db/client";
export type { DB } from "@/db/client";

import { sql } from "drizzle-orm";
import { db as _db } from "@/db/client";
import type { UnitOfWork } from "@shared/index";

/**
 * Transaction boundary for multi-write operations (record + graph edges + audit
 * + revision). better-sqlite3 is synchronous and single-threaded, so a domain
 * service's writes inside `run` execute without interleaving. The richer
 * Postgres implementation (true async tx) arrives with the backbone migration.
 */
export const unitOfWork: UnitOfWork = {
  async run<T>(work: () => Promise<T>): Promise<T> {
    // Drizzle's better-sqlite3 transaction expects a sync callback; our writes
    // resolve synchronously, so we guard with explicit BEGIN/COMMIT/ROLLBACK.
    _db.run(sql`BEGIN`);
    try {
      const result = await work();
      _db.run(sql`COMMIT`);
      return result;
    } catch (e) {
      _db.run(sql`ROLLBACK`);
      throw e;
    }
  },
};

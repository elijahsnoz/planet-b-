import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import { GARDEN_SQLITE_SCHEMA } from "./schema";

/**
 * The Garden's local store — a separate SQLite file (db/garden.db), isolated from
 * the Archive database, opened once and schema-ensured lazily. Used when Supabase
 * is not configured, so the architecture can be proven end-to-end with no external
 * infrastructure.
 */
declare global {
  // eslint-disable-next-line no-var
  var __planetb_garden_db__: Database.Database | undefined;
}

export function gardenDb(): Database.Database {
  if (global.__planetb_garden_db__) return global.__planetb_garden_db__;
  const file = process.env.PLANET_B_GARDEN_DB ?? path.join(process.cwd(), "db", "garden.db");
  const d = new Database(file);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(GARDEN_SQLITE_SCHEMA);
  global.__planetb_garden_db__ = d;
  return d;
}

import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

/**
 * The Planet B database connection (SQLite via better-sqlite3 + Drizzle).
 * Single file at db/planet-b.db — the portable, inheritable archive.
 * Server-only; a cached singleton so Next's many module instances share one handle.
 */
const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");

declare global {
  // eslint-disable-next-line no-var
  var __planetb_sqlite__: Database.Database | undefined;
}

function connect(): Database.Database {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return sqlite;
}

const sqlite = global.__planetb_sqlite__ ?? connect();
if (process.env.NODE_ENV !== "production") global.__planetb_sqlite__ = sqlite;

export const db = drizzle(sqlite, { schema });
export { schema };
export type DB = typeof db;

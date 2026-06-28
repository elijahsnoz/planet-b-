/**
 * Applies Drizzle migrations to db/planet-b.db. Run: npm run db:migrate
 * (Standalone script — does not import the server-only client.)
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";

const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
console.log("✓ migrations applied →", DB_PATH);
sqlite.close();

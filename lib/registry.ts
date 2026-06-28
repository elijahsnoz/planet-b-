import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/**
 * Mints a permanent registry ID (PB-{KIND}-{NNNNNN}). SQLite has no sequences,
 * so we upsert-increment registry_counters atomically. IDs never repeat/change.
 */
export function mintRegistryId(kind: string): string {
  const row = db.get<{ last_value: number }>(sql`
    insert into registry_counters(kind, last_value) values (${kind}, 1)
    on conflict(kind) do update set last_value = last_value + 1
    returning last_value
  `);
  return `PB-${kind.toUpperCase()}-${String(row.last_value).padStart(6, "0")}`;
}

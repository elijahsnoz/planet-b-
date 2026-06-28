import "server-only";
/**
 * SqliteRegistryRepository — better-sqlite3 implementation of RegistryRepository.
 * SQLite has no sequences, so we upsert-increment `registry_counters` atomically.
 * Swapped for a Postgres sequence/identity implementation later (ADR-0001),
 * without any change to RegistryService or its callers.
 */
import { sql } from "drizzle-orm";
import { db } from "@platform/db";
import type { RegistryKind } from "@shared/index";
import type { RegistryRepository } from "./registry.repository";

export class SqliteRegistryRepository implements RegistryRepository {
  nextValue(kind: RegistryKind): number {
    const row = db.get<{ last_value: number }>(sql`
      insert into registry_counters(kind, last_value) values (${kind}, 1)
      on conflict(kind) do update set last_value = last_value + 1
      returning last_value
    `);
    return row.last_value;
  }

  peek(kind: RegistryKind): number {
    const row = db.get<{ last_value: number } | undefined>(
      sql`select last_value from registry_counters where kind = ${kind}`
    );
    return row?.last_value ?? 0;
  }
}

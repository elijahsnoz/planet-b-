/**
 * Idempotent backfill for Phase 2C (Planet Passport domain).
 *
 *  - inserts the new `passport.*` RBAC permissions + grants them to
 *    super_admin / platform_admin
 *  - mints a Planet Passport (PB-ID-NNNNNN) for every existing person that does
 *    not already have one (Principle IV — no contributor becomes invisible)
 *
 * Safe to run repeatedly. A fresh `npm run db:reset` already includes these via
 * seed.ts; this script is only for the live archive file.
 *
 * Run: npx tsx db/backfill-phase2c.ts
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");

const ACTIONS = [
  "read", "create", "update", "publish", "archive", "restore",
  "issue", "revoke", "manage", "upload", "export", "history",
];

const insertPerm = sqlite.prepare("INSERT OR IGNORE INTO permissions(key) VALUES (?)");
const getPerm = sqlite.prepare("SELECT id FROM permissions WHERE key = ?");
const getRole = sqlite.prepare("SELECT id FROM roles WHERE key = ?");
const hasGrant = sqlite.prepare("SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?");
const grant = sqlite.prepare("INSERT INTO role_permissions(role_id, permission_id) VALUES (?, ?)");

const mintId = sqlite.prepare(
  `INSERT INTO registry_counters(kind, last_value) VALUES ('id', 1)
   ON CONFLICT(kind) DO UPDATE SET last_value = last_value + 1
   RETURNING last_value`
);
const peopleWithoutPassport = sqlite.prepare(
  `SELECT p.id FROM people p
   LEFT JOIN passports pp ON pp.person_id = p.id
   WHERE pp.id IS NULL
   ORDER BY p.registry_id, p.created_at`
);
const insertPassport = sqlite.prepare(
  `INSERT INTO passports(id, registry_id, passport_id, person_id, passport_status)
   VALUES (?, ?, ?, ?, 'unclaimed')`
);

const run = sqlite.transaction(() => {
  // 1. permissions
  const keys = ACTIONS.map((a) => `passport.${a}`);
  for (const k of keys) insertPerm.run(k);
  let granted = 0;
  for (const roleKey of ["super_admin", "platform_admin"]) {
    const role = getRole.get(roleKey) as { id: number } | undefined;
    if (!role) continue;
    for (const k of keys) {
      const perm = getPerm.get(k) as { id: number } | undefined;
      if (perm && !hasGrant.get(role.id, perm.id)) {
        grant.run(role.id, perm.id);
        granted++;
      }
    }
  }

  // 2. one Passport per person
  let minted = 0;
  for (const row of peopleWithoutPassport.all() as { id: string }[]) {
    const n = (mintId.get() as { last_value: number }).last_value;
    const pid = `PB-ID-${String(n).padStart(6, "0")}`;
    insertPassport.run(randomUUID(), pid, pid, row.id);
    minted++;
  }
  return { permissions: keys.length, granted, minted };
});

const r = run();
console.log(
  `✓ Phase 2C backfill: ensured ${r.permissions} passport permissions; ` +
    `added ${r.granted} role grants; minted ${r.minted} Passports.`
);
sqlite.close();

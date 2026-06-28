/**
 * Idempotent backfill for Phase 2B (Certificate + Verification domains).
 *
 * Brings an ALREADY-SEEDED database up to date without a destructive reset:
 *  - inserts the new `verification.*` RBAC permissions
 *  - grants every verification + certificate permission to super_admin + platform_admin
 *
 * Safe to run repeatedly (INSERT OR IGNORE / existence checks). A fresh
 * `npm run db:reset` already includes these via seed.ts; this script is only for
 * the live archive file.
 *
 * Run: npx tsx db/backfill-phase2b.ts
 */
import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.PLANET_B_DB ?? path.join(process.cwd(), "db", "planet-b.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");

const ACTIONS = [
  "read", "create", "update", "publish", "archive", "restore",
  "issue", "revoke", "manage", "upload", "export", "history",
];
const NEW_RESOURCES = ["verification"];

const insertPerm = sqlite.prepare("INSERT OR IGNORE INTO permissions(key) VALUES (?)");
const getPerm = sqlite.prepare("SELECT id FROM permissions WHERE key = ?");
const getRole = sqlite.prepare("SELECT id FROM roles WHERE key = ?");
const hasGrant = sqlite.prepare(
  "SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?"
);
const grant = sqlite.prepare(
  "INSERT INTO role_permissions(role_id, permission_id) VALUES (?, ?)"
);

const run = sqlite.transaction(() => {
  // 1. Ensure the new permission keys exist.
  const newKeys: string[] = [];
  for (const res of NEW_RESOURCES) {
    for (const act of ACTIONS) {
      const key = `${res}.${act}`;
      insertPerm.run(key);
      newKeys.push(key);
    }
  }

  // 2. Grant new permissions (+ all existing certificate.* for completeness) to
  //    the two top roles, mirroring seed.ts's "all permissions" rule.
  const certKeys = ACTIONS.map((a) => `certificate.${a}`);
  const keys = [...new Set([...newKeys, ...certKeys])];

  let granted = 0;
  for (const roleKey of ["super_admin", "platform_admin"]) {
    const role = getRole.get(roleKey) as { id: number } | undefined;
    if (!role) continue;
    for (const k of keys) {
      const perm = getPerm.get(k) as { id: number } | undefined;
      if (!perm) continue;
      if (!hasGrant.get(role.id, perm.id)) {
        grant.run(role.id, perm.id);
        granted++;
      }
    }
  }
  return { permissions: newKeys.length, granted };
});

const result = run();
console.log(
  `✓ Phase 2B backfill: ensured ${result.permissions} verification permissions; ` +
    `added ${result.granted} role grants.`
);
sqlite.close();

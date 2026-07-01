#!/usr/bin/env node
/**
 * Planet B — Constitution guard.
 *
 * Turns the mechanically-checkable invariants (docs/CONSTITUTION.md) into a build
 * gate. Principles that are only written drift; these fail the build if violated.
 * The remaining invariants are human review gates and are not checked here.
 *
 * Run: npm run check:invariants
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];
const fail = (label, msg) => failures.push(`${label} — ${msg}`);
const pass = (label, msg) => console.log(`  ✓ ${label} — ${msg}`);

function walk(dir, exts = [".ts", ".tsx"]) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") out.push(...walk(p, exts));
    } else if (exts.some((x) => e.name.endsWith(x))) {
      out.push(p);
    }
  }
  return out;
}
const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };
const importLines = (src) => src.split("\n").filter((l) => /^\s*import\b/.test(l));
const rel = (p) => relative(ROOT, p);

/** Every Garden migration, concatenated — so schema invariants cover all of them. */
function allMigrationsSql() {
  const dir = join(ROOT, "supabase/migrations");
  let names;
  try { names = readdirSync(dir); } catch { return ""; }
  return names.filter((f) => f.endsWith(".sql")).map((f) => read(join(dir, f))).join("\n").toLowerCase();
}

// ── The Constitution is FROZEN. These seven statements are the law, verbatim. ─
// Changing one requires a deliberate edit here AND in docs/CONSTITUTION.md — an
// explicit architecture review, never a silent feature-work edit.
const FROZEN_INVARIANTS = [
  "Contribution comes before identity.",
  "Popularity never determines visibility.",
  "Every contribution may matter decades from now.",
  "The archive remembers. It does not erase.",
  "The system optimises for meaning, never attention.",
  "Technology should disappear.",
  "Every contribution should have the potential to inspire another human being, even years later.",
];
{
  const doc = read(join(ROOT, "docs/CONSTITUTION.md"));
  const drifted = FROZEN_INVARIANTS.filter((s) => !doc.includes(s));
  if (drifted.length) {
    fail("Frozen constitution", `invariant wording drifted (edit the guard's frozen list only via architecture review): "${drifted[0]}"`);
  } else {
    pass("Frozen constitution", `all ${FROZEN_INVARIANTS.length} invariants intact, verbatim`);
  }
}

// ── Dependency rule: the Supabase SDK is imported by exactly one adapter file ─
{
  const files = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "app")), ...walk(join(ROOT, "lib"))];
  const importers = files.filter((f) => importLines(read(f)).some((l) => l.includes("@supabase/supabase-js")));
  const allowed = new Set(["src/platform/supabase/client.ts"]);
  const bad = importers.map(rel).filter((f) => !allowed.has(f));
  if (bad.length) fail("Dependency rule", `Supabase SDK imported outside the adapter edge: ${bad.join(", ")}`);
  else pass("Dependency rule", "Supabase SDK is imported only by the adapter edge");
}

// ── Core purity: the contribution domain imports no infrastructure/framework ──
{
  const files = walk(join(ROOT, "src/domains/contribution"));
  const forbidden = /from ['"](@platform|@supabase|next\/|@\/lib)/;
  const bad = files.filter((f) => importLines(read(f)).some((l) => forbidden.test(l))).map(rel);
  if (bad.length) fail("Core purity", `contribution domain imports infrastructure: ${bad.join(", ")}`);
  else pass("Core purity", "contribution domain imports only itself + zod");
}

// ── Invariant 1: contribution before identity (Garden code never imports auth) ─
{
  const files = ["src/domains/contribution", "src/platform/contribution", "lib/garden"].flatMap((d) => walk(join(ROOT, d)));
  const bad = files.filter((f) => importLines(read(f)).some((l) => /from ['"]@?\/?lib\/auth/.test(l))).map(rel);
  if (bad.length) fail("Invariant 1", `Garden code imports auth — identity must follow contribution: ${bad.join(", ")}`);
  else pass("Invariant 1", "the contribution path requires no auth");
}

// ── Invariant 2: no popularity signal exists in the schema (all migrations) ───
{
  const sql = allMigrationsSql();
  const forbidden = ["like_count", "likes", "follower", "followers", "upvote", "karma", "trending", "popularity", "view_count", "share_count"];
  const hits = forbidden.filter((w) => new RegExp(`\\b${w}\\b`).test(sql));
  if (hits.length) fail("Invariant 2", `schema contains popularity signal(s): ${hits.join(", ")}`);
  else pass("Invariant 2", "no popularity columns exist — visibility cannot be driven by them");
}

// ── Invariant 4: the archive remembers (soft-delete only, no cascade erase) ───
{
  const sql = allMigrationsSql();
  const problems = [];
  if (/on delete cascade/.test(sql)) problems.push("uses `on delete cascade` (would erase children)");
  if (!/deleted_at/.test(sql)) problems.push("missing soft-delete (`deleted_at`)");
  if (problems.length) fail("Invariant 4", problems.join("; "));
  else pass("Invariant 4", "soft-delete only; no cascade erase");
}

console.log("");
if (failures.length) {
  console.error("CONSTITUTION VIOLATED:\n" + failures.map((f) => `  ✗ ${f}`).join("\n"));
  console.error("\nSee docs/CONSTITUTION.md. An invariant is not a preference.");
  process.exit(1);
}
console.log("All checkable invariants hold. ✓");

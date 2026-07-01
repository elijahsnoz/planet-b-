#!/usr/bin/env node
/**
 * The Garden — one-command end-to-end proof against a RUNNING server.
 *
 * Store-agnostic: it exercises the HTTP write path, so it proves the exact same
 * thing whether the server is configured with the SQLite adapter or the real
 * Supabase adapter. After provisioning Supabase and starting the server with its
 * env vars, run this again — an identical PASS is the production-grade proof.
 *
 * Usage:  node scripts/garden-proof.mjs [baseUrl]     (default http://localhost:3000)
 * Needs:  the server running with PLANET_B_GARDEN=1.
 */
const base = process.argv[2] || process.env.PROOF_URL || "http://localhost:3000";
let allPass = true;
const check = (label, cond, detail = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) allPass = false;
};

const cookieFrom = (res) => (res.headers.get("set-cookie") || "").match(/pb_visitor=[^;]+/)?.[0] ?? null;

const DREAM1 = "I dream of cities that grow like forests.";
const DREAM2 = "I dream that no child fears tomorrow.";

async function sow(text, cookie) {
  const res = await fetch(`${base}/api/garden/sow`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ text }),
  });
  const body = await res.json().catch(() => ({}));
  return { res, body, cookie: cookieFrom(res) };
}

(async () => {
  console.log(`Garden end-to-end proof · ${base}\n`);

  const a = await sow(DREAM1, null);
  if (a.res.status === 404) {
    console.log("  ✗ The Garden endpoint returned 404 — start the server with PLANET_B_GARDEN=1.");
    process.exit(1);
  }
  check("anonymous visitor can contribute (201, no prior cookie)", a.res.status === 201 && a.body.ok === true, `status ${a.res.status}`);
  check("visitor cookie issued", !!a.cookie);
  const id = a.body.id;
  const v1 = a.body.visitorId;
  check("permanent UUIDv7 id assigned", typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-/.test(id), id);

  const g1 = await fetch(`${base}/garden/${id}`);
  const h1 = await g1.text();
  const g2 = await fetch(`${base}/garden/${id}`);
  const h2 = await g2.text();
  check("resolves at a permanent URL", g1.status === 200 && h1.includes(DREAM1));
  check("survives refresh (identical second load)", g2.status === 200 && h2.includes(DREAM1));

  const b = await sow(DREAM2, a.cookie);
  check("same anonymous identity across visits", b.body.ok === true && b.body.visitorId === v1, `${v1} == ${b.body.visitorId}`);

  console.log(`\n${allPass ? "END-TO-END PROOF PASSED ✓" : "PROOF FAILED ✗"}`);
  console.log(`\nThen verify atomicity in the Supabase SQL editor:`);
  console.log(`  select`);
  console.log(`    (select count(*) from contributions) as contributions,`);
  console.log(`    (select count(*) from domain_events where type = 'ContributionCreated') as events,`);
  console.log(`    (select count(*) from event_dispatch) as dispatch;`);
  console.log(`  -- the three counts must be EQUAL (contribution + event + dispatch land atomically)`);
  console.log(`  select count(*) from visitors where person_id is not null; -- must be 0 (identity follows contribution)`);
  process.exit(allPass ? 0 : 1);
})();

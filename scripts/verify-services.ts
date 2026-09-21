/**
 * Prove home-services search (H1–H4, H6) against seeded DB.
 * Run after: npm run demo:seed
 * Does not modify car-parts verify.
 */
import { initSchema, getDb } from "../lib/db";
import { searchPros } from "../lib/services/search";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

async function main() {
  await initSchema();
  const db = getDb();

  // --- H1: Atlanta Plumbing Co seeded unverified ---
  const h1 = await db.execute({
    sql: `SELECT * FROM service_pros WHERE business_name = ?`,
    args: ["Atlanta Plumbing Co"],
  });
  assert(h1.rows.length === 1, "H1: Atlanta Plumbing Co profile persists");
  const atlanta = h1.rows[0];
  assert(
    String(atlanta.trades).toLowerCase().includes("plumbing"),
    "H1: trade is plumbing"
  );
  assert(
    String(atlanta.service_area).toLowerCase().includes("atlanta"),
    "H1: service area includes Atlanta"
  );
  assert(
    String(atlanta.license_status) === "unverified",
    "H1: license_status is unverified"
  );
  assert(Number(atlanta.active) === 1, "H1: Atlanta Plumbing Co is active");

  // --- H2: search plumbing + Atlanta ---
  const h2 = await searchPros({ trade: "plumbing", location: "Atlanta" });
  assert(h2.length > 0, `H2: plumbing + Atlanta returns results (got ${h2.length})`);
  const atlantaHit = h2.find((p) => p.business_name === "Atlanta Plumbing Co");
  assert(!!atlantaHit, "H2: Atlanta Plumbing Co appears in search");
  assert(
    atlantaHit!.license_status === "unverified",
    "H2: Atlanta Plumbing Co labeled unverified"
  );
  assert(
    !h2.some((p) => p.business_name === "Inactive Pipe Co"),
    "H2: inactive pro excluded from search"
  );

  // --- H3: licensed only excludes unverified ---
  const h3 = await searchPros({
    trade: "plumbing",
    location: "Atlanta",
    licensedOnly: true,
  });
  assert(
    !h3.some((p) => p.business_name === "Atlanta Plumbing Co"),
    "H3: unverified Atlanta Plumbing Co excluded by licensed-only"
  );
  assert(
    h3.every((p) => p.license_status === "verified"),
    "H3: licensed-only returns only verified pros"
  );
  assert(
    h3.some((p) => p.business_name === "Peach State Pipe Pros"),
    "H3: verified Peach State Pipe Pros appears under licensed-only"
  );

  // --- H4: verified pro has source name + URL ---
  const verified = h3.find((p) => p.business_name === "Peach State Pipe Pros");
  assert(!!verified, "H4: verified pro present");
  assert(
    Boolean(verified!.license_source_name && verified!.license_source_url),
    "H4: verified pro has license_source_name and license_source_url"
  );
  assert(
    verified!.license_source_name!.toLowerCase().includes("georgia"),
    "H4: source name is a named board (Georgia demo source)"
  );
  assert(
    Boolean(verified!.license_number),
    "H4: verified pro has license_number"
  );

  // Experienced filter sanity
  const experienced = await searchPros({
    trade: "plumbing",
    location: "Atlanta",
    experiencedOnly: true,
  });
  assert(
    experienced.every((p) => p.years_experience >= 5),
    "experienced-only: all results have years ≥ 5"
  );
  assert(
    experienced.some((p) => p.business_name === "Atlanta Plumbing Co"),
    "experienced-only: Atlanta Plumbing Co (12 yrs) included"
  );

  // --- H6: nonsense trade+location ---
  const empty = await searchPros({
    trade: "zzzz-no-such-trade-xyzzy",
    location: "Nowhereville",
  });
  assert(empty.length === 0, "H6: nonsense trade+location returns empty");

  // Count active pros
  const count = await db.execute(
    `SELECT COUNT(*) AS n FROM service_pros WHERE active = 1`
  );
  const n = Number(count.rows[0].n);
  assert(n >= 8 && n <= 12, `seed active pros in 8–12 range (got ${n})`);

  console.log("\nAll demo:verify-services checks passed (H1 H2 H3 H4 H6).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Prove home-services H1–H7 against seeded DB.
 * Run after: npm run demo:seed
 * Does not modify car-parts verify.
 */
import { initSchema, getDb } from "../lib/db";
import { searchPros, getPro } from "../lib/services/search";
import { setProActive } from "../lib/services/pros";
import { createLead, getServiceThread } from "../lib/services/leads";
import { authenticateUser } from "../lib/users";

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
  assert(
    atlanta.owner_user_id != null,
    "H1: Atlanta Plumbing Co attached to demo pro owner"
  );

  const demoPro = await authenticateUser(
    "pro@atlanta-plumbing.example",
    "demo1234"
  );
  assert(!!demoPro, "demo pro login pro@atlanta-plumbing.example / demo1234");
  assert(
    Number(atlanta.owner_user_id) === demoPro!.id,
    "H1: owner matches demo pro user"
  );

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

  // --- H5: homeowner lead / thread ---
  const buyer = await authenticateUser("buyer@example.com", "demo1234");
  assert(!!buyer, "demo buyer login for H5");
  const proId = Number(atlanta.id);
  const { leadId, threadId } = await createLead({
    proId,
    homeownerId: buyer!.id,
    jobDescription: "Kitchen faucet leak — need repair this week.",
    preferredTiming: "Weekday mornings",
    openThread: true,
  });
  assert(leadId > 0, `H5: lead saved (id=${leadId})`);
  assert(threadId != null && threadId > 0, `H5: thread opened (id=${threadId})`);
  const leadRow = await db.execute({
    sql: `SELECT * FROM service_leads WHERE id = ?`,
    args: [leadId],
  });
  assert(leadRow.rows.length === 1, "H5: lead row persists");
  assert(
    String(leadRow.rows[0].job_description).includes("faucet"),
    "H5: job description stored"
  );
  const thread = await getServiceThread(threadId!);
  assert(!!thread, "H5: service thread loadable");
  assert(
    thread!.messages.length >= 1,
    "H5: thread has opening lead message"
  );
  assert(
    thread!.messages[0].body.toLowerCase().includes("lead request"),
    "H5: opener is lead request body"
  );

  // --- H6: nonsense trade+location ---
  const empty = await searchPros({
    trade: "zzzz-no-such-trade-xyzzy",
    location: "Nowhereville",
  });
  assert(empty.length === 0, "H6: nonsense trade+location returns empty");

  // --- H7: deactivate → gone from search ---
  await setProActive(proId, false);
  const afterDeact = await searchPros({
    trade: "plumbing",
    location: "Atlanta",
  });
  assert(
    !afterDeact.some((p) => p.business_name === "Atlanta Plumbing Co"),
    "H7: deactivated Atlanta Plumbing Co gone from search"
  );
  const loaded = await getPro(proId);
  assert(loaded != null && loaded.active === false, "H7: pro marked inactive");
  // restore for other demos / smoke
  await setProActive(proId, true);
  const restored = await searchPros({
    trade: "plumbing",
    location: "Atlanta",
  });
  assert(
    restored.some((p) => p.business_name === "Atlanta Plumbing Co"),
    "H7 cleanup: reactivated Atlanta Plumbing Co back in search"
  );

  // Count active pros
  const count = await db.execute(
    `SELECT COUNT(*) AS n FROM service_pros WHERE active = 1`
  );
  const n = Number(count.rows[0].n);
  assert(n >= 8 && n <= 12, `seed active pros in 8–12 range (got ${n})`);

  console.log("\nAll demo:verify-services checks passed (H1–H7).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

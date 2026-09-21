/**
 * Prove search + CRUD + handoff against seeded DB.
 * Run after: npm run demo:seed
 */
import { initSchema } from "../lib/db";
import { searchListings } from "../lib/search";
import {
  createListing,
  updateListing,
  setListingActive,
  getListing,
} from "../lib/listings";
import { listSellers, getDemoBuyer } from "../lib/users";
import { getOrCreateThread, addMessage, getThread } from "../lib/threads";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

async function main() {
  await initSchema();

  // --- A2 / A3 / A6 (search) ---
  const byName = await searchListings({ partName: "alternator" });
  assert(byName.length > 0, `search "alternator" returns results (got ${byName.length})`);
  const civicAlt = byName.find(
    (r) =>
      r.location === "Atlanta, GA" &&
      r.condition === "used" &&
      r.seller_name === "Peachtree Auto Salvage" &&
      r.fitments.some(
        (f) => f.year === 2015 && f.make === "Honda" && f.model === "Civic"
      )
  );
  assert(!!civicAlt, "Civic Atlanta used alternator appears in part-name search");
  assert(
    !byName.some((r) => r.part_number === "SOLD-OUT-001"),
    "inactive listing excluded from search"
  );

  const byYmm = await searchListings({
    year: 2015,
    make: "Honda",
    model: "Civic",
  });
  assert(byYmm.length > 0, `YMM 2015/Honda/Civic returns results (got ${byYmm.length})`);
  assert(
    byYmm.some((r) => r.id === civicAlt!.id),
    "same Civic alternator appears in YMM search"
  );

  const combined = await searchListings({
    partName: "alternator",
    year: 2015,
    make: "Honda",
    model: "Civic",
  });
  assert(
    combined.some((r) => r.id === civicAlt!.id),
    "combined alternator + YMM finds Civic listing"
  );

  const byPn = await searchListings({ partNumber: "31100-R1A-A01" });
  assert(byPn.length === 1, `unique part number returns exactly 1 (got ${byPn.length})`);
  assert(byPn[0].id === civicAlt!.id, "part-number hit is the Civic alternator");

  const empty = await searchListings({ partName: "zzzz-no-such-part-xyzzy" });
  assert(empty.length === 0, "nonsense query returns empty (honest empty state)");

  // --- A1: create + edit via lib (same path as seller UI) ---
  const sellers = await listSellers();
  assert(sellers.length >= 1, "at least one seller seeded");
  const seller = sellers[0];

  const createdId = await createListing({
    seller_id: seller.id,
    part_name: "verify-test rotor",
    part_number: "VERIFY-ROTOR-001",
    condition: "used",
    location: "Atlanta, GA",
    notes: "created by demo:verify",
    price_text: "$12",
    fitments: [{ year: 2019, make: "Honda", model: "Civic" }],
  });
  const created = await getListing(createdId);
  assert(!!created && created.part_name === "verify-test rotor", "A1 create listing persists");
  assert(
    created!.fitments.some((f) => f.year === 2019 && f.make === "Honda"),
    "A1 create stores fitment"
  );

  await updateListing(createdId, {
    part_name: "verify-test rotor edited",
    part_number: "VERIFY-ROTOR-001",
    condition: "refurbished",
    location: "Atlanta, GA",
    notes: "edited by demo:verify",
    price_text: "$15",
    active: true,
    fitments: [{ year: 2019, make: "Honda", model: "Civic" }],
  });
  const edited = await getListing(createdId);
  assert(
    edited?.part_name === "verify-test rotor edited" &&
      edited.condition === "refurbished",
    "A1 edit listing persists"
  );

  const foundCreated = await searchListings({ partNumber: "VERIFY-ROTOR-001" });
  assert(foundCreated.length === 1, "A1 created listing appears in search");

  // --- A7: deactivate → gone from search ---
  await setListingActive(createdId, false);
  const afterDeact = await searchListings({ partNumber: "VERIFY-ROTOR-001" });
  assert(afterDeact.length === 0, "A7 deactivated listing gone from search");
  const stillThere = await getListing(createdId);
  assert(stillThere?.active === false, "A7 listing remains in DB as inactive");

  // cleanup test listing reactivation not required; leave inactive

  // --- A5: thread + contact handoff ---
  const buyer = await getDemoBuyer();
  assert(!!buyer, "demo buyer exists");

  const listing = await getListing(civicAlt!.id);
  assert(!!listing, "Civic listing loadable for handoff");
  assert(
    Boolean(listing!.contact_email || listing!.contact_phone),
    "A5 Peachtree seller has contact for handoff"
  );

  const threadId = await getOrCreateThread({
    listingId: listing!.id,
    buyerId: buyer!.id,
    sellerId: listing!.seller_id,
  });
  await addMessage({
    threadId,
    senderId: buyer!.id,
    body: "Verify: is the alternator still available?",
  });
  const thread = await getThread(threadId);
  assert(!!thread, "A5 thread opens");
  assert(thread!.seller_id === listing!.seller_id, "A5 thread tied to listing seller");
  assert(thread!.messages.length >= 1, "A5 message stored on thread");
  assert(
    Boolean(thread!.contact_email || thread!.contact_phone),
    "A5 contact available on thread handoff"
  );

  // Seller with no email+phone? Southern has phone only — fine.
  // Metro has email only — fine.

  console.log("\nAll demo:verify checks passed (search + A1 + A7 + A5).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

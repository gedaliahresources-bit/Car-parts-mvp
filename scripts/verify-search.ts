/**
 * Prove search + CRUD + handoff + auth against seeded DB.
 * Run after: npm run demo:seed
 */
import { initSchema, getDb } from "../lib/db";
import { searchListings } from "../lib/search";
import {
  createListing,
  updateListing,
  setListingActive,
  getListing,
} from "../lib/listings";
import {
  listSellers,
  getDemoBuyer,
  authenticateUser,
  createUser,
  getUserByEmail,
} from "../lib/users";
import { getOrCreateThread, addMessage, getThread } from "../lib/threads";
import { verifyPassword } from "../lib/password";

const DEMO_PASSWORD = "demo1234";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

async function main() {
  await initSchema();

  // --- Auth ---
  const peach = await authenticateUser(
    "yard@peachtree-salvage.example",
    DEMO_PASSWORD
  );
  assert(!!peach, "seeded Peachtree authenticates with demo1234");
  assert(peach!.role === "seller", "Peachtree is a seller");
  assert(
    peach!.display_name === "Peachtree Auto Salvage",
    "Peachtree display name matches"
  );

  const badPw = await authenticateUser(
    "yard@peachtree-salvage.example",
    "wrong-password"
  );
  assert(!badPw, "wrong password rejected");

  const buyerAuth = await authenticateUser("buyer@example.com", DEMO_PASSWORD);
  assert(
    !!buyerAuth && buyerAuth.role === "buyer",
    "seeded demo buyer authenticates"
  );

  const db = getDb();
  const hashRow = await db.execute({
    sql: `SELECT password_hash FROM users WHERE email = ?`,
    args: ["yard@peachtree-salvage.example"],
  });
  const storedHash = String(hashRow.rows[0].password_hash);
  assert(!storedHash.includes(DEMO_PASSWORD), "password not stored as plaintext");
  assert(verifyPassword(DEMO_PASSWORD, storedHash), "scrypt hash verifies");

  // --- Search A2/A3/A6 ---
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

  // --- A1 create + edit ---
  const sellers = await listSellers();
  assert(sellers.length >= 2, "at least two sellers seeded");
  const seller = sellers[0];
  const otherSeller = sellers[1];

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
  assert(created!.seller_id === seller.id, "A1 listing owned by creating seller");
  assert(
    created!.seller_id !== otherSeller.id,
    "auth: other seller is not owner of Peachtree listing"
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

  // --- Signup seller ---
  const unique = `verify-seller-${Date.now()}@example.com`;
  const newSeller = await createUser({
    role: "seller",
    display_name: "Verify New Yard",
    email: unique,
    password: "demo1234",
    contact_email: unique,
  });
  const newListingId = await createListing({
    seller_id: newSeller.id,
    part_name: "verify-auth bumper",
    part_number: "VERIFY-AUTH-BUMPER",
    condition: "used",
    location: "Decatur, GA",
    fitments: [{ year: 2018, make: "Honda", model: "Civic" }],
  });
  const inSearch = await searchListings({ partNumber: "VERIFY-AUTH-BUMPER" });
  assert(
    inSearch.length === 1 && inSearch[0].seller_name === "Verify New Yard",
    "auth: signup seller listing appears in search"
  );
  const newListing = await getListing(newListingId);
  assert(
    newListing!.seller_id === newSeller.id &&
      newListing!.seller_id !== otherSeller.id,
    "auth: other seller cannot claim new signup listing"
  );
  await setListingActive(newListingId, false);

  // --- A7 deactivate ---
  await setListingActive(createdId, false);
  const afterDeact = await searchListings({ partNumber: "VERIFY-ROTOR-001" });
  assert(afterDeact.length === 0, "A7 deactivated listing gone from search");
  const stillThere = await getListing(createdId);
  assert(stillThere?.active === false, "A7 listing remains in DB as inactive");

  // --- A5 thread + handoff ---
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
  assert(thread!.buyer_id === buyer!.id, "A5 thread buyer is demo buyer");
  assert(thread!.messages.length >= 1, "A5 message stored on thread");
  assert(
    thread!.messages.some((m) => m.sender_id === buyer!.id),
    "A5 message attributed to buyer"
  );
  assert(
    Boolean(thread!.contact_email || thread!.contact_phone),
    "A5 contact available on thread handoff"
  );

  const byEmail = await getUserByEmail("yard@peachtree-salvage.example");
  assert(!!byEmail && byEmail.id === peach!.id, "getUserByEmail finds Peachtree");

  console.log("\nAll demo:verify checks passed (search + A1 + A7 + A5 + auth).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

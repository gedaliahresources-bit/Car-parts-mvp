/**
 * Reset DB and load demo sellers + listings.
 * Run: npm run demo:seed
 */
import fs from "fs";
import { getDb, getDbPath, initSchema, resetDbClient } from "../lib/db";

type Condition = "new" | "used" | "refurbished" | "core";

type SeedListing = {
  seller: number; // 0-based index into sellers array
  part_name: string;
  part_number?: string;
  condition: Condition;
  location: string;
  notes?: string;
  price_text?: string;
  fitments: { year: number; make: string; model: string }[];
  active?: boolean;
};

const sellers = [
  {
    role: "seller" as const,
    display_name: "Peachtree Auto Salvage",
    contact_email: "yard@peachtree-salvage.example",
    contact_phone: "404-555-0101",
  },
  {
    role: "seller" as const,
    display_name: "Metro Used Parts Co",
    contact_email: "sales@metrousedparts.example",
    contact_phone: null,
  },
  {
    role: "seller" as const,
    display_name: "Southern Yard Supply",
    contact_email: null,
    contact_phone: "678-555-0199",
  },
];

const listings: SeedListing[] = [
  // REQUIRED demo listing
  {
    seller: 0,
    part_name: "alternator",
    part_number: "31100-R1A-A01",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Pulled from running Civic. ~85k miles. Tested OK.",
    price_text: "$75",
    fitments: [
      { year: 2015, make: "Honda", model: "Civic" },
      { year: 2014, make: "Honda", model: "Civic" },
      { year: 2016, make: "Honda", model: "Civic" },
    ],
  },
  {
    seller: 0,
    part_name: "starter motor",
    part_number: "31200-R1A-A01",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$60",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "radiator",
    part_number: "19010-R1A-A51",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$90",
    fitments: [
      { year: 2013, make: "Honda", model: "Civic" },
      { year: 2014, make: "Honda", model: "Civic" },
    ],
  },
  {
    seller: 0,
    part_name: "headlight assembly",
    part_number: "33100-TR0-A01",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Driver side, clear lens",
    price_text: "$45",
    fitments: [{ year: 2012, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "front bumper cover",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$120",
    fitments: [{ year: 2015, make: "Honda", model: "Accord" }],
  },
  {
    seller: 0,
    part_name: "AC compressor",
    part_number: "38810-R1A-A01",
    condition: "refurbished",
    location: "Atlanta, GA",
    price_text: "$150",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "catalytic converter",
    condition: "used",
    location: "Atlanta, GA",
    notes: "OEM only — no aftermarket",
    price_text: "$200",
    fitments: [{ year: 2010, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "door mirror",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$35",
    fitments: [{ year: 2016, make: "Toyota", model: "Corolla" }],
  },
  {
    seller: 0,
    part_name: "wheel hub assembly",
    part_number: "44600-SDA-A00",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$55",
    fitments: [{ year: 2008, make: "Honda", model: "Accord" }],
  },

  // Metro Used Parts
  {
    seller: 1,
    part_name: "alternator",
    part_number: "27060-0C050",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$80",
    fitments: [
      { year: 2012, make: "Toyota", model: "Camry" },
      { year: 2013, make: "Toyota", model: "Camry" },
    ],
  },
  {
    seller: 1,
    part_name: "brake caliper",
    condition: "refurbished",
    location: "Marietta, GA",
    price_text: "$40",
    fitments: [{ year: 2015, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "transmission",
    part_number: "31000-R9A-A00",
    condition: "used",
    location: "Marietta, GA",
    notes: "CVT — verify fluid condition before install",
    price_text: "$850",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 1,
    part_name: "power steering pump",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$65",
    fitments: [{ year: 2007, make: "Honda", model: "CR-V" }],
  },
  {
    seller: 1,
    part_name: "fuel pump",
    part_number: "17045-R1A-A00",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$110",
    fitments: [{ year: 2014, make: "Honda", model: "Civic" }],
  },
  {
    seller: 1,
    part_name: "tail light",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$30",
    fitments: [{ year: 2018, make: "Honda", model: "Accord" }],
  },
  {
    seller: 1,
    part_name: "engine mount",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$45",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 1,
    part_name: "water pump",
    part_number: "19200-R40-A01",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$50",
    fitments: [{ year: 2011, make: "Honda", model: "Odyssey" }],
  },
  {
    seller: 1,
    part_name: "ABS module",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$175",
    fitments: [{ year: 2014, make: "Ford", model: "Focus" }],
  },

  // Southern Yard Supply
  {
    seller: 2,
    part_name: "alternator",
    part_number: "F1TZ-10346-A",
    condition: "core",
    location: "Decatur, GA",
    notes: "Core return required",
    price_text: "$40 core",
    fitments: [{ year: 1998, make: "Ford", model: "F-150" }],
  },
  {
    seller: 2,
    part_name: "hood",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$100",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "fender",
    condition: "used",
    location: "Decatur, GA",
    notes: "Passenger side, minor dents",
    price_text: "$80",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "radiator fan assembly",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$55",
    fitments: [{ year: 2013, make: "Nissan", model: "Altima" }],
  },
  {
    seller: 2,
    part_name: "throttle body",
    part_number: "16400-R1A-A01",
    condition: "refurbished",
    location: "Decatur, GA",
    price_text: "$95",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "rear axle",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$220",
    fitments: [{ year: 2010, make: "Ford", model: "Mustang" }],
  },
  {
    seller: 2,
    part_name: "intake manifold",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$70",
    fitments: [{ year: 2005, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 2,
    part_name: "serpentine belt tensioner",
    condition: "new",
    location: "Decatur, GA",
    price_text: "$25",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "cabin air filter housing",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$15",
    fitments: [{ year: 2017, make: "Toyota", model: "Rav4" }],
  },
  {
    seller: 2,
    part_name: "control arm",
    part_number: "51350-TR0-A01",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$48",
    fitments: [
      { year: 2012, make: "Honda", model: "Civic" },
      { year: 2013, make: "Honda", model: "Civic" },
    ],
  },
  // One inactive listing — should never appear in search
  {
    seller: 0,
    part_name: "alternator",
    part_number: "SOLD-OUT-001",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Deactivated — sold",
    price_text: "$70",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
    active: false,
  },
];

async function main() {
  const dbPath = getDbPath();
  resetDbClient();
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`Deleted existing DB: ${dbPath}`);
  }

  const db = getDb();
  await initSchema(db);

  const sellerIds: number[] = [];
  for (const s of sellers) {
    const r = await db.execute({
      sql: `INSERT INTO users (role, display_name, contact_email, contact_phone)
            VALUES (?, ?, ?, ?) RETURNING id`,
      args: [s.role, s.display_name, s.contact_email, s.contact_phone],
    });
    sellerIds.push(Number(r.rows[0].id));
  }

  // One buyer for future slices
  await db.execute({
    sql: `INSERT INTO users (role, display_name, contact_email, contact_phone)
          VALUES ('buyer', 'Demo Buyer', 'buyer@example.com', NULL)`,
  });

  let listingCount = 0;
  let fitmentCount = 0;

  for (const L of listings) {
    const sellerId = sellerIds[L.seller];
    const active = L.active === false ? 0 : 1;
    const r = await db.execute({
      sql: `INSERT INTO listings
            (seller_id, part_name, part_number, condition, location, notes, price_text, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        sellerId,
        L.part_name,
        L.part_number ?? null,
        L.condition,
        L.location,
        L.notes ?? null,
        L.price_text ?? null,
        active,
      ],
    });
    const listingId = Number(r.rows[0].id);
    listingCount++;

    for (const f of L.fitments) {
      await db.execute({
        sql: `INSERT INTO listing_fitments (listing_id, year, make, model) VALUES (?, ?, ?, ?)`,
        args: [listingId, f.year, f.make, f.model],
      });
      fitmentCount++;
    }
  }

  console.log(`Seeded ${sellerIds.length} sellers, ${listingCount} listings (${fitmentCount} fitments).`);
  console.log(`DB: ${dbPath}`);
  console.log(
    "Required demo row: alternator / 2015 Honda Civic / used / Atlanta, GA → Peachtree Auto Salvage"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

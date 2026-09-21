/**
 * Reset DB and load demo sellers + listings.
 * All seeded accounts use password: demo1234
 * Run: npm run demo:seed
 */
import fs from "fs";
import { getDb, getDbPath, initSchema, resetDbClient } from "../lib/db";
import { hashPassword } from "../lib/password";

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

const DEMO_PASSWORD = "demo1234";

const sellers = [
  {
    role: "seller" as const,
    display_name: "Peachtree Auto Salvage",
    email: "yard@peachtree-salvage.example",
    contact_email: "yard@peachtree-salvage.example",
    contact_phone: "404-555-0101",
  },
  {
    role: "seller" as const,
    display_name: "Metro Used Parts Co",
    email: "sales@metrousedparts.example",
    contact_email: "sales@metrousedparts.example",
    contact_phone: null,
  },
  {
    role: "seller" as const,
    display_name: "Southern Yard Supply",
    email: "parts@southern-yard.example",
    contact_email: null,
    contact_phone: "678-555-0199",
  },
];

const listings: SeedListing[] = [
  // REQUIRED demo listing — Civic alternator
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
  // REQUIRED: steering wheel + 2008 Toyota Camry
  {
    seller: 0,
    part_name: "steering wheel",
    part_number: "45100-06240",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Black leather, airbag clockspring included. From clean title Camry.",
    price_text: "$95",
    fitments: [
      { year: 2008, make: "Toyota", model: "Camry" },
      { year: 2007, make: "Toyota", model: "Camry" },
      { year: 2009, make: "Toyota", model: "Camry" },
    ],
  },

  // REQUIRED: trunk + 2016 Chevrolet Impala (Chevy alias)
  {
    seller: 1,
    part_name: "trunk lid",
    part_number: "22954758",
    condition: "used",
    location: "Marietta, GA",
    notes: "Decklid, black, hinges included. Minor parking-lot scrapes.",
    price_text: "$175",
    fitments: [
      { year: 2016, make: "Chevrolet", model: "Impala" },
      { year: 2015, make: "Chevrolet", model: "Impala" },
      { year: 2017, make: "Chevrolet", model: "Impala" },
    ],
  },

  // --- Peachtree Auto Salvage (seller 0) ---
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
    part_name: "water pump",
    part_number: "19200-R40-A01",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$55",
    fitments: [{ year: 2012, make: "Honda", model: "Accord" }],
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
    part_name: "taillight assembly",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$40",
    fitments: [{ year: 2014, make: "Toyota", model: "Camry" }],
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
    part_name: "rear bumper cover",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$110",
    fitments: [{ year: 2011, make: "Toyota", model: "Corolla" }],
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
  {
    seller: 0,
    part_name: "brake pads",
    condition: "new",
    location: "Atlanta, GA",
    notes: "Front ceramic set",
    price_text: "$38",
    fitments: [
      { year: 2016, make: "Honda", model: "Civic" },
      { year: 2017, make: "Honda", model: "Civic" },
    ],
  },
  {
    seller: 0,
    part_name: "brake rotors",
    condition: "new",
    location: "Atlanta, GA",
    price_text: "$65",
    fitments: [{ year: 2015, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "brake caliper",
    condition: "refurbished",
    location: "Atlanta, GA",
    price_text: "$55",
    fitments: [{ year: 2013, make: "Honda", model: "Accord" }],
  },
  {
    seller: 0,
    part_name: "control arm",
    part_number: "51350-TR0-A01",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$48",
    fitments: [
      { year: 2012, make: "Honda", model: "Civic" },
      { year: 2013, make: "Honda", model: "Civic" },
    ],
  },
  {
    seller: 0,
    part_name: "tie rod end",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$28",
    fitments: [{ year: 2008, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "CV axle",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Driver side, boot intact",
    price_text: "$75",
    fitments: [{ year: 2014, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "strut assembly",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$85",
    fitments: [{ year: 2010, make: "Toyota", model: "Corolla" }],
  },
  {
    seller: 0,
    part_name: "O2 sensor",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$35",
    fitments: [{ year: 2012, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "fuel pump",
    part_number: "77020-06040",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$90",
    fitments: [{ year: 2008, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "ignition coil",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$25",
    fitments: [{ year: 2015, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "MAF sensor",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$55",
    fitments: [{ year: 2011, make: "BMW", model: "328i" }],
  },
  {
    seller: 0,
    part_name: "hood",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Minor stone chips, no rust",
    price_text: "$140",
    fitments: [{ year: 2008, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "fender",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Passenger side",
    price_text: "$90",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 0,
    part_name: "door",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Front driver, complete with glass",
    price_text: "$180",
    fitments: [{ year: 2014, make: "Ford", model: "F-150" }],
  },
  {
    seller: 0,
    part_name: "window regulator",
    condition: "used",
    location: "Atlanta, GA",
    price_text: "$45",
    fitments: [{ year: 2013, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 0,
    part_name: "battery",
    condition: "used",
    location: "Atlanta, GA",
    notes: "Tested 12.4V — ~1 year remaining",
    price_text: "$40",
    fitments: [{ year: 2017, make: "Honda", model: "Accord" }],
  },

  // --- Metro Used Parts Co (seller 1) ---
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
    part_name: "steering wheel",
    condition: "used",
    location: "Marietta, GA",
    notes: "Sport flat-bottom, no airbag",
    price_text: "$120",
    fitments: [{ year: 2015, make: "BMW", model: "320i" }],
  },
  {
    seller: 1,
    part_name: "starter",
    condition: "refurbished",
    location: "Marietta, GA",
    price_text: "$70",
    fitments: [{ year: 2014, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "battery",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$110",
    fitments: [{ year: 2018, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 1,
    part_name: "radiator",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$95",
    fitments: [{ year: 2016, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "water pump",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$60",
    fitments: [{ year: 2011, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 1,
    part_name: "AC compressor",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$140",
    fitments: [{ year: 2010, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "headlight",
    condition: "used",
    location: "Marietta, GA",
    notes: "Passenger side HID",
    price_text: "$85",
    fitments: [{ year: 2013, make: "BMW", model: "328i" }],
  },
  {
    seller: 1,
    part_name: "taillight",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$30",
    fitments: [{ year: 2018, make: "Honda", model: "Accord" }],
  },
  {
    seller: 1,
    part_name: "bumper",
    condition: "used",
    location: "Marietta, GA",
    notes: "Front chrome, F-150",
    price_text: "$160",
    fitments: [{ year: 2015, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "fender",
    condition: "used",
    location: "Marietta, GA",
    notes: "Driver side, primed",
    price_text: "$100",
    fitments: [{ year: 2017, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 1,
    part_name: "hood",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$130",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 1,
    part_name: "door",
    condition: "used",
    location: "Marietta, GA",
    notes: "Rear passenger",
    price_text: "$150",
    fitments: [{ year: 2012, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 1,
    part_name: "mirror",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$42",
    fitments: [{ year: 2014, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "window regulator",
    condition: "refurbished",
    location: "Marietta, GA",
    price_text: "$50",
    fitments: [{ year: 2009, make: "Honda", model: "Accord" }],
  },
  {
    seller: 1,
    part_name: "brake pads",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$42",
    fitments: [{ year: 2016, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "brake rotors",
    condition: "used",
    location: "Marietta, GA",
    notes: "Machined and balanced",
    price_text: "$70",
    fitments: [{ year: 2015, make: "Chevrolet", model: "Silverado" }],
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
    part_name: "hub assembly",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$65",
    fitments: [{ year: 2013, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 1,
    part_name: "control arm",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$55",
    fitments: [{ year: 2011, make: "BMW", model: "335i" }],
  },
  {
    seller: 1,
    part_name: "tie rod",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$32",
    fitments: [{ year: 2014, make: "Ford", model: "F-150" }],
  },
  {
    seller: 1,
    part_name: "CV axle",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$80",
    fitments: [{ year: 2016, make: "Honda", model: "Accord" }],
  },
  {
    seller: 1,
    part_name: "strut",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$70",
    fitments: [{ year: 2012, make: "BMW", model: "328i" }],
  },
  {
    seller: 1,
    part_name: "catalytic converter",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$250",
    fitments: [{ year: 2007, make: "Honda", model: "Accord" }],
  },
  {
    seller: 1,
    part_name: "O2 sensor",
    condition: "new",
    location: "Marietta, GA",
    price_text: "$48",
    fitments: [{ year: 2015, make: "Ford", model: "F-150" }],
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
    part_name: "ignition coil",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$30",
    fitments: [{ year: 2010, make: "BMW", model: "328i" }],
  },
  {
    seller: 1,
    part_name: "MAF sensor",
    condition: "used",
    location: "Marietta, GA",
    price_text: "$60",
    fitments: [{ year: 2016, make: "Chevrolet", model: "Silverado" }],
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
    part_name: "transfer case",
    condition: "used",
    location: "Marietta, GA",
    notes: "4WD, fluid drained",
    price_text: "$450",
    fitments: [{ year: 2014, make: "Ford", model: "F-150" }],
  },

  // --- Southern Yard Supply (seller 2) ---
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
    part_name: "steering wheel",
    condition: "used",
    location: "Decatur, GA",
    notes: "Cloth wrap, cruise buttons work",
    price_text: "$70",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "starter motor",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$55",
    fitments: [{ year: 2009, make: "Toyota", model: "Corolla" }],
  },
  {
    seller: 2,
    part_name: "radiator",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$85",
    fitments: [{ year: 2018, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "water pump",
    condition: "refurbished",
    location: "Decatur, GA",
    price_text: "$70",
    fitments: [{ year: 2013, make: "BMW", model: "328i" }],
  },
  {
    seller: 2,
    part_name: "AC compressor",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$130",
    fitments: [{ year: 2017, make: "Toyota", model: "Corolla" }],
  },
  {
    seller: 2,
    part_name: "headlight assembly",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$55",
    fitments: [{ year: 2008, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "taillight",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$35",
    fitments: [{ year: 2015, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 2,
    part_name: "front bumper",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$125",
    fitments: [{ year: 2019, make: "Honda", model: "Accord" }],
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
    part_name: "door",
    condition: "used",
    location: "Decatur, GA",
    notes: "Front passenger, silver",
    price_text: "$170",
    fitments: [{ year: 2011, make: "BMW", model: "328i" }],
  },
  {
    seller: 2,
    part_name: "side mirror",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$38",
    fitments: [{ year: 2018, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "window regulator",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$40",
    fitments: [{ year: 2010, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 2,
    part_name: "brake pads",
    condition: "used",
    location: "Decatur, GA",
    notes: "~60% remaining",
    price_text: "$25",
    fitments: [{ year: 2012, make: "BMW", model: "328i" }],
  },
  {
    seller: 2,
    part_name: "brake rotors",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$55",
    fitments: [{ year: 2008, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "brake caliper",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$45",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "hub",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$50",
    fitments: [{ year: 2015, make: "Toyota", model: "Corolla" }],
  },
  {
    seller: 2,
    part_name: "control arm",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$52",
    fitments: [{ year: 2014, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 2,
    part_name: "tie rod",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$28",
    fitments: [{ year: 2017, make: "Honda", model: "Accord" }],
  },
  {
    seller: 2,
    part_name: "CV axle",
    condition: "refurbished",
    location: "Decatur, GA",
    price_text: "$90",
    fitments: [{ year: 2013, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "strut",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$75",
    fitments: [{ year: 2008, make: "Honda", model: "Accord" }],
  },
  {
    seller: 2,
    part_name: "catalytic converter",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$180",
    fitments: [{ year: 2011, make: "Ford", model: "F-150" }],
  },
  {
    seller: 2,
    part_name: "O2 sensor",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$30",
    fitments: [{ year: 2016, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "fuel pump",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$85",
    fitments: [{ year: 2015, make: "Chevrolet", model: "Silverado" }],
  },
  {
    seller: 2,
    part_name: "ignition coil",
    condition: "new",
    location: "Decatur, GA",
    price_text: "$35",
    fitments: [{ year: 2018, make: "Toyota", model: "Camry" }],
  },
  {
    seller: 2,
    part_name: "MAF sensor",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$50",
    fitments: [{ year: 2009, make: "Honda", model: "Civic" }],
  },
  {
    seller: 2,
    part_name: "transmission",
    condition: "used",
    location: "Decatur, GA",
    notes: "6-speed auto, ~90k miles",
    price_text: "$950",
    fitments: [{ year: 2012, make: "Ford", model: "F-150" }],
  },
  {
    seller: 2,
    part_name: "transfer case",
    condition: "used",
    location: "Decatur, GA",
    price_text: "$400",
    fitments: [{ year: 2016, make: "Chevrolet", model: "Silverado" }],
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

  const password_hash = hashPassword(DEMO_PASSWORD);
  const sellerIds: number[] = [];
  for (const s of sellers) {
    const r = await db.execute({
      sql: `INSERT INTO users (role, display_name, email, password_hash, contact_email, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [s.role, s.display_name, s.email, password_hash, s.contact_email, s.contact_phone],
    });
    sellerIds.push(Number(r.rows[0].id));
  }

  // Demo buyer (can message sellers)
  await db.execute({
    sql: `INSERT INTO users (role, display_name, email, password_hash, contact_email, contact_phone)
          VALUES ('buyer', 'Demo Buyer', 'buyer@example.com', ?, 'buyer@example.com', NULL)`,
    args: [password_hash],
  });

  let listingCount = 0;
  let activeCount = 0;
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
    if (active) activeCount++;

    for (const f of L.fitments) {
      await db.execute({
        sql: `INSERT INTO listing_fitments (listing_id, year, make, model) VALUES (?, ?, ?, ?)`,
        args: [listingId, f.year, f.make, f.model],
      });
      fitmentCount++;
    }
  }

  console.log(
    `Seeded ${sellerIds.length} sellers, ${listingCount} listings (${activeCount} active, ${fitmentCount} fitments).`
  );
  console.log(`DB: ${dbPath}`);
  console.log(
    "Required demo row: alternator / 2015 Honda Civic / used / Atlanta, GA → Peachtree Auto Salvage"
  );
  console.log(
    "Required demo row: steering wheel / 2008 Toyota Camry / used / Atlanta, GA → Peachtree Auto Salvage"
  );
  console.log(
    "Required demo row: trunk lid / 2016 Chevrolet Impala / used / Marietta, GA → Metro Used Parts Co"
  );
  console.log(`Demo password for all seed users: ${DEMO_PASSWORD}`);
  console.log("  yard@peachtree-salvage.example (seller)");
  console.log("  sales@metrousedparts.example (seller)");
  console.log("  parts@southern-yard.example (seller)");
  console.log("  buyer@example.com (buyer)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

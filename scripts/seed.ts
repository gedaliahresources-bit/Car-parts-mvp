/**
 * Reset DB and load demo sellers + listings + home-service pros.
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


type LicenseStatus = "verified" | "unverified" | "not_applicable";

type SeedPro = {
  business_name: string;
  trades: string;
  service_area: string;
  years_experience: number;
  specialties?: string;
  notes?: string;
  contact_email?: string;
  contact_phone?: string;
  active?: boolean;
  /** If set, attach this pro to the demo pro user with that email */
  owner_email?: string;
  license_status: LicenseStatus;
  license_number?: string;
  license_source_name?: string;
  license_source_url?: string;
  license_checked_on?: string;
};

const servicePros: SeedPro[] = [
  // H1 required: Atlanta Plumbing Co — unverified
  {
    business_name: "Atlanta Plumbing Co",
    trades: "plumbing",
    service_area: "Atlanta, GA",
    years_experience: 12,
    specialties: "Residential repairs, water heaters",
    notes: "Family-owned; serves metro Atlanta.",
    contact_email: "jobs@atlanta-plumbing.example",
    contact_phone: "404-555-0201",
    owner_email: "pro@atlanta-plumbing.example",
    license_status: "unverified",
  },
  // Verified plumbing with named demo source
  {
    business_name: "Peach State Pipe Pros",
    trades: "plumbing",
    service_area: "Atlanta, GA 30308",
    years_experience: 18,
    specialties: "Drain cleaning, slab leaks",
    contact_email: "hello@peachstatepipe.example",
    license_status: "verified",
    license_number: "PL-GA-44821",
    license_source_name:
      "Georgia Secretary of State Professional Licensing — example demo source",
    license_source_url: "https://sos.ga.gov/example-demo-license-board",
    license_checked_on: "2026-03-15",
  },
  {
    business_name: "CoolAir Atlanta HVAC",
    trades: "HVAC",
    service_area: "Atlanta, GA",
    years_experience: 9,
    specialties: "AC install, heat pumps",
    contact_phone: "404-555-0210",
    license_status: "verified",
    license_number: "HVAC-GA-99102",
    license_source_name:
      "Georgia Secretary of State Professional Licensing — example demo source",
    license_source_url: "https://sos.ga.gov/example-demo-license-board",
    license_checked_on: "2026-01-20",
  },
  {
    business_name: "SparkRight Electric",
    trades: "electrical",
    service_area: "Decatur, GA",
    years_experience: 7,
    specialties: "Panel upgrades, EV chargers",
    contact_email: "dispatch@sparkright.example",
    license_status: "unverified",
  },
  {
    business_name: "Metro General Contractors",
    trades: "general contractor, remodeling",
    service_area: "Marietta, GA",
    years_experience: 22,
    specialties: "Kitchen/bath remodels, additions",
    contact_email: "bids@metro-gc.example",
    license_status: "verified",
    license_number: "GC-GA-21044",
    license_source_name:
      "Georgia Secretary of State Professional Licensing — example demo source",
    license_source_url: "https://sos.ga.gov/example-demo-license-board",
    license_checked_on: "2025-11-02",
  },
  {
    business_name: "GreenEdge Lawn & Garden",
    trades: "lawn & garden",
    service_area: "Alpharetta, GA",
    years_experience: 4,
    specialties: "Mowing, landscaping, seasonal cleanup",
    contact_phone: "678-555-0222",
    license_status: "not_applicable",
    notes: "Lawn care — no state contractor license claimed for this trade.",
  },
  {
    business_name: "Buckhead Remodel Studio",
    trades: "remodeling",
    service_area: "Atlanta, GA 30305",
    years_experience: 11,
    specialties: "Interior finish, tile, cabinets",
    contact_email: "studio@buckhead-remodel.example",
    license_status: "unverified",
  },
  {
    business_name: "Northside Heat & Air",
    trades: "HVAC",
    service_area: "Roswell, GA",
    years_experience: 3,
    specialties: "Maintenance plans",
    license_status: "unverified",
  },
  {
    business_name: "WireWise Electrical LLC",
    trades: "electrical",
    service_area: "Atlanta, GA",
    years_experience: 15,
    specialties: "Commercial & residential wiring",
    contact_email: "office@wirewise.example",
    license_status: "verified",
    license_number: "EL-GA-77201",
    license_source_name:
      "Georgia Secretary of State Professional Licensing — example demo source",
    license_source_url: "https://sos.ga.gov/example-demo-license-board",
    license_checked_on: "2026-02-01",
  },
  {
    business_name: "YardCraft Outdoor",
    trades: "lawn & garden",
    service_area: "Sandy Springs, GA",
    years_experience: 8,
    specialties: "Hardscape, sod, irrigation",
    license_status: "not_applicable",
  },
  {
    business_name: "Summit Build GC",
    trades: "general contractor",
    service_area: "Atlanta, GA",
    years_experience: 6,
    specialties: "Whole-home renovations",
    contact_phone: "404-555-0233",
    license_status: "unverified",
  },
  // Inactive — should not appear in search
  {
    business_name: "Inactive Pipe Co",
    trades: "plumbing",
    service_area: "Atlanta, GA",
    years_experience: 10,
    active: false,
    license_status: "unverified",
    notes: "Deactivated seed row — must not appear in search",
  },
];

/** Populate an empty DB with demo sellers, listings, and service pros. */
export async function seedDemoData(): Promise<void> {
  const dbPath = getDbPath();
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

  // Demo buyer (can message sellers / send service leads)
  await db.execute({
    sql: `INSERT INTO users (role, display_name, email, password_hash, contact_email, contact_phone)
          VALUES ('buyer', 'Demo Buyer', 'buyer@example.com', ?, 'buyer@example.com', NULL)`,
    args: [password_hash],
  });

  // Demo home-services pro (owns Atlanta Plumbing Co)
  const demoProInsert = await db.execute({
    sql: `INSERT INTO users (role, display_name, email, password_hash, contact_email, contact_phone)
          VALUES ('seller', 'Atlanta Plumbing Co', 'pro@atlanta-plumbing.example', ?, 'jobs@atlanta-plumbing.example', '404-555-0201')
          RETURNING id`,
    args: [password_hash],
  });
  const demoProUserId = Number(demoProInsert.rows[0].id);
  const ownerByEmail: Record<string, number> = {
    "pro@atlanta-plumbing.example": demoProUserId,
  };

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

  let proCount = 0;
  let proActive = 0;
  for (const P of servicePros) {
    const active = P.active === false ? 0 : 1;
    if (P.license_status === "verified") {
      if (!P.license_source_name || !P.license_source_url) {
        throw new Error(
          `Verified pro "${P.business_name}" must have license_source_name and license_source_url`
        );
      }
    }
    const ownerId =
      P.owner_email && ownerByEmail[P.owner_email]
        ? ownerByEmail[P.owner_email]
        : null;
    await db.execute({
      sql: `INSERT INTO service_pros (
              owner_user_id, business_name, trades, service_area, years_experience,
              specialties, notes, contact_email, contact_phone, active,
              license_status, license_number, license_source_name,
              license_source_url, license_checked_on
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ownerId,
        P.business_name,
        P.trades,
        P.service_area,
        P.years_experience,
        P.specialties ?? null,
        P.notes ?? null,
        P.contact_email ?? null,
        P.contact_phone ?? null,
        active,
        P.license_status,
        P.license_number ?? null,
        P.license_source_name ?? null,
        P.license_source_url ?? null,
        P.license_checked_on ?? null,
      ],
    });
    proCount++;
    if (active) proActive++;
  }

  console.log(
    `Seeded ${sellerIds.length} sellers, ${listingCount} listings (${activeCount} active, ${fitmentCount} fitments).`
  );
  console.log(
    `Seeded ${proCount} service pros (${proActive} active).`
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
  console.log(
    "Required services row: Atlanta Plumbing Co / plumbing / Atlanta, GA / unverified"
  );
  console.log(`Demo password for all seed users: ${DEMO_PASSWORD}`);
  console.log("  yard@peachtree-salvage.example (seller)");
  console.log("  sales@metrousedparts.example (seller)");
  console.log("  parts@southern-yard.example (seller)");
  console.log("  buyer@example.com (buyer / homeowner leads)");
  console.log(
    "  pro@atlanta-plumbing.example (pro — owns Atlanta Plumbing Co)"
  );
}

async function main() {
  const dbPath = getDbPath();
  resetDbClient();
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`Deleted existing DB: ${dbPath}`);
  }
  await seedDemoData();
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  /(^|[/\\])seed\.(ts|js)$/.test(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

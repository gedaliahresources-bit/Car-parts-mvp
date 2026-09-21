import { createClient, type Client } from "@libsql/client";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "car-parts.db");

let client: Client | null = null;

export function getDbPath(): string {
  return DB_PATH;
}

export function getDb(): Client {
  if (!client) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    client = createClient({ url: `file:${DB_PATH}` });
  }
  return client;
}

/** Reset the cached client (used by seed after deleting the DB file). */
export function resetDbClient(): void {
  if (client) {
    client.close();
    client = null;
  }
}

export async function initSchema(db: Client = getDb()): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      part_name TEXT NOT NULL,
      part_number TEXT,
      condition TEXT NOT NULL CHECK (condition IN ('new', 'used', 'refurbished', 'core')),
      location TEXT NOT NULL,
      notes TEXT,
      price_text TEXT,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS listing_fitments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (listing_id, buyer_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active);
    CREATE INDEX IF NOT EXISTS idx_listings_part_name ON listings(part_name);
    CREATE INDEX IF NOT EXISTS idx_listings_part_number ON listings(part_number);
    CREATE INDEX IF NOT EXISTS idx_fitments_ymm ON listing_fitments(year, make, model);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    /* Home services — separate from car-parts listings */
    CREATE TABLE IF NOT EXISTS service_pros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER REFERENCES users(id),
      business_name TEXT NOT NULL,
      trades TEXT NOT NULL,
      service_area TEXT NOT NULL,
      years_experience INTEGER NOT NULL DEFAULT 0,
      specialties TEXT,
      notes TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      license_status TEXT NOT NULL CHECK (license_status IN ('verified', 'unverified', 'not_applicable')),
      license_number TEXT,
      license_source_name TEXT,
      license_source_url TEXT,
      license_checked_on TEXT
    );

    CREATE TABLE IF NOT EXISTS service_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pro_id INTEGER NOT NULL REFERENCES service_pros(id),
      homeowner_id INTEGER NOT NULL REFERENCES users(id),
      job_description TEXT NOT NULL,
      preferred_timing TEXT,
      thread_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pro_id INTEGER NOT NULL REFERENCES service_pros(id),
      homeowner_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (pro_id, homeowner_id)
    );

    CREATE TABLE IF NOT EXISTS service_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES service_threads(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_service_pros_active ON service_pros(active);
    CREATE INDEX IF NOT EXISTS idx_service_pros_trades ON service_pros(trades);
    CREATE INDEX IF NOT EXISTS idx_service_pros_area ON service_pros(service_area);
    CREATE INDEX IF NOT EXISTS idx_service_pros_license ON service_pros(license_status);
    CREATE INDEX IF NOT EXISTS idx_service_pros_owner ON service_pros(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_service_leads_pro ON service_leads(pro_id);
    CREATE INDEX IF NOT EXISTS idx_service_leads_homeowner ON service_leads(homeowner_id);
    CREATE INDEX IF NOT EXISTS idx_service_messages_thread ON service_messages(thread_id);
  `);
}

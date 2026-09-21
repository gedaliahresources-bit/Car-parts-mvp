import { getDb } from "./db";
import type { Fitment } from "./search";

export type Condition = "new" | "used" | "refurbished" | "core";

export type ListingInput = {
  seller_id: number;
  part_name: string;
  part_number?: string | null;
  condition: Condition;
  location: string;
  notes?: string | null;
  price_text?: string | null;
  active?: boolean;
  fitments: Fitment[];
};

export type ListingDetail = {
  id: number;
  seller_id: number;
  part_name: string;
  part_number: string | null;
  condition: string;
  location: string;
  notes: string | null;
  price_text: string | null;
  active: boolean;
  seller_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  fitments: Fitment[];
  fitment_summary: string;
};

function formatFitments(fitments: Fitment[]): string {
  if (fitments.length === 0) return "—";
  return fitments.map((f) => `${f.year} ${f.make} ${f.model}`).join("; ");
}

async function loadFitments(listingId: number): Promise<Fitment[]> {
  const db = getDb();
  const fitRes = await db.execute({
    sql: `SELECT year, make, model FROM listing_fitments WHERE listing_id = ? ORDER BY year, make, model`,
    args: [listingId],
  });
  return fitRes.rows.map((f) => ({
    year: Number(f.year),
    make: String(f.make),
    model: String(f.model),
  }));
}

export async function getListing(id: number): Promise<ListingDetail | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT l.*, u.display_name AS seller_name, u.contact_email, u.contact_phone
          FROM listings l
          JOIN users u ON u.id = l.seller_id
          WHERE l.id = ?`,
    args: [id],
  });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  const fitments = await loadFitments(id);
  return {
    id: Number(row.id),
    seller_id: Number(row.seller_id),
    part_name: String(row.part_name),
    part_number: row.part_number != null ? String(row.part_number) : null,
    condition: String(row.condition),
    location: String(row.location),
    notes: row.notes != null ? String(row.notes) : null,
    price_text: row.price_text != null ? String(row.price_text) : null,
    active: Number(row.active) === 1,
    seller_name: String(row.seller_name),
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
    fitments,
    fitment_summary: formatFitments(fitments),
  };
}

export async function listSellerListings(
  sellerId: number
): Promise<ListingDetail[]> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT l.*, u.display_name AS seller_name, u.contact_email, u.contact_phone
          FROM listings l
          JOIN users u ON u.id = l.seller_id
          WHERE l.seller_id = ?
          ORDER BY l.active DESC, l.part_name ASC, l.id ASC`,
    args: [sellerId],
  });
  const out: ListingDetail[] = [];
  for (const row of r.rows) {
    const id = Number(row.id);
    const fitments = await loadFitments(id);
    out.push({
      id,
      seller_id: Number(row.seller_id),
      part_name: String(row.part_name),
      part_number: row.part_number != null ? String(row.part_number) : null,
      condition: String(row.condition),
      location: String(row.location),
      notes: row.notes != null ? String(row.notes) : null,
      price_text: row.price_text != null ? String(row.price_text) : null,
      active: Number(row.active) === 1,
      seller_name: String(row.seller_name),
      contact_email: row.contact_email != null ? String(row.contact_email) : null,
      contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
      fitments,
      fitment_summary: formatFitments(fitments),
    });
  }
  return out;
}

async function replaceFitments(
  listingId: number,
  fitments: Fitment[]
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM listing_fitments WHERE listing_id = ?`,
    args: [listingId],
  });
  for (const f of fitments) {
    await db.execute({
      sql: `INSERT INTO listing_fitments (listing_id, year, make, model) VALUES (?, ?, ?, ?)`,
      args: [listingId, f.year, f.make, f.model],
    });
  }
}

export async function createListing(input: ListingInput): Promise<number> {
  const db = getDb();
  const active = input.active === false ? 0 : 1;
  const r = await db.execute({
    sql: `INSERT INTO listings
          (seller_id, part_name, part_number, condition, location, notes, price_text, active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [
      input.seller_id,
      input.part_name.trim(),
      input.part_number?.trim() || null,
      input.condition,
      input.location.trim(),
      input.notes?.trim() || null,
      input.price_text?.trim() || null,
      active,
    ],
  });
  const id = Number(r.rows[0].id);
  await replaceFitments(id, input.fitments);
  return id;
}

export async function updateListing(
  id: number,
  input: Omit<ListingInput, "seller_id"> & { seller_id?: number }
): Promise<void> {
  const db = getDb();
  const active = input.active === false ? 0 : 1;
  await db.execute({
    sql: `UPDATE listings SET
            part_name = ?,
            part_number = ?,
            condition = ?,
            location = ?,
            notes = ?,
            price_text = ?,
            active = ?
          WHERE id = ?`,
    args: [
      input.part_name.trim(),
      input.part_number?.trim() || null,
      input.condition,
      input.location.trim(),
      input.notes?.trim() || null,
      input.price_text?.trim() || null,
      active,
      id,
    ],
  });
  await replaceFitments(id, input.fitments);
}

export async function setListingActive(
  id: number,
  active: boolean
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE listings SET active = ? WHERE id = ?`,
    args: [active ? 1 : 0, id],
  });
}

/** Parse fitment lines: "2015 Honda Civic" (year make model…). */
export function parseFitmentLines(text: string): Fitment[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: Fitment[] = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;
    const year = Number(parts[0]);
    if (Number.isNaN(year)) continue;
    const make = parts[1];
    const model = parts.slice(2).join(" ");
    if (!make || !model) continue;
    out.push({ year, make, model });
  }
  return out;
}

export function fitmentsToText(fitments: Fitment[]): string {
  return fitments.map((f) => `${f.year} ${f.make} ${f.model}`).join("\n");
}

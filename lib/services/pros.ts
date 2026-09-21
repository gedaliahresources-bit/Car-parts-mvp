import { getDb } from "../db";

export type LicenseStatus = "verified" | "unverified" | "not_applicable";

export type ServicePro = {
  id: number;
  owner_user_id: number | null;
  business_name: string;
  /** Comma-separated trade labels, e.g. "plumbing, remodeling" */
  trades: string;
  trade_list: string[];
  service_area: string;
  years_experience: number;
  specialties: string | null;
  notes: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  active: boolean;
  license_status: LicenseStatus;
  license_number: string | null;
  license_source_name: string | null;
  license_source_url: string | null;
  license_checked_on: string | null;
};

export type ProInput = {
  owner_user_id: number;
  business_name: string;
  trades: string;
  service_area: string;
  years_experience: number;
  specialties?: string | null;
  notes?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  active?: boolean;
  license_status: LicenseStatus;
  license_number?: string | null;
  license_source_name?: string | null;
  license_source_url?: string | null;
  license_checked_on?: string | null;
};

export function parseTrades(trades: string): string[] {
  return trades
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function rowToPro(row: Record<string, unknown>): ServicePro {
  const trades = String(row.trades ?? "");
  const status = String(row.license_status) as LicenseStatus;
  return {
    id: Number(row.id),
    owner_user_id:
      row.owner_user_id != null ? Number(row.owner_user_id) : null,
    business_name: String(row.business_name),
    trades,
    trade_list: parseTrades(trades),
    service_area: String(row.service_area),
    years_experience: Number(row.years_experience ?? 0),
    specialties: row.specialties != null ? String(row.specialties) : null,
    notes: row.notes != null ? String(row.notes) : null,
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
    active: Number(row.active) === 1,
    license_status: status,
    license_number: row.license_number != null ? String(row.license_number) : null,
    license_source_name:
      row.license_source_name != null ? String(row.license_source_name) : null,
    license_source_url:
      row.license_source_url != null ? String(row.license_source_url) : null,
    license_checked_on:
      row.license_checked_on != null ? String(row.license_checked_on) : null,
  };
}

/** Known trade labels for forms / filters (soft match still uses LIKE). */
export const TRADE_OPTIONS = [
  "plumbing",
  "HVAC",
  "electrical",
  "general contractor",
  "lawn & garden",
  "remodeling",
] as const;

const LICENSE_STATUSES = new Set<LicenseStatus>([
  "verified",
  "unverified",
  "not_applicable",
]);

export function assertValidLicenseFields(input: {
  license_status: string;
  license_number?: string | null;
  license_source_name?: string | null;
  license_source_url?: string | null;
}): LicenseStatus {
  if (!LICENSE_STATUSES.has(input.license_status as LicenseStatus)) {
    throw new Error("Invalid license_status");
  }
  const status = input.license_status as LicenseStatus;
  if (status === "verified") {
    if (
      !input.license_number?.trim() ||
      !input.license_source_name?.trim() ||
      !input.license_source_url?.trim()
    ) {
      throw new Error(
        "Verified status requires license_number, license_source_name, and license_source_url"
      );
    }
  }
  return status;
}

export async function listProsForOwner(ownerUserId: number): Promise<ServicePro[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM service_pros WHERE owner_user_id = ? ORDER BY id ASC`,
    args: [ownerUserId],
  });
  return result.rows.map((row) =>
    rowToPro(row as unknown as Record<string, unknown>)
  );
}

export async function createPro(input: ProInput): Promise<number> {
  const status = assertValidLicenseFields(input);
  const business = input.business_name.trim();
  const trades = input.trades.trim();
  const area = input.service_area.trim();
  if (!business || !trades || !area) {
    throw new Error("Business name, trade(s), and service area are required");
  }
  const db = getDb();
  const r = await db.execute({
    sql: `INSERT INTO service_pros (
            owner_user_id, business_name, trades, service_area, years_experience,
            specialties, notes, contact_email, contact_phone, active,
            license_status, license_number, license_source_name,
            license_source_url, license_checked_on
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [
      input.owner_user_id,
      business,
      trades,
      area,
      Math.max(0, Math.floor(input.years_experience || 0)),
      input.specialties?.trim() || null,
      input.notes?.trim() || null,
      input.contact_email?.trim() || null,
      input.contact_phone?.trim() || null,
      input.active === false ? 0 : 1,
      status,
      status === "verified" ? input.license_number!.trim() : input.license_number?.trim() || null,
      status === "verified"
        ? input.license_source_name!.trim()
        : input.license_source_name?.trim() || null,
      status === "verified"
        ? input.license_source_url!.trim()
        : input.license_source_url?.trim() || null,
      input.license_checked_on?.trim() || null,
    ],
  });
  return Number(r.rows[0].id);
}

export async function updatePro(
  id: number,
  input: Omit<ProInput, "owner_user_id">
): Promise<void> {
  const status = assertValidLicenseFields(input);
  const business = input.business_name.trim();
  const trades = input.trades.trim();
  const area = input.service_area.trim();
  if (!business || !trades || !area) {
    throw new Error("Business name, trade(s), and service area are required");
  }
  const db = getDb();
  await db.execute({
    sql: `UPDATE service_pros SET
            business_name = ?, trades = ?, service_area = ?, years_experience = ?,
            specialties = ?, notes = ?, contact_email = ?, contact_phone = ?,
            active = ?, license_status = ?, license_number = ?,
            license_source_name = ?, license_source_url = ?, license_checked_on = ?
          WHERE id = ?`,
    args: [
      business,
      trades,
      area,
      Math.max(0, Math.floor(input.years_experience || 0)),
      input.specialties?.trim() || null,
      input.notes?.trim() || null,
      input.contact_email?.trim() || null,
      input.contact_phone?.trim() || null,
      input.active === false ? 0 : 1,
      status,
      status === "verified" ? input.license_number!.trim() : input.license_number?.trim() || null,
      status === "verified"
        ? input.license_source_name!.trim()
        : input.license_source_name?.trim() || null,
      status === "verified"
        ? input.license_source_url!.trim()
        : input.license_source_url?.trim() || null,
      input.license_checked_on?.trim() || null,
      id,
    ],
  });
}

export async function setProActive(id: number, active: boolean): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE service_pros SET active = ? WHERE id = ?`,
    args: [active ? 1 : 0, id],
  });
}

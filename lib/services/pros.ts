export type LicenseStatus = "verified" | "unverified" | "not_applicable";

export type ServicePro = {
  id: number;
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

import { getDb } from "../db";
import { rowToPro, type ServicePro } from "./pros";

export type ProSearchParams = {
  trade?: string;
  location?: string;
  /** Only license_status = verified */
  licensedOnly?: boolean;
  /** years_experience >= minYears (default 5 when experiencedOnly) */
  experiencedOnly?: boolean;
  minYears?: number;
};

function hasSearchCriteria(p: ProSearchParams): boolean {
  return Boolean(
    (p.trade && p.trade.trim()) ||
      (p.location && p.location.trim()) ||
      p.licensedOnly ||
      p.experiencedOnly
  );
}

/**
 * Search active service pros by trade + location (soft LIKE).
 * Empty criteria returns []. Honest empty — never pads.
 */
export async function searchPros(
  params: ProSearchParams
): Promise<ServicePro[]> {
  if (!hasSearchCriteria(params)) {
    return [];
  }

  const db = getDb();
  const conditions: string[] = ["p.active = 1"];
  const args: (string | number)[] = [];

  if (params.trade?.trim()) {
    conditions.push("LOWER(p.trades) LIKE LOWER(?)");
    args.push(`%${params.trade.trim()}%`);
  }

  if (params.location?.trim()) {
    conditions.push("LOWER(p.service_area) LIKE LOWER(?)");
    args.push(`%${params.location.trim()}%`);
  }

  if (params.licensedOnly) {
    conditions.push("p.license_status = 'verified'");
  }

  if (params.experiencedOnly) {
    const min = params.minYears ?? 5;
    conditions.push("p.years_experience >= ?");
    args.push(min);
  }

  const sql = `
    SELECT
      p.id,
      p.business_name,
      p.trades,
      p.service_area,
      p.years_experience,
      p.specialties,
      p.notes,
      p.contact_email,
      p.contact_phone,
      p.active,
      p.license_status,
      p.license_number,
      p.license_source_name,
      p.license_source_url,
      p.license_checked_on
    FROM service_pros p
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.business_name ASC, p.id ASC
  `;

  const result = await db.execute({ sql, args });
  return result.rows.map((row) =>
    rowToPro(row as unknown as Record<string, unknown>)
  );
}

/** Load one pro by id (any active state). */
export async function getPro(id: number): Promise<ServicePro | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM service_pros WHERE id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToPro(result.rows[0] as unknown as Record<string, unknown>);
}

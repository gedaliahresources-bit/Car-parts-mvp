import { getDb } from "./db";

export type SearchParams = {
  partName?: string;
  partNumber?: string;
  year?: string | number;
  make?: string;
  model?: string;
};

export type Fitment = {
  year: number;
  make: string;
  model: string;
};

export type SearchResult = {
  id: number;
  part_name: string;
  part_number: string | null;
  condition: string;
  location: string;
  notes: string | null;
  price_text: string | null;
  seller_name: string;
  fitments: Fitment[];
  fitment_summary: string;
};

function hasAnyCriteria(p: SearchParams): boolean {
  return Boolean(
    (p.partName && p.partName.trim()) ||
      (p.partNumber && p.partNumber.trim()) ||
      (p.year !== undefined && String(p.year).trim() !== "") ||
      (p.make && p.make.trim()) ||
      (p.model && p.model.trim())
  );
}


/** Expand common make nicknames so "Chevy" matches "Chevrolet", etc. */
function makeSearchTerms(make: string): string[] {
  const raw = make.trim();
  if (!raw) return [];
  const key = raw.toLowerCase();
  const aliases: Record<string, string[]> = {
    chevy: ["chevy", "chevrolet"],
    chevrolet: ["chevy", "chevrolet"],
    vw: ["vw", "volkswagen"],
    volkswagen: ["vw", "volkswagen"],
    gmc: ["gmc"],
    mercedes: ["mercedes", "mercedes-benz", "mercedes benz"],
    "mercedes-benz": ["mercedes", "mercedes-benz", "mercedes benz"],
    "mercedes benz": ["mercedes", "mercedes-benz", "mercedes benz"],
  };
  const terms = aliases[key] ?? [raw];
  // de-dupe case-insensitively while preserving first spelling
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of terms) {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/** Search active listings. Empty criteria returns []. */
export async function searchListings(
  params: SearchParams
): Promise<SearchResult[]> {
  if (!hasAnyCriteria(params)) {
    return [];
  }

  const db = getDb();
  const conditions: string[] = ["l.active = 1"];
  const args: (string | number)[] = [];

  if (params.partName?.trim()) {
    conditions.push("LOWER(l.part_name) LIKE LOWER(?)");
    args.push(`%${params.partName.trim()}%`);
  }

  if (params.partNumber?.trim()) {
    conditions.push("LOWER(COALESCE(l.part_number, '')) LIKE LOWER(?)");
    args.push(`%${params.partNumber.trim()}%`);
  }

  const yearStr = params.year !== undefined ? String(params.year).trim() : "";
  const make = params.make?.trim() ?? "";
  const model = params.model?.trim() ?? "";
  const hasYmm = yearStr !== "" || make !== "" || model !== "";

  if (hasYmm) {
    const ymmParts: string[] = [];
    if (yearStr !== "") {
      const yearNum = Number(yearStr);
      if (!Number.isNaN(yearNum)) {
        ymmParts.push("f.year = ?");
        args.push(yearNum);
      }
    }
    if (make) {
      const makeTerms = makeSearchTerms(make);
      if (makeTerms.length === 1) {
        ymmParts.push("LOWER(f.make) LIKE LOWER(?)");
        args.push(`%${makeTerms[0]}%`);
      } else {
        const ors = makeTerms.map(() => "LOWER(f.make) LIKE LOWER(?)");
        ymmParts.push(`(${ors.join(" OR ")})`);
        for (const t of makeTerms) args.push(`%${t}%`);
      }
    }
    if (model) {
      ymmParts.push("LOWER(f.model) LIKE LOWER(?)");
      args.push(`%${model}%`);
    }
    if (ymmParts.length > 0) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM listing_fitments f
          WHERE f.listing_id = l.id AND ${ymmParts.join(" AND ")}
        )`
      );
    }
  }

  const sql = `
    SELECT
      l.id,
      l.part_name,
      l.part_number,
      l.condition,
      l.location,
      l.notes,
      l.price_text,
      u.display_name AS seller_name
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY l.part_name ASC, l.id ASC
  `;

  const result = await db.execute({ sql, args });

  const listings: SearchResult[] = [];

  for (const row of result.rows) {
    const id = Number(row.id);
    const fitRes = await db.execute({
      sql: `SELECT year, make, model FROM listing_fitments WHERE listing_id = ? ORDER BY year, make, model`,
      args: [id],
    });
    const fitments: Fitment[] = fitRes.rows.map((f) => ({
      year: Number(f.year),
      make: String(f.make),
      model: String(f.model),
    }));
    const fitment_summary =
      fitments.length === 0
        ? "—"
        : fitments.map((f) => `${f.year} ${f.make} ${f.model}`).join("; ");

    listings.push({
      id,
      part_name: String(row.part_name),
      part_number: row.part_number != null ? String(row.part_number) : null,
      condition: String(row.condition),
      location: String(row.location),
      notes: row.notes != null ? String(row.notes) : null,
      price_text: row.price_text != null ? String(row.price_text) : null,
      seller_name: String(row.seller_name),
      fitments,
      fitment_summary,
    });
  }

  return listings;
}

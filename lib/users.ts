import { getDb } from "./db";

export type User = {
  id: number;
  role: "buyer" | "seller";
  display_name: string;
  contact_email: string | null;
  contact_phone: string | null;
};

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    role: String(row.role) as "buyer" | "seller",
    display_name: String(row.display_name),
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
  };
}

export async function listSellers(): Promise<User[]> {
  const db = getDb();
  const r = await db.execute(
    `SELECT id, role, display_name, contact_email, contact_phone
     FROM users WHERE role = 'seller' ORDER BY id`
  );
  return r.rows.map((row) => rowToUser(row as Record<string, unknown>));
}

export async function getUser(id: number): Promise<User | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT id, role, display_name, contact_email, contact_phone FROM users WHERE id = ?`,
    args: [id],
  });
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

/** Seeded demo buyer (first buyer). */
export async function getDemoBuyer(): Promise<User | null> {
  const db = getDb();
  const r = await db.execute(
    `SELECT id, role, display_name, contact_email, contact_phone
     FROM users WHERE role = 'buyer' ORDER BY id LIMIT 1`
  );
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

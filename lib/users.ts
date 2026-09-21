import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import type { SessionUser } from "./auth";

export type User = {
  id: number;
  role: "buyer" | "seller";
  display_name: string;
  email: string;
  contact_email: string | null;
  contact_phone: string | null;
};

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    role: String(row.role) as "buyer" | "seller",
    display_name: String(row.display_name),
    email: String(row.email),
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
  };
}

export function userToSession(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
}

export async function listSellers(): Promise<User[]> {
  const db = getDb();
  const r = await db.execute(
    `SELECT id, role, display_name, email, contact_email, contact_phone
     FROM users WHERE role = 'seller' ORDER BY id`
  );
  return r.rows.map((row) => rowToUser(row as Record<string, unknown>));
}

export async function getUser(id: number): Promise<User | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT id, role, display_name, email, contact_email, contact_phone
          FROM users WHERE id = ?`,
    args: [id],
  });
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT id, role, display_name, email, contact_email, contact_phone
          FROM users WHERE lower(email) = lower(?)`,
    args: [email.trim()],
  });
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

/** Seeded demo buyer (first buyer). */
export async function getDemoBuyer(): Promise<User | null> {
  const db = getDb();
  const r = await db.execute(
    `SELECT id, role, display_name, email, contact_email, contact_phone
     FROM users WHERE role = 'buyer' ORDER BY id LIMIT 1`
  );
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

export type CreateUserInput = {
  role: "buyer" | "seller";
  display_name: string;
  email: string;
  password: string;
  contact_email?: string | null;
  contact_phone?: string | null;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const display = input.display_name.trim();
  if (!email || !display || !input.password) {
    throw new Error("Name, email, and password are required");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Email already registered");

  const password_hash = hashPassword(input.password);
  const contactEmail =
    input.contact_email?.trim() ||
    (input.role === "seller" ? email : null);
  const db = getDb();
  const r = await db.execute({
    sql: `INSERT INTO users
          (role, display_name, email, password_hash, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING id, role, display_name, email, contact_email, contact_phone`,
    args: [
      input.role,
      display,
      email,
      password_hash,
      contactEmail,
      input.contact_phone?.trim() || null,
    ],
  });
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT id, role, display_name, email, password_hash, contact_email, contact_phone
          FROM users WHERE lower(email) = lower(?)`,
    args: [email.trim()],
  });
  if (r.rows.length === 0) return null;
  const row = r.rows[0] as Record<string, unknown>;
  const ok = verifyPassword(password, String(row.password_hash));
  if (!ok) return null;
  return rowToUser(row);
}

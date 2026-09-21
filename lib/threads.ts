import { getDb } from "./db";

export type Thread = {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  created_at: string;
};

export type Message = {
  id: number;
  thread_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender_name: string;
};

export type ThreadDetail = Thread & {
  listing_part_name: string;
  listing_active: boolean;
  buyer_name: string;
  seller_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  messages: Message[];
};

export async function getOrCreateThread(opts: {
  listingId: number;
  buyerId: number;
  sellerId: number;
}): Promise<number> {
  const db = getDb();
  const existing = await db.execute({
    sql: `SELECT id FROM threads WHERE listing_id = ? AND buyer_id = ?`,
    args: [opts.listingId, opts.buyerId],
  });
  if (existing.rows.length > 0) {
    return Number(existing.rows[0].id);
  }
  const r = await db.execute({
    sql: `INSERT INTO threads (listing_id, buyer_id, seller_id)
          VALUES (?, ?, ?) RETURNING id`,
    args: [opts.listingId, opts.buyerId, opts.sellerId],
  });
  return Number(r.rows[0].id);
}

export async function getThread(id: number): Promise<ThreadDetail | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT t.*,
                 l.part_name AS listing_part_name,
                 l.active AS listing_active,
                 b.display_name AS buyer_name,
                 s.display_name AS seller_name,
                 s.contact_email,
                 s.contact_phone
          FROM threads t
          JOIN listings l ON l.id = t.listing_id
          JOIN users b ON b.id = t.buyer_id
          JOIN users s ON s.id = t.seller_id
          WHERE t.id = ?`,
    args: [id],
  });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  const msgRes = await db.execute({
    sql: `SELECT m.*, u.display_name AS sender_name
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.thread_id = ?
          ORDER BY m.created_at ASC, m.id ASC`,
    args: [id],
  });
  const messages: Message[] = msgRes.rows.map((m) => ({
    id: Number(m.id),
    thread_id: Number(m.thread_id),
    sender_id: Number(m.sender_id),
    body: String(m.body),
    created_at: String(m.created_at),
    sender_name: String(m.sender_name),
  }));
  return {
    id: Number(row.id),
    listing_id: Number(row.listing_id),
    buyer_id: Number(row.buyer_id),
    seller_id: Number(row.seller_id),
    created_at: String(row.created_at),
    listing_part_name: String(row.listing_part_name),
    listing_active: Number(row.listing_active) === 1,
    buyer_name: String(row.buyer_name),
    seller_name: String(row.seller_name),
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
    messages,
  };
}

export async function addMessage(opts: {
  threadId: number;
  senderId: number;
  body: string;
}): Promise<number> {
  const body = opts.body.trim();
  if (!body) throw new Error("Message body required");
  const db = getDb();
  const r = await db.execute({
    sql: `INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?) RETURNING id`,
    args: [opts.threadId, opts.senderId, body],
  });
  return Number(r.rows[0].id);
}

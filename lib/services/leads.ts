import { getDb } from "../db";
import { getPro } from "./search";

export type ServiceLead = {
  id: number;
  pro_id: number;
  homeowner_id: number;
  job_description: string;
  preferred_timing: string | null;
  thread_id: number | null;
  created_at: string;
};

export type ServiceThreadDetail = {
  id: number;
  pro_id: number;
  homeowner_id: number;
  created_at: string;
  pro_business_name: string;
  pro_active: boolean;
  homeowner_name: string;
  pro_owner_id: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  messages: {
    id: number;
    thread_id: number;
    sender_id: number;
    body: string;
    created_at: string;
    sender_name: string;
  }[];
};

export async function createLead(opts: {
  proId: number;
  homeownerId: number;
  jobDescription: string;
  preferredTiming?: string | null;
  openThread?: boolean;
}): Promise<{ leadId: number; threadId: number | null }> {
  const job = opts.jobDescription.trim();
  if (!job) throw new Error("Job description required");

  const pro = await getPro(opts.proId);
  if (!pro || !pro.active) throw new Error("Pro not available");
  if (pro.owner_user_id != null && pro.owner_user_id === opts.homeownerId) {
    throw new Error("You cannot send a lead to your own profile");
  }

  const db = getDb();
  let threadId: number | null = null;

  if (opts.openThread !== false) {
    threadId = await getOrCreateServiceThread({
      proId: opts.proId,
      homeownerId: opts.homeownerId,
    });
    const timing = opts.preferredTiming?.trim();
    const body = timing
      ? `Lead request:\n${job}\n\nPreferred timing: ${timing}`
      : `Lead request:\n${job}`;
    await addServiceMessage({
      threadId,
      senderId: opts.homeownerId,
      body,
    });
  }

  const r = await db.execute({
    sql: `INSERT INTO service_leads
            (pro_id, homeowner_id, job_description, preferred_timing, thread_id)
          VALUES (?, ?, ?, ?, ?) RETURNING id`,
    args: [
      opts.proId,
      opts.homeownerId,
      job,
      opts.preferredTiming?.trim() || null,
      threadId,
    ],
  });

  return { leadId: Number(r.rows[0].id), threadId };
}

export async function getOrCreateServiceThread(opts: {
  proId: number;
  homeownerId: number;
}): Promise<number> {
  const db = getDb();
  const existing = await db.execute({
    sql: `SELECT id FROM service_threads WHERE pro_id = ? AND homeowner_id = ?`,
    args: [opts.proId, opts.homeownerId],
  });
  if (existing.rows.length > 0) {
    return Number(existing.rows[0].id);
  }
  const r = await db.execute({
    sql: `INSERT INTO service_threads (pro_id, homeowner_id) VALUES (?, ?) RETURNING id`,
    args: [opts.proId, opts.homeownerId],
  });
  return Number(r.rows[0].id);
}

export async function getServiceThread(
  id: number
): Promise<ServiceThreadDetail | null> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT t.*,
                 p.business_name AS pro_business_name,
                 p.active AS pro_active,
                 p.owner_user_id AS pro_owner_id,
                 p.contact_email,
                 p.contact_phone,
                 h.display_name AS homeowner_name
          FROM service_threads t
          JOIN service_pros p ON p.id = t.pro_id
          JOIN users h ON h.id = t.homeowner_id
          WHERE t.id = ?`,
    args: [id],
  });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  const msgRes = await db.execute({
    sql: `SELECT m.*, u.display_name AS sender_name
          FROM service_messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.thread_id = ?
          ORDER BY m.created_at ASC, m.id ASC`,
    args: [id],
  });
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    homeowner_id: Number(row.homeowner_id),
    created_at: String(row.created_at),
    pro_business_name: String(row.pro_business_name),
    pro_active: Number(row.pro_active) === 1,
    homeowner_name: String(row.homeowner_name),
    pro_owner_id:
      row.pro_owner_id != null ? Number(row.pro_owner_id) : null,
    contact_email:
      row.contact_email != null ? String(row.contact_email) : null,
    contact_phone:
      row.contact_phone != null ? String(row.contact_phone) : null,
    messages: msgRes.rows.map((m) => ({
      id: Number(m.id),
      thread_id: Number(m.thread_id),
      sender_id: Number(m.sender_id),
      body: String(m.body),
      created_at: String(m.created_at),
      sender_name: String(m.sender_name),
    })),
  };
}

export async function addServiceMessage(opts: {
  threadId: number;
  senderId: number;
  body: string;
}): Promise<number> {
  const body = opts.body.trim();
  if (!body) throw new Error("Message body required");
  const db = getDb();
  const r = await db.execute({
    sql: `INSERT INTO service_messages (thread_id, sender_id, body)
          VALUES (?, ?, ?) RETURNING id`,
    args: [opts.threadId, opts.senderId, body],
  });
  return Number(r.rows[0].id);
}

export async function listLeadsForPro(proId: number): Promise<ServiceLead[]> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT * FROM service_leads WHERE pro_id = ? ORDER BY id DESC`,
    args: [proId],
  });
  return r.rows.map((row) => ({
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    homeowner_id: Number(row.homeowner_id),
    job_description: String(row.job_description),
    preferred_timing:
      row.preferred_timing != null ? String(row.preferred_timing) : null,
    thread_id: row.thread_id != null ? Number(row.thread_id) : null,
    created_at: String(row.created_at),
  }));
}

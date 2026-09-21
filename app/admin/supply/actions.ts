"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { initSchema } from "@/lib/db";
import { createUser, getUserByEmail } from "@/lib/users";
import { createListing } from "@/lib/listings";
import { createPro } from "@/lib/services/pros";
import {
  setSupplyFlash,
  type SupplyImportResult,
} from "@/lib/admin-supply-flash";

const SOURCE_NOTE = "source: atlanta-recruitment";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function adminKeyOk(key: string): boolean {
  const expected = process.env.ADMIN_SUPPLY_KEY;
  if (!expected || !key) return false;
  return key === expected;
}

function tempPassword(): string {
  return randomBytes(9).toString("base64url");
}

/** Parse one CSV line; supports simple quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * CSV row formats (header optional):
 *   seller,email,display_name,phone[,part_name,location]
 *   pro,email,display_name,phone,business_name,trades,service_area
 */
async function importOneRow(
  cols: string[],
  key: string
): Promise<SupplyImportResult> {
  if (!adminKeyOk(key)) {
    return { ok: false, error: "Invalid or missing ADMIN_SUPPLY_KEY" };
  }

  const kind = (cols[0] || "").toLowerCase();
  if (kind === "type" || kind === "kind") {
    return { ok: false, error: "Skipped header row" };
  }

  if (kind === "seller") {
    const email = (cols[1] || "").trim();
    const display_name = (cols[2] || "").trim();
    const phone = (cols[3] || "").trim() || null;
    const part_name = (cols[4] || "").trim();
    const location = (cols[5] || "").trim() || "Atlanta, GA";

    if (!email || !display_name) {
      return {
        ok: false,
        error: "Seller row needs email and display_name",
      };
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return {
        ok: false,
        error: `Email already registered (user #${existing.id})`,
        email,
        userId: existing.id,
      };
    }

    const password = tempPassword();
    const user = await createUser({
      role: "seller",
      display_name,
      email,
      password,
      contact_phone: phone,
    });

    let listingId: number | undefined;
    if (part_name) {
      listingId = await createListing({
        seller_id: user.id,
        part_name,
        condition: "used",
        location,
        notes: SOURCE_NOTE,
        active: true,
        fitments: [],
      });
    }

    return {
      ok: true,
      kind: "seller",
      email: user.email,
      userId: user.id,
      tempPassword: password,
      listingId,
    };
  }

  if (kind === "pro") {
    const email = (cols[1] || "").trim();
    const display_name = (cols[2] || "").trim();
    const phone = (cols[3] || "").trim() || null;
    const business_name = (cols[4] || "").trim() || display_name;
    const trades = (cols[5] || "").trim() || "general contractor";
    const service_area = (cols[6] || "").trim() || "Atlanta, GA";

    if (!email || !display_name) {
      return {
        ok: false,
        error: "Pro row needs email and display_name",
      };
    }

    let user = await getUserByEmail(email);
    let password: string | undefined;
    let existingUser = false;

    if (user) {
      existingUser = true;
    } else {
      password = tempPassword();
      user = await createUser({
        role: "seller",
        display_name,
        email,
        password,
        contact_phone: phone,
      });
    }

    const proId = await createPro({
      owner_user_id: user.id,
      business_name,
      trades,
      service_area,
      years_experience: 0,
      notes: SOURCE_NOTE,
      contact_email: email,
      contact_phone: phone,
      license_status: "unverified",
      active: true,
    });

    return {
      ok: true,
      kind: "pro",
      email: user.email,
      userId: user.id,
      tempPassword: password,
      proId,
      existingUser,
    };
  }

  return {
    ok: false,
    error: `Unknown type "${kind}" — use seller or pro`,
  };
}

export async function adminSupplyImportAction(formData: FormData) {
  await initSchema();
  const key = str(formData, "key");
  const csv = str(formData, "csv");

  if (!adminKeyOk(key)) {
    setSupplyFlash({
      ok: false,
      error: process.env.ADMIN_SUPPLY_KEY
        ? "Invalid admin key"
        : "ADMIN_SUPPLY_KEY is not set on this server",
    });
    redirect(`/admin/supply?key=${encodeURIComponent(key)}`);
  }

  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    setSupplyFlash({ ok: false, error: "Paste at least one CSV row" });
    redirect(`/admin/supply?key=${encodeURIComponent(key)}`);
  }

  let result: SupplyImportResult = {
    ok: false,
    error: "No data rows",
  };
  for (const line of lines) {
    const cols = parseCsvLine(line);
    const kind = (cols[0] || "").toLowerCase();
    if (kind === "type" || kind === "kind") continue;
    result = await importOneRow(cols, key);
    break;
  }

  setSupplyFlash(result);
  redirect(`/admin/supply?key=${encodeURIComponent(key)}`);
}

export async function adminSupplyUnlockAction(formData: FormData) {
  const key = str(formData, "key");
  redirect(`/admin/supply?key=${encodeURIComponent(key)}`);
}

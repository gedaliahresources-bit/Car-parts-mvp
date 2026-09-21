import { cookies } from "next/headers";

const FLASH_COOKIE = "admin_supply_flash";

export type SupplyImportResult = {
  ok: boolean;
  error?: string;
  kind?: "seller" | "pro";
  email?: string;
  userId?: number;
  tempPassword?: string;
  listingId?: number;
  proId?: number;
  existingUser?: boolean;
};

export function setSupplyFlash(result: SupplyImportResult) {
  cookies().set(FLASH_COOKIE, JSON.stringify(result), {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin/supply",
    maxAge: 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export function consumeSupplyFlash(): SupplyImportResult | null {
  const raw = cookies().get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  cookies().set(FLASH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin/supply",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  try {
    return JSON.parse(raw) as SupplyImportResult;
  } catch {
    return null;
  }
}

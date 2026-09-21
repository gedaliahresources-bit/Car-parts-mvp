"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { initSchema } from "@/lib/db";
import {
  createListing,
  updateListing,
  setListingActive,
  parseFitmentLines,
  getListing,
  type Condition,
} from "@/lib/listings";
import { getUser, getDemoBuyer } from "@/lib/users";
import { getOrCreateThread, addMessage } from "@/lib/threads";

const CONDITIONS = new Set(["new", "used", "refurbished", "core"]);

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function createListingAction(formData: FormData) {
  await initSchema();
  const sellerId = Number(str(formData, "seller_id"));
  const seller = await getUser(sellerId);
  if (!seller || seller.role !== "seller") {
    throw new Error("Invalid seller");
  }

  const condition = str(formData, "condition");
  if (!CONDITIONS.has(condition)) throw new Error("Invalid condition");

  const fitments = parseFitmentLines(str(formData, "fitments"));
  const partName = str(formData, "part_name").trim();
  const location = str(formData, "location").trim();
  if (!partName || !location) throw new Error("Part name and location required");

  const id = await createListing({
    seller_id: sellerId,
    part_name: partName,
    part_number: str(formData, "part_number") || null,
    condition: condition as Condition,
    location,
    notes: str(formData, "notes") || null,
    price_text: str(formData, "price_text") || null,
    active: str(formData, "active") !== "0",
    fitments,
  });

  revalidatePath("/");
  revalidatePath(`/seller/${sellerId}`);
  redirect(`/seller/${sellerId}?created=${id}`);
}

export async function updateListingAction(formData: FormData) {
  await initSchema();
  const listingId = Number(str(formData, "listing_id"));
  const sellerId = Number(str(formData, "seller_id"));
  const existing = await getListing(listingId);
  if (!existing || existing.seller_id !== sellerId) {
    throw new Error("Listing not found for seller");
  }

  const condition = str(formData, "condition");
  if (!CONDITIONS.has(condition)) throw new Error("Invalid condition");

  const fitments = parseFitmentLines(str(formData, "fitments"));
  const partName = str(formData, "part_name").trim();
  const location = str(formData, "location").trim();
  if (!partName || !location) throw new Error("Part name and location required");

  await updateListing(listingId, {
    part_name: partName,
    part_number: str(formData, "part_number") || null,
    condition: condition as Condition,
    location,
    notes: str(formData, "notes") || null,
    price_text: str(formData, "price_text") || null,
    active: str(formData, "active") !== "0",
    fitments,
  });

  revalidatePath("/");
  revalidatePath(`/seller/${sellerId}`);
  revalidatePath(`/listings/${listingId}`);
  redirect(`/seller/${sellerId}?updated=${listingId}`);
}

export async function deactivateListingAction(formData: FormData) {
  await initSchema();
  const listingId = Number(str(formData, "listing_id"));
  const sellerId = Number(str(formData, "seller_id"));
  const existing = await getListing(listingId);
  if (!existing || existing.seller_id !== sellerId) {
    throw new Error("Listing not found for seller");
  }
  await setListingActive(listingId, false);
  revalidatePath("/");
  revalidatePath(`/seller/${sellerId}`);
  revalidatePath(`/listings/${listingId}`);
  redirect(`/seller/${sellerId}?deactivated=${listingId}`);
}

export async function reactivateListingAction(formData: FormData) {
  await initSchema();
  const listingId = Number(str(formData, "listing_id"));
  const sellerId = Number(str(formData, "seller_id"));
  const existing = await getListing(listingId);
  if (!existing || existing.seller_id !== sellerId) {
    throw new Error("Listing not found for seller");
  }
  await setListingActive(listingId, true);
  revalidatePath("/");
  revalidatePath(`/seller/${sellerId}`);
  revalidatePath(`/listings/${listingId}`);
  redirect(`/seller/${sellerId}?reactivated=${listingId}`);
}

export async function startThreadAction(formData: FormData) {
  await initSchema();
  const listingId = Number(str(formData, "listing_id"));
  const listing = await getListing(listingId);
  if (!listing || !listing.active) {
    throw new Error("Listing not available");
  }
  const buyer = await getDemoBuyer();
  if (!buyer) throw new Error("No demo buyer — run npm run demo:seed");

  const threadId = await getOrCreateThread({
    listingId,
    buyerId: buyer.id,
    sellerId: listing.seller_id,
  });

  const opener = str(formData, "opener").trim();
  if (opener) {
    await addMessage({ threadId, senderId: buyer.id, body: opener });
  }

  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function sendMessageAction(formData: FormData) {
  await initSchema();
  const threadId = Number(str(formData, "thread_id"));
  const senderId = Number(str(formData, "sender_id"));
  const body = str(formData, "body");
  await addMessage({ threadId, senderId, body });
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

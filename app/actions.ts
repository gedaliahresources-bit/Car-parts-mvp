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
import {
  createUser,
  authenticateUser,
  userToSession,
  getUser,
} from "@/lib/users";
import { getOrCreateThread, addMessage, getThread } from "@/lib/threads";
import {
  createSession,
  destroySession,
  getSession,
} from "@/lib/auth";

const CONDITIONS = new Set(["new", "used", "refurbished", "core"]);

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function safeNext(raw: string): string {
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export async function signUpAction(formData: FormData) {
  await initSchema();
  const roleRaw = str(formData, "role");
  const role = roleRaw === "seller" ? "seller" : "buyer";
  const next = safeNext(str(formData, "next") || (role === "seller" ? "/seller" : "/"));

  try {
    const user = await createUser({
      role,
      display_name: str(formData, "display_name"),
      email: str(formData, "email"),
      password: str(formData, "password"),
      contact_email: str(formData, "contact_email") || null,
      contact_phone: str(formData, "contact_phone") || null,
    });
    await createSession(userToSession(user));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign up failed";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/");
  redirect(next);
}

export async function signInAction(formData: FormData) {
  await initSchema();
  const email = str(formData, "email");
  const password = str(formData, "password");
  const next = safeNext(str(formData, "next") || "/");

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
  }

  await createSession(userToSession(user));
  revalidatePath("/");

  if (next === "/" && user.role === "seller") {
    redirect(`/seller/${user.id}`);
  }
  redirect(next);
}

export async function signOutAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/");
}

async function requireOwnSellerAction(sellerId: number) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/seller/${sellerId}`)}`);
  if (session.role !== "seller" || session.id !== sellerId) {
    throw new Error("Not allowed to manage this seller inventory");
  }
  return session;
}

export async function createListingAction(formData: FormData) {
  await initSchema();
  const sellerId = Number(str(formData, "seller_id"));
  await requireOwnSellerAction(sellerId);

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
  await requireOwnSellerAction(sellerId);

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
  await requireOwnSellerAction(sellerId);

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
  await requireOwnSellerAction(sellerId);

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

  const session = await getSession();
  if (!session) {
    redirect(
      `/login?next=${encodeURIComponent(`/listings/${listingId}`)}&error=${encodeURIComponent("Log in to message the seller")}`
    );
  }

  if (session.id === listing.seller_id) {
    throw new Error("You cannot message your own listing");
  }

  const threadId = await getOrCreateThread({
    listingId,
    buyerId: session.id,
    sellerId: listing.seller_id,
  });

  const opener = str(formData, "opener").trim();
  if (opener) {
    await addMessage({ threadId, senderId: session.id, body: opener });
  }

  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function sendMessageAction(formData: FormData) {
  await initSchema();
  const threadId = Number(str(formData, "thread_id"));
  const body = str(formData, "body");

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/threads/${threadId}`)}`);
  }

  const thread = await getThread(threadId);
  if (!thread) throw new Error("Thread not found");
  if (session.id !== thread.buyer_id && session.id !== thread.seller_id) {
    throw new Error("Not a participant of this thread");
  }

  await addMessage({ threadId, senderId: session.id, body });
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

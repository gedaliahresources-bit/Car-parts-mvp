import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "car_parts_session";

export type SessionUser = {
  id: number;
  email: string;
  displayName: string;
  role: "buyer" | "seller";
};

function secretKey(): Uint8Array {
  const raw =
    process.env.SESSION_SECRET ||
    "dev-car-parts-mvp-session-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.id);
    const email = String(payload.email ?? "");
    const displayName = String(payload.displayName ?? "");
    const role = payload.role === "seller" ? "seller" : "buyer";
    if (!id || !email) return null;
    return { id, email, displayName, role };
  } catch {
    return null;
  }
}

/** Logged-in user required; redirect to login with optional next path. */
export async function requireSession(
  nextPath?: string
): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;
  const { redirect } = await import("next/navigation");
  const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  redirect(`/login${q}`);
  throw new Error("unreachable");
}

/**
 * Seller may only manage their own inventory.
 * Redirects to login if anonymous; redirects to own inventory if wrong id.
 */
export async function requireOwnSeller(
  sellerId: number
): Promise<SessionUser> {
  const session = await requireSession(`/seller/${sellerId}`);
  if (session.role !== "seller") {
    const { redirect } = await import("next/navigation");
    redirect("/seller");
    throw new Error("unreachable");
  }
  if (session.id !== sellerId) {
    const { redirect } = await import("next/navigation");
    redirect(`/seller/${session.id}`);
    throw new Error("unreachable");
  }
  return session;
}

/**
 * Logged-in user may only manage their own pro profiles.
 * Redirects to login if anonymous; redirects to own dashboard if wrong id.
 */
export async function requireOwnProOwner(
  userId: number
): Promise<SessionUser> {
  const session = await requireSession(`/services/pro/${userId}`);
  if (session.id !== userId) {
    const { redirect } = await import("next/navigation");
    redirect(`/services/pro/${session.id}`);
    throw new Error("unreachable");
  }
  return session;
}


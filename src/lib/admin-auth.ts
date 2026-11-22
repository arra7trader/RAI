import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

export const AUTH_SESSION_COOKIE = "rai_session";
const sessionLifetimeSeconds = 60 * 60 * 12;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000);
  await getDb().authSession.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });
  return token;
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await getDb().authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    });
    if (!session || session.expiresAt <= new Date()) return null;
    const user = session.user;
    if (user.role !== "SUPER_ADMIN" || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUserFromToken(token: string | undefined) {
  if (!token) return null;
  try {
    const session = await getDb().authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: {
        user: {
          select: {
            id: true,
            tenantId: true,
            name: true,
            role: true,
            isActive: true,
            tenant: { select: { isActive: true } },
          },
        },
      },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive) return null;
    if ((session.user.role === "OWNER" || session.user.role === "STAFF") && !session.user.tenant?.isActive) return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function getTenantWorkerFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const user = await getAuthenticatedUserFromToken(token);
  if (!user || (user.role !== "OWNER" && user.role !== "STAFF") || !user.tenantId || !user.tenant?.isActive) return null;
  return user;
}

export async function requireUser(role: "OWNER" | "STAFF") {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const session = token
    ? await getDb().authSession.findUnique({
        where: { tokenHash: hashSessionToken(token) },
        include: {
          user: {
            select: {
              id: true,
              tenantId: true,
              name: true,
              role: true,
              isActive: true,
              tenant: { select: { isActive: true } },
            },
          },
        },
      })
    : null;

  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    session.user.role !== role ||
    !session.user.tenantId ||
    !session.user.tenant?.isActive
  ) {
    redirect("/login");
  }
  return session.user;
}

export async function requireTenantWorker() {
  const user = await getTenantWorkerFromCookie();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAuthSession, AUTH_SESSION_COOKIE, getAdminCookieOptions } from "@/lib/admin-auth";
import { consumeLoginAttempt } from "@/lib/login-rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 400 });
    }

    const { db, emailHash, attempts } = await consumeLoginAttempt(
      parsed.data.email,
      request.headers.get("x-real-ip") ?? "unknown",
    );
    if (attempts > 5) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi 15 menit kemudian." },
        { status: 429, headers: { "retry-after": "900", "cache-control": "no-store" } },
      );
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      include: { tenant: { select: { isActive: true } } },
    });
    const valid = user && user.isActive && user.tenantId && user.tenant?.isActive && (user.role === "OWNER" || user.role === "STAFF")
      ? await compare(parsed.data.password, user.passwordHash)
      : false;

    if (!valid || !user) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }

    await db.adminLoginAttempt.deleteMany({ where: { emailHash } });
    const token = await createAuthSession(user.id);
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      redirectTo: user.role === "OWNER" ? "/dashboard" : "/app",
    });
    response.cookies.set(AUTH_SESSION_COOKIE, token, getAdminCookieOptions());
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Login sedang tidak tersedia." }, { status: 503 });
  }
}

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  }

  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (token) {
    try {
      await getDb().authSession.deleteMany({
        where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      });
    } catch {
      // Always clear the browser cookie even if database revocation fails.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

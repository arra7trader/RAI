import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AUTH_SESSION_COOKIE, getAuthenticatedUserFromToken } from "@/lib/admin-auth";
import {
  createVisitorCookieValue,
  getVisitorId,
  VISIT_COOLDOWN_MS,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitor-cookie";

const visitorCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function unavailable(status: 404 | 503, message: string) {
  return new NextResponse(
    `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QR belum tersedia</title><body style="font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f7;color:#1d1d1f"><main style="max-width:440px;padding:32px;text-align:center"><div style="font-size:13px;font-weight:700;letter-spacing:.1em;color:#32a8a4">RAI</div><h1 style="font-size:28px;letter-spacing:-.04em">QR belum dapat dibuka</h1><p style="color:#6e6e73;line-height:1.6">${message}</p></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function resolveQr(
  request: NextRequest,
  code: string,
  responseMode: "redirect" | "json" = "redirect",
) {
  let visitorId: string;
  let newCookieValue: string | undefined;

  try {
    const db = getDb();
    const qr = await db.qrCode.findUnique({
      where: { code },
      include: {
        tenant: {
          select: { id: true, slug: true, activeQrMode: true, isActive: true },
        },
      },
    });

    if (!qr || qr.status !== "ACTIVE" || !qr.tenant || !qr.tenant.isActive) {
      if (responseMode === "json") {
        return NextResponse.json(
          { error: "QR_NOT_FOUND" },
          { status: 404, headers: { "cache-control": "no-store" } },
        );
      }
      return unavailable(404, "Pastikan kode QR benar atau hubungi Tim RAI.");
    }

    if (responseMode === "redirect") {
      const authToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
      const user = await getAuthenticatedUserFromToken(authToken);
      if (user?.tenantId === qr.tenant.id && user.role === "OWNER") {
        return NextResponse.redirect(new URL("/dashboard", request.url), 307);
      }
      if (user?.tenantId === qr.tenant.id && user.role === "STAFF") {
        return NextResponse.redirect(new URL("/app", request.url), 307);
      }
    }

    const cookieValue = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    const verifiedVisitorId = getVisitorId(cookieValue);

    if (verifiedVisitorId) {
      visitorId = createHash("sha256").update(verifiedVisitorId).digest("hex");
    } else {
      newCookieValue = createVisitorCookieValue();
      visitorId = createHash("sha256")
        .update(newCookieValue.slice(0, newCookieValue.lastIndexOf(".")))
        .digest("hex");
    }

    const tenantVisitorToken = createHash("sha256")
      .update(`${qr.tenant.id}:${visitorId}`)
      .digest("hex");
    const now = new Date();
    const cooldownLimit = new Date(now.getTime() - VISIT_COOLDOWN_MS).toISOString();

    const visit = await db.$transaction(async (transaction) => {
      const sessionRows = await transaction.$queryRaw<Array<{ visit_count: number }>>`
        INSERT INTO "visitor_sessions" (
          "id", "tenant_id", "visitor_token", "first_seen_at", "last_seen_at", "visit_count"
        ) VALUES (
          ${randomUUID()}, ${qr.tenant!.id}, ${tenantVisitorToken}, ${now.toISOString()}, ${now.toISOString()}, 1
        )
        ON CONFLICT("tenant_id", "visitor_token") DO UPDATE SET
          "last_seen_at" = excluded."last_seen_at",
          "visit_count" = "visitor_sessions"."visit_count" + 1
        WHERE julianday("visitor_sessions"."last_seen_at") <= julianday(${cooldownLimit})
        RETURNING "visit_count"
      `;

      const session = sessionRows[0];
      if (!session) {
        const existing = await transaction.visitorSession.findUnique({
          where: {
            tenantId_visitorToken: {
              tenantId: qr.tenant!.id,
              visitorToken: tenantVisitorToken,
            },
          },
          select: { visitCount: true },
        });

        return {
          counted: false,
          visitorType: existing?.visitCount === 1 ? "NEW" : "RETURNING",
        };
      }

      await transaction.qrCode.update({
        where: { id: qr.id },
        data: { totalScans: { increment: 1 } },
      });

      await transaction.storeVisit.create({
        data: {
          tenantId: qr.tenant!.id,
          qrCodeId: qr.id,
          visitorToken: tenantVisitorToken,
          visitorType: session.visit_count === 1 ? "NEW" : "RETURNING",
          visitedAt: now,
        },
      });

      return {
        counted: true,
        visitorType: session.visit_count === 1 ? "NEW" : "RETURNING",
      };
    });

    if (responseMode === "json") {
      const response = NextResponse.json({
        status: "ACTIVE",
        store: {
          slug: qr.tenant.slug,
          activeQrMode: qr.tenant.activeQrMode,
        },
        visit,
        cooldownHours: VISIT_COOLDOWN_MS / (60 * 60 * 1000),
      });
      response.headers.set("cache-control", "no-store");
      if (newCookieValue) {
        response.cookies.set(VISITOR_COOKIE_NAME, newCookieValue, visitorCookieOptions);
      }
      return response;
    }

    const destination = new URL(`/${qr.tenant.slug}`, request.url);
    switch (qr.tenant.activeQrMode) {
      case "REVIEW_FOCUS":
        destination.searchParams.set("focus", "review");
        break;
      case "MENU_ORDER":
        destination.pathname = `/${qr.tenant.slug}/menu`;
        break;
      case "CLOSED_STORE":
        destination.searchParams.set("mode", "closed");
        break;
      default:
        break;
    }

    const response = NextResponse.redirect(destination, 307);
    response.headers.set("cache-control", "no-store");
    if (newCookieValue) {
      response.cookies.set(VISITOR_COOKIE_NAME, newCookieValue, visitorCookieOptions);
    }
    return response;
  } catch (error) {
    console.error("QR resolution failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    if (responseMode === "json") {
      return NextResponse.json(
        { error: "QR_SERVICE_UNAVAILABLE" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    return unavailable(503, "Layanan QR sedang mengalami gangguan. Silakan coba lagi nanti.");
  }
}

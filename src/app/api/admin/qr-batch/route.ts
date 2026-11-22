import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { qrBatchSchema } from "@/lib/admin-schemas";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = qrBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Jumlah atau label QR tidak valid." }, { status: 400 });
    }

    const db = getDb();
    const created: Array<{ id: string; code: string; label: string }> = [];
    const reserved = new Set<string>();
    let attempts = 0;

    while (created.length < parsed.data.quantity && attempts < parsed.data.quantity * 5) {
      attempts += 1;
      const quantity = Math.min(parsed.data.quantity - created.length, 100);
      const candidates = Array.from({ length: quantity }, (_, index) => {
        const code = `RAI-${randomInt(0, 36 ** 6).toString(36).toUpperCase().padStart(6, "0")}`;
        return { code, label: `${parsed.data.labelPrefix} ${created.length + index + 1}` };
      }).filter((item) => {
        if (reserved.has(item.code)) return false;
        reserved.add(item.code);
        return true;
      });

      try {
        const inserted = await db.qrCode.createManyAndReturn({
          data: candidates.map((item) => ({ ...item, status: "UNASSIGNED" })),
          select: { id: true, code: true, label: true },
        });
        created.push(...inserted);
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) {
          throw error;
        }
      }
    }

    if (created.length !== parsed.data.quantity) {
      return NextResponse.json(
        { error: "Sebagian kode gagal dibuat. Periksa inventaris dan coba kembali." },
        { status: 503 },
      );
    }

    return NextResponse.json({ codes: created }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Batch QR gagal dibuat." }, { status: 503 });
  }
}

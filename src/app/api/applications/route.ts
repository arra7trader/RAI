import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { storeApplicationSchema } from "@/lib/application-schemas";
import { consumeApplicationAttempt } from "@/lib/application-rate-limit";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Format pengajuan tidak valid." }, { status: 415 });
  }

  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeApplicationAttempt(address) > 5) {
      return NextResponse.json({ error: "Terlalu banyak pengajuan dari jaringan ini. Coba lagi 15 menit kemudian." }, { status: 429, headers: { "retry-after": "900", "cache-control": "no-store" } });
    }
    const parsed = storeApplicationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Periksa kembali data usaha." }, { status: 400 });
    }

    const data = parsed.data;
    const db = getDb();
    const duplicate = await db.storeApplication.findFirst({
      where: {
        ownerEmail: data.ownerEmail,
        status: { in: ["PENDING", "APPROVED"] },
        submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ ok: true, message: "Pengajuan Anda sudah diterima dan sedang ditinjau." }, { status: 200 });
    }

    const slug = data.businessName.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || `toko-${createHash("sha256").update(data.ownerEmail).digest("hex").slice(0, 8)}`;
    await db.storeApplication.create({
      data: {
        ...data,
        phoneWa: data.phoneWa.replace(/\D/g, ""),
        slug,
        status: "PENDING",
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, message: "Pengajuan terkirim. Tim RAI akan menghubungi Anda setelah peninjauan." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Pengajuan belum tersimpan. Coba kembali nanti." }, { status: 503 });
  }
}

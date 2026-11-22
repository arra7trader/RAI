import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeApplicationAttempt } from "@/lib/application-rate-limit";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ rating: z.number().int().min(1).max(5), message: z.string().trim().max(1000).default("") });

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeApplicationAttempt(`feedback:${address}`) > 15) return NextResponse.json({ error: "Terlalu banyak masukan. Coba kembali nanti." }, { status: 429 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Nilai rating atau pesan tidak valid." }, { status: 400 });
    const { storeSlug } = await params;
    const tenant = await getDb().tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true } });
    if (!tenant?.isActive) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    await getDb().customerFeedback.create({ data: { tenantId: tenant.id, rating: parsed.data.rating, message: parsed.data.message } });
    return NextResponse.json({ ok: true, message: "Masukan tersimpan. Terima kasih sudah membantu toko berkembang." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Masukan belum tersimpan. Coba kembali nanti." }, { status: 503 });
  }
}

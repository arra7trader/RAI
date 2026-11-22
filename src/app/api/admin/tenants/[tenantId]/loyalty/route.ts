import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  isActive: z.boolean(),
  targetStamps: z.number().int().min(2).max(20),
  rewardTitle: z.string().trim().min(2).max(120),
  termsText: z.string().trim().max(600),
  rewardDiscount: z.number().int().min(0).max(100_000_000),
}).refine((data) => !data.isActive || data.rewardDiscount > 0, { path: ["rewardDiscount"], message: "Isi nilai hadiah lebih dari Rp0 sebelum mengaktifkan program." });

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pengaturan loyalti tidak valid." }, { status: 400 });
  const { tenantId } = await params;
  const db = getDb();
  try {
    if (!await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true } })) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    const program = await db.loyaltyProgram.upsert({ where: { tenantId }, create: { tenantId, ...parsed.data }, update: parsed.data });
    return NextResponse.json({ ok: true, program: { isActive: program.isActive, targetStamps: program.targetStamps } }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Pengaturan loyalti gagal disimpan." }, { status: 503 });
  }
}

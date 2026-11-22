import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ cardToken: z.string().min(16).max(80), quantity: z.number().int().min(1).max(10).default(1) });

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kode kartu atau jumlah stempel tidak valid." }, { status: 400 });
  const db = getDb();
  const card = await db.customer.findFirst({
    where: { tenantId: user.tenantId, cardToken: parsed.data.cardToken },
    select: {
      id: true,
      tenant: { select: { loyaltyProgram: { select: { isActive: true, targetStamps: true, rewardTitle: true } } } },
    },
  });
  if (!card || !card.tenant.loyaltyProgram?.isActive) return NextResponse.json({ error: "Kartu tidak ditemukan atau program toko tidak aktif." }, { status: 404 });
  try {
    const updated = await db.$transaction(async (tx) => {
      await tx.stampEvent.create({ data: { tenantId: user.tenantId!, customerId: card.id, staffId: user.id, quantity: parsed.data.quantity } });
      return tx.customer.update({ where: { id: card.id }, data: { stampBalance: { increment: parsed.data.quantity }, stampsIssued: { increment: parsed.data.quantity } }, select: { name: true, cardToken: true, stampBalance: true, stampsIssued: true, stampsRedeemed: true } });
    });
    return NextResponse.json({ customer: updated, program: card.tenant.loyaltyProgram }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stempel belum tersimpan." }, { status: 503 });
  }
}

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const claimSchema = z.object({ cardToken: z.string().min(16).max(80) });

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = claimSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kartu pelanggan tidak valid." }, { status: 400 });
  const db = getDb(); const tenantId = user.tenantId;
  try {
    const card = await db.customer.findFirst({ where: { tenantId, cardToken: parsed.data.cardToken }, include: { tenant: { select: { loyaltyProgram: true } } } });
    const program = card?.tenant.loyaltyProgram;
    if (!card || !program?.isActive) return NextResponse.json({ error: "Kartu atau program loyalti tidak ditemukan." }, { status: 404 });
    if (card.stampBalance < program.targetStamps) return NextResponse.json({ error: `Pelanggan membutuhkan ${program.targetStamps - card.stampBalance} stempel lagi.` }, { status: 409 });
    const code = `RAI-${randomBytes(5).toString("hex").toUpperCase()}`;
    const voucher = await db.$transaction(async (tx) => {
      const redeemed = await tx.customer.updateMany({ where: { id: card.id, tenantId, stampBalance: { gte: program.targetStamps } }, data: { stampBalance: { decrement: program.targetStamps }, stampsRedeemed: { increment: program.targetStamps } } });
      if (redeemed.count !== 1) throw new Error("NOT_ENOUGH_STAMPS");
      return tx.voucher.create({ data: { tenantId, customerId: card.id, code, title: program.rewardTitle, discountAmount: program.rewardDiscount }, select: { code: true, title: true, discountAmount: true } });
    });
    return NextResponse.json({ voucher, customer: { name: card.name, stampBalance: card.stampBalance - program.targetStamps } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_ENOUGH_STAMPS") return NextResponse.json({ error: "Saldo stempel berubah. Periksa kartu lalu coba lagi." }, { status: 409 });
    return NextResponse.json({ error: "Hadiah belum dapat diterbitkan." }, { status: 503 });
  }
}

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
    if (!card || !program?.isActive || program.rewardDiscount < 1) return NextResponse.json({ error: "Kartu tidak ditemukan atau hadiah toko belum diatur." }, { status: 404 });
    if (card.stampBalance < program.targetStamps) return NextResponse.json({ error: `Pelanggan membutuhkan ${program.targetStamps - card.stampBalance} stempel lagi.` }, { status: 409 });
    const code = `RAI-${randomBytes(5).toString("hex").toUpperCase()}`;
    const result = await db.$transaction(async (tx) => {
      const current = await tx.loyaltyProgram.findUnique({ where: { tenantId }, select: { isActive: true, targetStamps: true, rewardTitle: true, rewardDiscount: true } });
      if (!current?.isActive || current.rewardDiscount < 1) throw new Error("REWARD_NOT_CONFIGURED");
      const redeemed = await tx.customer.updateMany({ where: { id: card.id, tenantId, stampBalance: { gte: current.targetStamps } }, data: { stampBalance: { decrement: current.targetStamps }, stampsRedeemed: { increment: current.targetStamps } } });
      if (redeemed.count !== 1) throw new Error("NOT_ENOUGH_STAMPS");
      const [voucher, customer] = await Promise.all([
        tx.voucher.create({ data: { tenantId, customerId: card.id, code, title: current.rewardTitle, discountAmount: current.rewardDiscount }, select: { code: true, title: true, discountAmount: true } }),
        tx.customer.findUniqueOrThrow({ where: { id: card.id }, select: { stampBalance: true } }),
      ]);
      return { voucher, stampBalance: customer.stampBalance };
    });
    return NextResponse.json({ voucher: result.voucher, customer: { name: card.name, stampBalance: result.stampBalance } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_ENOUGH_STAMPS") return NextResponse.json({ error: "Saldo stempel berubah. Periksa kartu lalu coba lagi." }, { status: 409 });
    if (error instanceof Error && error.message === "REWARD_NOT_CONFIGURED") return NextResponse.json({ error: "Nilai hadiah berubah. Hubungi Tim RAI sebelum menerbitkan voucher." }, { status: 409 });
    return NextResponse.json({ error: "Hadiah belum dapat diterbitkan." }, { status: 503 });
  }
}

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeApplicationAttempt } from "@/lib/application-rate-limit";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ name: z.string().trim().min(2).max(100), phoneWa: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/), dataConsent: z.literal(true) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeSlug: string; promotionId: string }> }) {
  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeApplicationAttempt(`promotion:${address}`) > 8) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba kembali nanti." }, { status: 429 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data pelanggan tidak valid." }, { status: 400 });
    const { storeSlug, promotionId } = await params;
    const db = getDb();
    const phoneWa = parsed.data.phoneWa.replace(/\D/g, "");
    const code = `RAI-${randomBytes(5).toString("hex").toUpperCase()}`;
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true } });
      if (!tenant?.isActive) throw new Error("STORE_NOT_FOUND");
      const customer = await tx.customer.upsert({
        where: { tenantId_phoneWa: { tenantId: tenant.id, phoneWa } },
        update: { name: parsed.data.name },
        create: { tenantId: tenant.id, name: parsed.data.name, phoneWa },
        select: { id: true, name: true },
      });
      const campaign = await tx.promotionCampaign.findFirst({
        where: { id: promotionId, tenantId: tenant.id, isActive: true, validUntil: { gt: new Date() } },
        select: { id: true, title: true, discountType: true, discountValue: true, minimumPurchase: true, quota: true, claimedCount: true, validUntil: true, freeProductId: true, freeProduct: { select: { isAvailable: true } } },
      });
      if (!campaign || campaign.claimedCount >= campaign.quota) throw new Error("PROMOTION_FULL");
      if (campaign.discountType === "FREE_ITEM" && !campaign.freeProduct?.isAvailable) throw new Error("FREE_ITEM_UNAVAILABLE");
      const claimed = await tx.promotionCampaign.updateMany({ where: { id: campaign.id, tenantId: tenant.id, isActive: true, validUntil: { gt: new Date() }, claimedCount: { lt: campaign.quota } }, data: { claimedCount: { increment: 1 } } });
      if (claimed.count !== 1) throw new Error("PROMOTION_FULL");
      const voucher = await tx.voucher.create({
        data: {
          tenantId: tenant.id, customerId: customer.id, promotionId: campaign.id, freeProductId: campaign.freeProductId,
          code, title: campaign.title, discountType: campaign.discountType,
          discountValue: campaign.discountValue,
          discountAmount: campaign.discountType === "NOMINAL" ? campaign.discountValue : 0,
          minimumPurchase: campaign.minimumPurchase, expiresAt: campaign.validUntil,
        },
        select: { code: true, title: true, discountType: true, discountValue: true, minimumPurchase: true, expiresAt: true, freeProduct: { select: { name: true } } },
      });
      return { customer, voucher };
    });
    return NextResponse.json(result, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "STORE_NOT_FOUND") return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    if (error instanceof Error && error.message === "PROMOTION_FULL") return NextResponse.json({ error: "Promo sudah habis atau tidak berlaku." }, { status: 409 });
    if (error instanceof Error && error.message === "FREE_ITEM_UNAVAILABLE") return NextResponse.json({ error: "Produk hadiah sedang tidak tersedia." }, { status: 409 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Nomor WhatsApp ini sudah mengklaim promo tersebut." }, { status: 409 });
    return NextResponse.json({ error: "Klaim promo gagal disimpan." }, { status: 503 });
  }
}

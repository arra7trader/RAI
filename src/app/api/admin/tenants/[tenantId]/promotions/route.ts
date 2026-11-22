import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const campaignSchema = z.object({
  title: z.string().trim().min(2).max(120),
  discountType: z.enum(["NOMINAL", "PERCENTAGE", "FREE_ITEM"]),
  discountValue: z.number().int().min(1).max(1_000_000_000),
  minimumPurchase: z.number().int().min(0).max(1_000_000_000),
  quota: z.number().int().min(1).max(100_000),
  validUntil: z.string().datetime().refine((value) => new Date(value) > new Date(), "Masa berlaku harus di masa depan."),
  freeProductId: z.string().uuid().optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.discountType === "PERCENTAGE" && value.discountValue > 100) context.addIssue({ code: "custom", path: ["discountValue"], message: "Persentase diskon maksimal 100%." });
  if (value.discountType === "FREE_ITEM" && !value.freeProductId) context.addIssue({ code: "custom", path: ["freeProductId"], message: "Pilih produk hadiah." });
  if (value.discountType !== "FREE_ITEM" && value.freeProductId) context.addIssue({ code: "custom", path: ["freeProductId"], message: "Produk hadiah hanya diperlukan untuk promo barang gratis." });
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data promo tidak valid." }, { status: 400 });
  const { tenantId } = await params;
  const db = getDb();
  try {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    const freeProductId = parsed.data.freeProductId || null;
    if (freeProductId && !await db.product.findFirst({ where: { id: freeProductId, tenantId }, select: { id: true } })) {
      return NextResponse.json({ error: "Produk hadiah tidak termasuk katalog toko ini." }, { status: 400 });
    }
    const campaign = await db.promotionCampaign.create({
      data: { ...parsed.data, validUntil: new Date(parsed.data.validUntil), freeProductId, tenantId, isActive: true },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, campaign }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Promo gagal dibuat." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const body = z.object({ campaignId: z.string().uuid(), isActive: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Status promo tidak valid." }, { status: 400 });
  const { tenantId } = await params;
  const updated = await getDb().promotionCampaign.updateMany({ where: { id: body.data.campaignId, tenantId }, data: { isActive: body.data.isActive } });
  if (!updated.count) return NextResponse.json({ error: "Promo tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, isActive: body.data.isActive }, { headers: { "cache-control": "no-store" } });
}

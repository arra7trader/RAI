import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ id: z.string().uuid().optional(), category: z.string().trim().min(1).max(60), name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).default(""), price: z.number().int().min(0).max(1_000_000_000), isAvailable: z.boolean().default(true), trackInventory: z.boolean().default(false), initialStock: z.number().int().min(0).max(1_000_000).default(0), lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5) });

export async function GET() {
  const user = await requireUser("OWNER");
  return NextResponse.json({ products: await getDb().product.findMany({ where: { tenantId: user.tenantId! }, orderBy: [{ category: "asc" }, { name: "asc" }] }) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await requireUser("OWNER");
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  const { id, initialStock, ...data } = parsed.data;
  const db = getDb();
  try {
    if (id) {
      const result = await db.$transaction(async (tx) => {
        const existing = await tx.product.findFirst({ where: { id, tenantId: user.tenantId! }, select: { stockQuantity: true, trackInventory: true } });
        if (!existing) return false;
        if (existing.trackInventory && !data.trackInventory) throw new Error("INVENTORY_CANNOT_BE_DISABLED");
        const stockQuantity = existing.trackInventory ? existing.stockQuantity : data.trackInventory ? initialStock : existing.stockQuantity;
        const product = await tx.product.updateMany({ where: { id, tenantId: user.tenantId!, stockQuantity: existing.stockQuantity }, data: { ...data, stockQuantity } });
        if (!product.count) throw new Error("STOCK_CHANGED");
        const difference = stockQuantity - existing.stockQuantity;
        if (difference !== 0) await tx.stockMovement.create({ data: { tenantId: user.tenantId!, productId: id, type: "ADJUSTMENT", quantity: difference, note: "Penyesuaian saldo melalui katalog" } });
        return true;
      });
      if (!result) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    } else {
      await db.$transaction(async (tx) => {
        const product = await tx.product.create({ data: { ...data, stockQuantity: data.trackInventory ? initialStock : 0, tenantId: user.tenantId! } });
        if (data.trackInventory && initialStock > 0) {
          await tx.stockMovement.create({ data: { tenantId: user.tenantId!, productId: product.id, type: "OPENING", quantity: initialStock, note: "Saldo awal" } });
        }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") return NextResponse.json({ error: "Stok berubah bersamaan. Muat ulang lalu simpan kembali." }, { status: 409 });
    if (error instanceof Error && error.message === "INVENTORY_CANNOT_BE_DISABLED") return NextResponse.json({ error: "Pelacakan stok yang sudah aktif tidak dapat dinonaktifkan." }, { status: 409 });
    return NextResponse.json({ error: "Produk gagal disimpan." }, { status: 503 });
  }
}

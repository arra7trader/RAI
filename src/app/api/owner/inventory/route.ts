import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const supplierSchema = z.object({ action: z.literal("SUPPLIER"), name: z.string().trim().min(1).max(120), phone: z.string().trim().max(30).default(""), notes: z.string().trim().max(300).default("") });
const purchaseSchema = z.object({ action: z.literal("PURCHASE"), supplierId: z.string().uuid().nullable().optional(), reference: z.string().trim().max(80).default(""), note: z.string().trim().max(300).default(""), items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(100_000), unitCost: z.number().int().min(0).max(1_000_000_000) })).min(1).max(30) });
const adjustmentSchema = z.object({ action: z.literal("ADJUSTMENT"), productId: z.string().uuid(), quantity: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0), note: z.string().trim().min(3).max(300) });

export async function GET() {
  const user = await requireUser("OWNER");
  const tenantId = user.tenantId!;
  const db = getDb();
  const [products, suppliers, purchases, movements] = await Promise.all([
    db.product.findMany({ where: { tenantId }, orderBy: [{ trackInventory: "desc" }, { name: "asc" }], select: { id: true, name: true, category: true, trackInventory: true, stockQuantity: true, lowStockThreshold: true } }),
    db.supplier.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    db.purchase.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, reference: true, total: true, createdAt: true, supplier: { select: { name: true } }, items: { select: { name: true, quantity: true } } } }),
    db.stockMovement.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, type: true, quantity: true, note: true, createdAt: true, product: { select: { name: true } } } }),
  ]);
  return NextResponse.json({ products, suppliers, purchases, movements }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await requireUser("OWNER");
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = z.object({ action: z.string() }).safeParse(body);
  if (!action.success) return NextResponse.json({ error: "Aksi inventaris tidak valid." }, { status: 400 });
  const tenantId = user.tenantId!;
  const db = getDb();

  if (action.data.action === "SUPPLIER") {
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data pemasok tidak valid." }, { status: 400 });
    try {
      await db.supplier.create({ data: { ...parsed.data, tenantId } });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch { return NextResponse.json({ error: "Pemasok gagal disimpan. Nama mungkin sudah digunakan." }, { status: 409 }); }
  }

  if (action.data.action === "ADJUSTMENT") {
    const parsed = adjustmentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Rincian penyesuaian tidak valid." }, { status: 400 });
    const { productId, quantity, note } = parsed.data;
    try {
      await db.$transaction(async (tx) => {
        const where = { id: productId, tenantId, trackInventory: true, ...(quantity < 0 ? { stockQuantity: { gte: -quantity } } : {}) };
        const changed = await tx.product.updateMany({ where, data: { stockQuantity: { increment: quantity } } });
        if (changed.count !== 1) throw new Error("STOCK_NOT_ADJUSTABLE");
        await tx.stockMovement.create({ data: { tenantId, productId, type: "ADJUSTMENT", quantity, note } });
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "STOCK_NOT_ADJUSTABLE") return NextResponse.json({ error: "Produk belum melacak stok atau saldo stok tidak cukup." }, { status: 409 });
      return NextResponse.json({ error: "Penyesuaian stok gagal disimpan." }, { status: 503 });
    }
  }

  if (action.data.action === "PURCHASE") {
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Rincian pembelian tidak valid." }, { status: 400 });
    const data = parsed.data;
    const ids = data.items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) return NextResponse.json({ error: "Pilih setiap produk satu kali per pembelian." }, { status: 400 });
    const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    if (!Number.isSafeInteger(total)) return NextResponse.json({ error: "Total pembelian melebihi batas." }, { status: 400 });
    try {
      await db.$transaction(async (tx) => {
        if (data.supplierId) {
          const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, tenantId }, select: { id: true } });
          if (!supplier) throw new Error("SUPPLIER_INVALID");
        }
        const products = await tx.product.findMany({ where: { id: { in: ids }, tenantId, trackInventory: true }, select: { id: true, name: true } });
        if (products.length !== ids.length) throw new Error("PRODUCT_NOT_TRACKED");
        const byId = new Map(products.map((product) => [product.id, product]));
        const items = data.items.map((item) => ({ ...item, name: byId.get(item.productId)!.name, lineTotal: item.quantity * item.unitCost }));
        const purchase = await tx.purchase.create({ data: { tenantId, supplierId: data.supplierId ?? null, reference: data.reference, note: data.note, total, items: { create: items } }, select: { id: true } });
        for (const item of items) {
          await tx.product.updateMany({ where: { id: item.productId, tenantId, trackInventory: true }, data: { stockQuantity: { increment: item.quantity } } });
          await tx.stockMovement.create({ data: { tenantId, productId: item.productId, purchaseId: purchase.id, type: "PURCHASE", quantity: item.quantity, note: data.reference ? `Pembelian ${data.reference}` : "Penerimaan pembelian" } });
        }
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === "SUPPLIER_INVALID") return NextResponse.json({ error: "Pemasok tidak ditemukan." }, { status: 404 });
      if (error instanceof Error && error.message === "PRODUCT_NOT_TRACKED") return NextResponse.json({ error: "Semua produk pembelian harus mengaktifkan pelacakan stok." }, { status: 409 });
      return NextResponse.json({ error: "Pembelian gagal disimpan." }, { status: 503 });
    }
  }

  return NextResponse.json({ error: "Aksi inventaris tidak dikenal." }, { status: 400 });
}

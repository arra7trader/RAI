import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  paymentMethod: z.enum(["CASH", "QRIS", "TRANSFER", "CARD"]),
  customerName: z.string().trim().max(100).default(""),
  customerPhone: z.string().trim().max(20).default(""),
  voucherCode: z.string().trim().max(40).default(""),
});

export async function GET() {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const db = getDb();
  const [products, shift] = await Promise.all([
    db.product.findMany({ where: { tenantId: user.tenantId, isAvailable: true }, orderBy: [{ category: "asc" }, { name: "asc" }], select: { id: true, name: true, category: true, price: true } }),
    db.cashDrawerShift.findFirst({ where: { tenantId: user.tenantId, closedAt: null }, select: { id: true, openingCash: true, openedAt: true } }),
  ]);
  return NextResponse.json({ products, shift }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Rincian transaksi tidak valid." }, { status: 400 });
  const data = parsed.data; const tenantId = user.tenantId!; const db = getDb();
  try {
    const result = await db.$transaction(async (tx) => {
      const ids = [...new Set(data.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids }, tenantId, isAvailable: true }, select: { id: true, name: true, price: true } });
      if (products.length !== ids.length) throw new Error("PRODUCT_UNAVAILABLE");
      const byId = new Map(products.map((product) => [product.id, product]));
      const lines = data.items.map((item) => {
        const product = byId.get(item.productId)!;
        return { productId: product.id, name: product.name, unitPrice: product.price, quantity: item.quantity, lineTotal: product.price * item.quantity };
      });
      const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
      if (!Number.isSafeInteger(subtotal)) throw new Error("TOTAL_INVALID");
      const customerPhone = data.customerPhone.replace(/\D/g, "");
      let customer = customerPhone ? await tx.customer.findUnique({ where: { tenantId_phoneWa: { tenantId, phoneWa: customerPhone } } }) : null;
      if (customerPhone && !customer) customer = await tx.customer.create({ data: { tenantId, phoneWa: customerPhone, name: data.customerName || "Pelanggan" } });
      else if (customer && data.customerName && customer.name !== data.customerName) customer = await tx.customer.update({ where: { id: customer.id }, data: { name: data.customerName } });
      let voucher = null; let discount = 0;
      if (data.voucherCode) {
        voucher = await tx.voucher.findFirst({ where: { tenantId, code: data.voucherCode, status: "ISSUED", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
        if (!voucher || (voucher.customerId && voucher.customerId !== customer?.id)) throw new Error("VOUCHER_INVALID");
        discount = Math.min(subtotal, voucher.discountAmount);
      }
      const shift = data.paymentMethod === "CASH" ? await tx.cashDrawerShift.findFirst({ where: { tenantId, closedAt: null } }) : null;
      if (data.paymentMethod === "CASH" && !shift) throw new Error("CASH_SHIFT_REQUIRED");
      const order = await tx.order.create({
        data: {
          tenantId, staffId: user.id, customerId: customer?.id, voucherId: voucher?.id, shiftId: shift?.id,
          paymentMethod: data.paymentMethod, subtotal, discount, total: subtotal - discount,
          items: { create: lines },
        },
        select: { id: true, subtotal: true, discount: true, total: true, paymentMethod: true, createdAt: true, items: true },
      });
      if (voucher) {
        const redeemed = await tx.voucher.updateMany({ where: { id: voucher.id, tenantId, status: "ISSUED" }, data: { status: "REDEEMED", redeemedAt: new Date() } });
        if (redeemed.count !== 1) throw new Error("VOUCHER_INVALID");
      }
      const program = await tx.loyaltyProgram.findUnique({ where: { tenantId }, select: { isActive: true, rewardDiscount: true } });
      if (customer && program?.isActive) {
        await tx.stampEvent.create({ data: { tenantId, customerId: customer.id, staffId: user.id, orderId: order.id, quantity: 1 } });
        await tx.customer.update({ where: { id: customer.id }, data: { stampBalance: { increment: 1 }, stampsIssued: { increment: 1 } } });
      }
      return { order, customerName: customer?.name ?? "", customerPhone, stampsAdded: Boolean(customer && program?.isActive) };
    });
    const receipt = ["Struk RAI", ...result.order.items.map((item) => `${item.quantity} x ${item.name} — Rp${item.lineTotal.toLocaleString("id-ID")}`), `Subtotal: Rp${result.order.subtotal.toLocaleString("id-ID")}`, `Diskon: Rp${result.order.discount.toLocaleString("id-ID")}`, `Total: Rp${result.order.total.toLocaleString("id-ID")}`, `Pembayaran: ${result.order.paymentMethod}`].join("\n");
    const whatsappUrl = result.customerPhone ? `https://wa.me/${result.customerPhone}?text=${encodeURIComponent(receipt)}` : null;
    return NextResponse.json({ ...result, whatsappUrl }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const messages: Record<string, string> = {
      PRODUCT_UNAVAILABLE: "Satu atau lebih produk sudah tidak tersedia.", TOTAL_INVALID: "Nilai transaksi di luar batas yang didukung.",
      VOUCHER_INVALID: "Voucher tidak valid, sudah digunakan, kedaluwarsa, atau bukan milik pelanggan ini.",
      CASH_SHIFT_REQUIRED: "Buka kas laci sebelum menerima pembayaran tunai.",
    };
    if (error instanceof Error && messages[error.message]) return NextResponse.json({ error: messages[error.message] }, { status: 409 });
    return NextResponse.json({ error: "Transaksi gagal disimpan." }, { status: 503 });
  }
}

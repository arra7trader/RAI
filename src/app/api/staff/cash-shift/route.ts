import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("OPEN"), amount: z.number().int().min(0).max(1_000_000_000) }),
  z.object({ action: z.literal("MOVEMENT"), type: z.enum(["IN", "OUT"]), amount: z.number().int().min(1).max(1_000_000_000), note: z.string().trim().max(200).default("") }),
  z.object({ action: z.literal("CLOSE"), countedCash: z.number().int().min(0).max(1_000_000_000) }),
]);

async function shiftSummary(tenantId: string) {
  const db = getDb();
  const shift = await db.cashDrawerShift.findFirst({ where: { tenantId, closedAt: null }, orderBy: { openedAt: "desc" }, include: { movements: { orderBy: { createdAt: "desc" }, take: 50 } } });
  if (!shift) return null;
  const sales = await db.order.aggregate({ where: { tenantId, shiftId: shift.id, status: "PAID", paymentMethod: "CASH" }, _sum: { total: true } });
  const expectedCash = shift.openingCash + (sales._sum.total ?? 0) + shift.movements.reduce((total, movement) => total + (movement.type === "IN" ? movement.amount : -movement.amount), 0);
  return { ...shift, expectedCash };
}

export async function GET() {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  return NextResponse.json({ shift: await shiftSummary(user.tenantId) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data kas laci tidak valid." }, { status: 400 });
  const db = getDb(); const tenantId = user.tenantId;
  try {
    if (parsed.data.action === "OPEN") {
      const existing = await db.cashDrawerShift.findFirst({ where: { tenantId, closedAt: null }, select: { id: true } });
      if (existing) return NextResponse.json({ error: "Shift kas masih terbuka." }, { status: 409 });
      await db.cashDrawerShift.create({ data: { tenantId, openedById: user.id, openingCash: parsed.data.amount } });
    } else {
      const shift = await db.cashDrawerShift.findFirst({ where: { tenantId, closedAt: null }, select: { id: true } });
      if (!shift) return NextResponse.json({ error: "Buka shift kas terlebih dahulu." }, { status: 409 });
      if (parsed.data.action === "MOVEMENT") await db.cashDrawerMovement.create({ data: { tenantId, shiftId: shift.id, createdById: user.id, type: parsed.data.type, amount: parsed.data.amount, note: parsed.data.note } });
      else {
        const current = await shiftSummary(tenantId);
        if (!current) return NextResponse.json({ error: "Shift kas tidak ditemukan." }, { status: 409 });
        const closed = await db.cashDrawerShift.updateMany({ where: { id: shift.id, tenantId, closedAt: null }, data: { closedAt: new Date(), closedById: user.id, expectedCash: current.expectedCash, countedCash: parsed.data.countedCash } });
        if (!closed.count) return NextResponse.json({ error: "Shift kas sudah ditutup." }, { status: 409 });
        return NextResponse.json({ ok: true, expectedCash: current.expectedCash, difference: parsed.data.countedCash - current.expectedCash, shift: null });
      }
    }
    return NextResponse.json({ ok: true, shift: await shiftSummary(tenantId) });
  } catch { return NextResponse.json({ error: "Perubahan kas laci gagal disimpan." }, { status: 503 }); }
}

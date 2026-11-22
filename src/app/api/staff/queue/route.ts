import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const actionSchema = z.object({ action: z.enum(["NEXT", "COMPLETE", "SKIP"]), ticketId: z.string().uuid().optional() });
function jakartaDayKey() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export async function GET() {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const tickets = await getDb().queueTicket.findMany({ where: { tenantId: user.tenantId, dayKey: jakartaDayKey(), status: { in: ["WAITING", "CALLED"] } }, orderBy: { ticketNumber: "asc" }, take: 100 });
  return NextResponse.json({ tickets }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Aksi antrean tidak valid." }, { status: 400 });
  const db = getDb(); const dayKey = jakartaDayKey();
  try {
    if (parsed.data.action === "NEXT") {
      const next = await db.queueTicket.findFirst({ where: { tenantId: user.tenantId, dayKey, status: "WAITING" }, orderBy: { ticketNumber: "asc" } });
      if (!next) return NextResponse.json({ error: "Tidak ada antrean yang menunggu." }, { status: 404 });
      const changed = await db.queueTicket.updateMany({ where: { id: next.id, tenantId: user.tenantId, status: "WAITING" }, data: { status: "CALLED", calledAt: new Date() } });
      if (!changed.count) return NextResponse.json({ error: "Antrean berubah. Muat ulang daftar." }, { status: 409 });
      return NextResponse.json({ ok: true, ticket: { id: next.id, ticketNumber: next.ticketNumber } });
    }
    if (!parsed.data.ticketId) return NextResponse.json({ error: "Pilih nomor antrean." }, { status: 400 });
    const status = parsed.data.action === "COMPLETE" ? "COMPLETED" : "SKIPPED";
    const updated = await db.queueTicket.updateMany({ where: { id: parsed.data.ticketId, tenantId: user.tenantId, dayKey, status: "CALLED" }, data: { status } });
    if (!updated.count) return NextResponse.json({ error: "Antrean tidak ditemukan atau statusnya telah berubah." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Perubahan antrean gagal." }, { status: 503 }); }
}

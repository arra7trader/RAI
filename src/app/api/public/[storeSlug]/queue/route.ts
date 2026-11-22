import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeApplicationAttempt } from "@/lib/application-rate-limit";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(100), phoneWa: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/) });
function jakartaDayKey() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export async function GET(_request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const db = getDb();
  const tenant = await db.tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true } });
  if (!tenant?.isActive) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
  const tickets = await db.queueTicket.findMany({ where: { tenantId: tenant.id, dayKey: jakartaDayKey(), status: { in: ["WAITING", "CALLED"] } }, orderBy: { ticketNumber: "asc" }, take: 50, select: { ticketNumber: true, status: true, createdAt: true, calledAt: true } });
  return NextResponse.json({ tickets }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeApplicationAttempt(`queue:${address}`) > 8) return NextResponse.json({ error: "Terlalu banyak nomor antrean diminta. Coba kembali nanti." }, { status: 429 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Nama dan nomor WhatsApp antrean wajib valid." }, { status: 400 });
    const { storeSlug } = await params;
    const db = getDb();
    const tenant = await db.tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true } });
    if (!tenant?.isActive) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    const dayKey = jakartaDayKey();
    const phoneWa = parsed.data.phoneWa.replace(/\D/g, "");
    const customer = await db.customer.findUnique({ where: { tenantId_phoneWa: { tenantId: tenant.id, phoneWa } }, select: { id: true } });
    const ticket = await db.$transaction(async (tx) => {
      const row = await tx.$queryRaw<Array<{ next_value: number }>>`
        INSERT INTO "queue_counters" ("id", "next_value") VALUES (${`${tenant.id}:${dayKey}`}, 1)
        ON CONFLICT("id") DO UPDATE SET "next_value" = "queue_counters"."next_value" + 1
        RETURNING "next_value"
      `;
      const number = row[0]?.next_value;
      if (!number) throw new Error("QUEUE_COUNTER_FAILED");
      return tx.queueTicket.create({ data: { tenantId: tenant.id, customerId: customer?.id, dayKey, ticketNumber: number, customerName: parsed.data.name, phoneWa } });
    });
    return NextResponse.json({ ticket: { id: ticket.id, ticketNumber: ticket.ticketNumber, dayKey: ticket.dayKey, status: ticket.status } }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Nomor antrean gagal dibuat. Coba kembali." }, { status: 503 });
  }
}

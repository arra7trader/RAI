import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeApplicationAttempt } from "@/lib/application-rate-limit";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(100), phoneWa: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  try {
    const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeApplicationAttempt(`customer:${address}`) > 8) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba kembali nanti." }, { status: 429 });
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Data pelanggan tidak valid." }, { status: 400 });
    const { storeSlug } = await params;
    const db = getDb();
    const tenant = await db.tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true, loyaltyProgram: { select: { isActive: true, targetStamps: true, rewardTitle: true } } } });
    if (!tenant?.isActive || !tenant.loyaltyProgram?.isActive) return NextResponse.json({ error: "Program stempel toko belum aktif." }, { status: 404 });
    const customer = await db.customer.upsert({
      where: { tenantId_phoneWa: { tenantId: tenant.id, phoneWa: body.data.phoneWa.replace(/\D/g, "") } },
      update: { name: body.data.name },
      create: { tenantId: tenant.id, name: body.data.name, phoneWa: body.data.phoneWa.replace(/\D/g, "") },
      select: { name: true, cardToken: true, stampBalance: true, stampsIssued: true, stampsRedeemed: true },
    });
    return NextResponse.json({ customer, program: tenant.loyaltyProgram }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Kartu loyalti belum tersedia." }, { status: 503 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const token = _request.nextUrl.searchParams.get("card");
  if (!token || token.length > 80) return NextResponse.json({ error: "Kartu tidak ditemukan." }, { status: 404 });
  const customer = await getDb().customer.findFirst({
    where: { cardToken: token, tenant: { slug: storeSlug, isActive: true } },
    select: { name: true, cardToken: true, stampBalance: true, stampsIssued: true, stampsRedeemed: true, tenant: { select: { loyaltyProgram: { select: { targetStamps: true, rewardTitle: true, isActive: true } } } } },
  });
  if (!customer || !customer.tenant.loyaltyProgram?.isActive) return NextResponse.json({ error: "Kartu tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ customer, program: customer.tenant.loyaltyProgram }, { headers: { "cache-control": "no-store" } });
}

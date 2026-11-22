import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ id: z.string().uuid().optional(), category: z.string().trim().min(1).max(60), name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).default(""), price: z.number().int().min(0).max(1_000_000_000), isAvailable: z.boolean().default(true) });

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
  const { id, ...data } = parsed.data;
  const db = getDb();
  try {
    if (id) {
      const product = await db.product.updateMany({ where: { id, tenantId: user.tenantId! }, data });
      if (!product.count) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    } else {
      await db.product.create({ data: { ...data, tenantId: user.tenantId! } });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Produk gagal disimpan." }, { status: 503 }); }
}

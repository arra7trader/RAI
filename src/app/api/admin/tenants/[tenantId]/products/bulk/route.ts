import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const productSchema = z.object({
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(""),
  price: z.number().int().min(0).max(1_000_000_000),
  isAvailable: z.boolean().default(true),
});

const bulkSchema = z.object({ products: z.array(productSchema).min(1).max(250) }).superRefine(({ products }, context) => {
  const seen = new Set<string>();
  products.forEach((product, index) => {
    const name = product.name.toLocaleLowerCase("id-ID");
    if (seen.has(name)) context.addIssue({ code: "custom", path: ["products", index, "name"], message: "Nama produk tidak boleh berulang dalam satu impor." });
    seen.add(name);
  });
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });

  const { tenantId } = await params;
  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data produk tidak valid." }, { status: 400 });

  const db = getDb();
  try {
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
      if (!tenant) throw new Error("TENANT_NOT_FOUND");
      const names = new Set(parsed.data.products.map((product) => product.name.toLocaleLowerCase("id-ID")));
      const existing = await tx.product.findMany({ where: { tenantId }, select: { name: true } });
      const duplicate = existing.find((product) => names.has(product.name.toLocaleLowerCase("id-ID")));
      if (duplicate) throw new Error(`PRODUCT_EXISTS:${duplicate.name}`);
      return tx.product.createMany({ data: parsed.data.products.map((product) => ({ ...product, tenantId })) });
    });
    return NextResponse.json({ ok: true, count: result.count }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "TENANT_NOT_FOUND") return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    if (error instanceof Error && error.message.startsWith("PRODUCT_EXISTS:")) return NextResponse.json({ error: `Produk sudah ada di katalog: ${error.message.slice("PRODUCT_EXISTS:".length)}. Hapus duplikat dari data impor.` }, { status: 409 });
    return NextResponse.json({ error: "Katalog gagal disimpan. Tidak ada produk yang diimpor." }, { status: 503 });
  }
}

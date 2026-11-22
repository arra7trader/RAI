import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(["FNB", "RETAIL", "SERVICE", "CLINIC", "OTHER"]),
  phoneWa: z.string().trim().regex(/^(?:|\+?[0-9\s()-]{8,20})$/),
  address: z.string().trim().max(300),
  googleReviewUrl: z.string().trim().max(2000).refine((value) => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Link ulasan harus menggunakan URL HTTPS yang valid."),
  latitude: z.number().finite().min(-90).max(90).nullable(),
  longitude: z.number().finite().min(-180).max(180).nullable(),
  geofenceRadius: z.number().int().min(20).max(1000),
  workStartTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  planTier: z.enum(["LARIS", "KASIR", "JURAGAN"]),
  planStatus: z.enum(["TRIAL", "ACTIVE", "EXPIRED"]),
  isActive: z.boolean(),
}).refine((data) => (data.latitude === null) === (data.longitude === null), { path: ["latitude"], message: "Latitude dan longitude harus diisi bersama." });

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Profil toko tidak valid." }, { status: 400 });
  const { tenantId } = await params;
  const updated = await getDb().tenant.updateMany({
    where: { id: tenantId },
    data: { ...parsed.data, phoneWa: parsed.data.phoneWa.replace(/\D/g, "") },
  });
  if (!updated.count) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}

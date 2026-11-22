import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { storeApplicationSchema } from "@/lib/application-schemas";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function allowedSecret(candidate: string | null) {
  const expected = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
  if (!expected || !candidate) return false;
  const supplied = Buffer.from(candidate);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function POST(request: NextRequest) {
  if (!allowedSecret(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null)) {
    return NextResponse.json({ error: "Integrasi Form tidak diotorisasi." }, { status: 401 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Format data Form tidak valid." }, { status: 415 });
  }
  const body = await request.json().catch(() => null);
  const parsed = storeApplicationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Jawaban Form belum lengkap." }, { status: 400 });
  const data = parsed.data;
  try {
    const db = getDb();
    const duplicate = await db.storeApplication.findFirst({ where: { ownerEmail: data.ownerEmail, status: { in: ["PENDING", "APPROVED"] }, submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ ok: true, duplicate: true });
    const slug = data.businessName.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || `toko-${Date.now().toString(36)}`;
    const application = await db.storeApplication.create({ data: { ...data, phoneWa: data.phoneWa.replace(/\D/g, ""), slug, status: "PENDING" }, select: { id: true } });
    return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "Jawaban Form belum masuk ke antrean. Kirim ulang nanti." }, { status: 503 }); }
}

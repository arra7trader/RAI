import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ mode: z.enum(["DEFAULT_HUB", "MENU_ORDER", "REVIEW_FOCUS", "CLOSED_STORE"]) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Mode QR tidak valid." }, { status: 400 });
  const { tenantId } = await params;
  const result = await getDb().tenant.updateMany({ where: { id: tenantId }, data: { activeQrMode: parsed.data.mode } });
  if (!result.count) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, mode: parsed.data.mode }, { headers: { "cache-control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { getOwnerTenantScope } from "@/lib/owner-tenant-scope";

export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ feedbackId: string }> }) {
  const user = await requireUser("OWNER");
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const { feedbackId } = await params;
  const scope = await getOwnerTenantScope(user.id, user.tenantId);
  const where = { id: feedbackId, tenantId: { in: scope.tenantIds } };
  const current = await getDb().customerFeedback.findFirst({ where, select: { status: true } });
  if (!current) return NextResponse.json({ error: "Masukan tidak ditemukan." }, { status: 404 });
  const status = current.status === "OPEN" ? "RESOLVED" : "OPEN";
  const result = await getDb().customerFeedback.updateMany({ where, data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null } });
  if (!result.count) return NextResponse.json({ error: "Masukan sudah berubah." }, { status: 409 });
  return NextResponse.json({ ok: true, status });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  primaryTenantId: z.string().uuid(),
  branchTenantIds: z.array(z.string().uuid()).min(1).max(19),
}).refine((data) => !data.branchTenantIds.includes(data.primaryTenantId), {
  path: ["branchTenantIds"],
  message: "Pilih cabang yang berbeda dari toko utama.",
}).refine((data) => new Set(data.branchTenantIds).size === data.branchTenantIds.length, {
  path: ["branchTenantIds"],
  message: "Pilihan cabang tidak boleh berulang.",
});

export async function POST(request: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pilihan cabang tidak valid." }, { status: 400 });
  const ids = [parsed.data.primaryTenantId, ...parsed.data.branchTenantIds];
  const db = getDb();

  try {
    const selected = await db.tenant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, isActive: true, planTier: true, groupId: true },
    });
    if (selected.length !== ids.length || selected.some((tenant) => !tenant.isActive)) {
      return NextResponse.json({ error: "Semua toko harus aktif. Muat ulang daftar toko." }, { status: 409 });
    }
    const primary = selected.find((tenant) => tenant.id === parsed.data.primaryTenantId);
    const owner = primary ? await db.user.findFirst({ where: { tenantId: primary.id, role: "OWNER", isActive: true }, select: { id: true } }) : null;
    const ownerCount = primary ? await db.user.count({ where: { tenantId: primary.id, role: "OWNER", isActive: true } }) : 0;
    if (!primary || selected.some((tenant) => tenant.planTier !== "JURAGAN") || !owner || ownerCount !== 1) {
      return NextResponse.json({ error: "Setiap cabang harus aktif memakai paket JURAGAN. Toko utama harus memiliki tepat satu akun owner." }, { status: 409 });
    }
    const ownerIds = [owner.id];
    const linkedOwners = await db.tenantGroupOwner.findMany({ where: { userId: owner.id }, select: { groupId: true } });
    const storeGroupIds = new Set(selected.map((tenant) => tenant.groupId).filter((id): id is string => Boolean(id)));
    const ownerGroupId = linkedOwners[0]?.groupId;
    if (storeGroupIds.size > 1 || (storeGroupIds.size === 1 && [...storeGroupIds][0] !== ownerGroupId)) {
      return NextResponse.json({ error: "Toko atau akun owner sudah terhubung ke grup cabang lain." }, { status: 409 });
    }

    const group = await db.$transaction(async (tx) => {
      const groupId = ownerGroupId;
      const saved = groupId
        ? await tx.tenantGroup.findUniqueOrThrow({ where: { id: groupId }, select: { id: true } })
        : await tx.tenantGroup.create({ data: { name: primary.name }, select: { id: true } });

      await tx.tenant.updateMany({ where: { groupId: saved.id, id: { notIn: ids } }, data: { groupId: null } });
      for (const userId of ownerIds) {
        await tx.tenantGroupOwner.upsert({ where: { groupId_userId: { groupId: saved.id, userId } }, update: {}, create: { groupId: saved.id, userId } });
      }
      const linked = await tx.tenant.updateMany({ where: { id: { in: ids }, isActive: true }, data: { groupId: saved.id } });
      if (linked.count !== ids.length) throw new Error("TENANT_GROUP_UPDATE_INCOMPLETE");
      return saved;
    });
    return NextResponse.json({ ok: true, groupId: group.id, tenantCount: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Pengaturan cabang gagal disimpan." }, { status: 503 });
  }
}

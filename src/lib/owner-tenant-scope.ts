import "server-only";
import { getDb } from "@/lib/db";

export async function getOwnerTenantScope(ownerUserId: string, primaryTenantId: string | null) {
  const db = getDb();
  const membership = await db.tenantGroupOwner.findUnique({
    where: { userId: ownerUserId },
    select: { group: { select: { tenants: { where: { isActive: true, planTier: "JURAGAN" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, slug: true, planTier: true, groupId: true } } } } },
  });
  if (membership?.group.tenants.length && membership.group.tenants.some((tenant) => tenant.id === primaryTenantId)) {
    return { tenants: membership.group.tenants, tenantIds: membership.group.tenants.map((tenant) => tenant.id) };
  }

  const primary = primaryTenantId
    ? await db.tenant.findFirst({ where: { id: primaryTenantId, isActive: true }, select: { id: true, name: true, slug: true, planTier: true, groupId: true } })
    : null;
  const tenants = primary ? [primary] : [];
  return { tenants, tenantIds: tenants.map((tenant) => tenant.id) };
}

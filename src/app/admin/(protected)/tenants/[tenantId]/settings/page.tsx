import { notFound } from "next/navigation";
import { AdminLoyaltySettings, AdminQrModeSettings } from "@/components/admin-tenant-controls";
import { AdminPromotionCampaigns } from "@/components/promotion-campaigns";
import { AdminTenantProfile } from "@/components/admin-tenant-profile";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTenantSettingsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getDb().tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      activeQrMode: true,
      category: true,
      phoneWa: true,
      address: true,
      googleReviewUrl: true,
      latitude: true,
      longitude: true,
      geofenceRadius: true,
      workStartTime: true,
      planTier: true,
      planStatus: true,
      isActive: true,
      loyaltyProgram: { select: { isActive: true, targetStamps: true, rewardTitle: true, termsText: true, rewardDiscount: true } },
      products: { select: { id: true, name: true, isAvailable: true }, orderBy: { name: "asc" } },
      promotions: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, discountType: true, discountValue: true, minimumPurchase: true, quota: true, claimedCount: true, validUntil: true, isActive: true, freeProductId: true, freeProduct: { select: { name: true, isAvailable: true } } } },
    },
  });
  if (!tenant) notFound();

  return <>
    <div className="admin-page-heading"><span className="admin-eyebrow">Concierge toko</span><h1>Pengaturan · {tenant.name}</h1><p>Atur tujuan QR dan program stempel serta nominal hadiah toko ini.</p></div>
    <div className="tenant-settings-grid">
      <AdminQrModeSettings tenantId={tenant.id} initialMode={tenant.activeQrMode} />
      <AdminLoyaltySettings tenantId={tenant.id} initial={tenant.loyaltyProgram} />
    </div>
    <AdminTenantProfile tenantId={tenant.id} initial={{ name: tenant.name, category: tenant.category, phoneWa: tenant.phoneWa, address: tenant.address, googleReviewUrl: tenant.googleReviewUrl, latitude: tenant.latitude, longitude: tenant.longitude, geofenceRadius: tenant.geofenceRadius, workStartTime: tenant.workStartTime, planTier: tenant.planTier, planStatus: tenant.planStatus, isActive: tenant.isActive }} />
    <AdminPromotionCampaigns tenantId={tenant.id} products={tenant.products} initial={tenant.promotions.map((campaign) => ({ ...campaign, validUntil: campaign.validUntil.toISOString() }))} />
  </>;
}

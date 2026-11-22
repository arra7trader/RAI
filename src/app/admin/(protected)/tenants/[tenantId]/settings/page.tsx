import { notFound } from "next/navigation";
import { AdminLoyaltySettings, AdminQrModeSettings } from "@/components/admin-tenant-controls";
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
      loyaltyProgram: { select: { isActive: true, targetStamps: true, rewardTitle: true, termsText: true, rewardDiscount: true } },
    },
  });
  if (!tenant) notFound();

  return <>
    <div className="admin-page-heading"><span className="admin-eyebrow">Concierge toko</span><h1>Pengaturan · {tenant.name}</h1><p>Atur tujuan QR dan program stempel serta nominal hadiah toko ini.</p></div>
    <div className="tenant-settings-grid">
      <AdminQrModeSettings tenantId={tenant.id} initialMode={tenant.activeQrMode} />
      <AdminLoyaltySettings tenantId={tenant.id} initial={tenant.loyaltyProgram} />
    </div>
  </>;
}

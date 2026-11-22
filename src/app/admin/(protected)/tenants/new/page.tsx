import Link from "next/link";
import { AdminTenantOnboarding } from "@/components/admin-tenant-onboarding";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewTenantPage() {
  const qrCodes = await getDb().qrCode.findMany({
    where: { status: "UNASSIGNED", tenantId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, code: true, label: true },
    take: 500,
  });

  return (
    <>
      <div className="admin-page-heading">
        <Link className="admin-back-link" href="/admin/tenants">← Daftar toko</Link>
        <span className="admin-eyebrow">Concierge onboarding</span>
        <h1>Siapkan toko baru.</h1>
        <p>Profil, akun owner, dan QR fisik dibuat dalam satu proses.</p>
      </div>
      <AdminTenantOnboarding qrCodes={qrCodes} />
    </>
  );
}

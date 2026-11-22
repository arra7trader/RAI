import { AdminBranchGroups } from "@/components/admin-branch-groups";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BranchGroupsPage() {
  const tenants = await getDb().tenant.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, planTier: true, isActive: true, groupId: true },
  });
  return <>
    <div className="admin-page-heading"><span className="admin-eyebrow">Paket RAI Juragan</span><h1>Atur grup cabang.</h1><p>Gabungkan beberapa toko agar owner utama melihat ringkasan kunjungan, omzet, dan masukan dari semua cabang.</p></div>
    <AdminBranchGroups tenants={tenants} />
  </>;
}

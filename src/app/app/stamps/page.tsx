import { StampIssuer } from "@/components/stamp-issuer";
import { requireTenantWorker } from "@/lib/admin-auth";

export default async function StaffStampsPage() {
  const staff = await requireTenantWorker();
  return <><div className="admin-page-heading"><span className="admin-eyebrow">Program loyalti</span><h1>Tambah stempel</h1><p>Periksa kartu pelanggan dan catat stempel atas kunjungan atau transaksi.</p></div><StampIssuer /></>;
}

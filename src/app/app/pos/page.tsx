import { PointOfSale } from "@/components/point-of-sale";
import { requireTenantWorker } from "@/lib/admin-auth";

export default async function PosPage() {
  const user = await requireTenantWorker();
  return <><div className="admin-page-heading"><span className="admin-eyebrow">Kasir · {user.name}</span><h1>POS toko</h1><p>Catat transaksi, voucher, dan stempel pelanggan.</p></div><PointOfSale /></>;
}

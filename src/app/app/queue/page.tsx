import { StaffQueue } from "@/components/staff-queue";
import { requireTenantWorker } from "@/lib/admin-auth";

export default async function StaffQueuePage() {
  const user = await requireTenantWorker();
  return <><div className="admin-page-heading"><span className="admin-eyebrow">{user.name}</span><h1>Kelola antrean</h1><p>Panggil pelanggan berikutnya dan perbarui status layanan.</p></div><StaffQueue /></>;
}

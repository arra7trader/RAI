import { AttendancePanel } from "@/components/attendance-panel";
import { requireTenantWorker } from "@/lib/admin-auth";

export default async function AttendancePage() {
  const user = await requireTenantWorker();
  return <><div className="admin-page-heading"><span className="admin-eyebrow">Absensi GPS · {user.name}</span><h1>Absensi hari ini</h1><p>Check-in dan check-out dengan selfie di dalam radius toko.</p></div><AttendancePanel /></>;
}

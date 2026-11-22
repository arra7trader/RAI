import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();
  const [tenantCount, activeQrCount, unassignedQrCount, pendingApplications] = await Promise.all([
    db.tenant.count(),
    db.qrCode.count({ where: { status: "ACTIVE" } }),
    db.qrCode.count({ where: { status: "UNASSIGNED", tenantId: null } }),
    db.storeApplication.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <div className="admin-page-heading">
        <span className="admin-eyebrow">Concierge panel</span>
        <h1>Ringkasan Tim RAI</h1>
        <p>Siapkan toko, kelola QR, dan pantau aktivasi klien.</p>
      </div>
      <div className="admin-metrics">
        <article className="admin-metric"><span>Toko terdaftar</span><strong>{tenantCount}</strong></article>
        <article className="admin-metric"><span>QR aktif</span><strong>{activeQrCount}</strong></article>
        <article className="admin-metric"><span>QR belum dipakai</span><strong>{unassignedQrCount}</strong></article>
        <article className="admin-metric"><span>Pengajuan menunggu</span><strong>{pendingApplications}</strong></article>
      </div>
      <div className="admin-quick-actions">
        <Link className="admin-action-card" href="/admin/qr-generator"><strong>Buat batch QR</strong><span>Hasilkan kode unik siap dicetak.</span></Link>
        <Link className="admin-action-card" href="/admin/tenants/new"><strong>Onboarding toko</strong><span>Daftarkan tenant dan akun owner.</span></Link>
        <Link className="admin-action-card" href="/admin/tenants"><strong>Lihat semua toko</strong><span>Periksa paket dan status aktivasi.</span></Link>
        <Link className="admin-action-card" href="/admin/applications"><strong>Periksa pengajuan toko</strong><span>Tinjau data sebelum memberi QR dan mengaktifkan tenant.</span></Link>
      </div>
    </>
  );
}

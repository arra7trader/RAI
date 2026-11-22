import Link from "next/link";
import { requireTenantWorker } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffLauncherPage() {
  const user = await requireTenantWorker();
  const tenant = await getDb().tenant.findUnique({
    where: { id: user.tenantId! },
    select: { name: true, slug: true },
  });

  if (!tenant) return null;

  return (
    <>
      <div className="admin-page-heading">
        <span className="admin-eyebrow">Akses kasir · {tenant.name}</span>
        <h1>Selamat datang, {user.name}.</h1>
        <p>Pilih layanan toko yang ingin dibuka.</p>
      </div>
      <div className="admin-quick-actions staff-actions">
        <Link className="admin-action-card" href={`/${tenant.slug}`}><strong>Portal toko</strong><span>Buka halaman pelanggan toko.</span></Link>
        <Link className="admin-action-card" href={`/${tenant.slug}/menu`}><strong>Katalog menu</strong><span>Lihat daftar produk dan layanan.</span></Link>
        <Link className="admin-action-card" href="/app/stamps"><strong>Stempel pelanggan</strong><span>Pindai kartu pelanggan lalu tambahkan stempel.</span></Link>
        <Link className="admin-action-card" href="/app/pos"><strong>POS kasir</strong><span>Catat transaksi dan voucher pelanggan.</span></Link>
        <Link className="admin-action-card" href="/app/queue"><strong>Antrean toko</strong><span>Kelola nomor antrean pelanggan.</span></Link>
        <Link className="admin-action-card" href={`/${tenant.slug}/queue`}><strong>Tampilan antrean publik</strong><span>Lihat antrean hari ini.</span></Link>
      </div>
    </>
  );
}

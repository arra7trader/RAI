import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await getDb().tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      planTier: true,
      planStatus: true,
      isActive: true,
      createdAt: true,
      qrCodes: { select: { code: true, status: true }, take: 1 },
    },
  });

  return (
    <>
      <div className="admin-page-heading admin-heading-with-action">
        <div><span className="admin-eyebrow">Klien RAI</span><h1>Daftar toko</h1><p>{tenants.length} toko terbaru dalam panel ini.</p></div>
        <Link className="button" href="/admin/tenants/new">Tambah toko</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nama toko</th><th>Kategori</th><th>Paket</th><th>Status</th><th>QR aktif</th><th>URL publik</th><th>Produk</th><th>Pengaturan</th></tr></thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td><strong>{tenant.name}</strong></td>
                <td>{tenant.category}</td>
                <td>{tenant.planTier}</td>
                <td><span className={`admin-status ${tenant.isActive ? "success" : "inactive"}`}>{tenant.isActive ? tenant.planStatus : "NONAKTIF"}</span></td>
                <td>{tenant.qrCodes[0]?.code ?? "—"}</td>
                <td><Link className="admin-table-link" href={`/${tenant.slug}`}>/{tenant.slug} ↗</Link></td>
                <td><Link className="admin-table-link" href={`/admin/tenants/${tenant.id}/products`}>Impor ↗</Link></td>
                <td><Link className="admin-table-link" href={`/admin/tenants/${tenant.id}/settings`}>Kelola ↗</Link></td>
              </tr>
            ))}
            {!tenants.length && <tr><td className="admin-empty-cell" colSpan={8}>Belum ada toko. Mulai dari onboarding pertama.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { getOwnerTenantScope } from "@/lib/owner-tenant-scope";

export const dynamic = "force-dynamic";

function jakartaDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const midnightUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) - 7 * 60 * 60 * 1000;
  return { start: new Date(midnightUtc), end: new Date(midnightUtc + 24 * 60 * 60 * 1000) };
}

function formatJakartaDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default async function OwnerDashboardPage() {
  const user = await requireUser("OWNER");
  const db = getDb();
  const { start, end } = jakartaDayRange();
  const scope = await getOwnerTenantScope(user.id, user.tenantId);
  const primary = scope.tenants.find((tenant) => tenant.id === user.tenantId);
  if (!primary) return null;

  const [visitRows, orderRows, feedbackRows] = await Promise.all([
    db.storeVisit.groupBy({ by: ["tenantId", "visitorType"], where: { tenantId: { in: scope.tenantIds }, visitedAt: { gte: start, lt: end } }, _count: { _all: true } }),
    db.order.groupBy({ by: ["tenantId"], where: { tenantId: { in: scope.tenantIds }, status: "PAID", createdAt: { gte: start, lt: end } }, _sum: { total: true }, _count: { _all: true } }),
    db.customerFeedback.groupBy({ by: ["tenantId"], where: { tenantId: { in: scope.tenantIds }, status: "OPEN" }, _count: { _all: true } }),
  ]);

  const visitsByTenant = new Map<string, { newVisits: number; returningVisits: number }>();
  for (const visit of visitRows) {
    const totals = visitsByTenant.get(visit.tenantId) ?? { newVisits: 0, returningVisits: 0 };
    if (visit.visitorType === "NEW") totals.newVisits += visit._count._all;
    else totals.returningVisits += visit._count._all;
    visitsByTenant.set(visit.tenantId, totals);
  }
  const ordersByTenant = new Map(orderRows.map((row) => [row.tenantId, { sales: row._sum.total ?? 0, count: row._count._all }]));
  const feedbackByTenant = new Map(feedbackRows.map((row) => [row.tenantId, row._count._all]));
  const branchRows = scope.tenants.map((tenant) => ({
    ...tenant,
    ...(visitsByTenant.get(tenant.id) ?? { newVisits: 0, returningVisits: 0 }),
    ...(ordersByTenant.get(tenant.id) ?? { sales: 0, count: 0 }),
    openFeedback: feedbackByTenant.get(tenant.id) ?? 0,
  }));
  const totalVisits = branchRows.reduce((sum, row) => sum + row.newVisits + row.returningVisits, 0);
  const totalSales = branchRows.reduce((sum, row) => sum + row.sales, 0);
  const totalOrders = branchRows.reduce((sum, row) => sum + row.count, 0);
  const totalFeedback = branchRows.reduce((sum, row) => sum + row.openFeedback, 0);
  const isMultiBranch = scope.tenants.length > 1 && primary.planTier === "JURAGAN";
  const adminWhatsApp = process.env.NEXT_PUBLIC_RAI_ADMIN_WA?.replace(/\D/g, "");
  const helpUrl = adminWhatsApp
    ? `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(`Halo Tim RAI, saya ${user.name} dari ${primary.name}. Saya ingin minta bantuan.`)}`
    : "/#kontak";

  return <>
    <div className="admin-page-heading">
      <span className="admin-eyebrow">Ringkasan owner · {primary.name}</span>
      <h1>{isMultiBranch ? "Semua cabang, satu ringkasan." : "Sekilas hari ini."}</h1>
      <p>{formatJakartaDate(new Date())} · Paket RAI {primary.planTier.toLowerCase()}{isMultiBranch ? ` · ${scope.tenants.length} cabang` : ""}</p>
    </div>
    <section className="admin-metrics owner-metrics" aria-label="Ringkasan hari ini">
      <article className="admin-metric"><span>{isMultiBranch ? "Scan QR semua cabang" : "Scan QR hari ini"}</span><strong>{totalVisits}</strong></article>
      <article className="admin-metric"><span>{isMultiBranch ? "Omzet cabang hari ini" : "Omzet hari ini"}</span><strong>{`Rp${totalSales.toLocaleString("id-ID")}`}</strong></article>
      <article className="admin-metric"><span>Transaksi lunas</span><strong>{totalOrders}</strong></article>
      <article className="admin-metric"><span>Masukan terbuka</span><strong>{totalFeedback}</strong></article>
    </section>
    {isMultiBranch && <section className="report-section branch-summary">
      <div className="admin-section-heading"><div><span className="admin-eyebrow">Paket RAI Juragan</span><h2>Performa setiap cabang</h2></div><Link className="admin-table-link" href="/dashboard/reports">Buka laporan Excel ↗</Link></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cabang</th><th>Kunjungan</th><th>Omzet lunas</th><th>Transaksi</th><th>Masukan</th></tr></thead><tbody>{branchRows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><div className="admin-field-help">/{row.slug}</div></td><td>{row.newVisits + row.returningVisits}</td><td><strong>{`Rp${row.sales.toLocaleString("id-ID")}`}</strong></td><td>{row.count}</td><td>{row.openFeedback}</td></tr>)}</tbody></table></div>
    </section>}
    <p className="dashboard-note">Kunjungan dihitung kembali setelah jeda tiga jam per perangkat.</p>
    <section className="dashboard-help"><div><span className="admin-eyebrow">Layanan Terima Beres</span><h2>Perlu ubah menu atau promo?</h2><p>Tim RAI bisa membantu menyiapkan perubahan toko Anda.</p></div><a className="button" href={helpUrl} target={adminWhatsApp ? "_blank" : undefined} rel={adminWhatsApp ? "noreferrer" : undefined}>Chat Tim RAI <span aria-hidden="true">↗</span></a></section>
    <div className="admin-quick-actions owner-quick-actions">
      <Link className="admin-action-card" href="/dashboard/products"><strong>Kelola menu & produk</strong><span>Perbarui katalog pelanggan dan harga di POS.</span></Link>
      <Link className="admin-action-card" href="/dashboard/reports"><strong>Laporan & pelanggan</strong><span>Pantau transaksi, feedback, absensi, dan unduh Excel.</span></Link>
      <Link className="admin-action-card" href="/app/pos"><strong>POS & kas laci</strong><span>Catat transaksi dan buka atau tutup shift kas.</span></Link>
      <Link className="admin-action-card" href="/app/queue"><strong>Antrean</strong><span>Kelola nomor antrean toko.</span></Link>
      <Link className="admin-action-card" href="/app/attendance"><strong>Absensi</strong><span>Check-in tim dengan foto dan geofence toko.</span></Link>
      <Link className="admin-action-card" href={`/${primary.slug}`}><strong>Lihat portal pelanggan</strong><span>Buka halaman publik toko Anda.</span></Link>
      <Link className="admin-action-card" href={`/${primary.slug}/menu`}><strong>Lihat katalog</strong><span>Periksa menu yang tampil untuk pelanggan.</span></Link>
    </div>
  </>;
}

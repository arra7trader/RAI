import { FeedbackList } from "@/components/feedback-list";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { getOwnerTenantScope } from "@/lib/owner-tenant-scope";

export const dynamic = "force-dynamic";
function range() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)) - 7 * 3600_000;
  return { start: new Date(start), end: new Date(start + 24 * 3600_000), dayKey: `${map.year}-${map.month}-${map.day}` };
}

function jakartaDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function OwnerReportsPage() {
  const user = await requireUser("OWNER"); const { start, end, dayKey } = range(); const db = getDb();
  const scope = await getOwnerTenantScope(user.id, user.tenantId);
  const tenantIds = { in: scope.tenantIds };
  const [sales, ordersToday, customerCount, openFeedback, feedback, customers, attendance] = await Promise.all([
    db.order.aggregate({ where: { tenantId: tenantIds, status: "PAID", createdAt: { gte: start, lt: end } }, _sum: { total: true, discount: true }, _count: { _all: true } }),
    db.order.findMany({ where: { tenantId: tenantIds, status: "PAID", createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, total: true, discount: true, paymentMethod: true, createdAt: true, tenant: { select: { name: true } }, staff: { select: { name: true } }, items: { select: { name: true, quantity: true } } } }),
    db.customer.count({ where: { tenantId: tenantIds } }), db.customerFeedback.count({ where: { tenantId: tenantIds, status: "OPEN" } }),
    db.customerFeedback.findMany({ where: { tenantId: tenantIds }, orderBy: { createdAt: "desc" }, take: 40, select: { id: true, rating: true, message: true, status: true, createdAt: true, tenant: { select: { name: true } }, customer: { select: { name: true, phoneWa: true } } } }),
    db.customer.findMany({ where: { tenantId: tenantIds }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, phoneWa: true, stampBalance: true, stampsIssued: true, createdAt: true, tenant: { select: { name: true } } } }),
    db.attendance.findMany({ where: { tenantId: tenantIds, dayKey }, orderBy: { checkInAt: "desc" }, take: 50, select: { dayKey: true, checkInAt: true, checkOutAt: true, checkInDistance: true, checkOutDistance: true, tenant: { select: { name: true } }, user: { select: { name: true } } } }),
  ]);
  const rupiah = (value: number) => `Rp${value.toLocaleString("id-ID")}`;
  const today = jakartaDateValue(new Date());
  const monthStart = jakartaDateValue(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  return <>
    <div className="admin-page-heading"><span className="admin-eyebrow">CRM · omzet · feedback · absensi</span><h1>Laporan toko</h1><p>Omzet hari ini dihitung dari pesanan berstatus lunas.</p></div>
    <section className="admin-card report-export-card"><div><span className="admin-eyebrow">Ekspor Excel</span><h2>Unduh laporan operasional</h2><p>Berisi transaksi, kas laci, mutasi kas, dan absensi. Akun multi-cabang mendapat data hanya dari grupnya.</p></div><form action="/api/owner/reports/export" method="get" className="report-export-form"><label>Dari<input type="date" name="from" defaultValue={monthStart} required /></label><label>Sampai<input type="date" name="to" defaultValue={today} required /></label><button className="button" type="submit">Unduh .xlsx</button></form></section>
    <div className="admin-metrics"><article className="admin-metric"><span>Omzet hari ini</span><strong>{rupiah(sales._sum.total ?? 0)}</strong></article><article className="admin-metric"><span>Transaksi lunas</span><strong>{sales._count._all}</strong></article><article className="admin-metric"><span>Pelanggan terdaftar</span><strong>{customerCount}</strong></article><article className="admin-metric"><span>Masukan terbuka</span><strong>{openFeedback}</strong></article></div>
    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Transaksi hari ini</span><h2>Riwayat penjualan</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{scope.tenants.length > 1 && <th>Cabang</th>}<th>Waktu WIB</th><th>Item</th><th>Pembayaran</th><th>Kasir</th><th>Total</th></tr></thead><tbody>{ordersToday.map((order) => <tr key={order.id}>{scope.tenants.length > 1 && <td>{order.tenant.name}</td>}<td>{order.createdAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}</td><td>{order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</td><td>{order.paymentMethod}</td><td>{order.staff?.name ?? "—"}</td><td><strong>{rupiah(order.total)}</strong></td></tr>)}{!ordersToday.length && <tr><td className="admin-empty-cell" colSpan={scope.tenants.length > 1 ? 6 : 5}>Belum ada transaksi hari ini.</td></tr>}</tbody></table></div></section>
    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Umpan balik privat</span><h2>Masukan pelanggan</h2></div></div><FeedbackList initial={feedback.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} /></section>
    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Data pelanggan</span><h2>CRM sederhana</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{scope.tenants.length > 1 && <th>Cabang</th>}<th>Pelanggan</th><th>WhatsApp</th><th>Stempel</th><th>Terdaftar</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}>{scope.tenants.length > 1 && <td>{customer.tenant.name}</td>}<td><strong>{customer.name}</strong></td><td><a className="admin-table-link" href={`https://wa.me/${customer.phoneWa}`} target="_blank" rel="noreferrer">{customer.phoneWa} ↗</a></td><td>{customer.stampBalance} saldo · {customer.stampsIssued} terkumpul</td><td>{customer.createdAt.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</td></tr>)}{!customers.length && <tr><td className="admin-empty-cell" colSpan={scope.tenants.length > 1 ? 5 : 4}>Belum ada pelanggan terdaftar.</td></tr>}</tbody></table></div></section>
    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Kehadiran tim</span><h2>Absensi terbaru</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{scope.tenants.length > 1 && <th>Cabang</th>}<th>Tanggal</th><th>Nama</th><th>Masuk</th><th>Keluar</th><th>Jarak lokasi</th></tr></thead><tbody>{attendance.map((item, index) => <tr key={`${item.dayKey}-${index}`}>{scope.tenants.length > 1 && <td>{item.tenant.name}</td>}<td>{item.dayKey}</td><td><strong>{item.user.name}</strong></td><td>{item.checkInAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}</td><td>{item.checkOutAt?.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }) ?? "Belum check-out"}</td><td>{item.checkInDistance} m{item.checkOutDistance !== null ? ` · ${item.checkOutDistance} m` : ""}</td></tr>)}{!attendance.length && <tr><td className="admin-empty-cell" colSpan={scope.tenants.length > 1 ? 6 : 5}>Belum ada data absensi.</td></tr>}</tbody></table></div></section>
  </>;
}

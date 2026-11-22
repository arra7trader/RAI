import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBulkProducts } from "@/components/admin-bulk-products";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTenantProductsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getDb().tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, products: { orderBy: [{ category: "asc" }, { name: "asc" }], select: { category: true, name: true, price: true, isAvailable: true } } } });
  if (!tenant) notFound();

  return <>
    <div className="admin-page-heading"><span className="admin-eyebrow">Concierge katalog</span><h1>Kelola produk · {tenant.name}</h1><p>Produk baru hanya masuk ke toko ini. Katalog muncul di portal <Link className="admin-table-link" href={`/${tenant.slug}`}>/{tenant.slug}</Link> dan POS toko.</p><Link className="admin-table-link" href={`/admin/tenants/${tenant.id}/settings`}>Kelola QR & program stempel ↗</Link></div>
    <AdminBulkProducts tenantId={tenant.id} tenantName={tenant.name} />
    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Katalog saat ini</span><h2>{tenant.products.length} produk</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Status</th></tr></thead><tbody>{tenant.products.map((product, index) => <tr key={`${product.name}-${index}`}><td><strong>{product.name}</strong></td><td>{product.category}</td><td>Rp{product.price.toLocaleString("id-ID")}</td><td>{product.isAvailable ? "Tersedia" : "Disembunyikan"}</td></tr>)}{!tenant.products.length && <tr><td className="admin-empty-cell" colSpan={4}>Belum ada produk di katalog.</td></tr>}</tbody></table></div></section>
  </>;
}

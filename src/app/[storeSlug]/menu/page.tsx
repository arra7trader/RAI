import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function StoreMenuPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const db = getDb();
  const store = await db.tenant.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true, slug: true, isActive: true },
  });

  if (!store || !store.isActive) notFound();

  const products = await db.product.findMany({
    where: { tenantId: store.id, isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, category: true, name: true, description: true, price: true },
  });

  return (
    <main className="store-page">
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/" aria-label="RAI, beranda">
            <BrandLogo />
          </Link>
          <span className="store-nav-name">{store.name}</span>
          <Link className="store-nav-link" href={`/${store.slug}`}>Kembali</Link>
        </div>
      </header>
      <div className="container store-content">
        <section className="menu-heading">
          <span className="store-kicker">Katalog toko</span>
          <h1>Menu {store.name}</h1>
          <p>Daftar pilihan terbaru dari toko.</p>
        </section>
        {products.length ? (
          <div className="menu-grid">
            {products.map((product) => (
              <article className="menu-card" key={product.id}>
                <div>
                  <span className="menu-category">{product.category}</span>
                  <h2>{product.name}</h2>
                  {product.description && <p>{product.description}</p>}
                </div>
                <strong>{rupiah.format(product.price)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-menu">
            <span className="store-card-icon">☰</span>
            <h2>Menu sedang disiapkan</h2>
            <p>Tim RAI akan menambahkan daftar menu toko ini.</p>
          </div>
        )}
        <footer className="store-footer">Didukung oleh <Link href="/">UMKM Creative by RAI</Link></footer>
      </div>
    </main>
  );
}

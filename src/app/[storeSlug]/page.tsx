import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";
import { FeedbackForm } from "@/components/feedback-form";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ focus?: string; mode?: string }>;
}) {
  const [{ storeSlug }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  const store = await db.tenant.findUnique({
    where: { slug: storeSlug },
    select: {
      name: true,
      slug: true,
      address: true,
      phoneWa: true,
      googleReviewUrl: true,
      activeQrMode: true,
      isActive: true,
    },
  });

  if (!store || !store.isActive) notFound();

  const showReview = query.focus === "review" || store.activeQrMode === "REVIEW_FOCUS";
  const isClosed = query.mode === "closed" || store.activeQrMode === "CLOSED_STORE";
  const whatsapp = store.phoneWa.replace(/\D/g, "");

  return (
    <main className="store-page">
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/" aria-label="RAI, beranda">
            <BrandLogo />
          </Link>
          <span className="store-nav-name">{store.name}</span>
          <Link className="store-nav-link" href={`/${store.slug}/menu`}>Lihat menu</Link>
        </div>
      </header>

      <div className="container store-content">
        <section className="store-hero">
          <span className="store-kicker">{store.name}</span>
          <h1>{isClosed ? "Sampai jumpa lagi." : "Selamat datang."}</h1>
          <p>
            {isClosed
              ? "Toko sedang tidak melayani pesanan. Silakan kembali lagi nanti."
              : "Temukan informasi toko dan layanan pelanggan di sini."}
          </p>
          {store.address && <span className="store-address">{store.address}</span>}
          <Link className="button" href={`/${store.slug}/menu`}>Lihat menu <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="store-actions" aria-label="Layanan pelanggan">
          <Link className="store-action-card" href={`/${store.slug}/menu`}>
            <span className="store-card-icon">☰</span>
            <strong>Menu & layanan</strong>
            <span>Lihat daftar pilihan toko</span>
          </Link>
          {store.googleReviewUrl ? (
            <a className="store-action-card" href={store.googleReviewUrl} target="_blank" rel="noreferrer">
              <span className="store-card-icon gold">★</span>
              <strong>Ulasan Google</strong>
              <span>Beri ulasan untuk toko</span>
            </a>
          ) : (
            <div className="store-action-card muted-card">
              <span className="store-card-icon gold">★</span>
              <strong>Ulasan Google</strong>
              <span>Link ulasan belum tersedia</span>
            </div>
          )}
          {whatsapp ? (
            <a className="store-action-card" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              <span className="store-card-icon">↗</span>
              <strong>Hubungi toko</strong>
              <span>Tanya langsung melalui WhatsApp</span>
            </a>
          ) : (
            <div className="store-action-card muted-card">
              <span className="store-card-icon">✳</span>
              <strong>Program loyalti</strong>
              <span>Kartu stempel digital segera hadir</span>
            </div>
          )}
          <Link className="store-action-card" href={`/${store.slug}/stamp`}>
            <span className="store-card-icon gold">✳</span>
            <strong>Stempel digital</strong>
            <span>Daftar atau cek kartu loyalti pelanggan</span>
          </Link>
          <Link className="store-action-card" href={`/${store.slug}/queue`}>
            <span className="store-card-icon">#</span><strong>Antrean digital</strong><span>Ambil nomor dan pantau panggilan</span>
          </Link>
        </section>

        {showReview && (
          <section className="review-callout" id="ulasan">
            <div>
              <span className="store-kicker">Pengalaman Anda berarti</span>
              <h2>Ada masukan untuk {store.name}?</h2>
              <p>Anda bisa memberi ulasan langsung di Google. Semua pelanggan mendapat pilihan yang sama.</p>
            </div>
            {store.googleReviewUrl ? (
              <a className="button" href={store.googleReviewUrl} target="_blank" rel="noreferrer">Buka Google Maps ↗</a>
            ) : (
              <span className="store-address">Link ulasan belum tersedia.</span>
            )}
          </section>
        )}

        <section className="review-callout feedback-callout" id="masukan">
          <div><span className="store-kicker">Masukan privat</span><h2>Bantu {store.name} berkembang.</h2><p>Semua rating tetap mendapatkan akses yang sama ke tautan ulasan Google di atas.</p></div>
          <FeedbackForm storeSlug={store.slug} />
        </section>

        <footer className="store-footer">Didukung oleh <Link href="/">UMKM Creative by RAI</Link></footer>
      </div>
    </main>
  );
}

import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";

const adminWhatsApp = process.env.NEXT_PUBLIC_RAI_ADMIN_WA?.replace(/\D/g, "");
const consultationText = encodeURIComponent("Halo Tim RAI, saya ingin konsultasi tentang paket layanan RAI.");
const consultationUrl = adminWhatsApp
  ? `https://wa.me/${adminWhatsApp}?text=${consultationText}`
  : "/#kontak";

const packages = [
  {
    name: "RAI Laris",
    audience: "Fokus pengunjung, reputasi, dan pelanggan loyal.",
    description: "Untuk toko yang ingin lebih mudah dikenal pengunjung dan menjaga pelanggan kembali.",
    items: [
      "Setup profil dan QR toko oleh Tim RAI",
      "Katalog digital menu atau layanan",
      "Alur ulasan dan masukan pelanggan",
      "Program stempel dan voucher",
      "Ringkasan kunjungan QR",
    ],
  },
  {
    name: "RAI Kasir",
    audience: "Fokus transaksi dan kegiatan operasional.",
    description: "Untuk toko yang membutuhkan alat bantu pencatatan operasional harian.",
    items: [
      "Semua dukungan RAI Laris",
      "Input produk dan harga awal",
      "POS kasir dan catatan transaksi",
      "Buku kas laci dan tutup shift",
      "Absensi dengan verifikasi lokasi",
    ],
    featured: true,
  },
  {
    name: "RAI Juragan",
    audience: "Fokus multi-cabang dan laporan terpusat.",
    description: "Untuk usaha dengan beberapa lokasi yang ingin diringkas dalam satu tampilan.",
    items: [
      "Semua dukungan RAI Kasir",
      "Setup toko dan cabang terpusat",
      "Ringkasan aktivitas lintas cabang",
      "Laporan operasional terjadwal",
      "Dukungan prioritas dari Tim RAI",
    ],
  },
];

export default function PackagesPage() {
  return (
    <main className="page-shell">
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="/" aria-label="RAI, beranda">
            <BrandLogo />
          </a>
          <nav className="nav-links" aria-label="Navigasi utama">
            <a href="/#cara-kerja">Cara kerja</a>
            <a href="/#fitur">Fitur</a>
            <a href="/paket" aria-current="page">Paket layanan</a>
          </nav>
          <a className="button" href={consultationUrl}>Konsultasi gratis</a>
        </div>
      </header>

      <section className="hero" id="paket">
        <div className="container">
          <div className="eyebrow">Layanan terima beres</div>
          <h1>Pilih dukungan<br />yang pas untuk toko.</h1>
          <p className="hero-copy">
            Tim RAI membantu setup profil, data awal, dan QR toko. Ceritakan kebutuhan usaha Anda untuk membahas paket yang sesuai.
          </p>
          <div className="hero-actions">
            <a className="button" href={consultationUrl}>Konsultasi gratis <span aria-hidden="true">↗</span></a>
            <a className="button secondary" href="/">Kembali ke beranda</a>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="package-grid">
            {packages.map((pack) => (
              <article className={`package-card ${pack.featured ? "featured" : ""}`} key={pack.name}>
                {pack.featured && <span className="package-label">Untuk operasional toko</span>}
                <h3>{pack.name}</h3>
                <p><strong>{pack.audience}</strong> {pack.description}</p>
                <ul>{pack.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <a className={`button ${pack.featured ? "" : "secondary"}`} href={consultationUrl}>Tanya & aktifkan</a>
              </article>
            ))}
          </div>
          <p className="notice" style={{ textAlign: "center", marginTop: 24 }}>
            Layanan disesuaikan dengan kebutuhan usaha. Hubungi Tim RAI untuk membahas setup dan aktivasi.
          </p>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="/" aria-label="RAI, beranda"><BrandLogo /></a>
          <Image className="footer-full-logo" src="/rai-logo.png" alt="UMKM Creative by RAI" width={58} height={60} />
          <div className="footer-links"><a href="/">Beranda</a><a href="/#fitur">Fitur</a><a href={consultationUrl}>Konsultasi</a></div>
        </div>
      </footer>
    </main>
  );
}

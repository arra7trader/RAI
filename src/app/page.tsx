import Image from "next/image";
import { ExperienceSwitcher } from "@/components/experience-switcher";
import { BrandLogo } from "@/components/brand-logo";

const adminWhatsApp = process.env.NEXT_PUBLIC_RAI_ADMIN_WA?.replace(/\D/g, "");
const consultationText = encodeURIComponent("Halo Tim RAI, saya ingin konsultasi tentang platform RAI.");
const consultationUrl = adminWhatsApp
  ? `https://wa.me/${adminWhatsApp}?text=${consultationText}`
  : "#kontak";

const features = [
  { icon: "★", tone: "gold", title: "Ulasan pelanggan", copy: "Kumpulkan ulasan dan masukan pelanggan di satu alur yang mudah." },
  { icon: "↗", tone: "teal", title: "Pengunjung QR", copy: "Pahami jumlah kunjungan dari scan QR harian di toko." },
  { icon: "✳", tone: "gold", title: "Stempel & voucher promo", copy: "Pelanggan menyimpan kartu digital dan mengklaim voucher dengan nomor WhatsApp." },
  { icon: "▦", tone: "teal", title: "POS & kas laci", copy: "Catat transaksi dan pergerakan uang kas dalam satu alur kerja." },
  { icon: "◎", tone: "coral", title: "Absensi karyawan", copy: "Catat kehadiran tim dengan verifikasi lokasi toko." },
  { icon: "♥", tone: "coral", title: "Setup terima beres", copy: "Tim RAI bantu menyiapkan profil, katalog, dan QR siap digunakan." },
];

const usageSteps = [
  {
    number: "01",
    title: "Ajukan toko",
    copy: "Isi Google Form dengan profil usaha dan kontak pemilik. Pengajuan masuk antrean untuk ditinjau Tim RAI.",
  },
  {
    number: "02",
    title: "Tunggu persetujuan & setup",
    copy: "Setelah disetujui, Tim RAI menyiapkan portal, akun owner, dan QR yang sudah terhubung ke toko Anda.",
  },
  {
    number: "03",
    title: "Pasang QR di toko",
    copy: "Cetak dan pajang QR. Pelanggan scan untuk melihat menu, membuat kartu stempel, mengklaim promo dengan WhatsApp, atau mengambil nomor antrean.",
  },
  {
    number: "04",
    title: "Kelola toko setiap hari",
    copy: "Owner masuk ke dashboard untuk cek omzet, masukan, menu, dan laporan. Kasir memakai POS, memasukkan voucher, mencatat shift, antrean, stempel, dan absensi. Tim RAI mengatur QR serta promo dari panel admin.",
  },
];

const packages = [
  {
    name: "RAI Laris",
    description: "Untuk menarik pengunjung dan menjaga pelanggan tetap kembali.",
    items: ["QR pelanggan & katalog digital", "Program stempel dan voucher", "Ringkasan kunjungan toko"],
  },
  {
    name: "RAI Kasir",
    description: "Untuk mengelola transaksi dan rutinitas operasional toko.",
    items: ["Semua fitur RAI Laris", "POS dan buku kas laci", "Absensi dengan verifikasi lokasi"],
    featured: true,
  },
  {
    name: "RAI Juragan",
    description: "Untuk bisnis yang beroperasi di beberapa cabang.",
    items: ["Semua fitur RAI Kasir", "Ringkasan lintas cabang", "Laporan dan dukungan prioritas"],
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#beranda" aria-label="RAI, beranda">
            <BrandLogo />
          </a>
          <nav className="nav-links" aria-label="Navigasi utama">
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#fitur">Fitur</a>
            <a href="#paket">Paket layanan</a>
          </nav>
          <a className="button" href={consultationUrl}>Konsultasi gratis</a>
        </div>
      </header>

      <section className="hero" id="beranda">
        <div className="container">
          <div className="eyebrow">UMKM Creative by RAI</div>
          <h1>Satu QR.<br />Dua dunia.<br />Terima beres.</h1>
          <p className="hero-copy">
            Pengalaman pelanggan dan operasional toko dalam satu platform. Tim RAI bantu siapkan, jadi Anda bisa fokus menjalankan usaha.
          </p>
          <div className="hero-actions">
            <a className="button" href={consultationUrl}>Konsultasi gratis <span aria-hidden="true">↗</span></a>
            <a className="button secondary" href="#cara-kerja">Lihat cara kerja</a>
          </div>
          <div className="hero-art" aria-label="Pratinjau stand QR RAI">
            <div className="art-note left"><strong>Siap pajang</strong>QR fisik untuk toko Anda</div>
            <div className="stand">
              <span className="stand-logo">UMKM CREATIVE</span>
              <div className="qr" aria-hidden="true">{Array.from({ length: 49 }, (_, index) => <i key={index} />)}</div>
              <span className="stand-caption">SCAN & TEMUKAN</span>
            </div>
            <div className="art-note right"><strong>Satu QR dinamis</strong>Pengalaman sesuai kebutuhan</div>
          </div>
        </div>
      </section>

      <section className="section soft" id="cara-kerja">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Satu QR, dua pengalaman</span>
            <h2>Dirancang untuk yang datang dan yang menjalankan toko.</h2>
            <p>QR yang sama menghubungkan pelanggan dengan toko, sekaligus membantu owner melihat aktivitas usaha.</p>
          </div>
          <ExperienceSwitcher />
          <div className="usage-guide">
            <div className="section-head">
              <span className="eyebrow">Mulai menggunakan RAI</span>
              <h2>Dari pengajuan sampai QR siap dipakai.</h2>
              <p>Ikuti empat langkah ini. Toko baru aktif setelah pengajuan disetujui Tim RAI.</p>
            </div>
            <ol className="usage-grid">
              {usageSteps.map((step) => (
                <li className="usage-card" key={step.number}>
                  <span className="usage-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
            <div className="usage-actions">
              <a className="button" href="/daftar">Ajukan toko <span aria-hidden="true">↗</span></a>
              <a className="button secondary" href="/login">Login owner / staff</a>
            </div>
            <p className="usage-note">Akun login diberikan setelah toko disetujui. Fitur yang dapat dipakai mengikuti paket dan peran akun.</p>
          </div>
        </div>
      </section>

      <section className="section" id="fitur">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Satu platform</span>
            <h2>Yang dibutuhkan toko, dalam satu tempat.</h2>
            <p>Mulai dari pengalaman pelanggan sampai alat bantu operasional harian.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className={`feature-icon ${feature.tone === "teal" ? "" : feature.tone}`} aria-hidden="true">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft" id="paket">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Layanan terima beres</span>
            <h2>Pilih dukungan sesuai skala usaha.</h2>
            <p>Tim RAI bantu setup awal dan pembaruan sistem. Hubungi kami untuk membahas paket yang sesuai.</p>
          </div>
          <div className="package-grid">
            {packages.map((pack) => (
              <article className={`package-card ${pack.featured ? "featured" : ""}`} key={pack.name}>
                {pack.featured && <span className="package-label">Operasional lengkap</span>}
                <h3>{pack.name}</h3>
                <p>{pack.description}</p>
                <ul>{pack.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <a className={`button ${pack.featured ? "" : "secondary"}`} href={consultationUrl}>Tanya & aktifkan</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="kontak">
        <div className="container">
          <div className="contact-box">
            <div>
              <h2>Siap merapikan pengalaman pelanggan dan operasional toko?</h2>
              <p>Diskusikan kebutuhan usaha Anda bersama Tim RAI.</p>
              {!adminWhatsApp && <div className="notice">Kontak WhatsApp resmi belum dikonfigurasi.</div>}
            </div>
            <a className="button" href={consultationUrl}>Hubungi Tim RAI <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="#beranda"><BrandLogo /></a>
          <span className="footer-brand-lockup"><Image src="/rai-logo.png" alt="UMKM Creative by RAI" width={58} height={60} /></span>
          <div className="footer-links"><a href="#cara-kerja">Cara kerja</a><a href="#fitur">Fitur</a><a href="#paket">Paket</a><a href="/daftar">Ajukan aktivasi toko</a></div>
        </div>
      </footer>
    </main>
  );
}

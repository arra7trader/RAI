import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = {
  title: "Ajukan Aktivasi Toko — RAI",
  description: "Ajukan aktivasi layanan RAI lewat Google Form. Tim RAI meninjau data sebelum toko diaktifkan.",
};

const applicationFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfGpb8mUWYwHp2T7xsHPLH2Ssqi_UrxyFj7EG-BuZmfxhlnyQ/viewform";

export default function StoreApplicationPage() {
  return <main className="store-page">
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><BrandLogo /></Link><span className="store-nav-name">Pengajuan toko</span><Link className="store-nav-link" href="/">Beranda</Link></div></header>
    <div className="container store-content">
      <section className="menu-heading"><span className="store-kicker">Bergabung dengan RAI</span><h1>Ajukan aktivasi toko.</h1><p>Isi Google Form berisi profil usaha dan kontak pemilik. Tim RAI akan meninjau pengajuan dan menghubungi Anda melalui WhatsApp.</p></section>
      <section className="admin-card application-form-link"><div><span className="admin-eyebrow">Proses persetujuan</span><h2>Toko aktif setelah disetujui.</h2><p>Mengirim form belum membuat akun atau mengaktifkan paket. Super Admin memeriksa data, memilih QR, lalu mengaktifkan toko dan akun owner.</p><a className="button" href={applicationFormUrl} target="_blank" rel="noreferrer">Isi Google Form <span aria-hidden="true">↗</span></a></div></section>
      <footer className="store-footer">Butuh bantuan? <a href={`https://wa.me/${(process.env.NEXT_PUBLIC_RAI_ADMIN_WA || "").replace(/\D/g, "")}`}>WhatsApp Tim RAI</a></footer>
    </div>
  </main>;
}

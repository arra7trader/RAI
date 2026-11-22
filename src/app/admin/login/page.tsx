import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandLogo } from "@/components/brand-logo";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="brand" href="/"><BrandLogo /></Link>
        <span className="admin-eyebrow">Panel Tim RAI</span>
        <h1>Masuk ke panel admin.</h1>
        <p>Akses terbatas untuk Super Admin RAI.</p>
        <AdminLoginForm />
        <Link className="admin-back-link" href="/">Kembali ke beranda</Link>
      </section>
    </main>
  );
}

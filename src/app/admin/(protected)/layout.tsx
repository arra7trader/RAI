import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { requireAdmin } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <Link className="brand" href="/admin"><BrandLogo /><span className="admin-word">ADMIN</span></Link>
          <div className="admin-account"><span>{admin.name}</span><AdminLogoutButton /></div>
        </div>
      </header>
      <div className="container admin-layout">
        <nav className="admin-nav" aria-label="Navigasi admin">
          <Link href="/admin">Ringkasan</Link>
          <Link href="/admin/qr-generator">Generator QR</Link>
          <Link href="/admin/tenants">Daftar toko</Link>
          <Link href="/admin/applications">Pengajuan toko</Link>
          <Link href="/admin/branches">Grup cabang</Link>
          <Link href="/admin/tenants/new">Onboarding toko</Link>
        </nav>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
